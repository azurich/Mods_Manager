import customtkinter as ctk
from tkinter import messagebox
import tkinter as tk
import os
import requests
import ctypes
import subprocess

# === Configuration de la fenêtre principale ===
ctk.set_appearance_mode("system")  # Suit le thème système

# Thèmes personnalisés neutres et professionnels
DARK_THEME = {
    "primary": "#4f46e5",      # Indigo professionnel
    "primary_hover": "#4338ca", # Indigo plus foncé
    "success": "#059669",      # Vert émeraude
    "danger": "#dc2626",       # Rouge professionnel
    "bg_primary": "#0f172a",   # Fond principal slate
    "bg_secondary": "#1e293b", # Fond secondaire slate
    "bg_card": "#334155",      # Fond des cartes slate
    "text_primary": "#f8fafc", # Texte principal
    "text_secondary": "#cbd5e1" # Texte secondaire
}

LIGHT_THEME = {
    "primary": "#4f46e5",      # Indigo professionnel
    "primary_hover": "#4338ca", # Indigo plus foncé
    "success": "#059669",      # Vert émeraude
    "danger": "#dc2626",       # Rouge professionnel
    "bg_primary": "#ffffff",   # Fond principal blanc
    "bg_secondary": "#f8fafc", # Fond secondaire gris très clair
    "bg_card": "#f1f5f9",      # Fond des cartes gris clair
    "text_primary": "#0f172a", # Texte principal foncé
    "text_secondary": "#475569" # Texte secondaire gris
}

# Détection du thème système
def get_current_theme():
    appearance = ctk.get_appearance_mode()
    return DARK_THEME if appearance == "Dark" else LIGHT_THEME

CUSTOM_COLORS = get_current_theme()

root = ctk.CTk()
root.title("Mods Manager")
root.resizable(False, False)
root.configure(fg_color=CUSTOM_COLORS["bg_primary"])

# === Couleurs et thèmes ===
BG_COLOR = CUSTOM_COLORS["bg_primary"]
FG_COLOR = CUSTOM_COLORS["text_primary"]
BOX_COLOR = CUSTOM_COLORS["bg_secondary"]
CONSOLE_FG = CUSTOM_COLORS["text_primary"]
HOVER_COLOR = CUSTOM_COLORS["bg_card"]
largeur_fenetre, hauteur_fenetre = 900, 750
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
VERSION = "1.12"
OLD_MODS = [
    'BoatBreakFix-Universal-1.0.2.jar',
    'curios-forge-5.4.6+1.20.1.jar',
    'TravelersBackpack-1.20.1-9.1.7.jar'
]
NEW_MODS = {
    'curios-forge-5.11.0+1.20.1.jar': 'https://cdn.modrinth.com/data/vvuO3ImH/versions/QBtodtmR/curios-forge-5.11.0%2B1.20.1.jar',
    'corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar': 'https://cdn.modrinth.com/data/pJGcKPh1/versions/kNCc37SZ/corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar',
    'sophisticatedcore-1.20.1-0.6.26.668.jar': 'https://mediafilez.forgecdn.net/files/5729/525/sophisticatedcore-1.20.1-0.6.26.668.jar',
    'sophisticatedbackpacks-1.20.1-3.20.7.1075.jar': 'https://mediafilez.forgecdn.net/files/5732/297/sophisticatedbackpacks-1.20.1-3.20.7.1075.jar',
	 'sodiumdynamiclights-forge-1.0.10-1.20.1.jar': 'https://cdn.modrinth.com/data/PxQSWIcD/versions/I156ee3A/sodiumdynamiclights-forge-1.0.10-1.20.1.jar',
    'curiouslanterns-1.20.1-1.3.6.jar': 'https://cdn.modrinth.com/data/cE5SLYbv/versions/q3pQ4N0L/curiouslanterns-1.20.1-1.3.6.jar',
    'radiantgear-forge-2.2.0%2B1.20.1.jar': 'https://cdn.modrinth.com/data/AtT9wm5O/versions/dQfDugX5/radiantgear-forge-2.2.0%2B1.20.1.jar'
}

# === Utilitaires ===

def update_theme():
    """Met à jour le thème selon les paramètres système"""
    global CUSTOM_COLORS
    CUSTOM_COLORS = get_current_theme()
    root.configure(fg_color=CUSTOM_COLORS["bg_primary"])
    
    # Mettre à jour les composants principaux
    main_container.configure(fg_color=CUSTOM_COLORS["bg_secondary"])
    instance_section.configure(fg_color=CUSTOM_COLORS["bg_card"])
    delete_section.configure(fg_color=CUSTOM_COLORS["bg_card"])
    install_section.configure(fg_color=CUSTOM_COLORS["bg_card"])
    progress_frame.configure(fg_color=CUSTOM_COLORS["bg_secondary"])
    console_frame.configure(fg_color=CUSTOM_COLORS["bg_secondary"])
    console.configure(fg_color=CUSTOM_COLORS["bg_primary"])
    
    # Programmer la prochaine vérification
    root.after(1000, update_theme)

def log_console(msg):
    # Ajouter un timestamp pour chaque message
    import datetime
    timestamp = datetime.datetime.now().strftime("%H:%M:%S")
    
    console.insert("end", f"[{timestamp}] {msg}\n")
    console.see("end")

# === Fonctions principales ===
def lister_instances():
    base_path = os.path.join(os.path.expanduser("~"), "curseforge", "Minecraft", "Instances")
    dossiers = os.listdir(base_path)
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
    
    # Afficher la barre de progression
    progress_frame.pack(pady=(20, 20), padx=30, fill="x", before=console_frame)
    progress_var.set(0)
    for i, (fichier, url) in enumerate(NEW_MODS.items(), 1):
        try:
            r = requests.get(url, verify=False)
            with open(os.path.join(MODS_FOLDER, fichier), 'wb') as f:
                f.write(r.content)
            log_console(f"✔ Installé : {fichier}")
        except Exception as e:
            log_console(f"❌ Erreur lors du téléchargement de {fichier} : {e}")
        progress_percentage = (i / len(NEW_MODS))
        progress_var.set(progress_percentage)
        # Mettre à jour le titre de la progression (fix pour accès aux enfants)
        for child in progress_frame.winfo_children():
            if isinstance(child, ctk.CTkLabel):
                child.configure(text=f"Progression ({int(progress_percentage*100)}%)")
                break
        root.update()

# === Ajout du fichier config après installation des mods ===
    try:
        config_dir = os.path.join(os.path.dirname(MODS_FOLDER), "config")
        os.makedirs(config_dir, exist_ok=True)
        config_url = "https://raw.githubusercontent.com/azurich/Mods_Manager/main/Mods_Manager/config/sodiumdynamiclights-client.toml"
        config_path = os.path.join(config_dir, "sodiumdynamiclights-client.toml")
        urllib.request.urlretrieve(config_url, config_path)
        log_console("✔ Fichier de configuration téléchargé et placé dans 'config'.")
    except Exception as e:
        log_console(f"❌ Erreur lors du téléchargement du fichier config : {e}")
    
    # Cacher la barre de progression une fois terminé
    progress_frame.pack_forget()

def choisir_instance():
    global MODS_FOLDER
    selected = instance_var.get()
    if not selected:
        log_console("Aucune instance sélectionnée")
        return
        
    for path in instances:
        if os.path.basename(os.path.dirname(path)) == selected:
            MODS_FOLDER = path
            break
    log_console(f"Instance sélectionnée : {selected}")
    log_console(f"Chemin des mods : {MODS_FOLDER}")
    try:
        with open("last_instance.txt", "w") as f:
            f.write(selected)
        log_console("Configuration sauvegardée")
    except Exception as e:
        log_console(f"Erreur lors de la sauvegarde : {e}")

# === Interface utilisateur ===
# Header avec titre
header_frame = ctk.CTkFrame(root, fg_color="transparent")
header_frame.pack(pady=(20, 30), padx=30, fill="x")

title_label = ctk.CTkLabel(header_frame, text=f"Mods Manager v{VERSION}", 
                          font=ctk.CTkFont(size=24, weight="bold"),
                          text_color=CUSTOM_COLORS["text_primary"])
title_label.pack()

# Container principal avec design moderne
main_container = ctk.CTkFrame(root, fg_color=CUSTOM_COLORS["bg_secondary"], corner_radius=15)
main_container.pack(pady=(0, 20), padx=30, fill="x")

# Section sélection d'instance
instance_section = ctk.CTkFrame(main_container, fg_color=CUSTOM_COLORS["bg_card"], corner_radius=10)
instance_section.pack(pady=20, padx=20, fill="x")

instance_var = ctk.StringVar()
instances = lister_instances()
instance_names = [os.path.basename(os.path.dirname(path)) for path in instances]

ctk.CTkLabel(instance_section, text="Sélection de l'instance", 
             font=ctk.CTkFont(size=16, weight="bold"),
             text_color=CUSTOM_COLORS["text_primary"]).pack(pady=(15, 10))

# ComboBox avec couleurs améliorées
instance_menu = ctk.CTkComboBox(instance_section, variable=instance_var, values=instance_names, 
                               state="readonly", width=450, height=40,
                               font=ctk.CTkFont(size=14),
                               dropdown_font=ctk.CTkFont(size=14),
                               corner_radius=10,
                               border_width=2,
                               button_color=CUSTOM_COLORS["primary"],
                               button_hover_color=CUSTOM_COLORS["primary_hover"],
                               dropdown_fg_color=CUSTOM_COLORS["bg_card"],
                               dropdown_hover_color=CUSTOM_COLORS["primary"],
                               dropdown_text_color=CUSTOM_COLORS["text_primary"])
instance_menu.pack(pady=(0, 15), padx=20)

bt_choix = ctk.CTkButton(instance_section, text=" Choisir l'instance", command=choisir_instance,
                        image=choose_icon, compound="left", height=40, font=ctk.CTkFont(size=13, weight="bold"),
                        fg_color=CUSTOM_COLORS["primary"], hover_color=CUSTOM_COLORS["primary_hover"])
bt_choix.pack(pady=(0, 15), padx=20)

# Section actions avec layout horizontal
actions_frame = ctk.CTkFrame(main_container, fg_color="transparent")
actions_frame.pack(pady=(0, 20), padx=20, fill="x")

# Bouton supprimer
delete_section = ctk.CTkFrame(actions_frame, fg_color=CUSTOM_COLORS["bg_card"], corner_radius=10)
delete_section.pack(side="left", expand=True, fill="both", padx=(0, 10))

ctk.CTkLabel(delete_section, text="Nettoyage", 
             font=ctk.CTkFont(size=14, weight="bold")).pack(pady=(15, 10))

bt_suppr = ctk.CTkButton(delete_section, text=" Supprimer anciens mods", command=supprimer_anciens_mods,
                        image=delete_icon, compound="left", height=45, font=ctk.CTkFont(size=12, weight="bold"),
                        fg_color=CUSTOM_COLORS["danger"], hover_color="#dc2626")
bt_suppr.pack(pady=(0, 15), padx=15, fill="x")

# Bouton installer
install_section = ctk.CTkFrame(actions_frame, fg_color=CUSTOM_COLORS["bg_card"], corner_radius=10)
install_section.pack(side="right", expand=True, fill="both", padx=(10, 0))

ctk.CTkLabel(install_section, text="Installation", 
             font=ctk.CTkFont(size=14, weight="bold")).pack(pady=(15, 10))

bt_dl = ctk.CTkButton(install_section, text=" Installer nouveaux mods", command=telecharger_nouveaux_mods,
                     image=install_icon, compound="left", height=45, font=ctk.CTkFont(size=12, weight="bold"),
                     fg_color=CUSTOM_COLORS["success"], hover_color="#059669")
bt_dl.pack(pady=(0, 15), padx=15, fill="x")

# === Progression personnalisée ===
progress_var = ctk.DoubleVar()
progress_frame = ctk.CTkFrame(root, fg_color=CUSTOM_COLORS["bg_secondary"], corner_radius=15)
progress_frame.pack(pady=(20, 20), padx=30, fill="x")

ctk.CTkLabel(progress_frame, text="Progression", 
             font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(15, 10))

progress_bar = ctk.CTkProgressBar(progress_frame, variable=progress_var, height=20,
                                 progress_color=CUSTOM_COLORS["primary"])
progress_bar.pack(pady=(0, 15), padx=20, fill="x")
progress_var.set(0)  # S'assurer que la variable est à 0
progress_bar.set(0)  # Forcer la barre à 0
progress_frame.pack_forget()  # Cacher la progression au début

# === Console ===
console_frame = ctk.CTkFrame(root, fg_color=CUSTOM_COLORS["bg_secondary"], corner_radius=15)
console_frame.pack(fill="both", expand=True, padx=30, pady=(0, 30))

ctk.CTkLabel(console_frame, text="Console", 
             font=ctk.CTkFont(size=16, weight="bold")).pack(pady=(15, 10))

console = ctk.CTkTextbox(console_frame, font=ctk.CTkFont(family="Consolas", size=12),
                        fg_color=CUSTOM_COLORS["bg_primary"], corner_radius=10)
console.pack(fill="both", expand=True, padx=20, pady=(0, 20))

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
                log_console(f"Instance restaurée automatiquement : {saved}")
except Exception as e:
    log_console(f"Erreur lors du chargement de l'instance sauvegardée : {e}")

# Message de bienvenue
log_console("=== Mods Manager prêt à l'utilisation ===\nSélectionnez une instance et cliquez sur les boutons d'action.")

verifier_mise_a_jour()

# Démarrer le système de mise à jour du thème
update_theme()

root.mainloop()