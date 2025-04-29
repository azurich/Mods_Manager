import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk
import os
import requests
import ctypes

# === Config ===
MODS_FOLDER = os.path.join(os.path.expanduser("~"), "curseforge", "Minecraft", "Instances", "Les ZAMIS", "mods")
OLD_MODS = [
    'BoatBreakFix-Universal-1.0.2.jar',
    'curios-forge-5.4.6+1.20.1.jar'
]
NEW_MODS = {
    'curios-forge-5.11.0+1.20.1.jar': 'https://cdn.modrinth.com/data/vvuO3ImH/versions/QBtodtmR/curios-forge-5.11.0%2B1.20.1.jar',
    'corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar': 'https://cdn.modrinth.com/data/pJGcKPh1/versions/kNCc37SZ/corpsecurioscompat-1.18.x-1.20.x-Forge-2.2.1.jar'
}

# === Couleurs fixes style Windows 11 sombre bleuté ===
BG_COLOR = "#1f1f2e"
FG_COLOR = "#ffffff"
BOX_COLOR = "#292942"
CONSOLE_FG = "#ffffff"
HOVER_COLOR = "#3a3a5c"

# === Fonctions ===
def supprimer_anciens_mods():
    log_console("\n[Suppression des anciens mods]")
    if not os.path.exists(MODS_FOLDER):
        log_console(f"❌ Dossier introuvable : {MODS_FOLDER}")
        return
    for mod in OLD_MODS:
        chemin_mod = os.path.join(MODS_FOLDER, mod)
        if os.path.exists(chemin_mod):
            try:
                os.remove(chemin_mod)
                log_console(f"✔ Supprimé : {mod}")
            except Exception as e:
                log_console(f"❌ Erreur en supprimant {mod} : {e}")
        else:
            log_console(f"(ignoré) {mod} introuvable")

def telecharger_nouveaux_mods():
    log_console("\n[Téléchargement des nouveaux mods]")
    if not os.path.exists(MODS_FOLDER):
        log_console(f"❌ Dossier introuvable : {MODS_FOLDER}")
        return
    total = len(NEW_MODS)
    count = 0
    for nom_fichier, url in NEW_MODS.items():
        try:
            chemin_mod = os.path.join(MODS_FOLDER, nom_fichier)
            r = requests.get(url, verify=False)
            with open(chemin_mod, 'wb') as f:
                f.write(r.content)
            log_console(f"✔ Installé : {nom_fichier}")
        except Exception as e:
            log_console(f"❌ Erreur lors du téléchargement de {nom_fichier} : {e}")
        count += 1
        progress_var.set((count / total) * 100)
        progress_bar.update()

def log_console(msg):
    console.configure(state='normal')
    if "Supprimé" in msg or "Erreur en supprimant" in msg:
        console.insert(tk.END, msg + '\n', 'red')
    elif "Installé" in msg or "Téléchargement" in msg:
        console.insert(tk.END, msg + '\n', 'green')
    else:
        console.insert(tk.END, msg + '\n')
    console.configure(state='disabled')
    console.see(tk.END)
    print(msg)


# === Interface ===
root = tk.Tk()
root.title("Mods Manager - Les ZAMIS")
root.resizable(False, False)
root.configure(bg=BG_COLOR)

# Calcul pour centrer la fenêtre
largeur_fenetre = 640
hauteur_fenetre = 600
ecran_largeur = root.winfo_screenwidth()
ecran_hauteur = root.winfo_screenheight()
x = (ecran_largeur // 2) - (largeur_fenetre // 2)
y = (ecran_hauteur // 2) - (hauteur_fenetre // 2)
root.geometry(f"{largeur_fenetre}x{hauteur_fenetre}+{x}+{y}")

try:
    root.iconbitmap(os.path.join("assets", "app.ico"))
except:
    pass

try:
    hwnd = ctypes.windll.user32.GetParent(root.winfo_id())
    DWMWA_USE_IMMERSIVE_DARK_MODE = 20
    dark_mode = ctypes.c_int(1)
    ctypes.windll.dwmapi.DwmSetWindowAttribute(hwnd, DWMWA_USE_IMMERSIVE_DARK_MODE, ctypes.byref(dark_mode), ctypes.sizeof(dark_mode))
except:
    pass

try:
    delete_icon = tk.PhotoImage(file="assets/delete_icon.png")
    install_icon = tk.PhotoImage(file="assets/install_icon.png")
except:
    delete_icon = install_icon = None

# === Styles modernes ===
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


# === Frame Boutons ===
frame_central = tk.Frame(root, bg=BG_COLOR)
frame_central.pack(pady=(30, 20))

bt_suppr = tk.Button(frame_central, text=" Supprimer les anciens mods", command=supprimer_anciens_mods, image=delete_icon)
style_bouton(bt_suppr)
bt_suppr.pack(pady=10)

bt_dl = tk.Button(frame_central, text=" Installer les nouveaux mods", command=telecharger_nouveaux_mods, image=install_icon)
style_bouton(bt_dl)
bt_dl.pack(pady=10)

# === Barre de progression modernisée et arrondie ===
style = ttk.Style()
style.theme_use('clam')
style.configure("TProgressbar",
                thickness=18,
                troughcolor="#292942",
                background="#4a90e2",
                bordercolor="#1f1f2e",
                lightcolor="#4a90e2",
                darkcolor="#4a90e2")

progress_var = tk.DoubleVar()
progress_bar = ttk.Progressbar(root, variable=progress_var, maximum=100, style="TProgressbar")
progress_bar.pack(fill=tk.X, padx=40, pady=(10, 30))

# === Console ===
console_frame = tk.LabelFrame(root, text="Console", bg=BG_COLOR, fg=FG_COLOR, font=("Segoe UI", 10, "bold"))
console_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))

console = scrolledtext.ScrolledText(console_frame, wrap=tk.WORD, font=("Consolas", 10), bg=BOX_COLOR, fg=CONSOLE_FG,
                                    insertbackground=CONSOLE_FG, borderwidth=1, relief="solid")
console.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
console.tag_config('red', foreground='red')
console.tag_config('green', foreground='lightgreen')
console.configure(state='disabled')

# === Démarrage ===
root.after(100, lambda: log_console(f"Chemin mods : {MODS_FOLDER}"))
root.after(200, lambda: log_console("Application prête. Cliquez sur un bouton pour démarrer."))

root.mainloop()
