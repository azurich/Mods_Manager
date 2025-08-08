const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
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
const VERSION = '2.0.6';

// Configuration par défaut (fallback)
const DEFAULT_CONFIG = {
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
            url: 'https://raw.githubusercontent.com/azurich/Mods_Manager/refs/heads/main/Mods_Manager/config/sodiumdynamiclights-client.toml',
            destination: 'config'
        }
    ]
};

// URL de la configuration distante
const REMOTE_CONFIG_URL = 'https://raw.githubusercontent.com/azurich/Mods_Manager/refs/heads/main/remote-mods-config.json';

// Cache de la configuration
let cachedConfig = null;
let lastConfigUpdate = 0;
const CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fonction pour télécharger la configuration distante
async function fetchRemoteConfig() {
    try {
        console.log('🌐 Téléchargement de la configuration distante...');
        console.log('📡 URL:', REMOTE_CONFIG_URL);
        
        const response = await axios.get(REMOTE_CONFIG_URL, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mods-Manager-Config-Fetcher',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            // Ajouter un timestamp pour éviter le cache
            params: {
                '_t': Date.now()
            }
        });
        
        console.log('✅ Configuration distante téléchargée');
        
        // Valider la structure de la configuration
        const config = response.data;
        if (!config.oldMods || !config.newMods || !config.configFiles) {
            throw new Error('Structure de configuration invalide');
        }
        
        // Mettre en cache
        cachedConfig = config;
        lastConfigUpdate = Date.now();
        
        // Sauvegarder localement en backup
        try {
            const backupPath = path.join(require('os').tmpdir(), 'mods-config-backup.json');
            await fs.writeFile(backupPath, JSON.stringify(config, null, 2));
            console.log('💾 Configuration sauvegardée en backup');
        } catch (backupError) {
            console.warn('⚠️ Impossible de sauvegarder le backup:', backupError.message);
        }
        
        return config;
    } catch (error) {
        console.error('❌ Erreur lors du téléchargement de la config distante:', error.message);
        
        // Essayer de charger depuis le backup
        try {
            const backupPath = path.join(require('os').tmpdir(), 'mods-config-backup.json');
            if (await fs.pathExists(backupPath)) {
                const backupData = await fs.readFile(backupPath, 'utf8');
                console.log('🔄 Utilisation du backup de configuration');
                return JSON.parse(backupData);
            }
        } catch (backupError) {
            console.warn('⚠️ Impossible de charger le backup:', backupError.message);
        }
        
        throw error;
    }
}

// Fonction pour charger la configuration des mods (avec fallback intelligent)
async function loadModsConfig(forceRefresh = false) {
    // Utiliser le cache si disponible et récent
    if (!forceRefresh && cachedConfig && (Date.now() - lastConfigUpdate < CONFIG_CACHE_DURATION)) {
        console.log('📋 Utilisation de la configuration en cache');
        return cachedConfig;
    }
    
    try {
        // Essayer de charger la configuration distante
        return await fetchRemoteConfig();
    } catch (remoteError) {
        console.warn('⚠️ Échec du chargement distant, essai local...');
        
        // Fallback 1: Configuration locale
        try {
            const configPath = path.join(__dirname, '../config/mods-config.json');
            if (await fs.pathExists(configPath)) {
                const configData = await fs.readFile(configPath, 'utf8');
                console.log('📁 Configuration locale chargée');
                return JSON.parse(configData);
            }
        } catch (localError) {
            console.warn('⚠️ Configuration locale non disponible:', localError.message);
        }
        
        // Fallback 2: Configuration par défaut
        console.log('🔧 Utilisation de la configuration par défaut');
        return DEFAULT_CONFIG;
    }
}

// Note: electron-updater désactivé - on utilise notre système de mise à jour intelligent


function createWindow() {
    console.log('🚀 Création de la fenêtre principale...');
    
    // Créer la fenêtre principale avec optimisations
    mainWindow = new BrowserWindow({
        width: 1350,
        height: 700,
        resizable: false, // Verrouiller le redimensionnement
        maximizable: false, // Désactiver la maximisation
        backgroundColor: '#ffffff', // Fond blanc pour éviter le flash
        icon: path.join(__dirname, '../assets/app.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: !isDev,
            enableRemoteModule: false,
            sandbox: false
        },
        titleBarStyle: 'default',
        center: true, // Centrer automatiquement sur l'écran
        show: false, // Ne pas afficher avant d'être prêt
        minWidth: 1350, // Taille minimale (au cas où)
        minHeight: 700,
        maxWidth: 1350, // Taille maximale (sécurité)
        maxHeight: 700
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

    // Afficher la fenêtre dès qu'elle est prête (pas de délai)
    mainWindow.once('ready-to-show', () => {
        console.log('🎯 Fenêtre principale prête - affichage immédiat');
        
        // Afficher immédiatement
        mainWindow.show();
        
        console.log('🚀 APPLICATION DEMARREE');
        console.log('📱 Version:', VERSION);
        console.log('🔧 Mode dev:', isDev);
        console.log('🌐 Electron-updater initialisé');

        // Vérifier les mises à jour au démarrage avec electron-updater (délai long)
        if (!isDev) {
            console.log('🔄 Vérification auto des mises à jour (electron-updater) dans 5s...');
            setTimeout(() => {
                console.log('🚀 Démarrage de la vérification différée des mises à jour');
                checkForUpdates();
            }, 5000); // Délai réduit pour une meilleure UX
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

// Fonction pour détecter les launchers installés
async function detectLaunchers() {
    console.log('🔍 Détection des launchers Minecraft...');
    const launchers = [];
    
    try {
        // CurseForge
        const cfPath = path.join(require('os').homedir(), 'curseforge', 'minecraft', 'Instances');
        console.log('📂 Test CurseForge:', cfPath);
        if (await fs.pathExists(cfPath)) {
            launchers.push({
                id: 'curseforge',
                name: 'CurseForge',
                path: cfPath,
                instancesPath: cfPath
            });
            console.log('✅ CurseForge détecté');
        } else {
            console.log('❌ CurseForge non trouvé');
        }
        
        // Modrinth
        const mrPath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'ModrinthApp', 'profiles');
        console.log('📂 Test Modrinth:', mrPath);
        if (await fs.pathExists(mrPath)) {
            launchers.push({
                id: 'modrinth',
                name: 'Modrinth',
                path: mrPath,
                instancesPath: mrPath
            });
            console.log('✅ Modrinth détecté');
        } else {
            console.log('❌ Modrinth non trouvé');
        }
        
        console.log(`🎯 ${launchers.length} launcher(s) détecté(s):`, launchers.map(l => l.name));
        return launchers;
    } catch (error) {
        console.error('❌ Erreur détection launchers:', error);
        return [];
    }
}

// Fonction pour récupérer les instances d'un launcher spécifique
async function getInstancesForLauncher(launcherId) {
    console.log('📋 Récupération instances pour:', launcherId);
    const instances = [];
    
    try {
        if (launcherId === 'curseforge') {
            const basePath = path.join(require('os').homedir(), 'curseforge', 'minecraft', 'Instances');
            
            if (await fs.pathExists(basePath)) {
                const folders = await fs.readdir(basePath);
                
                for (const folder of folders) {
                    const instancePath = path.join(basePath, folder);
                    const modsPath = path.join(instancePath, 'mods');
                    
                    if (await fs.pathExists(modsPath)) {
                        instances.push({
                            name: folder,
                            path: modsPath,
                            launcher: 'curseforge',
                            fullPath: instancePath
                        });
                    }
                }
            }
        } else if (launcherId === 'modrinth') {
            const basePath = path.join(require('os').homedir(), 'AppData', 'Roaming', 'ModrinthApp', 'profiles');
            
            if (await fs.pathExists(basePath)) {
                const folders = await fs.readdir(basePath);
                
                for (const folder of folders) {
                    const instancePath = path.join(basePath, folder);
                    const modsPath = path.join(instancePath, 'mods');
                    
                    if (await fs.pathExists(modsPath)) {
                        instances.push({
                            name: folder,
                            path: modsPath,
                            launcher: 'modrinth',
                            fullPath: instancePath
                        });
                    }
                }
            }
        }
        
        console.log(`✅ ${instances.length} instance(s) trouvée(s) pour ${launcherId}`);
        return instances;
    } catch (error) {
        console.error(`❌ Erreur récupération instances ${launcherId}:`, error);
        return [];
    }
}

// Gestionnaires IPC pour le support multi-plateforme
ipcMain.handle('detect-launchers', async() => {
    return await detectLaunchers();
});

ipcMain.handle('get-instances-for-launcher', async(event, launcherId) => {
    return await getInstancesForLauncher(launcherId);
});

// Ancien gestionnaire (rétrocompatibilité)
ipcMain.handle('get-minecraft-instances', async() => {
    try {
        // Par défaut, on retourne les instances CurseForge pour la compatibilité
        return await getInstancesForLauncher('curseforge');
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
    const config = await loadModsConfig();
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
    const config = await loadModsConfig();
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
    console.log('📁 Début téléchargement des fichiers de configuration...');
    console.log('📋 Nombre de fichiers config à télécharger:', config.configFiles?.length || 0);
    
    for (const configFile of config.configFiles) {
        try {
            console.log('🔽 Téléchargement config:', configFile.filename);
            console.log('📂 ModsPath:', modsPath);
            console.log('📂 ParentDir:', path.dirname(modsPath));
            
            const configDir = path.join(path.dirname(modsPath), configFile.destination);
            console.log('📁 ConfigDir calculé:', configDir);
            
            await fs.ensureDir(configDir);
            console.log('✅ Dossier config créé/vérifié');

            console.log('🌐 URL de téléchargement:', configFile.url);
            const configResponse = await axios.get(configFile.url);
            console.log('✅ Fichier téléchargé, taille:', configResponse.data.length);
            
            const configPath = path.join(configDir, configFile.filename);
            console.log('💾 Écriture vers:', configPath);
            
            await fs.writeFile(configPath, configResponse.data);
            console.log('✅ Fichier écrit avec succès');

            results.push({
                filename: configFile.filename,
                status: 'success',
                message: `✔ Fichier de configuration téléchargé et placé dans "${configFile.destination}".`
            });
        } catch (error) {
            console.error('❌ Erreur config:', configFile.filename, error);
            results.push({
                filename: configFile.filename,
                status: 'error',
                message: `❌ Erreur lors du téléchargement du fichier ${configFile.filename} : ${error.message}`
            });
        }
    }
    
    console.log('📁 Fin téléchargement des fichiers de configuration');

    return results;
});

// Configuration d'electron-updater
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

// Configuration pour éviter les conflits d'installation
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Empêcher les vérifications automatiques si une installation est en cours
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;

// Désactiver complètement en mode dev
if (isDev) {
    autoUpdater.updateConfigPath = null;
}

// Variables pour gérer l'état de la mise à jour
let updateInfo = null;
let updateCheckInProgress = false;

// Fonction de vérification des mises à jour avec timing pour UX
async function checkForUpdates() {
    if (updateCheckInProgress) {
        console.log('⏳ Vérification déjà en cours...');
        return;
    }

    // Vérifier si une installation/mise à jour est en cours
    const isInstalling = process.argv.some(arg => arg.includes('--squirrel') || arg.includes('--install'));
    if (isInstalling) {
        console.log('⚠️ Installation en cours détectée, skip de la vérification de mise à jour');
        return;
    }

    updateCheckInProgress = true;
    const startTime = Date.now();
    const minDuration = 1500; // Durée minimale pour voir l'état "checking"

    try {
        console.log('🚀 Démarrage vérification mise à jour avec electron-updater');
        console.log('📱 Version actuelle:', VERSION);
        
        await autoUpdater.checkForUpdates();
        
        // Attendre la durée minimale pour l'UX
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDuration - elapsed);
        
        if (remainingTime > 0) {
            console.log(`⏰ Attente de ${remainingTime}ms pour UX...`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log('✅ Vérification terminée');
    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error.message);
        
        // Si l'erreur contient "ENOENT" ou "update server", c'est probablement normal
        if (error.message.includes('ENOENT') || error.message.includes('update server') || error.message.includes('app-update.yml')) {
            console.log('ℹ️ Pas de serveur de mise à jour disponible (normal pour les builds locaux)');
            console.log('📋 Pour les mises à jour, uploadez la version sur GitHub Releases');
        }
        
        // Attendre la durée minimale même en cas d'erreur
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minDuration - elapsed);
        
        if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        if (mainWindow && !error.message.includes('ENOENT') && !error.message.includes('app-update.yml')) {
            mainWindow.webContents.send('update-error', error.message);
        }
    } finally {
        updateCheckInProgress = false;
    }
}

// Événements electron-updater
autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Vérification des mises à jour...');
    if (mainWindow) {
        mainWindow.webContents.send('update-checking');
    }
});

autoUpdater.on('update-available', (info) => {
    console.log('✨ Mise à jour disponible:', info.version);
    updateInfo = info;
    
    if (mainWindow) {
        mainWindow.webContents.send('update-available', {
            version: info.version,
            currentVersion: VERSION,
            size: info.files?.[0]?.size || 0,
            releaseDate: info.releaseDate,
            releaseName: info.releaseName
        });
    }
});

autoUpdater.on('update-not-available', (info) => {
    console.log('✅ Pas de mise à jour disponible');
    if (mainWindow) {
        // Délai pour laisser voir l'état "checking"
        setTimeout(() => {
            mainWindow.webContents.send('update-not-available');
        }, 1500);
    }
});

autoUpdater.on('error', (err) => {
    console.error('💥 Erreur electron-updater:', err.message);
    if (mainWindow) {
        mainWindow.webContents.send('update-error', err.message);
    }
});

autoUpdater.on('download-progress', (progress) => {
    console.log(`📥 Progression: ${Math.round(progress.percent)}%`);
    if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', {
            percent: Math.round(progress.percent),
            bytesPerSecond: progress.bytesPerSecond,
            total: progress.total,
            transferred: progress.transferred
        });
    }
});

autoUpdater.on('update-downloaded', (info) => {
    console.log('✅ Mise à jour téléchargée:', info.version);
    if (mainWindow) {
        mainWindow.webContents.send('update-downloaded', {
            version: info.version
        });
    }
});


ipcMain.handle('check-updates', checkForUpdates);

// Handler pour déclencher le téléchargement
ipcMain.handle('start-update-download', async () => {
    try {
        if (updateInfo) {
            console.log('📥 Démarrage téléchargement mise à jour...');
            if (mainWindow) {
                mainWindow.webContents.send('update-download-started', {
                    version: updateInfo.version,
                    size: updateInfo.files?.[0]?.size || 0
                });
            }
            await autoUpdater.downloadUpdate();
            return true;
        } else {
            console.warn('⚠️ Aucune mise à jour disponible à télécharger');
            return false;
        }
    } catch (error) {
        console.error('❌ Erreur téléchargement mise à jour:', error);
        if (mainWindow) {
            mainWindow.webContents.send('update-error', error.message);
        }
        return false;
    }
});

// Compatibilité avec l'ancienne interface
ipcMain.handle('check-for-updates', () => {
    return checkForUpdates();
});

ipcMain.handle('restart-and-install', () => {
    console.log('🔄 Redémarrage et installation...');
    autoUpdater.quitAndInstall();
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

// Gestionnaire pour les préférences de langue
ipcMain.handle('save-language-preference', async (event, language) => {
    try {
        store.set('language', language);
        console.log('🌍 Préférence de langue sauvegardée:', language);
        return true;
    } catch (error) {
        console.error('❌ Erreur sauvegarde langue:', error);
        return false;
    }
});

ipcMain.handle('get-language-preference', async () => {
    try {
        const language = store.get('language', null);
        console.log('🌍 Préférence de langue récupérée:', language);
        return language;
    } catch (error) {
        console.error('❌ Erreur récupération langue:', error);
        return null;
    }
});

// Gestionnaires pour la configuration distante
ipcMain.handle('refresh-mods-config', async () => {
    try {
        console.log('🔄 Refresh forcé de la configuration des mods...');
        const config = await loadModsConfig(true); // forceRefresh = true
        console.log('✅ Configuration rafraîchie avec succès');
        
        // Retourner un résumé de la configuration
        return {
            success: true,
            summary: {
                oldModsCount: config.oldMods?.length || 0,
                newModsCount: Object.keys(config.newMods || {}).length,
                configFilesCount: config.configFiles?.length || 0
            }
        };
    } catch (error) {
        console.error('❌ Erreur lors du refresh de la config:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('get-config-info', async () => {
    try {
        const config = await loadModsConfig();
        const isFromCache = cachedConfig && (Date.now() - lastConfigUpdate < CONFIG_CACHE_DURATION);
        
        return {
            success: true,
            info: {
                source: isFromCache ? 'cache' : 'remote/fallback',
                lastUpdate: lastConfigUpdate > 0 ? new Date(lastConfigUpdate).toLocaleString() : 'Jamais',
                oldModsCount: config.oldMods?.length || 0,
                newModsCount: Object.keys(config.newMods || {}).length,
                configFilesCount: config.configFiles?.length || 0,
                cacheExpiry: isFromCache ? new Date(lastConfigUpdate + CONFIG_CACHE_DURATION).toLocaleString() : 'N/A'
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

// Événements de l'application
app.whenReady().then(() => {
    console.log('🚀 Application Electron prête - chargement direct');
    
    // Créer la fenêtre principale immédiatement (pas de splash)
    createWindow();
});

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