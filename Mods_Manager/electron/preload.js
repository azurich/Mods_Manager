const { contextBridge, ipcRenderer } = require('electron');

// Exposer les APIs sécurisées au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des instances Minecraft (multi-plateforme)
  detectLaunchers: () => ipcRenderer.invoke('detect-launchers'),
  getInstancesForLauncher: (launcherId) => ipcRenderer.invoke('get-instances-for-launcher', launcherId),
  getMinecraftInstances: () => ipcRenderer.invoke('get-minecraft-instances'), // Rétrocompatibilité
  
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
  onUpdateChecking: (callback) => {
    ipcRenderer.on('update-checking', (event) => callback());
  },
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
    ipcRenderer.on('update-download-progress', (event, progress) => callback(progress));
  },
  onUpdateDownloadStarted: (callback) => {
    ipcRenderer.on('update-download-started', (event, info) => callback(info));
  },
  
  // Nettoyage des écouteurs
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Ouvrir des liens externes
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Gestion des logs (support utilisateur)
  openLogFile: () => ipcRenderer.invoke('open-log-file'),
  getLogContent: () => ipcRenderer.invoke('get-log-content'),
  
  // Gestion de la configuration distante
  refreshModsConfig: () => ipcRenderer.invoke('refresh-mods-config'),
  getConfigInfo: () => ipcRenderer.invoke('get-config-info'),
  
  // Gestion des préférences de langue
  saveLanguagePreference: (language) => ipcRenderer.invoke('save-language-preference', language),
  getLanguagePreference: () => ipcRenderer.invoke('get-language-preference')
});