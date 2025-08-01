# Configuration des Mods

Ce fichier `mods-config.json` permet de personnaliser facilement les mods gérés par l'application.

## Structure du fichier

```json
{
  "oldMods": [
    "nom-du-mod-ancien.jar"
  ],
  "newMods": {
    "nom-du-nouveau-mod.jar": "https://url-de-telechargement.com/fichier.jar"
  },
  "configFiles": [
    {
      "filename": "nom-du-fichier-config.toml",
      "url": "https://url-vers-le-fichier-config.com/config.toml",
      "destination": "config"
    }
  ]
}
```

## Sections

### `oldMods`
Liste des mods à supprimer (noms de fichiers exacts).
- Ajoutez ou supprimez des noms de fichiers selon vos besoins
- Les noms doivent correspondre exactement aux fichiers présents dans le dossier mods

### `newMods`
Dictionnaire des mods à télécharger et installer.
- **Clé** : Nom du fichier final (avec extension .jar)
- **Valeur** : URL de téléchargement direct du mod

### `configFiles`
Liste des fichiers de configuration à télécharger.
- `filename` : Nom du fichier de configuration
- `url` : URL de téléchargement du fichier
- `destination` : Dossier de destination relatif au dossier d'instance (ex: "config", "saves", etc.)

## Comment modifier

1. **Pour ajouter un nouveau mod :**
   ```json
   "newMods": {
     "mon-nouveau-mod-1.0.jar": "https://cdn.modrinth.com/data/.../mon-mod.jar",
     // ... autres mods
   }
   ```

2. **Pour supprimer un ancien mod :**
   ```json
   "oldMods": [
     "ancien-mod-obsolete.jar",
     // ... autres mods à supprimer
   ]
   ```

3. **Pour ajouter un fichier de configuration :**
   ```json
   "configFiles": [
     {
       "filename": "mon-config.toml",
       "url": "https://example.com/config.toml",
       "destination": "config"
     }
   ]
   ```

## Notes importantes

- Les URLs de téléchargement doivent être des liens directs vers les fichiers
- Pour Modrinth : utilisez les URLs de l'API (commençant par `https://cdn.modrinth.com/`)
- Pour CurseForge : utilisez les URLs directes MediaFireZ (`https://mediafilez.forgecdn.net/`)
- Respectez la syntaxe JSON (virgules, guillemets, accolades)
- Testez vos modifications avant de distribuer

## Validation

Après modification, vous pouvez valider votre JSON sur : https://jsonlint.com/