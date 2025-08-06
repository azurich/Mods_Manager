const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Script de build et release automatisé\n');

// 1. Lire la version actuelle
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Version actuelle: ${currentVersion}`);

// 2. Demander directement la nouvelle version
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askNewVersion() {
  return new Promise((resolve) => {
    rl.question(`\n🎯 Entrez la nouvelle version (actuelle: ${currentVersion}): `, (version) => {
      resolve(version.trim());
    });
  });
}

async function main() {
  try {
    // Demander directement la nouvelle version
    const newVersion = await askNewVersion();
    
    if (!newVersion) {
      console.log('❌ Version invalide');
      process.exit(1);
    }
    
    rl.close();
    
    console.log(`\n🎯 Nouvelle version: ${newVersion}`);
    console.log('\n📝 Mise à jour du package.json...');
    
    // 3. Mettre à jour la version dans package.json
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
    
    console.log('✅ Version mise à jour dans package.json');
    
    // 4. Mettre à jour la version dans main.js
    console.log('📝 Mise à jour de la version dans electron/main.js...');
    const mainJsPath = path.join(__dirname, 'electron', 'main.js');
    
    if (fs.existsSync(mainJsPath)) {
      let mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
      
      // Remplacer la ligne const VERSION = '...'
      const versionRegex = /const VERSION = '[^']+';/;
      const newVersionLine = `const VERSION = '${newVersion}';`;
      
      if (versionRegex.test(mainJsContent)) {
        mainJsContent = mainJsContent.replace(versionRegex, newVersionLine);
        fs.writeFileSync(mainJsPath, mainJsContent);
        console.log('✅ Version mise à jour dans electron/main.js');
      } else {
        console.log('⚠️  Ligne VERSION non trouvée dans main.js');
      }
    } else {
      console.log('⚠️  Fichier electron/main.js non trouvé');
    }
    
    // 5. Mettre à jour la version dans l'interface utilisateur (mods-manager.tsx)
    console.log('📝 Mise à jour de la version dans l\'interface utilisateur...');
    const modsManagerPath = path.join(__dirname, 'src', 'components', 'mods-manager.tsx');
    
    if (fs.existsSync(modsManagerPath)) {
      let modsManagerContent = fs.readFileSync(modsManagerPath, 'utf8');
      
      // Remplacer les versions dans l'interface
      const badgeRegex = /<Badge variant="secondary">v[\d.]+<\/Badge>/;
      const versionPRegex = /<p>Version: [\d.]+<\/p>/;
      
      const newBadgeLine = `<Badge variant="secondary">v${newVersion}</Badge>`;
      const newVersionPLine = `<p>Version: ${newVersion}</p>`;
      
      let updated = false;
      
      if (badgeRegex.test(modsManagerContent)) {
        modsManagerContent = modsManagerContent.replace(badgeRegex, newBadgeLine);
        updated = true;
        console.log('✅ Badge version mis à jour');
      }
      
      if (versionPRegex.test(modsManagerContent)) {
        modsManagerContent = modsManagerContent.replace(versionPRegex, newVersionPLine);
        updated = true;
        console.log('✅ Texte version mis à jour');
      }
      
      if (updated) {
        fs.writeFileSync(modsManagerPath, modsManagerContent);
        console.log('✅ Interface utilisateur mise à jour');
      } else {
        console.log('⚠️  Aucune version trouvée dans l\'interface');
      }
    } else {
      console.log('⚠️  Fichier mods-manager.tsx non trouvé');
    }
    
    // 6. Build React
    console.log('\n🔨 Build React...');
    execSync('npm run build:react', { stdio: 'inherit' });
    
    // 7. Build Electron
    console.log('\n📦 Build Electron...');
    execSync('npm run build:electron', { stdio: 'inherit' });
    
    // 8. Afficher les fichiers générés
    console.log('\n📁 Fichiers générés dans dist-electron/:');
    try {
      const allFiles = require('fs').readdirSync('./dist-electron');
      const exeFiles = allFiles.filter(f => f.endsWith('.exe'));
      const ymlFiles = allFiles.filter(f => f.endsWith('.yml'));
      
      console.log('\n📦 Installateurs NSIS:');
      exeFiles.forEach(file => console.log(`   ✅ ${file}`));
      
      console.log('\n📄 Métadonnées electron-updater:');
      ymlFiles.forEach(file => console.log(`   ✅ ${file}`));
      
      // Vérifier qu'on a bien les deux architectures
      const hasX64 = exeFiles.some(f => f.includes('x64'));
      const hasIa32 = exeFiles.some(f => f.includes('ia32'));
      const hasLatest = ymlFiles.some(f => f.includes('latest'));
      
      console.log('\n🎯 Vérification des builds:');
      console.log(`   ${hasX64 ? '✅' : '❌'} Installateur x64 (64-bit)`);
      console.log(`   ${hasIa32 ? '✅' : '❌'} Installateur ia32 (32-bit)`);
      console.log(`   ${hasLatest ? '✅' : '❌'} Fichier latest.yml pour les mises à jour`);
      
      if (!hasX64 || !hasIa32 || !hasLatest) {
        console.log('\n⚠️  Attention: Certains fichiers attendus sont manquants!');
      }
      
    } catch (error) {
      console.log('   Aucun fichier trouvé dans dist-electron/');
    }
    
    console.log(`\n✅ Build v${newVersion} terminé avec succès !`);
    console.log('📁 Les fichiers sont prêts dans le dossier dist-electron/');
    console.log('🚀 Compatible avec electron-updater pour les mises à jour automatiques');
    console.log('');
    console.log('📋 Prochaines étapes:');
    console.log('   1. Créez une nouvelle release sur GitHub avec le tag v' + newVersion);
    console.log('   2. Uploadez TOUS les fichiers (.exe + latest.yml) sur GitHub Releases');
    console.log('   3. Titre suggéré: "Mods Manager v' + newVersion + '"');
    console.log('   4. Les utilisateurs recevront automatiquement la notification de mise à jour');
    console.log('   5. Electron-updater gérera les mises à jour automatiquement');
    console.log('');
    console.log('🌐 Liens utiles:');
    console.log('   • Site web: https://modsmanager.azurich.fr');
    console.log('   • GitHub Releases: https://github.com/azurich/Mods_Manager/releases');
    console.log('   • Support: contact@azurich.fr');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();