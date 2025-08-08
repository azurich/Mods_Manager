const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ASCII Art et style terminal
console.clear();
console.log('\x1b[36m%s\x1b[0m', `
 ███╗   ███╗ ██████╗ ██████╗ ███████╗    ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗██████╗ 
 ████╗ ████║██╔═══██╗██╔══██╗██╔════╝    ████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝██╔══██╗
 ██╔████╔██║██║   ██║██║  ██║███████╗    ██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗  ██████╔╝
 ██║╚██╔╝██║██║   ██║██║  ██║╚════██║    ██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝  ██╔══██╗
 ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████║    ██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗██║  ██║
 ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝    ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝
`);

console.log('\x1b[33m%s\x1b[0m', '                            🚀 BUILD & RELEASE AUTOMATION 🚀\n');
console.log('═'.repeat(100));

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
      
      // Remplacer les versions dans l'interface (format i18n)
      const badgeRegex = /<Badge variant="secondary">\{t\('app\.version', \{ version: '[\d.]+' \}\)\}<\/Badge>/;
      const versionPRegex = /\{t\('settings\.information\.version', \{ version: '[\d.]+' \}\)\}/;
      
      const newBadgeLine = `<Badge variant="secondary">{t('app.version', { version: '${newVersion}' })}</Badge>`;
      const newVersionPLine = `{t('settings.information.version', { version: '${newVersion}' })}`;
      
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
    
    // 6. Nettoyer le dossier dist-electron
    console.log('\n🧹 Nettoyage du dossier dist-electron...');
    const distElectronPath = path.join(__dirname, 'dist-electron');
    
    if (fs.existsSync(distElectronPath)) {
      const files = fs.readdirSync(distElectronPath);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(distElectronPath, file);
        try {
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
          deletedCount++;
        } catch (error) {
          console.warn(`⚠️  Impossible de supprimer ${file}:`, error.message);
        }
      }
      
      if (deletedCount > 0) {
        console.log(`✅ ${deletedCount} fichier(s)/dossier(s) supprimé(s)`);
      } else {
        console.log('✅ Dossier déjà vide');
      }
    } else {
      console.log('ℹ️  Dossier dist-electron n\'existe pas encore');
    }
    
    // 7. Build React
    console.log('\n🔨 Build React...');
    execSync('npm run build:react', { stdio: 'inherit' });
    
    // 8. Build Electron
    console.log('\n📦 Build Electron...');
    execSync('npm run build:electron', { stdio: 'inherit' });
    
    // 9. Afficher les fichiers générés
    console.log('\n📁 Fichiers générés dans dist-electron/:');
    try {
      const allFiles = require('fs').readdirSync('./dist-electron');
      const exeFiles = allFiles.filter(f => f.endsWith('.exe'));
      const ymlFiles = allFiles.filter(f => f.endsWith('.yml'));
      
      console.log('\n📦 Installateurs NSIS:');
      exeFiles.forEach(file => console.log(`   ✅ ${file}`));
      
      console.log('\n📄 Métadonnées electron-updater:');
      ymlFiles.forEach(file => console.log(`   ✅ ${file}`));
      
      // Vérifier qu'on a bien l'installateur universel
      const hasUniversalInstaller = exeFiles.some(f => f === 'Mods-Manager-Setup.exe');
      const hasLatest = ymlFiles.some(f => f.includes('latest'));
      
      console.log('\n🎯 Vérification des builds:');
      console.log(`   ${hasUniversalInstaller ? '✅' : '❌'} Installateur universel (x64 + x86)`);
      console.log(`   ${hasLatest ? '✅' : '❌'} Fichier latest.yml pour les mises à jour`);
      
      if (!hasUniversalInstaller || !hasLatest) {
        console.log('\n⚠️  Attention: Certains fichiers attendus sont manquants!');
      } else {
        console.log('\n🎉 Setup parfait pour electron-updater!');
        console.log('   ✅ Un seul fichier = pas d\'erreur 404');
        console.log('   ✅ electron-updater détectera automatiquement l\'architecture');
      }
      
    } catch (error) {
      console.log('   Aucun fichier trouvé dans dist-electron/');
    }
    
    console.log('\x1b[32m%s\x1b[0m', `\n✅ Build v${newVersion} terminé avec succès !`);
    console.log('\x1b[36m%s\x1b[0m', '📁 Les fichiers sont prêts dans le dossier dist-electron/');
    console.log('\x1b[35m%s\x1b[0m', '🚀 Compatible avec electron-updater pour les mises à jour automatiques');
    console.log('\n' + '═'.repeat(100));
    console.log('\x1b[33m%s\x1b[0m', '🎉 PROCESSUS TERMINÉ AVEC SUCCÈS 🎉');
    console.log('═'.repeat(100));
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();