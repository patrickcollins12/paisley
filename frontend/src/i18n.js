


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
            "System": "System",
            "Back": "Back",
            "Details": "Details",
            "Interest Rate": "Interest Rate",
            "Recent Transactions": "Recent Transactions",
            "Last transaction": "Last transaction",
            "Error loading accounts data": "Error loading accounts data",
            "What I own (Assets)": "What I own (Assets)",
            "Total (Assets)": "Total (Assets)",
            "What I owe (Liabilities)": "What I owe (Liabilities)",
            "Total (Liabilities)": "Total (Liabilities)",
            "Net Worth": "Net Worth",
            "TZ of browser": "TZ of browser",
            "Account Name": "Account Name",
            "Account Type": "Account Type",
            "Balance": "Balance",
            "Last Balance": "Last Balance",
            "1 year": "1 year",
            "Today": "Today",
            "Yesterday": "Yesterday",
            "Columns": "Columns",
            "ID": "ID",
            "Date": "Date",
            "Account Number": "Account Number",
            "Description": "Description",
            "Debit": "Debit",
            "Credit": "Credit",
            "Amount": "Amount",
            "Tags": "Tags",
            "Party": "Party",
            "Account Currency": "Account Currency"
        }
    },

    "en": {
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
            "System": "System",
            "Back": "Back",
            "Details": "Details",
            "Interest Rate": "Interest Rate",
            "Recent Transactions": "Recent Transactions",
            "Last transaction": "Last transaction",
            "Error loading accounts data": "Error loading accounts data",
            "What I own (Assets)": "What I own (Assets)",
            "Total (Assets)": "Total (Assets)",
            "What I owe (Liabilities)": "What I owe (Liabilities)",
            "Total (Liabilities)": "Total (Liabilities)",
            "Net Worth": "Net Worth",
            "TZ of browser": "TZ of browser",
            "Account Name": "Account Name",
            "Account Type": "Account Type",
            "Balance": "Balance",
            "Last Balance": "Last Balance",
            "1 year": "1 year",
            "Today": "Today",
            "Yesterday": "Yesterday",
            "Columns": "Columns",
            "ID": "ID",
            "Date": "Date",
            "Account Number": "Account Number",
            "Description": "Description",
            "Debit": "Debit",
            "Credit": "Credit",
            "Amount": "Amount",
            "Tags": "Tags",
            "Party": "Party",
            "Account Currency": "Account Currency"
        }
    },

    "de": {
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
            "System": "System",
            "Back": "Zurück",
            "Details": "Details",
            "Interest Rate": "Zinssatz",
            "Recent Transactions": "Letzte Transaktionen",
            "Last transaction": "Letzte Transaktion",
            "Error loading accounts data": "Fehler beim Laden der Kontodaten",
            "What I own (Assets)": "Mein Besitz (Vermögenswerte)",
            "Total (Assets)": "Gesamt (Vermögenswerte)",
            "What I owe (Liabilities)": "Meine Schulden (Verbindlichkeiten)",
            "Total (Liabilities)": "Gesamt (Verbindlichkeiten)",
            "Net Worth": "Vermögen",
            "TZ of browser": "Zeitzone des Browsers",
            "Account Name": "Kontoname",
            "Account Type": "Kontotyp",
            "Balance": "Kontostand",
            "Last Balance": "Letzter Kontostand",
            "1 year": "1 Jahr",
            "Today": "Heute",
            "Yesterday": "Gestern",
            "Columns": "Spalten",
            "ID": "ID",
            "Date": "Datum",
            "Account Number": "Kontonummer",
            "Description": "Beschreibung",
            "Debit": "Soll",
            "Credit": "Haben",
            "Amount": "Betrag",
            "Tags": "Tags",
            "Party": "Partei",
            "Account Currency": "Konto-Währung"
        }
    },

    "fr": {
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
            "System": "Système",
            "Back": "Retour",
            "Details": "Détails",
            "Interest Rate": "Taux d'intérêt",
            "Recent Transactions": "Transactions récentes",
            "Last transaction": "Dernière transaction",
            "Error loading accounts data": "Erreur de chargement des données du compte",
            "What I own (Assets)": "Ce que je possède (Actifs)",
            "Total (Assets)": "Total (Actifs)",
            "What I owe (Liabilities)": "Ce que je dois (Dettes)",
            "Total (Liabilities)": "Total (Dettes)",
            "Net Worth": "Valeur nette",
            "TZ of browser": "Fuseau horaire du navigateur",
            "Account Name": "Nom du compte",
            "Account Type": "Type de compte",
            "Balance": "Solde",
            "Last Balance": "Dernier solde",
            "1 year": "1 an",
            "Today": "Aujourd'hui",
            "Yesterday": "Hier",
            "Columns": "Colonnes",
            "ID": "ID",
            "Date": "Date",
            "Account Number": "Numéro de compte",
            "Description": "Description",
            "Debit": "Débit",
            "Credit": "Crédit",
            "Amount": "Montant",
            "Tags": "Étiquettes",
            "Party": "Partie",
            "Account Currency": "Devise du compte"
        }
    },

    "ja": {
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
            "System": "システム",
            "Back": "戻る",
            "Details": "詳細",
            "Interest Rate": "金利",
            "Recent Transactions": "最近の取引",
            "Last transaction": "最後の取引",
            "Error loading accounts data": "アカウントデータの読み込みエラー",
            "What I own (Assets)": "所有する資産",
            "Total (Assets)": "資産合計",
            "What I owe (Liabilities)": "負債",
            "Total (Liabilities)": "負債合計",
            "Net Worth": "純資産",
            "TZ of browser": "ブラウザのタイムゾーン",
            "Account Name": "口座名",
            "Account Type": "口座タイプ",
            "Balance": "残高",
            "Last Balance": "前回の残高",
            "1 year": "1年",
            "Today": "今日",
            "Yesterday": "昨日",
            "Columns": "列",
            "ID": "ID",
            "Date": "日付",
            "Account Number": "口座番号",
            "Description": "説明",
            "Debit": "借方",
            "Credit": "貸方",
            "Amount": "金額",
            "Tags": "タグ",
            "Party": "当事者",
            "Account Currency": "口座通貨"
        }
    }
};


i18n
    .use(LanguageDetector)  // Use the language detector for auto-detection
    .use(initReactI18next)  // passes i18n down to react-i18next
    .init({
        resources,
        // fallbackLng: "en",  // Fallback language if the detected language is unavailable
        fallbackLng: ["en", "en-US"], // Falls back to 'en' translations for en-AU and en-GB
        interpolation: {
            escapeValue: false // react already safes from xss
        },
        debug: false,  // Enable debug mode

        // only in development should we enable these detection settings:
        detection: {
            caches: [],
            // cookieMinutes: 0,  // Also ensure cookies are not used
            localStorage: false,  // Don't use localStorage for caching
            sessionStorage: false,  // Don't use sessionStorage for caching
        }

    });

export default i18n;
