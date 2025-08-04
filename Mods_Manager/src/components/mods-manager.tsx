import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from '@/components/theme-provider'
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
  Github,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  ArrowUp
} from 'lucide-react'

interface MinecraftInstance {
  name: string
  path: string
}

// Types pour l'API Electron
interface ElectronAPI {
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
  
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const handleCheckForUpdates = async () => {
    console.log('🔘 BOUTON REFRESH CLIQUE');
    
    if (!window.electronAPI) {
      console.log('⚠️ Mode dev - electronAPI non disponible');
      toast({
        variant: "info",
        title: "Mode développement",
        description: "Les mises à jour ne sont disponibles qu'en mode production",
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
      title: "Chargement des instances",
      description: "Recherche des instances Minecraft...",
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
          title: "Mode développement",
          description: `${mockInstances.length} instance(s) de test chargées`,
        })
        return
      }

      const instancesList = await window.electronAPI.getMinecraftInstances()
      setInstances(instancesList)
      
      if (instancesList.length === 0) {
        toast({
          variant: "destructive",
          title: "Aucune instance trouvée",
          description: "Vérifiez que CurseForge est installé et que vous avez des instances.",
        })
      } else {
        toast({
          variant: "success",
          title: "Instances chargées",
          description: `${instancesList.length} instance(s) trouvée(s)`,
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
            title: "Instance restaurée",
            description: `Dernière instance : ${lastInstance}`,
          })
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: `Impossible de charger les instances : ${error}`,
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
          variant: "success",
          title: "Instance sélectionnée",
          description: `${instanceName} - ${instance.path}`,
        })
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erreur de sauvegarde",
          description: `Impossible de sauvegarder l'instance : ${error}`,
        })
      }
    }
  }

  const handleDeleteMods = async () => {
    if (!selectedInstancePath) {
      toast({
        variant: "destructive",
        title: "Instance manquante",
        description: "Veuillez sélectionner une instance d'abord",
      })
      return
    }

    setIsLoading(true)
    toast({
      title: "Suppression en cours",
      description: "Suppression des anciens mods...",
    })
    
    try {
      if (!window.electronAPI) {
        // Mode développement - simulation
        toast({
          variant: "info",
          title: "Mode développement",
          description: "Suppression simulée en cours...",
        })
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast({
          variant: "success",
          title: "Suppression terminée",
          description: "Simulation de suppression terminée avec succès",
        })
        return
      }

      const results = await window.electronAPI.deleteOldMods(selectedInstancePath)
      
      const successCount = results.filter(r => r.status === 'success').length
      const errorCount = results.filter(r => r.status === 'error').length
      
      toast({
        variant: errorCount > 0 ? "destructive" : "success",
        title: "Suppression terminée",
        description: `${successCount} fichier(s) supprimé(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`,
      })
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur de suppression",
        description: `Impossible de supprimer les mods : ${error}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInstallMods = async () => {
    if (!selectedInstancePath) {
      toast({
        variant: "destructive",
        title: "Instance manquante",
        description: "Veuillez sélectionner une instance d'abord",
      })
      return
    }

    setIsLoading(true)
    // Créer une notification de progression persistante
    const progressToast = toast({
      variant: "info",
      title: "Installation en cours",
      description: "Téléchargement des nouveaux mods...",
      duration: 1000000, // Très long pour qu'elle reste affichée
    })
    
    try {
      if (!window.electronAPI) {
        // Mode développement - simulation avec progression
        for (let i = 0; i <= 100; i += 20) {
          // Mettre à jour la notification de progression
          progressToast.update({
            title: "Installation en cours",
            description: `Progression de simulation: ${i}%`,
          })
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        // Fermer la notification de progression et afficher le succès
        progressToast.dismiss()
        toast({
          variant: "success",
          title: "Installation terminée",
          description: "Simulation d'installation terminée avec succès",
        })
        return
      }

      // Écouter les événements de progression
      window.electronAPI.onDownloadProgress((data) => {
        // Mettre à jour la notification de progression en temps réel
        progressToast.update({
          title: "Installation en cours",
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
        title: "Installation terminée",
        description: `${successCount} mod(s) installé(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`,
      })
      
    } catch (error) {
      // Fermer la notification de progression en cas d'erreur
      progressToast.dismiss()
      toast({
        variant: "destructive",
        title: "Erreur d'installation",
        description: `Impossible d'installer les mods : ${error}`,
      })
    } finally {
      setIsLoading(false)
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download-progress')
      }
    }
  }

  useEffect(() => {
    loadInstances()
    toast({
      variant: "info",
      title: "Bienvenue",
      description: "Utilisez le bouton ⚙️ pour actualiser les instances",
    })
    
    // Gestionnaires d'événements pour les mises à jour
    if (window.electronAPI) {
      // Nettoyer les listeners existants pour éviter les doublons
      window.electronAPI.removeAllListeners('update-available')
      window.electronAPI.removeAllListeners('update-download-started')
      window.electronAPI.removeAllListeners('update-downloaded')
      window.electronAPI.removeAllListeners('update-not-available')
      window.electronAPI.removeAllListeners('update-error')

      // Mise à jour disponible
      if (window.electronAPI.onUpdateAvailable) {
        window.electronAPI.onUpdateAvailable((info) => {
          console.log('🔄 Mise à jour disponible reçue:', info)
          setUpdateInfo(info)
          setUpdateState(prevState => {
            if (prevState !== 'available') {
              return 'available'
            }
            return prevState
          })
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
              title: "📱 Application à jour",
              description: "Vous utilisez déjà la dernière version disponible.",
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
        window.electronAPI.removeAllListeners('update-download-started')
        window.electronAPI.removeAllListeners('update-not-available')
        window.electronAPI.removeAllListeners('update-error')
        window.electronAPI.removeAllListeners('update-downloaded')
      }
    }
  }, [])

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex-shrink-0 bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">
                Mods Manager
              </h1>
              <Badge variant="secondary">v2.0.1</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCheckForUpdates}
                title="Vérifier les mises à jour"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Paramètres"
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
                        🔍 Vérification des mises à jour...
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Recherche de nouvelles versions sur GitHub
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'available' && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        🚀 Nouvelle version disponible !
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Version {updateInfo?.version} • {updateInfo?.size ? `${(updateInfo.size / (1024 * 1024)).toFixed(1)} MB` : 'Taille inconnue'}
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'downloading' && (
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                        📥 Téléchargement en cours...
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Version {updateInfo?.version} • {updateProgress}% terminé
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
                        ✅ Mise à jour prête !
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Version {updateInfo?.version} téléchargée • Prêt à installer
                      </p>
                    </div>
                  )}
                  
                  {updateState === 'error' && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                        ⚠️ Erreur de mise à jour
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
                      Vérification...
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
                      Installer
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpdateState('none')}
                    >
                      Plus tard
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
                    Redémarrer
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
                <CardTitle>Sélection de l'instance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select 
                value={selectedInstance} 
                onValueChange={handleInstanceSelect}
                disabled={isInstancesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    isInstancesLoading ? "Chargement des instances..." : "Sélectionnez une instance..."
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
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => handleInstanceSelect(selectedInstance)}
                  disabled={!selectedInstance || isInstancesLoading}
                  className="space-x-2"
                >
                  <Folder className="h-4 w-4" />
                  <span>Choisir l'instance</span>
                </Button>
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
                  <CardTitle>Nettoyage</CardTitle>
                </div>
                <CardDescription>
                  Supprime les anciens mods obsolètes de votre instance
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
                  <span>Supprimer anciens mods</span>
                </Button>
              </CardContent>
            </Card>

            {/* Card Installation */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Download className="h-5 w-5 text-green-600" />
                  <CardTitle>Installation</CardTitle>
                </div>
                <CardDescription>
                  Télécharge et installe les derniers mods disponibles
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
                  <span>Installer nouveaux mods</span>
                </Button>
              </CardContent>
            </Card>
          </div>


        </div>

      </div>

      {/* Modal Paramètres */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Paramètres</CardTitle>
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
                <h4 className="text-sm font-medium">Informations</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Version: 2.0.1</p>
                  <p>Développé par: Azurich</p>
                </div>
              </div>
              
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Actions</h4>
                <div className="flex flex-col space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      loadInstances()
                      setShowSettings(false)
                    }}
                  >
                    Actualiser les instances
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
                    <span>Voir sur GitHub</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      if (window.electronAPI?.openLogFile) {
                        window.electronAPI.openLogFile()
                        toast({
                          variant: "info",
                          title: "Logs ouverts",
                          description: "Le fichier de logs a été ouvert dans votre éditeur par défaut.",
                        })
                      }
                    }}
                    className="flex items-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Voir les logs</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Apparence</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <Sun className="h-4 w-4" />
                    <span>Clair</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center space-x-2 flex-1"
                  >
                    <Moon className="h-4 w-4" />
                    <span>Sombre</span>
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