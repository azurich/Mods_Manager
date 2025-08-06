![Screenshot](https://r2.e-z.host/4ed8b442-31c9-4738-a919-7ff8dee725df/gqohuyhy.webp)

# Mods Manager

[![Version](https://img.shields.io/badge/version-2.0.6-blue.svg)](https://github.com/azurich/Mods_Manager/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)]()
[![Electron](https://img.shields.io/badge/Electron-28.0.0-47848f.svg)](https://electronjs.org/)

## ✨ Fonctionnalités

### 🎯 **Gestion des Mods**
- **Détection automatique** des instances CurseForge
- **Suppression intelligente** des anciens mods obsolètes
- **Installation automatique** des nouveaux mods depuis les sources officielles  
- **Configuration automatique** des fichiers de mods

### 🚀 **Système de Mise à Jour Intelligent**
- **Détection automatique** des nouvelles versions
- **Interface élégante** intégrée (fini les popups !)
- **Téléchargement intelligent** selon votre configuration (32/64 bits, portable/setup)
- **Installation transparente** avec redémarrage automatique
- **Barre de progression** en temps réel

### 🎨 **Interface Moderne**
- **Design responsive** avec thèmes clair/sombre
- **Composants Shadcn UI** élégants
- **Notifications toast** informatives
- **Navigation intuitive**

### 🛠️ **Fonctionnalités Avancées**
- **Logs détaillés** pour le débogage
- **Sauvegarde des préférences** (dernière instance utilisée)
- **Gestion d'erreurs** robuste
- **Mode développement** intégré

## 📥 Installation

### Téléchargement
Rendez-vous sur la page [Releases](https://github.com/azurich/Mods_Manager/releases) et téléchargez la version correspondant à votre système :

- **`Mods-Manager-Setup-x64.exe`** - Installateur Windows 64 bits
- **`Mods-Manager-Setup-x86.exe`** - Installateur Windows 32 bits  

### Prérequis
- **Windows 10/11** (x64 ou x86)
- **CurseForge** et/ou **Modrinth** installé avec des instances
- **Connexion Internet** pour les téléchargements et mises à jour des mods et configs

## 🚀 Utilisation

### Première utilisation
1. **Lancez l'application**
2. **Sélectionnez un launcher** bouton CurseForge ou Modrinth
3. **Sélectionnez une instance** dans la liste déroulante
4. **Supprimez les anciens mods** (optionnel)
5. **Installez les nouveaux mods** d'un clic

### Mises à jour
L'application vérifie automatiquement les mises à jour au démarrage :

- **🚀 Nouvelle version disponible** → Cliquez sur "Installer"
- **📥 Téléchargement en cours** → Suivez la progression
- **✅ Prêt à installer** → Cliquez sur "Redémarrer"

## 🏗️ Structure du Projet

```
Mods_Manager/
├── Mods_Manager/          # Application Electron principale
│   ├── src/               # Code React/TypeScript
│   ├── electron/          # Processus principal Electron
│   ├── dist/              # Build de production
│   └── package.json       # Dépendances et scripts
├── Web/                   # Version web (legacy)
└── README.md              # Ce fichier
```

## 🛠️ Développement

### Prérequis de développement
- **Node.js 18+**
- **npm** ou **yarn**
- **Git**

### Installation des dépendances
```bash
cd Mods_Manager/
npm install
```

### Scripts disponibles
```bash
# Développement avec hot-reload
npm run dev

# Build de production
npm run build

# Build et création de release
npm run build-and-release

# Développement React uniquement
npm run dev:react

# Build Electron
npm run build:electron
```

### Architecture technique
- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Shadcn UI + Tailwind CSS + Lucide React
- **Backend** : Electron 28 + Node.js
- **État** : React Hooks + Context API
- **Styling** : Tailwind CSS avec thèmes
- **Build** : Electron Builder

## 📋 Configuration des Mods

Les mods gérés sont configurés via le fichier remote-mods-config.json :

- **🗒️ Exemple de configs* → /remote-mods-config.json"

## 🔄 Système de Mise à Jour

Le système de mise à jour intelligent :

1. **Vérifie** les nouvelles versions sur GitHub
2. **Détecte** automatiquement votre architecture et type d'installation
3. **Télécharge** le bon fichier (32/64 bits)
4. **Installe** automatiquement et redémarre l'application

### Logs de débogage
Les logs sont sauvegardés dans : `%TEMP%/mods-manager-debug.log`

Accès via l'interface : **Paramètres** → **Voir les logs**

## 🤝 Contribution

Les contributions sont les bienvenues ! 

### Comment contribuer
1. **Fork** le projet
2. **Créez** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Committez** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Signaler un bug
Utilisez les [GitHub Issues](https://github.com/azurich/Mods_Manager/issues) avec le template approprié.

## 📝 Changelog

### Version 2.0.6 (Dernière)
- ✨ **Design moderne**
- 🚀 **Système de mise à jour automatique**
- ℹ️ **Support multi-langues**
- ❇️ **Compatible avec CurseForge et Modrinth**
- 🌓 **Gestion des thèmes Clair & Sombre**
- 📝 **Logs détaillés**

[Voir l'historique complet](CHANGELOG.md)

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**Azurich**
- GitHub: [@azurich](https://github.com/azurich)
- Projet: [Mods_Manager](https://github.com/azurich/Mods_Manager)

---

<div align="center">

Built in 🇫🇷

</div>
