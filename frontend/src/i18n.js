import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// the translations
const resources = {
    en: {
        translation: {
            "Welcome to React": "Welcome to React and react-i18next",
            "Transactions": "Transactions",
            "Accounts": "Accounts",
        }
    },
    de: {
        translation: {
            "Welcome to React": "Willkommen bei React und react-i18next",
            "Transactions": "Transaktionen",
            "Accounts": "Konten",
        }
    },
    fr: {
        translation: {
            "Welcome to React": "Bienvenue à React et react-i18next",
            "Transactions": "Transactions",
            "Accounts": "Comptes",
        }
    },
    jp: {
        translation: {
            "Welcome to React": "Reactへようこそ、そしてreact-i18next",
            "Transactions": "取引",
            "Accounts": "アカウント",
        }
    }
};

i18n
    .use(LanguageDetector)  // Use the language detector for auto-detection
    .use(initReactI18next)  // passes i18n down to react-i18next
    .init({
        resources,
        fallbackLng: "en",  // Fallback language if the detected language is unavailable
        interpolation: {
            escapeValue: false // react already safes from xss
        },
        debug: true,  // Enable debug mode
        detection: {
            caches: [],
            // cookieMinutes: 0,  // Also ensure cookies are not used
            localStorage: false,  // Don't use localStorage for caching
            sessionStorage: false,  // Don't use sessionStorage for caching
        }
    });

export default i18n;
