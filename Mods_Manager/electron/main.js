const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
// const { autoUpdater } = require('electron-updater'); // Désactivé - on utilise notre système intelligent
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const Store = require('electron-store');

// Système de logging toujours actif pour le support utilisateur
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const logFilePath = path.join(require('os').tmpdir(), 'mods-manager-debug.log');
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

function writeToLog(level, ...args) {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    
    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
        // Ignorer les erreurs de logging
    }
    
    // Appeler aussi la console originale
    if (level === 'ERROR') {
        originalConsoleError(...args);
    } else {
        originalConsoleLog(...args);
    }
}

// Remplacer console.log et console.error
console.log = (...args) => writeToLog('INFO', ...args);
console.error = (...args) => writeToLog('ERROR', ...args);

// Nettoyer le fichier de log au démarrage
try {
    fs.writeFileSync(logFilePath, `=== DEMARRAGE MODS MANAGER ${new Date().toISOString()} ===\n`);
    console.log('📝 Fichier de log créé:', logFilePath);
} catch (error) {
    console.error('❌ Impossible de créer le fichier de log:', error);
}

// Configuration du store pour les paramètres
const store = new Store();

// Variables globales
let mainWindow;
const VERSION = '2.0.1';

// Fonction pour charger la configuration des mods
function loadModsConfig() {
    try {
        const configPath = path.join(__dirname, '../config/mods-config.json');
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('Erreur lors du chargement de la configuration des mods:', error);
        // Configuration par défaut en cas d'erreur
        return {
            oldMods: [
                'BoatBreakFix-Universal-1.0.2.jar',
                'curios-forge-5.4.6+1.20.1.jar',
                'TravelersBackpack-1.20.1-9.1.7.jar'
            ],
            newMods: {
                'curios-forge-5.11.0+1.20.1.jar': 'https://cdn.modrinth.com/data/vvuO3ImH/versions/QBtodtmR/curios-forge-5.11.0%2B1.20.1.jar',
                'corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar': 'https://cdn.modrinth.com/data/pJGcKPh1/versions/kNCc37SZ/corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar',
                'sophisticatedcore-1.20.1-0.6.26.668.jar': 'https://mediafilez.forgecdn.net/files/5729/525/sophisticatedcore-1.20.1-0.6.26.668.jar',
                'sophisticatedbackpacks-1.20.1-3.20.7.1075.jar': 'https://mediafilez.forgecdn.net/files/5732/297/sophisticatedbackpacks-1.20.1-3.20.7.1075.jar',
                'sodiumdynamiclights-forge-1.0.10-1.20.1.jar': 'https://cdn.modrinth.com/data/PxQSWIcD/versions/I156ee3A/sodiumdynamiclights-forge-1.0.10-1.20.1.jar',
                'curiouslanterns-1.20.1-1.3.6.jar': 'https://cdn.modrinth.com/data/cE5SLYbv/versions/q3pQ4N0L/curiouslanterns-1.20.1-1.3.6.jar',
                'radiantgear-forge-2.2.0%2B1.20.1.jar': 'https://cdn.modrinth.com/data/AtT9wm5O/versions/dQfDugX5/radiantgear-forge-2.2.0%2B1.20.1.jar'
            },
            configFiles: [
                {
                    filename: 'sodiumdynamiclights-client.toml',
                    url: 'https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/config/sodiumdynamiclights-client.toml',
                    destination: 'config'
                }
            ]
        };
    }
}

// Note: electron-updater désactivé - on utilise notre système de mise à jour intelligent

function createWindow() {
    // Créer la fenêtre principale
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 700,
        resizable: true,
        icon: path.join(__dirname, '../assets/app.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: !isDev
        },
        titleBarStyle: 'default',
        show: false
    });

    // Supprimer la barre de menu par défaut
    mainWindow.setMenuBarVisibility(false);

    if (isDev) {
        // En développement, utiliser le serveur Vite
        mainWindow.loadURL('http://localhost:3001');
        mainWindow.webContents.openDevTools();
    } else {
        // En production, charger les fichiers buildés
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        // DevTools désactivés en production
    }

    // Afficher la fenêtre quand elle est prête
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        console.log('🚀 APPLICATION DEMARREE');
        console.log('📱 Version:', VERSION);
        console.log('🔧 Mode dev:', isDev);
        console.log('🌐 Smart updater initialisé:', !!smartUpdater);

        // Vérifier les mises à jour au démarrage avec notre système intelligent
        if (!isDev) {
            console.log('🔄 Vérification auto des mises à jour (système intelligent)...');
            setTimeout(() => {
                checkForUpdates();
            }, 2000); // Attendre 2s que l'interface soit chargée
        } else {
            console.log('⏸️ Mode dev - pas de vérification auto');
        }
    });

    // Ouvrir les liens externes dans le navigateur
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Raccourcis DevTools désactivés en production
    if (isDev) {
        mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.control && input.shift && input.key.toLowerCase() === 'i') {
                mainWindow.webContents.toggleDevTools();
            }
            if (input.key === 'F12') {
                mainWindow.webContents.toggleDevTools();
            }
        });
    }
}

// Gestionnaires IPC (identiques à l'ancienne version)
ipcMain.handle('get-minecraft-instances', async() => {
    try {
        const basePath = path.join(require('os').homedir(), 'curseforge', 'Minecraft', 'Instances');

        if (!await fs.pathExists(basePath)) {
            return [];
        }

        const folders = await fs.readdir(basePath);
        const instances = [];

        for (const folder of folders) {
            const instancePath = path.join(basePath, folder);
            const modsPath = path.join(instancePath, 'mods');

            if (await fs.pathExists(modsPath)) {
                instances.push({
                    name: folder,
                    path: modsPath
                });
            }
        }

        return instances;
    } catch (error) {
        console.error('Erreur lors de la récupération des instances:', error);
        return [];
    }
});

ipcMain.handle('save-last-instance', async(event, instanceName) => {
    try {
        store.set('lastInstance', instanceName);
        return true;
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        return false;
    }
});

ipcMain.handle('get-last-instance', async() => {
    try {
        return store.get('lastInstance', null);
    } catch (error) {
        console.error('Erreur lors de la récupération de la dernière instance:', error);
        return null;
    }
});

ipcMain.handle('delete-old-mods', async(event, modsPath) => {
    const config = loadModsConfig();
    const oldMods = config.oldMods;

    const results = [];

    for (const mod of oldMods) {
        const modPath = path.join(modsPath, mod);
        try {
            if (await fs.pathExists(modPath)) {
                await fs.remove(modPath);
                results.push({ mod, status: 'deleted', message: `✔ Supprimé : ${mod}` });
            } else {
                results.push({ mod, status: 'not_found', message: `(ignoré) ${mod} introuvable` });
            }
        } catch (error) {
            results.push({ mod, status: 'error', message: `❌ Erreur lors de la suppression de ${mod}: ${error.message}` });
        }
    }

    return results;
});

ipcMain.handle('download-new-mods', async(event, modsPath) => {
    const config = loadModsConfig();
    const newMods = config.newMods;

    const results = [];
    const totalMods = Object.keys(newMods).length;
    let completed = 0;

    for (const [filename, url] of Object.entries(newMods)) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const modPath = path.join(modsPath, filename);
            await fs.writeFile(modPath, response.data);

            completed++;
            const progress = (completed / totalMods) * 100;

            results.push({
                filename,
                status: 'success',
                message: `✔ Installé : ${filename}`,
                progress: Math.round(progress)
            });

            // Envoyer la progression à l'interface
            mainWindow.webContents.send('download-progress', {
                filename,
                progress: Math.round(progress),
                completed,
                total: totalMods
            });

        } catch (error) {
            results.push({
                filename,
                status: 'error',
                message: `❌ Erreur lors du téléchargement de ${filename} : ${error.message}`
            });
        }
    }

    // Télécharger les fichiers de configuration
    for (const configFile of config.configFiles) {
        try {
            const configDir = path.join(path.dirname(modsPath), configFile.destination);
            await fs.ensureDir(configDir);

            const configResponse = await axios.get(configFile.url);
            const configPath = path.join(configDir, configFile.filename);
            await fs.writeFile(configPath, configResponse.data);

            results.push({
                filename: configFile.filename,
                status: 'success',
                message: `✔ Fichier de configuration téléchargé et placé dans "${configFile.destination}".`
            });
        } catch (error) {
            results.push({
                filename: configFile.filename,
                status: 'error',
                message: `❌ Erreur lors du téléchargement du fichier ${configFile.filename} : ${error.message}`
            });
        }
    }

    return results;
});

// Système de mise à jour intelligent
class SmartUpdater {
    constructor() {
        this.currentVersion = VERSION;
        this.repoUrl = 'https://api.github.com/repos/azurich/Mods_Manager';
        this.isUpdating = false;
        this.pendingUpdate = null;
        this.lastNotifiedVersion = null; // Éviter les notifications en double
    }

    // Détecter l'architecture et le type d'installation
    getSystemInfo() {
        const arch = process.arch === 'x64' ? 'x64' : 'ia32';
        const isPortable = !process.env.APPDATA?.includes('Programs') && 
                          !process.execPath.includes('Program Files');
        
        return {
            arch,
            type: isPortable ? 'portable' : 'setup',
            platform: 'win'
        };
    }

    // Obtenir les informations de la dernière release
    async getLatestRelease() {
        try {
            console.log('🔍 Vérification des mises à jour...');
            console.log('📡 URL API:', `${this.repoUrl}/releases/latest`);
            
            const response = await axios.get(`${this.repoUrl}/releases/latest`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mods-Manager-Updater'
                }
            });
            
            console.log('✅ Réponse reçue:', {
                tag_name: response.data.tag_name,
                assets_count: response.data.assets?.length || 0,
                published_at: response.data.published_at
            });
            
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération de la release:', error.message);
            console.error('📊 Détails erreur:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
            });
            throw new Error('Impossible de vérifier les mises à jour');
        }
    }

    // Trouver l'asset approprié pour le système
    findMatchingAsset(release, systemInfo) {
        const assets = release.assets;
        console.log('🎯 Recherche d\'asset pour:', systemInfo);
        console.log('📦 Assets disponibles:', assets.map(a => ({name: a.name, size: a.size})));
        
        // Priorités de recherche basées sur le système
        const patterns = [
            `Mods-Manager-${systemInfo.type === 'portable' ? 'Portable' : 'Setup'}-${systemInfo.arch}.exe`,
            `Mods-Manager-${systemInfo.arch}.exe`,
            `Mods-Manager.exe`
        ];

        console.log('🔍 Patterns de recherche:', patterns);

        for (const pattern of patterns) {
            console.log(`🔎 Recherche pattern: ${pattern}`);
            const asset = assets.find(a => a.name.includes(pattern) || 
                                         a.name.toLowerCase().includes(pattern.toLowerCase()));
            if (asset) {
                console.log('✅ Asset trouvé:', asset.name);
                return asset;
            }
        }

        // Fallback: premier fichier .exe trouvé
        const fallbackAsset = assets.find(a => a.name.endsWith('.exe'));
        console.log('🔄 Fallback asset:', fallbackAsset?.name || 'Aucun');
        return fallbackAsset;
    }

    // Vérifier les mises à jour
    async checkForUpdates() {
        if (this.isUpdating) {
            console.log('⏳ Mise à jour déjà en cours...');
            return;
        }

        const startTime = Date.now();
        const minDuration = 1500; // Durée minimale de 1.5s pour voir l'état "checking"

        try {
            console.log('🚀 Démarrage vérification mise à jour');
            console.log('📱 Version actuelle:', this.currentVersion);
            
            const release = await this.getLatestRelease();
            const latestVersion = release.tag_name.replace('v', '');
            
            console.log('🔄 Version disponible:', latestVersion);
            console.log('⚖️ Comparaison versions:', this.compareVersions(latestVersion, this.currentVersion));

            // Calculer le temps restant pour atteindre la durée minimale
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minDuration - elapsed);
            
            if (remainingTime > 0) {
                console.log(`⏰ Attente de ${remainingTime}ms pour UX...`);
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            if (this.compareVersions(latestVersion, this.currentVersion) > 0) {
                console.log('✨ Nouvelle version détectée!');
                
                const systemInfo = this.getSystemInfo();
                console.log('💻 Info système:', systemInfo);
                
                const asset = this.findMatchingAsset(release, systemInfo);

                if (!asset) {
                    console.error('❌ Aucun asset compatible trouvé');
                    throw new Error('Aucun fichier de mise à jour compatible trouvé');
                }

                console.log('🎯 Asset sélectionné:', asset.name);
                await this.showUpdateDialog(latestVersion, release, asset, systemInfo);
            } else {
                console.log('✅ Application déjà à jour');
                if (mainWindow) {
                    mainWindow.webContents.send('update-not-available');
                }
            }
        } catch (error) {
            // Attendre le délai minimum même en cas d'erreur
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minDuration - elapsed);
            
            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

            console.error('💥 Erreur lors de la vérification:', error.message);
            console.error('📋 Stack trace:', error.stack);
            if (mainWindow) {
                mainWindow.webContents.send('update-error', error.message);
            }
        }
    }

    // Comparer les versions (format semver)
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }

    // Notifier qu'une mise à jour est disponible
    async showUpdateDialog(version, release, asset, systemInfo) {
        // Éviter les notifications en double pour la même version
        if (this.lastNotifiedVersion === version) {
            console.log('⚠️ Notification déjà envoyée pour la version', version);
            return;
        }
        
        this.lastNotifiedVersion = version;
        
        // Envoyer les infos de mise à jour à l'interface
        if (mainWindow) {
            console.log('📤 Envoi notification mise à jour:', version);
            mainWindow.webContents.send('update-available', {
                version,
                currentVersion: this.currentVersion,
                size: asset.size,
                type: systemInfo.type,
                arch: systemInfo.arch,
                asset: asset.name
            });
        }
        
        // Stocker les infos pour le téléchargement
        this.pendingUpdate = { asset, version, systemInfo };
    }

    // Déclencher le téléchargement de la mise à jour en attente
    async startPendingUpdate() {
        if (!this.pendingUpdate) {
            throw new Error('Aucune mise à jour en attente');
        }
        
        const { asset, version, systemInfo } = this.pendingUpdate;
        await this.downloadAndInstall(asset, version, systemInfo);
    }

    // Télécharger et installer la mise à jour
    async downloadAndInstall(asset, version, systemInfo) {
        this.isUpdating = true;
        console.log('📥 Début téléchargement...', {asset: asset.name, version, systemInfo});
        
        try {
            // Notification de début
            if (mainWindow) {
                mainWindow.webContents.send('update-download-started', { 
                    version, 
                    size: asset.size,
                    type: systemInfo.type
                });
            }

            // Créer le dossier temporaire
            const tempDir = path.join(require('os').tmpdir(), 'mods-manager-update');
            console.log('📁 Dossier temporaire:', tempDir);
            await fs.ensureDir(tempDir);

            // Télécharger le fichier
            const updateFilePath = path.join(tempDir, asset.name);
            console.log('⬇️ Téléchargement vers:', updateFilePath);
            console.log('🌐 URL de téléchargement:', asset.browser_download_url);
            
            await this.downloadFile(asset.browser_download_url, updateFilePath);
            console.log('✅ Téléchargement terminé');

            // Créer l'installateur intelligent
            console.log('🔧 Création installateur...');
            await this.createSmartInstaller(tempDir, asset.name, systemInfo);

            // Notification de fin de téléchargement
            if (mainWindow) {
                mainWindow.webContents.send('update-downloaded', { version });
            }

            // Lancer l'installation automatiquement
            console.log('🚀 Lancement installation automatique...');
            await this.performInstallation(tempDir, version);

        } catch (error) {
            console.error('💥 Erreur téléchargement:', error.message);
            console.error('📋 Stack trace:', error.stack);
            await this.showErrorDialog(error.message);
        } finally {
            this.isUpdating = false;
            console.log('🏁 Fin processus mise à jour');
        }
    }

    // Télécharger un fichier avec progression
    async downloadFile(url, filePath) {
        const response = await axios.get(url, {
            responseType: 'stream',
            timeout: 120000
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    }

    // Créer un installateur intelligent
    async createSmartInstaller(tempDir, fileName, systemInfo) {
        const isPortable = systemInfo.type === 'portable';
        const currentExePath = process.execPath;
        const currentDir = path.dirname(currentExePath);
        
        const installerScript = isPortable ? 
            this.createPortableInstaller(fileName, currentExePath) :
            this.createSetupInstaller(fileName);

        await fs.writeFile(path.join(tempDir, 'updater.js'), installerScript);
    }

    // Script pour version portable
    createPortableInstaller(fileName, currentExePath) {
        return `
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

setTimeout(async () => {
    try {
        const updateFile = path.join(__dirname, '${fileName}');
        const targetFile = '${currentExePath}';
        
        // Attendre que l'app se ferme
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Remplacer le fichier
        if (fs.existsSync(updateFile)) {
            if (fs.existsSync(targetFile)) {
                fs.unlinkSync(targetFile);
            }
            fs.copyFileSync(updateFile, targetFile);
            
            // Relancer l'application
            spawn(targetFile, [], { detached: true, stdio: 'ignore' });
        }
    } catch (error) {
        console.error('Erreur installation:', error);
    }
}, 1000);
`;
    }

    // Script pour version setup
    createSetupInstaller(fileName) {
        return `
const { spawn } = require('child_process');
const path = require('path');

setTimeout(() => {
    try {
        const setupFile = path.join(__dirname, '${fileName}');
        
        // Lancer l'installateur
        spawn(setupFile, ['/S'], { detached: true, stdio: 'ignore' });
    } catch (error) {
        console.error('Erreur installation:', error);
    }
}, 1000);
`;
    }

    // Effectuer l'installation
    async performInstallation(tempDir, version) {
        // Lancer l'installateur
        require('child_process').spawn('node', [path.join(tempDir, 'updater.js')], {
            detached: true,
            stdio: 'ignore'
        });
        
        console.log('🎯 Installateur lancé, fermeture de l\'application...');
        
        // Fermer l'application
        app.quit();
    }

    // Afficher dialogue d'erreur
    async showErrorDialog(message) {
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: '❌ Erreur de mise à jour',
            message: 'La mise à jour a échoué.',
            detail: `${message}\n\nVous pouvez télécharger manuellement depuis GitHub.`,
            buttons: ['🌐 Ouvrir GitHub', '✖️ Fermer'],
            defaultId: 1
        }).then((result) => {
            if (result.response === 0) {
                shell.openExternal('https://github.com/azurich/Mods_Manager/releases/latest');
            }
        });
    }
}

// Instance globale du système de mise à jour
const smartUpdater = new SmartUpdater();

// Fonction de vérification simplifiée
async function checkForUpdates() {
    console.log('🌟 DEBUT - checkForUpdates() appelée');
    console.log('🔧 smartUpdater existe:', !!smartUpdater);
    console.log('📋 Version actuelle dans main:', VERSION);
    
    try {
        await smartUpdater.checkForUpdates();
        console.log('✅ FIN - checkForUpdates() terminée avec succès');
    } catch (error) {
        console.log('❌ ERREUR dans checkForUpdates():', error.message);
        console.log('📋 Stack:', error.stack);
    }
}


ipcMain.handle('check-updates', checkForUpdates);

// Handler pour déclencher le téléchargement
ipcMain.handle('start-update-download', async () => {
    try {
        await smartUpdater.startPendingUpdate();
        return true;
    } catch (error) {
        console.error('Erreur déclenchement mise à jour:', error);
        return false;
    }
});

// Anciens gestionnaires electron-updater (désactivés)
ipcMain.handle('check-for-updates', () => {
    // Rediriger vers notre système intelligent
    return checkForUpdates();
});

ipcMain.handle('restart-and-install', () => {
    // Pour la compatibilité, redémarrer l'app normalement
    app.relaunch();
    app.exit();
});

// Gestionnaire pour ouvrir des liens externes
ipcMain.handle('open-external', async (event, url) => {
    shell.openExternal(url);
});

// Gestionnaires pour l'accès aux logs (support utilisateur)
ipcMain.handle('open-log-file', async () => {
    try {
        await shell.openPath(logFilePath);
        return true;
    } catch (error) {
        console.error('Erreur ouverture log:', error);
        return false;
    }
});

ipcMain.handle('get-log-content', async () => {
    try {
        if (await fs.pathExists(logFilePath)) {
            return await fs.readFile(logFilePath, 'utf8');
        }
        return 'Aucun log disponible';
    } catch (error) {
        console.error('Erreur lecture log:', error);
        return 'Erreur lors de la lecture du log';
    }
});

// Événements de l'application
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    console.error('Erreur non capturée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Promesse rejetée non gérée à', promise, 'raison:', reason);
});