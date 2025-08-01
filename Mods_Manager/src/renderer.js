// Variables globales
let selectedInstancePath = null;
let consoleComponent = null;
let progressComponent = null;
let isConsoleCollapsed = false;

// Éléments DOM
const elements = {
    instanceSelect: null,
    chooseInstanceBtn: null,
    deleteModsBtn: null,
    installModsBtn: null,
    progressSection: null,
    consoleContainer: null,
    clearConsoleBtn: null,
    toggleConsoleBtn: null,
    refreshBtn: null,
    settingsBtn: null,
    loadingOverlay: null,
    notificationsContainer: null
};

// Initialisation des icônes et de l'interface
function initializeUI() {
    // Initialiser les icônes
    document.getElementById('appIcon').appendChild(Icons.package({ size: 32 }));
    document.getElementById('folderIcon').appendChild(Icons.folder({ size: 20 }));
    document.getElementById('trashIcon').appendChild(Icons.trash({ size: 20 }));
    document.getElementById('downloadIcon').appendChild(Icons.download({ size: 20 }));
    document.getElementById('terminalIcon').appendChild(Icons.terminal({ size: 16 }));
    document.getElementById('refreshIcon').appendChild(Icons.refresh({ size: 16 }));
    document.getElementById('settingsIcon').appendChild(Icons.settings({ size: 16 }));
    document.getElementById('loadingSpinner').appendChild(Icons.loader({ size: 20 }));
    
    // Récupérer les références des éléments
    elements.instanceSelect = document.getElementById('instanceSelect');
    elements.chooseInstanceBtn = document.getElementById('chooseInstanceBtn');
    elements.deleteModsBtn = document.getElementById('deleteModsBtn');
    elements.installModsBtn = document.getElementById('installModsBtn');
    elements.progressSection = document.getElementById('progressSection');
    elements.consoleContainer = document.getElementById('consoleContainer');
    elements.clearConsoleBtn = document.getElementById('clearConsoleBtn');
    elements.toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
    elements.refreshBtn = document.getElementById('refreshBtn');
    elements.settingsBtn = document.getElementById('settingsBtn');
    elements.loadingOverlay = document.getElementById('loadingOverlay');
    elements.notificationsContainer = document.getElementById('notificationsContainer');
    
    // Initialiser les boutons avec les icônes
    updateButtonContent(elements.chooseInstanceBtn, 'check', 'Choisir l\'instance');
    updateButtonContent(elements.deleteModsBtn, 'trash', 'Supprimer anciens mods', 'destructive');
    updateButtonContent(elements.installModsBtn, 'download', 'Installer nouveaux mods', 'default');
    
    // Les styles sont déjà appliqués via les classes CSS dans le HTML
    
    // Initialiser la console simple
    const consoleElement = document.createElement('div');
    consoleElement.className = 'console';
    consoleElement.textContent = '=== Mods Manager prêt à l\'utilisation ===\nSélectionnez une instance et cliquez sur les boutons d\'action.';
    
    // Ajouter les méthodes log et clear
    consoleElement.log = function(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        
        if (this.textContent.includes('=== Mods Manager prêt')) {
            this.textContent = '';
        }
        
        this.textContent += (this.textContent ? '\n' : '') + logMessage;
        this.scrollTop = this.scrollHeight;
    };
    
    consoleElement.clear = function() {
        this.textContent = '=== Mods Manager prêt à l\'utilisation ===\nSélectionnez une instance et cliquez sur les boutons d\'action.';
    };
    
    consoleComponent = consoleElement;
    elements.consoleContainer.appendChild(consoleComponent);
    
    // Initialiser la détection du thème système
    initializeTheme();
}

function updateButtonContent(button, iconName, text, variant = 'default') {
    button.innerHTML = '';
    const icon = Icons.createIcon(iconName, { size: 16 });
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    button.appendChild(icon);
    button.appendChild(textSpan);
}

function setButtonLoading(button, loading, iconName = 'loader') {
    const icon = button.querySelector('span:first-child');
    const text = button.querySelector('span:last-child');
    
    if (loading) {
        button.disabled = true;
        button.classList.add('opacity-70');
        icon.innerHTML = '';
        icon.appendChild(Icons.createIcon('loader', { size: 16, className: 'animate-spin' }));
    } else {
        button.disabled = false;
        button.classList.remove('opacity-70');
        icon.innerHTML = '';
        icon.appendChild(Icons.createIcon(iconName, { size: 16 }));
    }
}

// Gestion du thème
function initializeTheme() {
    const applyTheme = () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', isDark);
    };
    
    applyTheme();
    
    // Écouter les changements de thème système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
}

// Notifications
function showNotification(message, type = 'info', duration = 4000) {
    const notification = document.createElement('div');
    notification.className = `notification-enter bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm`;
    
    const iconMap = {
        success: 'check',
        error: 'x',
        warning: 'alert',
        info: 'info'
    };
    
    const colorMap = {
        success: 'text-green-600',
        error: 'text-destructive',
        warning: 'text-yellow-600',
        info: 'text-primary'
    };
    
    notification.innerHTML = `
        <div class="flex items-start space-x-3">
            <div class="${colorMap[type]} flex-shrink-0 mt-0.5"></div>
            <div class="flex-1">
                <p class="text-sm font-medium text-foreground">${message}</p>
            </div>
        </div>
    `;
    
    const iconContainer = notification.querySelector('div > div');
    iconContainer.appendChild(Icons.createIcon(iconMap[type], { size: 16 }));
    
    elements.notificationsContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (elements.notificationsContainer.contains(notification)) {
                elements.notificationsContainer.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Gestion des overlays
function showLoadingOverlay(show = true, message = 'Chargement...') {
    if (show) {
        elements.loadingOverlay.classList.remove('hidden');
        elements.loadingOverlay.querySelector('span').textContent = message;
    } else {
        elements.loadingOverlay.classList.add('hidden');
    }
}

// Progression
function showProgress() {
    elements.progressSection.classList.remove('hidden');
    elements.progressSection.classList.add('animate-slide-up');
    updateProgress(0);
}

function hideProgress() {
    elements.progressSection.classList.add('hidden');
    elements.progressSection.classList.remove('animate-slide-up');
}

function updateProgress(percentage, action = '') {
    document.getElementById('progressPercentage').textContent = `${percentage}%`;
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    const currentActionEl = document.getElementById('currentAction');
    if (action) {
        currentActionEl.textContent = action;
        currentActionEl.classList.remove('hidden');
    } else {
        currentActionEl.classList.add('hidden');
    }
}

// Initialisation de l'application
async function initializeApp() {
    showLoadingOverlay(true, 'Initialisation...');
    
    consoleComponent.log('=== Mods Manager prêt à l\'utilisation ===', 'info');
    consoleComponent.log('Chargement des instances Minecraft...', 'info');
    
    try {
        // Afficher le skeleton loading
        document.getElementById('instanceLoading').classList.remove('hidden');
        
        const instances = await window.electronAPI.getMinecraftInstances();
        
        // Cacher le skeleton loading
        document.getElementById('instanceLoading').classList.add('hidden');
        
        // Vider le select
        elements.instanceSelect.innerHTML = '';
        
        if (instances.length === 0) {
            elements.instanceSelect.innerHTML = '<option value="">Aucune instance trouvée</option>';
            consoleComponent.log('❌ Aucune instance Minecraft trouvée', 'error');
            consoleComponent.log('Vérifiez que CurseForge est installé et que vous avez des instances.', 'warning');
            showNotification('Aucune instance Minecraft trouvée', 'warning');
        } else {
            elements.instanceSelect.innerHTML = '<option value="">Sélectionnez une instance...</option>';
            
            instances.forEach(instance => {
                const option = document.createElement('option');
                option.value = instance.name;
                option.textContent = instance.name;
                option.dataset.path = instance.path;
                elements.instanceSelect.appendChild(option);
            });
            
            consoleComponent.log(`✔ ${instances.length} instance(s) trouvée(s)`, 'success');
            showNotification(`${instances.length} instance(s) trouvée(s)`, 'success');
            
            // Restaurer la dernière instance utilisée
            const lastInstance = await window.electronAPI.getLastInstance();
            if (lastInstance) {
                elements.instanceSelect.value = lastInstance;
                const selectedOption = elements.instanceSelect.querySelector(`option[value="${lastInstance}"]`);
                if (selectedOption) {
                    selectedInstancePath = selectedOption.dataset.path;
                    elements.chooseInstanceBtn.disabled = false;
                    consoleComponent.log(`Instance restaurée automatiquement : ${lastInstance}`, 'info');
                }
            }
        }
    } catch (error) {
        document.getElementById('instanceLoading').classList.add('hidden');
        consoleComponent.log(`❌ Erreur lors du chargement des instances : ${error.message}`, 'error');
        elements.instanceSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        showNotification('Erreur de chargement des instances', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// Gestionnaires d'événements
function setupEventListeners() {
    // Sélection d'instance
    elements.instanceSelect.addEventListener('change', () => {
        const selectedInstanceName = elements.instanceSelect.value;
        
        if (selectedInstanceName) {
            const selectedOption = elements.instanceSelect.querySelector(`option[value="${selectedInstanceName}"]`);
            if (selectedOption) {
                selectedInstancePath = selectedOption.dataset.path;
                elements.chooseInstanceBtn.disabled = false;
                consoleComponent.log(`Instance pré-sélectionnée : ${selectedInstanceName}`, 'info');
            }
        } else {
            selectedInstancePath = null;
            elements.chooseInstanceBtn.disabled = true;
        }
    });
    
    // Bouton choisir instance
    elements.chooseInstanceBtn.addEventListener('click', async () => {
        const selectedInstanceName = elements.instanceSelect.value;
        
        if (!selectedInstanceName) {
            consoleComponent.log('❌ Aucune instance sélectionnée', 'error');
            showNotification('Aucune instance sélectionnée', 'error');
            return;
        }
        
        setButtonLoading(elements.chooseInstanceBtn, true);
        
        try {
            await window.electronAPI.saveLastInstance(selectedInstanceName);
            consoleComponent.log(`✔ Instance sélectionnée : ${selectedInstanceName}`, 'success');
            consoleComponent.log(`Chemin des mods : ${selectedInstancePath}`, 'info');
            
            // Activer les boutons d'action
            elements.deleteModsBtn.disabled = false;
            elements.installModsBtn.disabled = false;
            
            showNotification('Instance sélectionnée avec succès', 'success');
        } catch (error) {
            consoleComponent.log(`❌ Erreur lors de la sauvegarde : ${error.message}`, 'error');
            showNotification('Erreur lors de la sauvegarde', 'error');
        } finally {
            setButtonLoading(elements.chooseInstanceBtn, false, 'check');
        }
    });
    
    // Bouton supprimer mods
    elements.deleteModsBtn.addEventListener('click', async () => {
        if (!selectedInstancePath) {
            consoleComponent.log('❌ Aucune instance sélectionnée', 'error');
            showNotification('Aucune instance sélectionnée', 'error');
            return;
        }
        
        setButtonLoading(elements.deleteModsBtn, true);
        consoleComponent.log('\\n[Suppression des anciens mods]', 'info');
        
        try {
            const results = await window.electronAPI.deleteOldMods(selectedInstancePath);
            
            let successCount = 0;
            let errorCount = 0;
            
            results.forEach(result => {
                const type = result.status === 'deleted' ? 'success' : 
                           result.status === 'error' ? 'error' : 'info';
                consoleComponent.log(result.message, type);
                
                if (result.status === 'deleted') successCount++;
                if (result.status === 'error') errorCount++;
            });
            
            const message = errorCount > 0 ? 
                `Suppression terminée avec ${errorCount} erreur(s)` : 
                'Suppression terminée avec succès';
            
            consoleComponent.log(message, errorCount > 0 ? 'warning' : 'success');
            showNotification(message, errorCount > 0 ? 'warning' : 'success');
            
        } catch (error) {
            consoleComponent.log(`❌ Erreur lors de la suppression : ${error.message}`, 'error');
            showNotification('Erreur lors de la suppression', 'error');
        } finally {
            setButtonLoading(elements.deleteModsBtn, false, 'trash');
        }
    });
    
    // Bouton installer mods
    elements.installModsBtn.addEventListener('click', async () => {
        if (!selectedInstancePath) {
            consoleComponent.log('❌ Aucune instance sélectionnée', 'error');
            showNotification('Aucune instance sélectionnée', 'error');
            return;
        }
        
        setButtonLoading(elements.installModsBtn, true);
        showProgress();
        consoleComponent.log('\\n[Téléchargement des nouveaux mods]', 'info');
        
        try {
            // Écouter les événements de progression
            window.electronAPI.onDownloadProgress((data) => {
                updateProgress(data.progress, `Téléchargement de ${data.filename}...`);
                consoleComponent.log(`Progression: ${data.completed}/${data.total} (${data.progress}%)`, 'info');
            });
            
            const results = await window.electronAPI.downloadNewMods(selectedInstancePath);
            
            let successCount = 0;
            let errorCount = 0;
            
            results.forEach(result => {
                const type = result.status === 'success' ? 'success' : 'error';
                consoleComponent.log(result.message, type);
                
                if (result.status === 'success') successCount++;
                if (result.status === 'error') errorCount++;
            });
            
            const message = errorCount > 0 ? 
                `Installation terminée avec ${errorCount} erreur(s)` : 
                'Installation terminée avec succès';
            
            consoleComponent.log(message, errorCount > 0 ? 'warning' : 'success');
            showNotification(message, errorCount > 0 ? 'warning' : 'success');
            
        } catch (error) {
            consoleComponent.log(`❌ Erreur lors de l'installation : ${error.message}`, 'error');
            showNotification('Erreur lors de l\'installation', 'error');
        } finally {
            setButtonLoading(elements.installModsBtn, false, 'download');
            hideProgress();
            window.electronAPI.removeAllListeners('download-progress');
        }
    });
    
    // Boutons de la console
    elements.clearConsoleBtn.addEventListener('click', () => {
        consoleComponent.clear();
        showNotification('Console effacée', 'info', 2000);
    });
    
    elements.toggleConsoleBtn.addEventListener('click', () => {
        isConsoleCollapsed = !isConsoleCollapsed;
        if (isConsoleCollapsed) {
            elements.consoleContainer.style.height = '0';
            elements.consoleContainer.style.overflow = 'hidden';
        } else {
            elements.consoleContainer.style.height = '8rem';
            elements.consoleContainer.style.overflow = 'auto';
        }
        elements.toggleConsoleBtn.textContent = isConsoleCollapsed ? 'Afficher' : 'Réduire';
    });
    
    // Bouton actualiser
    elements.refreshBtn.addEventListener('click', () => {
        consoleComponent.log('Actualisation des instances...', 'info');
        initializeApp();
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            elements.refreshBtn.click();
        }
    });
    
    // Nettoyage à la fermeture
    window.addEventListener('beforeunload', () => {
        window.electronAPI.removeAllListeners('download-progress');
    });
}

// Initialisation complète
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    setupEventListeners();
    
    // Messages d'information
    consoleComponent.log('Raccourcis : Ctrl+R pour actualiser les instances', 'info');
    
    // Initialiser l'application
    initializeApp();
});