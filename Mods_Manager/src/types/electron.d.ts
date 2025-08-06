// Types pour l'API Electron étendue avec i18n
interface ElectronAPI {
  // Gestion des instances Minecraft (multi-plateforme)
  detectLaunchers: () => Promise<Launcher[]>
  getInstancesForLauncher: (launcherId: string) => Promise<MinecraftInstance[]>
  getMinecraftInstances: () => Promise<MinecraftInstance[]>
  
  // Sauvegarde et récupération des paramètres
  saveLastInstance: (instanceName: string) => Promise<boolean>
  getLastInstance: () => Promise<string | null>
  
  // Gestion des mods
  deleteOldMods: (modsPath: string) => Promise<any[]>
  downloadNewMods: (modsPath: string) => Promise<any[]>
  
  // Mises à jour
  checkUpdates: () => Promise<void>
  checkForUpdates: () => Promise<void>
  startUpdateDownload: () => Promise<boolean>
  restartAndInstall: () => void
  
  // Événements (pour la progression des téléchargements)
  onDownloadProgress: (callback: (data: any) => void) => void
  
  // Événements de mise à jour
  onUpdateChecking?: (callback: () => void) => void
  onUpdateAvailable?: (callback: (info: any) => void) => void
  onUpdateNotAvailable?: (callback: (info?: any) => void) => void
  onUpdateError?: (callback: (error: string) => void) => void
  onUpdateDownloaded?: (callback: (info: any) => void) => void
  onUpdateDownloadProgress?: (callback: (progress: any) => void) => void
  onUpdateDownloadStarted?: (callback: (info: any) => void) => void
  
  // Nettoyage des écouteurs
  removeAllListeners: (channel: string) => void
  
  // Ouvrir des liens externes
  openExternal?: (url: string) => Promise<void>
  
  // Gestion des logs (support utilisateur)
  openLogFile?: () => Promise<boolean>
  getLogContent?: () => Promise<string>
  
  // Gestion de la configuration distante
  refreshModsConfig?: () => Promise<any>
  getConfigInfo?: () => Promise<any>
  
  // Gestion des préférences de langue
  saveLanguagePreference?: (language: string) => Promise<boolean>
  getLanguagePreference?: () => Promise<string | null>
}

interface Launcher {
  id: string
  name: string
  path: string
  instancesPath: string
}

interface MinecraftInstance {
  name: string
  path: string
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {};