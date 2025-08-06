const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist-electron');

console.log('🔄 Nettoyage et renommage des fichiers générés...');

try {
  if (!fs.existsSync(distDir)) {
    console.log('❌ Le dossier dist-electron n\'existe pas');
    process.exit(1);
  }

  const files = fs.readdirSync(distDir);
  const exeFiles = files.filter(f => f.endsWith('.exe'));
  
  console.log('\n📦 Fichiers .exe trouvés:');
  exeFiles.forEach(file => console.log(`   📄 ${file}`));
  
  // Renommer ia32 en x86
  const ia32File = exeFiles.find(f => f.includes('ia32'));
  if (ia32File) {
    const newName = ia32File.replace('ia32', 'x86');
    const oldPath = path.join(distDir, ia32File);
    const newPath = path.join(distDir, newName);
    
    fs.renameSync(oldPath, newPath);
    console.log(`\n🔄 Renommé: ${ia32File} → ${newName}`);
    
    // Renommer aussi le fichier .blockmap
    const blockmapFile = ia32File + '.blockmap';
    const newBlockmapName = newName + '.blockmap';
    const oldBlockmapPath = path.join(distDir, blockmapFile);
    const newBlockmapPath = path.join(distDir, newBlockmapName);
    
    if (fs.existsSync(oldBlockmapPath)) {
      fs.renameSync(oldBlockmapPath, newBlockmapPath);
      console.log(`🔄 Renommé: ${blockmapFile} → ${newBlockmapName}`);
    }
  }
  
  // Pour electron-updater, il faut garder les fichiers avec architecture spécifique
  // et supprimer le générique car il ne correspond pas à une architecture précise
  const genericSetup = exeFiles.find(f => f === 'Mods-Manager-Setup.exe');
  if (genericSetup) {
    const genericPath = path.join(distDir, genericSetup);
    fs.unlinkSync(genericPath);
    console.log(`🗑️  Supprimé: ${genericSetup} (conflit d'architecture pour electron-updater)`);
    
    // Supprimer aussi son .blockmap
    const genericBlockmap = genericSetup + '.blockmap';
    const genericBlockmapPath = path.join(distDir, genericBlockmap);
    if (fs.existsSync(genericBlockmapPath)) {
      fs.unlinkSync(genericBlockmapPath);
      console.log(`🗑️  Supprimé: ${genericBlockmap}`);
    }
  }
  
  // Afficher les fichiers finaux
  const finalFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'));
  const ymlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.yml'));
  
  console.log('\n✅ Fichiers finaux:');
  finalFiles.forEach(file => console.log(`   🎯 ${file}`));
  
  console.log('\n📄 Métadonnées:');
  ymlFiles.forEach(file => console.log(`   📋 ${file}`));
  
  // Vérification
  const hasX64 = finalFiles.some(f => f.includes('x64'));
  const hasX86 = finalFiles.some(f => f.includes('x86'));
  const hasLatest = ymlFiles.some(f => f.includes('latest'));
  
  if (hasX64 && hasX86 && hasLatest) {
    console.log('\n🎉 Build parfait ! Prêt pour GitHub Releases');
    console.log('   ✅ Installateur x64 (64-bit)');
    console.log('   ✅ Installateur x86 (32-bit)');
    console.log('   ✅ Métadonnées electron-updater (architecture-aware)');
  } else {
    console.log('\n⚠️  Vérification échouée:');
    console.log(`   ${hasX64 ? '✅' : '❌'} Installateur x64`);
    console.log(`   ${hasX86 ? '✅' : '❌'} Installateur x86`);
    console.log(`   ${hasLatest ? '✅' : '❌'} Fichier latest.yml`);
  }
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}