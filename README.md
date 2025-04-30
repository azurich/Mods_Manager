# 🧩 Mods Manager

Application Windows graphique pour gérer automatiquement les mods Minecraft d'une instance CurseForge.  
Elle supprime les anciens mods, installe les nouveaux, et se met à jour toute seule !

---

## 🚀 Fonctionnalités

- 🔄 **Mise à jour automatique** du programme via GitHub
- 🗑 **Suppression** des anciens mods obsolètes
- ⬇️ **Téléchargement** et installation des nouveaux mods
- ✅ Interface **moderne et sombre** (style Windows 11)
- 🔧 **Barre de progression** & journal console avec couleurs
- 📦 Distribution facile via un unique `Mods Manager.exe`

---

## 📁 Organisation du projet

```plaintext
📦 Mod Manager
├── main.py              # Code principal de l'application
├── assets/              # Icônes (.ico, .png) utilisés dans l'UI
│   ├── app.ico
│   ├── delete_icon.png
│   └── install_icon.png
├── updater.exe          # Utilitaire qui remplace l'exe après MAJ
├── version.txt          # Numéro de version utilisé pour la détection de mise à jour
├── main_update.exe      # Nouveau exécutable téléchargé automatiquement
└── build_and_push.bat   # Script pour compiler et envoyer la mise à jour automatiquement
```

---

## 🛠 Dépendances

- Python 3.10+
- Modules :
  - `requests`
  - `tkinter` (standard)
- Pour compiler : `pyinstaller`

```bash
pip install requests pyinstaller
```

---

## 💻 Compilation (optionnelle)

Si tu veux générer ton propre `.exe`, utilise :

```bash
pyinstaller --onefile --noconsole --icon=assets/app.ico main.py
```

Ou simplement :  
🖱️ Double-clique le script `build_and_push.bat` pour :
- Incrémenter la version
- Compiler
- Copier dans le bon dossier
- Commit + push GitHub automatiquement

---

## 🧠 Comment fonctionne la mise à jour ?

1. L'app compare `VERSION = "x.y"` avec le contenu de `version.txt` sur GitHub
2. Si une nouvelle version est trouvée, elle télécharge `main_update.exe`
3. Elle lance `updater.exe` qui :
   - Supprime l'ancien `.exe`
   - Remplace par le nouveau
   - Relance automatiquement

---

## 🔐 SmartScreen / Sécurité Windows

⚠ Lors du premier lancement, Windows peut afficher :
> *“Windows a protégé votre ordinateur”*

Clique sur **« Informations complémentaires »** ➜ **« Exécuter quand même »**  
C'est normal pour toute app non signée. Il n'y a **aucun danger**.

---

## 🧪 Pour toute suggestion ou amélioration
> Ouvre une issue sur GitHub ou envoie-moi un message !
