@echo off
setlocal

:: === CONFIG À MODIFIER ICI ===
set "GIT_REPO_PATH=C:\Users\qbaudry\Documents\Mods_Manager\Mods_Manager"
set "VERSION=1.9"

:: === Nettoyage ===
echo.
echo Nettoyage des anciens fichiers...
rmdir /s /q build
rmdir /s /q dist
del /q *.spec

:: === Compilation ===
echo.
echo Compilation de main.py...
pyinstaller --onefile --noconsole --icon=assets/app.ico main.py

:: === Renommage ===
echo.
echo Renommage de l executable...
rename dist\main.exe main_update.exe

:: === Copie dans le repo GitHub ===
echo.
echo Copie dans le depot GitHub local...
copy /Y dist\main_update.exe "%GIT_REPO_PATH%\main_update.exe"

:: === Mise à jour du version.txt ===
echo %VERSION% > "%GIT_REPO_PATH%\version.txt"

:: === Git commit & push ===
echo.
cd /d "%GIT_REPO_PATH%"
git add main_update.exe version.txt
git commit -m "Mise a jour Mods Manager v%VERSION%"
git push

echo.
echo Mise a jour poussee sur GitHub avec succes !

:: === Nettoyage ===
echo.
echo Nettoyage des fichiers...
rmdir /s /q build
rmdir /s /q dist
del /q *.spec
echo Nettoyage des fichiers poubelle...

pause