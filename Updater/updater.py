import os
import time
import shutil
import subprocess
import sys

# Nom de ton vrai .exe principal
APP_NAME = "Mods Manager.exe"
UPDATE_NAME = "main_update.exe"

time.sleep(1.5)  # Attend que le .exe soit bien libéré

try:
    if os.path.exists(UPDATE_NAME):
        os.remove(APP_NAME)
        shutil.move(UPDATE_NAME, APP_NAME)
        subprocess.Popen([APP_NAME])
except Exception as e:
    print(f"Erreur lors de la mise à jour : {e}")

sys.exit()
