const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const axios = require('axios');
const Store = require('electron-store');

// Configuration du store pour les paramètres
const store = new Store();

// Variables globales
let mainWindow;
const VERSION = '1.12.0';

// Configuration de l'auto-updater (désactivé en dev)
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

// Configuration de sécurité
if (!isDev) {
  // Désactiver les outils de développement en production
  app.whenReady().then(() => {
    // Sécuriser l'application
  });
}

function createWindow() {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    resizable: false,
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

  // Charger l'interface
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Afficher la fenêtre quand elle est prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Vérifier les mises à jour au démarrage
    if (!isDev) {
      checkForUpdates();
    }
  });

  // Ouvrir les liens externes dans le navigateur
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Gestionnaires IPC
ipcMain.handle('get-minecraft-instances', async () => {
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

ipcMain.handle('save-last-instance', async (event, instanceName) => {
  try {
    store.set('lastInstance', instanceName);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
});

ipcMain.handle('get-last-instance', async () => {
  try {
    return store.get('lastInstance', null);
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière instance:', error);
    return null;
  }
});

ipcMain.handle('delete-old-mods', async (event, modsPath) => {
  const oldMods = [
    'BoatBreakFix-Universal-1.0.2.jar',
    'curios-forge-5.4.6+1.20.1.jar',
    'TravelersBackpack-1.20.1-9.1.7.jar'
  ];

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

ipcMain.handle('download-new-mods', async (event, modsPath) => {
  const newMods = {
    'curios-forge-5.11.0+1.20.1.jar': 'https://cdn.modrinth.com/data/vvuO3ImH/versions/QBtodtmR/curios-forge-5.11.0%2B1.20.1.jar',
    'corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar': 'https://cdn.modrinth.com/data/pJGcKPh1/versions/kNCc37SZ/corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar',
    'sophisticatedcore-1.20.1-0.6.26.668.jar': 'https://mediafilez.forgecdn.net/files/5729/525/sophisticatedcore-1.20.1-0.6.26.668.jar',
    'sophisticatedbackpacks-1.20.1-3.20.7.1075.jar': 'https://mediafilez.forgecdn.net/files/5732/297/sophisticatedbackpacks-1.20.1-3.20.7.1075.jar',
    'sodiumdynamiclights-forge-1.0.10-1.20.1.jar': 'https://cdn.modrinth.com/data/PxQSWIcD/versions/I156ee3A/sodiumdynamiclights-forge-1.0.10-1.20.1.jar',
    'curiouslanterns-1.20.1-1.3.6.jar': 'https://cdn.modrinth.com/data/cE5SLYbv/versions/q3pQ4N0L/curiouslanterns-1.20.1-1.3.6.jar',
    'radiantgear-forge-2.2.0%2B1.20.1.jar': 'https://cdn.modrinth.com/data/AtT9wm5O/versions/dQfDugX5/radiantgear-forge-2.2.0%2B1.20.1.jar'
  };

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

  // Télécharger le fichier de configuration
  try {
    const configDir = path.join(path.dirname(modsPath), 'config');
    await fs.ensureDir(configDir);
    
    const configUrl = 'https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/config/sodiumdynamiclights-client.toml';
    const configResponse = await axios.get(configUrl);
    
    const configPath = path.join(configDir, 'sodiumdynamiclights-client.toml');
    await fs.writeFile(configPath, configResponse.data);
    
    results.push({ 
      filename: 'sodiumdynamiclights-client.toml', 
      status: 'success', 
      message: '✔ Fichier de configuration téléchargé et placé dans "config".' 
    });
  } catch (error) {
    results.push({ 
      filename: 'config', 
      status: 'error', 
      message: `❌ Erreur lors du téléchargement du fichier config : ${error.message}` 
    });
  }

  return results;
});

async function checkForUpdates() {
  try {
    const versionUrl = 'https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/version.txt';
    const response = await axios.get(versionUrl, { timeout: 5000 });
    
    const latestVersion = response.data.trim();
    
    if (latestVersion !== VERSION) {
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Mise à jour disponible',
        message: `Une nouvelle version (${latestVersion}) est disponible.`,
        detail: `Version actuelle: ${VERSION}\\nNouvelle version: ${latestVersion}`,
        buttons: ['Télécharger', 'Plus tard'],
        defaultId: 0
      });
      
      if (result.response === 0) {
        shell.openExternal('https://github.com/azurich/Mods_Manager/releases/latest');
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des mises à jour:', error);
  }
}

ipcMain.handle('check-updates', checkForUpdates);

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