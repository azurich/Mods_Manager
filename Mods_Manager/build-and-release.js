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
    
    console.log('✅ Version mise à jour');
    
    // 4. Build React
    console.log('\n🔨 Build React...');
    execSync('npm run build:react', { stdio: 'inherit' });
    
    // 5. Build Electron
    console.log('\n📦 Build Electron...');
    execSync('npm run build:electron', { stdio: 'inherit' });
    
    // 6. Afficher les fichiers générés
    console.log('\n📁 Fichiers générés dans dist-electron/:');
    try {
      const files = require('fs').readdirSync('./dist-electron').filter(f => f.endsWith('.exe') || f.endsWith('.zip'));
      files.forEach(file => console.log(`   - ${file}`));
    } catch (error) {
      console.log('   Aucun fichier trouvé dans dist-electron/');
    }
    
    console.log(`\n✅ Build v${newVersion} terminé avec succès !`);
    console.log('📁 Les fichiers sont prêts dans le dossier dist-electron/');
    console.log('🔗 Vous pouvez maintenant les distribuer manuellement');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();