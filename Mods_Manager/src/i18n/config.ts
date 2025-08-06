import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import frTranslation from '../locales/fr/translation.json';
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';

// Fonction pour détecter la langue système
const getSystemLanguage = (): string => {
  try {
    // Dans Electron, navigator.language est disponible
    const systemLang = navigator.language || navigator.languages?.[0] || 'fr';
    
    // Mapper les langues système vers nos langues supportées
    if (systemLang.startsWith('en')) return 'en';
    if (systemLang.startsWith('fr')) return 'fr';
    if (systemLang.startsWith('es')) return 'es';
    
    // Défaut français
    return 'fr';
  } catch {
    return 'fr'; // Fallback
  }
};

// Fonction pour charger la langue sauvegardée (Electron d'abord, puis localStorage)
const getSavedLanguage = async (): Promise<string> => {
  try {
    // Dans Electron, essayer d'abord le store principal
    if (window.electronAPI?.getLanguagePreference) {
      const electronLanguage = await window.electronAPI.getLanguagePreference();
      if (electronLanguage) {
        return electronLanguage;
      }
    }
    
    // Fallback sur localStorage
    return localStorage.getItem('language') || getSystemLanguage();
  } catch {
    return getSystemLanguage();
  }
};

// Version synchrone pour l'initialisation
const getSavedLanguageSync = (): string => {
  try {
    return localStorage.getItem('language') || getSystemLanguage();
  } catch {
    return getSystemLanguage();
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: frTranslation
      },
      en: {
        translation: enTranslation
      },
      es: {
        translation: esTranslation
      }
    },
    lng: getSavedLanguageSync(), // Langue initiale : sauvegardée ou détectée
    fallbackLng: 'fr', // Français par défaut
    
    interpolation: {
      escapeValue: false, // React échappe déjà les valeurs
    },
    
    debug: false, // Désactiver en production
    
    // Configuration pour une meilleure performance
    load: 'languageOnly', // Ne charge que 'fr' au lieu de 'fr-FR'
    cleanCode: true,
    
    // Namespace par défaut
    defaultNS: 'translation',
    
    // Configuration des clés manquantes
    saveMissing: false,
    updateMissing: false
  });

// Fonction utilitaire pour changer de langue et sauvegarder
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    
    // Sauvegarder dans Electron store si disponible
    if (window.electronAPI?.saveLanguagePreference) {
      await window.electronAPI.saveLanguagePreference(language);
    }
    
    // Fallback localStorage
    localStorage.setItem('language', language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// Fonction pour synchroniser la langue au démarrage
export const initializeLanguage = async (): Promise<void> => {
  try {
    const savedLanguage = await getSavedLanguage();
    if (savedLanguage !== i18n.language) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error initializing language:', error);
  }
};

// Fonction utilitaire pour obtenir la langue actuelle
export const getCurrentLanguage = (): string => {
  return i18n.language || 'fr';
};

// Types pour une meilleure expérience développeur
export type SupportedLanguages = 'fr' | 'en' | 'es';

export const supportedLanguages: Record<SupportedLanguages, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español'
};

export default i18n;