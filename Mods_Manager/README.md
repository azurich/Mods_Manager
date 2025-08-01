# Mods Manager - Version Electron

Un gestionnaire de mods Minecraft moderne et sécurisé développé avec Electron.

## 🚀 Fonctionnalités

- **Interface moderne** avec support des thèmes sombre/clair automatique
- **Détection automatique** des instances Minecraft CurseForge  
- **Gestion des mods** : suppression d'anciens mods et installation de nouveaux
- **Téléchargement sécurisé** avec barre de progression en temps réel
- **Système de mise à jour** automatique depuis GitHub
- **Console de logs** avec timestamps pour un suivi détaillé
- **Sauvegarde automatique** de la dernière instance utilisée
- **Configuration automatique** des mods (Sodium Dynamic Lights)

## 📋 Prérequis

- **Node.js** 18+ et npm
- **CurseForge** installé avec des instances Minecraft
- **Windows** (testé sur Windows 10/11)

## 🛠️ Installation

1. **Cloner le projet**
   ```bash
   git clone <repository-url>
   cd Mods_Manager
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer en mode développement**
   ```bash
   npm run dev
   ```

4. **Construire l'application**
   ```bash
   npm run build
   ```

## 🎮 Utilisation

1. **Lancer l'application**
2. **Sélectionner une instance** Minecraft dans la liste déroulante
3. **Cliquer sur "Choisir l'instance"** pour confirmer
4. **Utiliser les boutons d'action** :
   - 🗑️ **Supprimer anciens mods** : Supprime les mods obsolètes
   - ⬇️ **Installer nouveaux mods** : Télécharge et installe les nouveaux mods

## 🔧 Configuration

L'application configure automatiquement :
- Les mods nécessaires selon la liste prédéfinie
- Le fichier de configuration `sodiumdynamiclights-client.toml`
- La sauvegarde de vos préférences

## 📂 Structure du projet

```
Mods_Manager/
├── src/
│   ├── main.js          # Processus principal Electron
│   ├── preload.js       # Script de préchargement sécurisé
│   ├── index.html       # Interface utilisateur
│   ├── styles.css       # Styles avec support thème adaptatif
│   └── renderer.js      # Logique de l'interface
├── assets/              # Icônes et ressources
├── config/              # Fichiers de configuration des mods
└── package.json         # Configuration du projet
```

## 🔐 Sécurité

- **Context Isolation** activé pour la sécurité
- **Node Integration** désactivé dans le renderer
- **Préchargement sécurisé** via preload.js
- **Validation des URLs** pour les téléchargements
- **Gestion d'erreurs** robuste

## 🎨 Interface

- Design moderne et épuré
- Support automatique des thèmes sombre/clair système
- Interface responsive
- Animations fluides
- Console de logs intégrée

## ⚡ Performance

- Téléchargements asynchrones avec progression
- Cache automatique des préférences
- Gestion mémoire optimisée
- Mises à jour en arrière-plan

## 🆚 Différences avec la version Python

### ✅ Améliorations
- Interface plus moderne et responsive
- Meilleure sécurité (context isolation)
- Gestion d'erreurs plus robuste
- Performance améliorée
- Support natif des thèmes système
- Empaquetage plus simple

### 🔄 Fonctionnalités conservées
- Toutes les fonctionnalités de l'original
- Même logique de gestion des mods
- URLs de téléchargement identiques
- Configuration automatique identique

## 🏗️ Build et Distribution

```bash
# Build pour Windows
npm run build-win

# Build universel
npm run build

# Package sans installeur
npm run pack
```

## 🐛 Dépannage

### L'application ne démarre pas
- Vérifiez que Node.js 18+ est installé
- Supprimez `node_modules` et relancez `npm install`

### Aucune instance trouvée
- Vérifiez que CurseForge est installé
- Assurez-vous d'avoir des instances Minecraft créées

### Erreurs de téléchargement
- Vérifiez votre connexion internet
- Les URLs de mods peuvent avoir changé

## 📝 Développement

### Scripts disponibles
- `npm start` : Lance l'app en production
- `npm run dev` : Lance en mode développement  
- `npm run build` : Construit l'application
- `npm run pack` : Package sans installeur

### Raccourcis en développement
- `Ctrl+R` : Actualiser les instances
- `Ctrl+Shift+I` : Outils de développement (dev uniquement)

## 🤝 Contribution

Les contributions sont les bienvenues ! Merci de :
1. Fork le projet
2. Créer une branche pour votre feature
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

## 🙏 Remerciements

- **CustomTkinter** pour l'inspiration de l'interface originale
- **Electron** pour le framework de développement
- **Modrinth** et **CurseForge** pour l'hébergement des mods