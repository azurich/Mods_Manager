import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from '@/components/theme-provider'
import { useTranslation } from 'react-i18next'
import { changeLanguage, getCurrentLanguage, supportedLanguages, SupportedLanguages, initializeLanguage } from '@/i18n/config'
import { 
  Package, 
  Folder, 
  Trash2, 
  Download, 
  RefreshCw, 
  Settings,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Github,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  Database,
  RotateCcw,
  Languages
} from 'lucide-react'

interface MinecraftInstance {
  name: string
  path: string
}

// Types pour l'API Electron
interface Launcher {
  id: string
  name: string
  path: string
  instancesPath: string
}

interface ElectronAPI {
  detectLaunchers: () => Promise<Launcher[]>
  getInstancesForLauncher: (launcherId: string) => Promise<MinecraftInstance[]>
  getMinecraftInstances: () => Promise<MinecraftInstance[]>
  saveLastInstance: (instanceName: string) => Promise<boolean>
  getLastInstance: () => Promise<string | null>
  deleteOldMods: (modsPath: string) => Promise<any[]>
  downloadNewMods: (modsPath: string) => Promise<any[]>
  onDownloadProgress: (callback: (data: any) => void) => void
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export function ModsManager() {
  const [launchers, setLaunchers] = useState<Launcher[]>([])
  const [selectedLauncher, setSelectedLauncher] = useState<string>('')
  const [instances, setInstances] = useState<MinecraftInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [selectedInstancePath, setSelectedInstancePath] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInstancesLoading, setIsInstancesLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [updateState, setUpdateState] = useState<'none' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'>('none')
  const [updateProgress, setUpdateProgress] = useState(0)
  const [updateError, setUpdateError] = useState<string>('')
  const [configInfo, setConfigInfo] = useState<any>(null)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguages>(getCurrentLanguage() as SupportedLanguages)

  const handleCheckForUpdates = async () => {
    console.log('🔘 BOUTON REFRESH CLIQUE');
    
    if (!window.electronAPI) {
      console.log('⚠️ Mode dev - electronAPI non disponible');
      toast({
        variant: "info",
        title: t('toasts.devMode'),
        description: t('toasts.devModeDesc'),
      })
      return
    }

    console.log('✅ electronAPI disponible');
    
    // Afficher l'état de vérification
    setUpdateState('checking')
    setUpdateError('')
    
    try {
      console.log('📞 Appel checkForUpdates...');
      await window.electronAPI.checkForUpdates()
      console.log('✅ checkForUpdates terminé');
    } catch (error) {
      console.log('❌ Erreur checkForUpdates:', error);
      setUpdateState('error')
      setUpdateError(error.toString())
    }
  }

  const handleInstallUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.restartAndInstall()
    }
  }

  const loadInstances = async () => {
    setIsInstancesLoading(true)
    toast({
      title: t('instances.title'),
      description: t('launchers.searching'),
    })
    
    try {
      // Vérifier si l'API Electron est disponible
      if (!window.electronAPI) {
        // Mode développement - instances fictives pour test
        const mockInstances = [
          { name: 'Test Instance 1', path: '/path/to/instance1/mods' },
          { name: 'Test Instance 2', path: '/path/to/instance2/mods' }
        ]
        setInstances(mockInstances)
        toast({
          variant: "info",
          title: t('toasts.devMode'),
          description: `${mockInstances.length} instance(s) de test chargées`,
        })
        return
      }

      const instancesList = await window.electronAPI.getMinecraftInstances()
      setInstances(instancesList)
      
      if (instancesList.length === 0) {
        toast({
          variant: "destructive",
          title: t('toasts.noLaunchers'),
          description: t('toasts.noLaunchersDesc'),
        })
      } else {
        toast({
          variant: "info",
          title: t('toasts.instancesLoaded'),
          description: t('toasts.instancesLoadedDesc', { count: instancesList.length, launcher: 'CurseForge' }),
        })

        // Restaurer la dernière instance utilisée
        const lastInstance = await window.electronAPI.getLastInstance()
        if (lastInstance && instancesList.some(i => i.name === lastInstance)) {
          setSelectedInstance(lastInstance)
          const instance = instancesList.find(i => i.name === lastInstance)
          if (instance) {
            setSelectedInstancePath(instance.path)
          }
          toast({
            variant: "info",
            title: t('toasts.instanceRestored'),
            description: t('toasts.instanceRestoredDesc', { name: lastInstance }),
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toasts.loadingError'),
        description: t('toasts.loadingErrorDesc', { error }),
      })
    } finally {
      setIsInstancesLoading(false)
    }
  }

  const loadLaunchers = async () => {
    setIsInstancesLoading(true)
    toast({
      title: t('launchers.detection'),
      description: t('launchers.searching'),
    })

    try {
      if (!window.electronAPI) {
        // Mode développement - launchers fictifs pour test
        const mockLaunchers = [
          { id: 'curseforge', name: 'CurseForge', path: '/test/curseforge', instancesPath: '/test/curseforge' }
        ]
        setLaunchers(mockLaunchers)
        setSelectedLauncher('curseforge')
        
        const mockInstances = [
          { name: 'Test Instance 1', path: '/path/to/instance1/mods' },
          { name: 'Test Instance 2', path: '/path/to/instance2/mods' }
        ]
        setInstances(mockInstances)
        setIsInstancesLoading(false)
        
        toast({
          variant: "info",
          title: t('toasts.devMode'),
          description: "Launchers et instances de test chargés",
        })
        return
      }

      const detectedLaunchers = await window.electronAPI.detectLaunchers()
      setLaunchers(detectedLaunchers)

      if (detectedLaunchers.length > 0) {
        // Ne pas sélectionner automatiquement - laisser l'utilisateur choisir
        toast({
          title: t('toasts.launchersDetected'),
          description: t('toasts.launchersDetectedDesc', { count: detectedLaunchers.length }),
          variant: "info"
        })
        setIsInstancesLoading(false) // Important : débloquer les boutons !
      } else {
        toast({
          title: t('toasts.noLaunchers'),
          description: t('toasts.noLaunchersDesc'),
          variant: "destructive",
        })
        setIsInstancesLoading(false)
      }
    } catch (error) {
      console.error('Erreur détection launchers:', error)
      toast({
        title: t('toasts.loadingError'),
        description: "Impossible de détecter les launchers",
        variant: "destructive",
      })
      setIsInstancesLoading(false)
    }
  }

  const loadInstancesForLauncher = async (launcherId: string) => {
    if (!launcherId) return
    
    setIsInstancesLoading(true)
    const launcher = launchers.find(l => l.id === launcherId)
    
    try {
      if (window.electronAPI) {
        const minecraftInstances = await window.electronAPI.getInstancesForLauncher(launcherId)
        setInstances(minecraftInstances)

        // Reset la sélection d'instance
        setSelectedInstance('')
        setSelectedInstancePath('')

        toast({
          title: t('toasts.instancesLoaded'),
          description: t('toasts.instancesLoadedDesc', { count: minecraftInstances.length, launcher: launcher?.name }),
          variant: "info"
        })
      }
    } catch (error) {
      console.error(`Erreur instances ${launcherId}:`, error)
      toast({
        title: t('toasts.loadingError'),
        description: `Impossible de charger les instances ${launcher?.name}`,
        variant: "destructive",
      })
    } finally {
      setIsInstancesLoading(false)
    }
  }

  const handleInstanceSelect = async (instanceName: string) => {
    setSelectedInstance(instanceName)
    const instance = instances.find(i => i.name === instanceName)
    if (instance) {
      setSelectedInstancePath(instance.path)
      
      try {
        if (window.electronAPI) {
          await window.electronAPI.saveLastInstance(instanceName)
        }
        toast({
          variant: "info",
          title: t('toasts.instanceSelected'),
          description: `${instanceName} - ${instance.path}`,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: t('toasts.saveError'),
          description: t('toasts.saveErrorDesc', { error }),
        })
      }
    }
  }

  const handleDeleteMods = async () => {
    if (!selectedInstancePath) {
      toast({
        variant: "destructive",
        title: t('toasts.instanceMissing'),
        description: t('toasts.instanceMissingDesc'),
      })
      return
    }

    setIsLoading(true)
    toast({
      title: t('actions.cleanup.inProgress'),
      description: t('actions.cleanup.removing'),
    })
    
    try {
      if (!window.electronAPI) {
        // Mode développement - simulation
        toast({
          variant: "info",
          title: t('toasts.devMode'),
          description: "Suppression simulée en cours...",
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast({
          variant: "success",
          title: t('toasts.deletionComplete'),
          description: "Simulation de suppression terminée avec succès",
        })
        return
      }

      const results = await window.electronAPI.deleteOldMods(selectedInstancePath)
      
      const successCount = results.filter(r => r.status === 'success').length
      const errorCount = results.filter(r => r.status === 'error').length
      
      toast({
        variant: errorCount > 0 ? "destructive" : "success",
        title: t('toasts.deletionComplete'),
        description: t('toasts.filesDeleted', { count: successCount }) + (errorCount > 0 ? t('toasts.withErrors', { count: errorCount }) : ''),
      })
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toasts.deletionError'),
        description: t('toasts.deletionErrorDesc', { error }),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallMods = async () => {
    if (!selectedInstancePath) {
      toast({
        variant: "destructive",
        title: t('toasts.instanceMissing'),
        description: t('toasts.instanceMissingDesc'),
      })
      return
    }

    setIsLoading(true)
    // Créer une notification de progression persistante
    const progressToast = toast({
      variant: "info",
      title: t('actions.install.inProgress'),
      description: t('actions.install.downloading'),
      duration: 1000000, // Très long pour qu'elle reste affichée
    })
    
    try {
      if (!window.electronAPI) {
        // Mode développement - simulation avec progression
        for (let i = 0; i <= 100; i += 20) {
          // Mettre à jour la notification de progression
          progressToast.update({
            title: t('actions.install.inProgress'),
            description: `Progression de simulation: ${i}%`,
          })
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        // Fermer la notification de progression et afficher le succès
        progressToast.dismiss()
        toast({
          variant: "success",
          title: t('toasts.installComplete'),
          description: "Simulation d'installation terminée avec succès",
        })
        return
      }

      // Écouter les événements de progression
      window.electronAPI.onDownloadProgress((data) => {
        // Mettre à jour la notification de progression en temps réel
        progressToast.update({
          title: t('actions.install.inProgress'),
          description: `${data.filename} (${data.completed}/${data.total}) - ${data.progress}%`,
        })
      })
      
      const results = await window.electronAPI.downloadNewMods(selectedInstancePath)
      
      // Fermer la notification de progression
      progressToast.dismiss()
      
      const successCount = results.filter(r => r.status === 'success').length
      const errorCount = results.filter(r => r.status === 'error').length
      
      toast({
        variant: errorCount > 0 ? "destructive" : "success",
        title: t('toasts.installComplete'),
        description: t('toasts.modsInstalled', { count: successCount }) + (errorCount > 0 ? t('toasts.withErrors', { count: errorCount }) : ''),
      })
      
    } catch (error) {
      // Fermer la notification de progression en cas d'erreur
      progressToast.dismiss()
      toast({
        variant: "destructive",
        title: t('toasts.installError'),
        description: t('toasts.installErrorDesc', { error }),
      })
    } finally {
      setIsLoading(false)
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download-progress')
      }
    }
  }

  const handleRefreshConfig = async () => {
    if (!window.electronAPI?.refreshModsConfig) {
      toast({
        variant: "destructive",
        title: t('toasts.notAvailable'),
        description: t('toasts.notAvailableDesc'),
      })
      return
    }

    toast({
      title: t('settings.configuration.refreshing'),
      description: t('settings.configuration.refreshDesc'),
    })

    try {
      const result = await window.electronAPI.refreshModsConfig()
      
      if (result.success) {
        await loadConfigInfo() // Recharger les infos de config
        toast({
          variant: "info",
          title: t('toasts.configRefreshed'),
          description: `${result.summary.oldModsCount} à supprimer • ${result.summary.newModsCount} à installer • ${result.summary.configFilesCount} fichiers config`,
        })
      } else {
        toast({
          variant: "destructive",
          title: t('toasts.configRefreshError'),
          description: result.error || "Impossible d'actualiser la configuration",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t('toasts.configRefreshError'),
        description: `Erreur: ${error}`,
      })
    }
  }

  const loadConfigInfo = async () => {
    if (window.electronAPI?.getConfigInfo) {
      try {
        const result = await window.electronAPI.getConfigInfo()
        if (result.success) {
          setConfigInfo(result.info)
        }
      } catch (error) {
        console.warn('Impossible de charger les infos de config:', error)
      }
    }
  }

  useEffect(() => {
    // Initialiser la langue depuis Electron store
    initializeLanguage().then(() => {
      setCurrentLanguage(getCurrentLanguage() as SupportedLanguages)
    })
    
    // Chargement immédiat pour une expérience plus rapide
    loadLaunchers()
    loadConfigInfo() // Charger les infos de configuration
    
    // Gestionnaires d'événements pour les mises à jour
    if (window.electronAPI) {
      // Nettoyer les listeners existants pour éviter les doublons
      window.electronAPI.removeAllListeners('update-checking')
      window.electronAPI.removeAllListeners('update-available')
      window.electronAPI.removeAllListeners('update-download-started')
      window.electronAPI.removeAllListeners('update-downloaded')
      window.electronAPI.removeAllListeners('update-not-available')
      window.electronAPI.removeAllListeners('update-error')

      // Vérification en cours
      if (window.electronAPI.onUpdateChecking) {
        window.electronAPI.onUpdateChecking(() => {
          console.log('🔍 Vérification des mises à jour en cours...')
          setUpdateState('checking')
          setUpdateError('')
        })
      }

      // Mise à jour disponible
      if (window.electronAPI.onUpdateAvailable) {
        window.electronAPI.onUpdateAvailable((info) => {
          console.log('🔄 Mise à jour disponible reçue:', info)
          setUpdateInfo(info)
          setUpdateState('available')
        })
      }

      // Téléchargement de mise à jour commencé
      if (window.electronAPI.onUpdateDownloadStarted) {
        window.electronAPI.onUpdateDownloadStarted((info) => {
          console.log('📥 Téléchargement commencé:', info)
          setUpdateInfo(info)
          setUpdateState('downloading')
          setUpdateProgress(0)
        })
      }

      // Progression du téléchargement
      if (window.electronAPI.onUpdateDownloadProgress) {
        window.electronAPI.onUpdateDownloadProgress((progress) => {
          console.log('📊 Progression téléchargement:', progress.percent + '%')
          setUpdateProgress(progress.percent)
        })
      }

      // Mise à jour téléchargée
      if (window.electronAPI.onUpdateDownloaded) {
        window.electronAPI.onUpdateDownloaded((info) => {
          console.log('✅ Téléchargement terminé:', info)
          setUpdateInfo(info)
          setUpdateState('ready')
          setUpdateProgress(100)
        })
      }

      // Pas de mise à jour disponible
      if (window.electronAPI.onUpdateNotAvailable) {
        window.electronAPI.onUpdateNotAvailable(() => {
          console.log('📱 Pas de mise à jour disponible')
          // Attendre un peu pour laisser le temps de voir l'état "checking"
          setTimeout(() => {
            setUpdateState('none')
            toast({
              variant: "info",
              title: `📱 ${t('updates.noUpdate')}`,
              description: t('updates.noUpdateDesc'),
            })
          }, 1500)
        })
      }

      // Erreur lors de la vérification
      if (window.electronAPI.onUpdateError) {
        window.electronAPI.onUpdateError((error) => {
          console.log('❌ Erreur mise à jour:', error)
          setUpdateError(error.toString())
          setUpdateState('error')
        })
      }
    }
    
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download-progress')
        window.electronAPI.removeAllListeners('update-checking')
        window.electronAPI.removeAllListeners('update-available')
        window.electronAPI.removeAllListeners('update-download-started')
        window.electronAPI.removeAllListeners('update-download-progress')
        window.electronAPI.removeAllListeners('update-not-available')
        window.electronAPI.removeAllListeners('update-error')
        window.electronAPI.removeAllListeners('update-downloaded')
      }
    }
  }, [])

  // Charger les instances quand le launcher change
  useEffect(() => {
    if (selectedLauncher) {
      loadInstancesForLauncher(selectedLauncher)
    }
  }, [selectedLauncher, launchers])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex-shrink-0 bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">
                {t('app.title')}
              </h1>
              <Badge variant="secondary">{t('app.version', { version: '2.0.6' })}</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCheckForUpdates}
                title={t('header.checkUpdates')}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLanguageMenu(true)}
                title={t('language.label')}
              >
                <Languages className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title={t('header.settings')}
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Interface de mise à jour stylée */}
      {updateState !== 'none' && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b border-blue-200 dark:border-blue-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {updateState === 'checking' && <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />}
                  {updateState === 'available' && <ArrowUp className="h-6 w-6 text-blue-600 animate-bounce" />}
                  {updateState === 'downloading' && <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}
                  {updateState === 'ready' && <CheckCircle className="h-6 w-6 text-green-600" />}
                  {updateState === 'error' && <AlertCircle className="h-6 w-6 text-red-600" />}
                </div>
                
                <div className="flex-1">
                  {updateState === 'checking' && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        🔍 {t('updates.checking')}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t('updates.searchingGithub')}
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'available' && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        🚀 {t('updates.available')}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Version {updateInfo?.version} • {updateInfo?.size ? `${(updateInfo.size / (1024 * 1024)).toFixed(1)} MB` : 'Taille inconnue'}
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'downloading' && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        📥 {t('updates.downloadProgress')}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Version {updateInfo?.version} • {updateProgress}% {t('updates.completed')}
                      </p>
                      <div className="mt-2 w-full bg-blue-200 rounded-full h-2 dark:bg-blue-800">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${updateProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {updateState === 'ready' && (
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        ✅ {t('updates.ready')}
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Version {updateInfo?.version} téléchargée • Prêt à installer
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'error' && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                        ⚠️ {t('updates.error')}
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {updateError || 'Une erreur est survenue'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {updateState === 'checking' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                    >
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t('updates.checking')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdateState('none')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {updateState === 'available' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={async () => {
                        if (window.electronAPI?.startUpdateDownload) {
                          // Déclencher le téléchargement
                          await window.electronAPI.startUpdateDownload()
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('updates.install')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdateState('none')}
                    >
                      {t('updates.later')}
                    </Button>
                  </>
                )}
                
                {updateState === 'ready' && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      if (window.electronAPI?.restartAndInstall) {
                        window.electronAPI.restartAndInstall()
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('updates.restart')}
                  </Button>
                )}
                
                {(updateState === 'error' || updateState === 'downloading') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUpdateState('none')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          
          {/* Section Instance */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Folder className="h-5 w-5 text-primary" />
                <CardTitle>{t('instances.title')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sélection de l'instance */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('instances.selectInstance')}</h4>
                <Select 
                  value={selectedInstance} 
                  onValueChange={handleInstanceSelect}
                  disabled={isInstancesLoading || !selectedLauncher}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      isInstancesLoading ? t('instances.loading') : 
                      !selectedLauncher ? t('instances.chooseFirst') :
                      t('instances.selectPlaceholder')
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {instances.map((instance) => (
                      <SelectItem key={instance.name} value={instance.name}>
                        {instance.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Sélection du launcher - Centrée */}
              <div className="flex justify-center space-x-3">
                {launchers.map((launcher) => (
                  <Button
                    key={launcher.id}
                    variant={selectedLauncher === launcher.id ? 'default' : 'outline'}
                    size="default"
                    onClick={() => setSelectedLauncher(launcher.id)}
                    className="flex items-center space-x-2 min-w-[120px]"
                    disabled={isInstancesLoading}
                  >
                    <Package className="h-4 w-4" />
                    <span>{launcher.name}</span>
                  </Button>
                ))}
                {launchers.length === 0 && !isInstancesLoading && (
                  <p className="text-sm text-muted-foreground">{t('instances.none')}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Card Nettoyage */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <CardTitle>{t('actions.cleanup.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('actions.cleanup.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  className="w-full space-x-2" 
                  onClick={handleDeleteMods}
                  disabled={!selectedInstancePath || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>{t('actions.cleanup.button')}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Card Installation */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Download className="h-5 w-5 text-green-600" />
                  <CardTitle>{t('actions.install.title')}</CardTitle>
                </div>
                <CardDescription>
                  {t('actions.install.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full space-x-2 bg-green-600 hover:bg-green-700" 
                  onClick={handleInstallMods}
                  disabled={!selectedInstancePath || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>{t('actions.install.button')}</span>
                </Button>
              </CardContent>
            </Card>
          </div>


        </div>

      </div>

      {/* Modal Sélecteur de langue */}
      {showLanguageMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-xs mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('language.label')}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowLanguageMenu(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={currentLanguage === 'fr' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={async () => {
                  await changeLanguage('fr')
                  setCurrentLanguage('fr')
                  setShowLanguageMenu(false)
                  toast({
                    variant: "info",
                    title: t('language.label'),
                    description: supportedLanguages['fr'],
                  })
                }}
              >
                {t('language.french')}
              </Button>
              <Button
                variant={currentLanguage === 'en' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={async () => {
                  await changeLanguage('en')
                  setCurrentLanguage('en')
                  setShowLanguageMenu(false)
                  toast({
                    variant: "info",
                    title: t('language.label'),
                    description: supportedLanguages['en'],
                  })
                }}
              >
                {t('language.english')}
              </Button>
              <Button
                variant={currentLanguage === 'es' ? 'default' : 'outline'}
                className="w-full justify-start"
                onClick={async () => {
                  await changeLanguage('es')
                  setCurrentLanguage('es')
                  setShowLanguageMenu(false)
                  toast({
                    variant: "info",
                    title: t('language.label'),
                    description: supportedLanguages['es'],
                  })
                }}
              >
                {t('language.spanish')}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('settings.title')}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('settings.information.title')}</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('settings.information.version', { version: '2.0.6' })}</p>
                  <p>{t('settings.information.developer')}</p>
                </div>
              </div>
              
              

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('settings.configuration.title')}</h4>
                {configInfo && (
                  <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
                    <p><Database className="h-3 w-3 inline mr-1" />{t('settings.configuration.source', { source: configInfo.source })}</p>
                    <p>{t('settings.configuration.lastUpdate', { date: configInfo.lastUpdate === 'Jamais' ? t('settings.configuration.never') : configInfo.lastUpdate })}</p>
                    <p>{t('settings.configuration.modsInfo', { oldMods: configInfo.oldModsCount, newMods: configInfo.newModsCount, configFiles: configInfo.configFilesCount })}</p>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshConfig}
                  className="flex items-center space-x-2 w-full"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{t('settings.configuration.refresh')}</span>
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('settings.actions.title')}</h4>
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      loadLaunchers()
                      setShowSettings(false)
                    }}
                  >
                    {t('settings.actions.refreshInstances')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (window.electronAPI?.openExternal) {
                        window.electronAPI.openExternal('https://github.com/azurich/Mods_Manager')
                      } else {
                        window.open('https://github.com/azurich/Mods_Manager', '_blank')
                      }
                    }}
                    className="flex items-center space-x-2"
                  >
                    <Github className="h-4 w-4" />
                    <span>{t('settings.actions.github')}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (window.electronAPI?.openLogFile) {
                        window.electronAPI.openLogFile()
                        toast({
                          variant: "info",
                          title: t('toasts.logsOpened'),
                          description: t('toasts.logsOpenedDesc'),
                        })
                      }
                    }}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('settings.actions.viewLogs')}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">{t('settings.appearance.title')}</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <Sun className="h-4 w-4" />
                    <span>{t('settings.appearance.light')}</span>
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="flex items-center space-x-2 flex-1"
                    title={t('settings.appearance.systemTooltip')}
                  >
                    <Monitor className="h-4 w-4" />
                    <span>{t('settings.appearance.system')}</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <Moon className="h-4 w-4" />
                    <span>{t('settings.appearance.dark')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}