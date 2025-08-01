const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs sécurisées au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des instances Minecraft
  getMinecraftInstances: () => ipcRenderer.invoke('get-minecraft-instances'),
  
  // Sauvegarde et récupération des paramètres
  saveLastInstance: (instanceName) => ipcRenderer.invoke('save-last-instance', instanceName),
  getLastInstance: () => ipcRenderer.invoke('get-last-instance'),
  
  // Gestion des mods
  deleteOldMods: (modsPath) => ipcRenderer.invoke('delete-old-mods', modsPath),
  downloadNewMods: (modsPath) => ipcRenderer.invoke('download-new-mods', modsPath),
  
  // Mises à jour
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  
  // Événements (pour la progression des téléchargements)
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  
  // Nettoyage des écouteurs
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});