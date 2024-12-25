import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import enCommon from './locales/en/common.json';
import enReader from './locales/en/reader.json';
import enSettings from './locales/en/settings.json';
import zhCommon from './locales/zh/common.json';
import zhReader from './locales/zh/reader.json';
import zhSettings from './locales/zh/settings.json';

const resources = {
  en: {
    common: enCommon,
    reader: enReader,
    settings: enSettings,
  },
  zh: {
    common: zhCommon,
    reader: zhReader,
    settings: zhSettings,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'zh',
    defaultNS: 'common',
    ns: ['common', 'reader', 'settings'],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n; 