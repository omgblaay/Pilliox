import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import de from './locales/de';
import pl from './locales/pl';

// Get saved language from localStorage or default to 'en'
const savedLanguage = typeof window !== 'undefined' 
  ? (localStorage.getItem('language') || 'en')
  : 'en';

// Initialize i18n synchronously - this must complete before export
i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
      pl: { translation: pl },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Ensure we're initialized
if (!i18n.isInitialized) {
  console.error('i18n failed to initialize!');
}

export default i18n;
