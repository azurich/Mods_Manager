const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Script de build et release automatisé\n');

// 1. Lire la version actuelle
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const currentVersion = packageJson.version;

console.log(`📦 Version actuelle: ${currentVersion}`);

// 2. Demander le type de release
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askReleaseType() {
  return new Promise((resolve) => {
    console.log('\n🔢 Type de release:');
    console.log('1. patch (1.12.0 → 1.12.1) - Bug fixes');
    console.log('2. minor (1.12.0 → 1.13.0) - Nouvelles fonctionnalités');
    console.log('3. major (1.12.0 → 2.0.0) - Breaking changes');
    console.log('4. custom - Spécifier manuellement');
    
    rl.question('\nChoisissez (1-4): ', (answer) => {
      resolve(answer);
    });
  });
}

function askCustomVersion() {
  return new Promise((resolve) => {
    rl.question('Entrez la nouvelle version (ex: 1.12.1): ', (version) => {
      resolve(version);
    });
  });
}

async function main() {
  try {
    // Demander le type de release
    const releaseType = await askReleaseType();
    let newVersion;
    
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    
    switch(releaseType) {
      case '1': // patch
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      case '2': // minor
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case '3': // major
        newVersion = `${major + 1}.0.0`;
        break;
      case '4': // custom
        newVersion = await askCustomVersion();
        break;
      default:
        console.log('❌ Choix invalide');
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
    
    // 6. Vérifier si c'est un repo Git
    let isGitRepo = false;
    try {
      execSync('git status', { stdio: 'pipe' });
      isGitRepo = true;
    } catch (error) {
      console.log('⚠️  Pas de repository Git détecté');
    }
    
    if (isGitRepo) {
      // Git add, commit et tag
      console.log('\n📤 Commit et tag Git...');
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "Release v${newVersion}"`, { stdio: 'inherit' });
      execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
      
      // Push avec les tags
      console.log('\n🚀 Push vers GitHub...');
      execSync('git push', { stdio: 'inherit' });
      execSync('git push --tags', { stdio: 'inherit' });
    } else {
      console.log('\n📁 Pas de Git - vous devrez uploader manuellement les fichiers');
      console.log('📦 Fichiers générés dans dist-electron/:');
      const files = require('fs').readdirSync('./dist-electron').filter(f => f.endsWith('.exe'));
      files.forEach(file => console.log(`   - ${file}`));
    }
    
    // 8. Publier sur GitHub Releases
    console.log('\n🎉 Publication GitHub Release...');
    execSync(`npm run release`, { stdio: 'inherit' });
    
    console.log(`\n✅ Release v${newVersion} publiée avec succès !`);
    console.log(`🔗 Vérifiez: https://github.com/azurich/Mods_Manager/releases/tag/v${newVersion}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();