import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
const resources = {
    "en-US": {
        translation: {
            "Transactions": "Transactions",
            "Accounts": "Accounts",
            "Rules": "Rules",
            "Visualize": "Visualize",
            "Toggle user menu": "Toggle user menu",
            "Account": "Account",
            "Settings": "Settings",
            "Logout": "Logout",
            "Light": "Light",
            "Dark": "Dark",
            "System": "System"
        }
    },

    "en-GB": {
        translation: {
            "Transactions": "Transactions",
            "Accounts": "Accounts",
            "Rules": "Rules",
            "Visualize": "Visualise",
            "Toggle user menu": "Toggle user menu",
            "Account": "Account",
            "Settings": "Settings",
            "Logout": "Logout",
            "Light": "Light",
            "Dark": "Dark",
            "System": "System"
        }
    },

    de: {
        translation: {
            "Transactions": "Transaktionen",
            "Accounts": "Konten",
            "Rules": "Regeln",
            "Visualize": "Visualisieren",
            "Toggle user menu": "Benutzermenü umschalten",
            "Account": "Konto",
            "Settings": "Einstellungen",
            "Logout": "Abmelden",
            "Light": "Hell",
            "Dark": "Dunkel",
            "System": "System"
        }
    },
    fr: {
        translation: {
            "Transactions": "Transactions",
            "Accounts": "Comptes",
            "Rules": "Règles",
            "Visualize": "Visualiser",
            "Toggle user menu": "Basculer le menu utilisateur",
            "Account": "Compte",
            "Settings": "Paramètres",
            "Logout": "Se déconnecter",
            "Light": "Clair",
            "Dark": "Sombre",
            "System": "Système"
        }
    },
    ja: {
        translation: {
            "Transactions": "取引",
            "Accounts": "アカウント",
            "Rules": "ルール",
            "Visualize": "可視化",
            "Toggle user menu": "ユーザーメニューを切り替える",
            "Account": "アカウント",
            "Settings": "設定",
            "Logout": "ログアウト",
            "Light": "ライト",
            "Dark": "ダーク",
            "System": "システム"
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

        // only in development should we enable these detection settings:
        detection: {
            caches: [],
            // cookieMinutes: 0,  // Also ensure cookies are not used
            localStorage: false,  // Don't use localStorage for caching
            sessionStorage: false,  // Don't use sessionStorage for caching
        }

    });

export default i18n;
