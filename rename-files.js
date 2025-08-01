const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist-electron');

console.log('🔄 Nettoyage et renommage des fichiers...');

try {
  const files = fs.readdirSync(distDir);
  
  files.forEach(file => {
    // Renommer ia32 → x86
    if (file.includes('-ia32.exe')) {
      const newName = file.replace('-ia32.exe', '-x86.exe');
      const oldPath = path.join(distDir, file);
      const newPath = path.join(distDir, newName);
      
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renommé: ${file} → ${newName}`);
    }
    
    // Supprimer les versions génériques (sans architecture)
    else if (file.startsWith('Mods-Manager-Setup.exe') || 
             file.startsWith('Mods-Manager-Portable.exe') ||
             (file.includes('Mods-Manager') && !file.includes('-x64') && !file.includes('-x86') && !file.includes('-ia32') && file.endsWith('.exe'))) {
      const filePath = path.join(distDir, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️  Supprimé: ${file} (version générique)`);
    }
  });
  
  console.log('🎉 Nettoyage terminé !');
  
  // Afficher les fichiers finaux
  const finalFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.exe'));
  console.log('\n📦 Fichiers finaux:');
  finalFiles.forEach(file => console.log(`   - ${file}`));
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}