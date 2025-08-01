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
  Moon
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
  
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  const handleCheckForUpdates = async () => {
    if (!window.electronAPI) {
      toast({
        variant: "info",
        title: "Mode développement",
        description: "Les mises à jour ne sont disponibles qu'en mode production",
      })
      return
    }

    toast({
      variant: "info",
      title: "Vérification des mises à jour",
      description: "Recherche de nouvelles versions...",
    })

    try {
      await window.electronAPI.checkForUpdates()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de vérifier les mises à jour",
      })
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
      // Mise à jour disponible
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info)
        toast({
          variant: "info",
          title: "Mise à jour disponible",
          description: `Version ${info.version} trouvée. Téléchargement en cours...`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallUpdate}
            >
              Installer
            </Button>
          ),
        })
      })

      // Mise à jour téléchargée
      window.electronAPI.onUpdateDownloaded((info) => {
        toast({
          variant: "success",
          title: "Mise à jour prête",
          description: `Version ${info.version} téléchargée. Redémarrez pour installer.`,
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstallUpdate}
            >
              Redémarrer
            </Button>
          ),
        })
      })

      // Pas de mise à jour disponible
      window.electronAPI.onUpdateNotAvailable(() => {
        toast({
          variant: "info",
          title: "Application à jour",
          description: "Vous avez déjà la dernière version installée.",
        })
      })

      // Erreur lors de la vérification
      window.electronAPI.onUpdateError((error) => {
        toast({
          variant: "destructive",
          title: "Erreur de mise à jour",
          description: "Impossible de vérifier les mises à jour. Vérifiez votre connexion.",
        })
      })
    }
    
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('download-progress')
        window.electronAPI.removeAllListeners('update-available')
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
              <Badge variant="secondary">v1.12</Badge>
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
                  <p>Version: 1.12.0</p>
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