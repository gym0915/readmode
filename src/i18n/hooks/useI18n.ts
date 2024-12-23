import { useTranslation } from 'react-i18next';
import i18n from '../config';

export const useI18n = (ns: string = 'common') => {
  const { t } = useTranslation(ns);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
  };

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage: i18n.language,
  };
}; 