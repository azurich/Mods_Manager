@echo off
setlocal

:: === CONFIG À MODIFIER ICI ===
set "GIT_REPO_PATH=C:\Users\Quentin\Documents\GitHub\updater"
set "VERSION=1.4"

:: === Nettoyage ===
echo.
echo 🔄 Nettoyage des anciens fichiers...
rmdir /s /q build
rmdir /s /q dist
del /q *.spec

:: === Compilation ===
echo.
echo 🛠 Compilation de main.py...
pyinstaller --onefile --noconsole --icon=assets/app.ico main.py

:: === Renommage ===
echo.
echo ✏️  Renommage de l'exécutable...
rename dist\main.exe main_update.exe

:: === Copie dans le repo GitHub ===
echo.
echo 📁 Copie dans le dépôt GitHub local...
copy /Y dist\main_update.exe "%GIT_REPO_PATH%\main_update.exe"

:: === Mise à jour du version.txt ===
echo %VERSION% > "%GIT_REPO_PATH%\version.txt"

:: === Git commit & push ===
echo.
cd /d "%GIT_REPO_PATH%"
git add main_update.exe version.txt
git commit -m "🔄 Mise à jour Mods Manager v%VERSION%"
git push

echo.
echo ✅ Mise à jour poussée sur GitHub avec succès !
pause