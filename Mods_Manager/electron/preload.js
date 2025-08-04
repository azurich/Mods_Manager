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
  checkForUpdates: () => ipcRenderer.invoke('check-updates'),
  startUpdateDownload: () => ipcRenderer.invoke('start-update-download'),
  restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
  
  // Événements (pour la progression des téléchargements)
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, data) => callback(data));
  },
  
  // Événements de mise à jour
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  onUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloadStarted: (callback) => {
    ipcRenderer.on('update-download-started', (event, info) => callback(info));
  },
  
  // Nettoyage des écouteurs
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Ouvrir des liens externes
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});