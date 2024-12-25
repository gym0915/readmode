import { useTranslation } from 'react-i18next';
import i18n from '../config';
import { useEffect } from 'react';
import { createLogger } from '~/shared/utils/logger';

const logger = createLogger('use-i18n');

export const useI18n = (ns: string = 'common') => {
  const { t } = useTranslation(ns);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
  };

  useEffect(() => {
    const handleLanguageChange = (message: any) => {
      if (message.type === 'LANGUAGE_CHANGED' && message.data?.language) {
        logger.debug('收到语言变化消息:', message.data.language);
        void i18n.changeLanguage(message.data.language);
      }
    };

    // 监听来自 content script 和 background 的消息
    chrome.runtime.onMessage.addListener(handleLanguageChange);

    return () => {
      chrome.runtime.onMessage.removeListener(handleLanguageChange);
    };
  }, []);

  return {
    t,
    i18n,
    changeLanguage,
    currentLanguage: i18n.language,
  };
}; 