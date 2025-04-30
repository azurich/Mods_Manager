import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
import os
import requests
import ctypes
import subprocess

# === Configuration de la fenêtre principale ===
root = tk.Tk()
root.title("Mods Manager")
root.resizable(False, False)

# === Couleurs et thèmes ===
BG_COLOR = "#1f1f2e"
FG_COLOR = "#ffffff"
BOX_COLOR = "#292942"
CONSOLE_FG = "#ffffff"
HOVER_COLOR = "#3a3a5c"

root.configure(bg=BG_COLOR)
largeur_fenetre, hauteur_fenetre = 780, 700
x = (root.winfo_screenwidth() // 2) - (largeur_fenetre // 2)
y = (root.winfo_screenheight() // 2) - (hauteur_fenetre // 2)
root.geometry(f"{largeur_fenetre}x{hauteur_fenetre}+{x}+{y}")

# === Icônes et mode sombre ===
os.makedirs("assets", exist_ok=True)

# Copier une icône par défaut si elle n'existe pas déjà
from shutil import copyfile

default_folder_icon = "default_assets/folder_icon.png"
user_icon_path = "assets/folder_icon.png"

if not os.path.exists(user_icon_path):
    try:
        os.makedirs("assets", exist_ok=True)
        if os.path.exists(default_folder_icon):
            copyfile(default_folder_icon, user_icon_path)
    except Exception as e:
        print(f"Erreur lors de la copie de l'icône par défaut : {e}")

# Vérification et téléchargement des icônes manquantes depuis GitHub
import urllib.request

def ensure_asset(filename):
    path = os.path.join("assets", filename)
    if not os.path.exists(path):
        url = f"https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/assets/{filename}"
        try:
            urllib.request.urlretrieve(url, path)
        except Exception as e:
            print(f"Erreur lors du téléchargement de {filename} : {e}")

for icon in ["folder_icon.png", "delete_icon.png", "install_icon.png", "app.ico"]:
    ensure_asset(icon)

try:
    root.iconbitmap(os.path.join("assets", "app.ico"))
except: pass

try:
    hwnd = ctypes.windll.user32.GetParent(root.winfo_id())
    ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, 20, ctypes.byref(ctypes.c_int(1)), ctypes.sizeof(ctypes.c_int))
except: pass

try:
    delete_icon = tk.PhotoImage(file="assets/delete_icon.png")
    install_icon = tk.PhotoImage(file="assets/install_icon.png")
    choose_icon = tk.PhotoImage(file="assets/folder_icon.png")
except:
    delete_icon = install_icon = choose_icon = None

# === Constantes ===
MODS_FOLDER = None
VERSION = "1.11"
OLD_MODS = [
    'BoatBreakFix-Universal-1.0.2.jar',
    'curios-forge-5.4.6+1.20.1.jar',
    'TravelersBackpack-1.20.1-9.1.7.jar'
]
NEW_MODS = {
    'curios-forge-5.11.0+1.20.1.jar': 'https://cdn.modrinth.com/data/vvuO3ImH/versions/QBtodtmR/curios-forge-5.11.0%2B1.20.1.jar',
    'corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar': 'https://cdn.modrinth.com/data/pJGcKPh1/versions/kNCc37SZ/corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar',
    'sophisticatedcore-1.20.1-0.6.26.668.jar': 'https://mediafilez.forgecdn.net/files/5729/525/sophisticatedcore-1.20.1-0.6.26.668.jar',
    'sophisticatedbackpacks-1.20.1-3.20.7.1075.jar': 'https://mediafilez.forgecdn.net/files/5732/297/sophisticatedbackpacks-1.20.1-3.20.7.1075.jar'
}

# === Utilitaires ===

def style_bouton(widget):
    widget.configure(
        bg=BOX_COLOR,
        fg=FG_COLOR,
        font=("Segoe UI", 11, "bold"),
        relief="groove",
        activebackground=HOVER_COLOR,
        activeforeground=FG_COLOR,
        bd=2,
        padx=20,
        pady=10,
        compound="left",
        cursor="hand2",
        highlightbackground="#4a90e2",
        highlightthickness=2
    )
    widget.bind("<Enter>", lambda e: widget.config(bg=HOVER_COLOR))
    widget.bind("<Leave>", lambda e: widget.config(bg=BOX_COLOR))

def log_console(msg):
    console.configure(state='normal')
    color = 'green' if "Installé" in msg or "Téléchargement" in msg else 'red' if "Supprimé" in msg or "Erreur" in msg or "(ignoré)" in msg else None
    console.insert(tk.END, msg + '\n', color)
    console.configure(state='disabled')
    console.see(tk.END)

# === Fonctions principales ===
def lister_instances():
    base_path = os.path.join(os.path.expanduser("~"), "curseforge", "Minecraft", "Instances")
    dossiers = [d for d in os.listdir(base_path) if d.startswith("Les ZAMIS")]
    return [os.path.join(base_path, d, "mods") for d in dossiers if os.path.isdir(os.path.join(base_path, d, "mods"))]

def verifier_mise_a_jour():
    url_version = "https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/version.txt"
    url_script = "https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/main_update.exe"
    try:
        r = requests.get(url_version, timeout=5, verify=False)
        if r.status_code == 200 and r.text.strip() != VERSION:
            if messagebox.askyesno("Mise à jour disponible", "Une nouvelle version est disponible. Voulez-vous mettre à jour maintenant ?"):
                r_script = requests.get(url_script, timeout=10, verify=False)
                if r_script.status_code == 200:
                    with open("main_update.exe", "wb") as f:
                        f.write(r_script.content)
                    messagebox.showinfo("Mise à jour", "Mise à jour effectuée. Redémarrage automatique...")
                    subprocess.Popen(["updater.exe"])
                    root.destroy()
    except Exception as e:
        log_console(f"Erreur de mise à jour : {e}")

def supprimer_anciens_mods():
    log_console("\n[Suppression des anciens mods]")
    if not MODS_FOLDER or not os.path.exists(MODS_FOLDER):
        log_console(f"❌ Dossier introuvable : {MODS_FOLDER}")
        return
    for mod in OLD_MODS:
        chemin = os.path.join(MODS_FOLDER, mod)
        try:
            os.remove(chemin)
            log_console(f"✔ Supprimé : {mod}")
        except:
            log_console(f"(ignoré) {mod} introuvable ou non supprimé")

def telecharger_nouveaux_mods():
    log_console("\n[Téléchargement des nouveaux mods]")
    if not MODS_FOLDER or not os.path.exists(MODS_FOLDER):
        log_console(f"❌ Dossier introuvable : {MODS_FOLDER}")
        return
    for i, (fichier, url) in enumerate(NEW_MODS.items(), 1):
        try:
            r = requests.get(url, verify=False)
            with open(os.path.join(MODS_FOLDER, fichier), 'wb') as f:
                f.write(r.content)
            log_console(f"✔ Installé : {fichier}")
        except Exception as e:
            log_console(f"❌ Erreur lors du téléchargement de {fichier} : {e}")
        progress_var.set((i / len(NEW_MODS)) * 100)
        progress_bar_canvas.update()

def choisir_instance():
    global MODS_FOLDER
    selected = instance_var.get()
    for path in instances:
        if os.path.basename(os.path.dirname(path)) == selected:
            MODS_FOLDER = path
            break
    log_console(f"Chemin mods sélectionné : {MODS_FOLDER}")
    try:
        with open("last_instance.txt", "w") as f:
            f.write(selected)
    except Exception as e:
        log_console(f"Erreur lors de la sauvegarde de l'instance : {e}")

# === Interface utilisateur ===
tk.Label(root, text=f"Mods Manager v{VERSION}", bg=BG_COLOR, fg=FG_COLOR, font=("Segoe UI", 12, "bold")).pack(pady=(15, 5))

frame_top = tk.Frame(root, bg=BG_COLOR)
frame_top.pack(pady=(20, 10), padx=20, fill=tk.X)

instance_var = tk.StringVar()
instances = lister_instances()
instance_names = [os.path.basename(os.path.dirname(path)) for path in instances]

frame_gauche = tk.Frame(frame_top, bg=BG_COLOR)
frame_gauche.pack(side=tk.LEFT, expand=True, fill=tk.BOTH, padx=(0, 20))

bt_choix = tk.Button(frame_gauche, text=" Choisir l'instance", command=choisir_instance, image=choose_icon, compound="left")
style_bouton(bt_choix)
bt_choix.pack(pady=(0, 10), fill=tk.X)

instance_menu = ttk.Combobox(frame_gauche, textvariable=instance_var, values=instance_names, state="readonly", width=40)
instance_menu.pack(fill=tk.X)

frame_droite = tk.Frame(frame_top, bg=BG_COLOR)
frame_droite.pack(side=tk.LEFT, expand=True, fill=tk.BOTH, padx=(20, 0))

bt_suppr = tk.Button(frame_droite, text=" Supprimer les anciens mods", command=supprimer_anciens_mods, image=delete_icon)
style_bouton(bt_suppr)
bt_suppr.pack(pady=(0, 10), fill=tk.X)

bt_dl = tk.Button(frame_droite, text=" Installer les nouveaux mods", command=telecharger_nouveaux_mods, image=install_icon)
style_bouton(bt_dl)
bt_dl.pack(fill=tk.X)

# === Progression personnalisée ===
style = ttk.Style()
style.theme_use('clam')
style.layout("TProgressbar", [('Horizontal.Progressbar.trough', {'children': [('Horizontal.Progressbar.pbar', {'side': 'left', 'sticky': 'ns'})], 'sticky': 'nswe'})])
style.configure("TProgressbar", thickness=60, troughcolor=BOX_COLOR, background="#4a90e2")

progress_var = tk.DoubleVar()
progress_frame = tk.Frame(root, bg=BG_COLOR)
progress_frame.pack(pady=(40, 30))

progress_bar_canvas = tk.Canvas(progress_frame, height=25, width=700, bg=BOX_COLOR, bd=0, highlightthickness=0)
progress_bar_canvas.pack(pady=(10, 20))
progress_bar = progress_bar_canvas.create_rectangle(0, 0, 0, 25, fill="#4a90e2", width=0)

def update_custom_progress(value):
    width = progress_bar_canvas.winfo_width()
    progress_bar_canvas.coords(progress_bar, 0, 0, int((value / 100) * width), 25)

progress_bar_canvas.bind("<Configure>", lambda e: update_custom_progress(progress_var.get()))
progress_var.trace_add("write", lambda *args: update_custom_progress(progress_var.get()))

# === Console ===
console_frame = tk.LabelFrame(root, text="Console", bg=BG_COLOR, fg=FG_COLOR, font=("Segoe UI", 10, "bold"))
console_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))

console = scrolledtext.ScrolledText(console_frame, wrap=tk.WORD, font=("Consolas", 10), bg=BOX_COLOR, fg=CONSOLE_FG,
                                    insertbackground=CONSOLE_FG, borderwidth=1, relief="solid")
console.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
console.tag_config('red', foreground='red')
console.tag_config('green', foreground='lightgreen')
console.configure(state='disabled')

# === Restauration instance sauvegardée (placée ici car console définie) ===
try:
    if os.path.exists("last_instance.txt"):
        with open("last_instance.txt", "r") as f:
            saved = f.read().strip()
            if saved in instance_names:
                instance_var.set(saved)
                for path in instances:
                    if os.path.basename(os.path.dirname(path)) == saved:
                        MODS_FOLDER = path
                        break
                log_console(f"Instance restaurée automatiquement : {MODS_FOLDER}")
except Exception as e:
    log_console(f"Erreur lors du chargement de l'instance sauvegardée : {e}")

verifier_mise_a_jour()
root.mainloop()
