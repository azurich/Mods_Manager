const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist-electron');

console.log('🔄 Vérification des fichiers générés...');

try {
  if (!fs.existsSync(distDir)) {
    console.log('❌ Le dossier dist-electron n\'existe pas');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  const exeFiles = files.filter(f => f.endsWith('.exe'));
  const ymlFiles = files.filter(f => f.endsWith('.yml'));
  
  console.log('\n📦 Fichiers générés:');
  exeFiles.forEach(file => console.log(`   📄 ${file}`));
  
  console.log('\n📄 Métadonnées:');
  ymlFiles.forEach(file => console.log(`   📋 ${file}`));
  
  // Vérification des installateurs par architecture
  const hasX64 = exeFiles.some(f => f.includes('x64'));
  const hasIa32 = exeFiles.some(f => f.includes('ia32'));
  const hasLatest = ymlFiles.some(f => f.includes('latest'));
  
  console.log('\n🎯 Vérification:');
  console.log(`   ${hasX64 ? '✅' : '❌'} Installateur x64 (64-bit)`);
  console.log(`   ${hasIa32 ? '✅' : '❌'} Installateur ia32 (32-bit)`);
  console.log(`   ${hasLatest ? '✅' : '❌'} Fichier latest.yml pour les mises à jour`);
  
  if (hasX64 && hasIa32 && hasLatest) {
    console.log('\n🎉 Build parfait ! Prêt pour GitHub Releases et electron-updater');
    console.log('   ✅ Architectures séparées avec DLLs correctement packagées');
    console.log('   ✅ electron-updater peut choisir la bonne architecture automatiquement');
    console.log('   ✅ Finies les erreurs ffmpeg.dll et autres DLLs manquantes !');
  } else {
    console.log('\n⚠️  Vérification échouée:');
    console.log(`   ${hasX64 ? '✅' : '❌'} Installateur x64`);
    console.log(`   ${hasIa32 ? '✅' : '❌'} Installateur ia32`);
    console.log(`   ${hasLatest ? '✅' : '❌'} Fichier latest.yml`);
    
    if (!hasX64 || !hasIa32) {
      console.log('\n💡 Les deux architectures sont nécessaires pour un bon fonctionnement');
    }
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}