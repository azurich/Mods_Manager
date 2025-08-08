import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import frTranslation from '../locales/fr/translation.json';
import enTranslation from '../locales/en/translation.json';
import esTranslation from '../locales/es/translation.json';
import deTranslation from '../locales/de/translation.json';
import ptTranslation from '../locales/pt/translation.json';
import ruTranslation from '../locales/ru/translation.json';
import zhTranslation from '../locales/zh/translation.json';
import jaTranslation from '../locales/ja/translation.json';
import koTranslation from '../locales/ko/translation.json';

// Fonction pour détecter la langue système
const getSystemLanguage = (): string => {
  try {
    // Dans Electron, navigator.language est disponible
    const systemLang = navigator.language || navigator.languages?.[0] || 'fr';
    
    // Mapper les langues système vers nos langues supportées
    if (systemLang.startsWith('en')) return 'en';
    if (systemLang.startsWith('fr')) return 'fr';
    if (systemLang.startsWith('es')) return 'es';
    if (systemLang.startsWith('de')) return 'de';
    if (systemLang.startsWith('pt')) return 'pt';
    if (systemLang.startsWith('ru')) return 'ru';
    if (systemLang.startsWith('zh')) return 'zh'; // zh-CN, zh-TW
    if (systemLang.startsWith('ja')) return 'ja';
    if (systemLang.startsWith('ko')) return 'ko';
    
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
      },
      de: {
        translation: deTranslation
      },
      pt: {
        translation: ptTranslation
      },
      ru: {
        translation: ruTranslation
      },
      zh: {
        translation: zhTranslation
      },
      ja: {
        translation: jaTranslation
      },
      ko: {
        translation: koTranslation
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
export type SupportedLanguages = 'fr' | 'en' | 'es' | 'de' | 'pt' | 'ru' | 'zh' | 'ja' | 'ko';

export const supportedLanguages: Record<SupportedLanguages, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어'
};

export default i18n;