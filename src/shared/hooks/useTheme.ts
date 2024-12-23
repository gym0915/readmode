import { useEffect } from 'react';
import { useThemeStore } from '../../store/theme';
import { IndexedDBManager } from '../utils/indexed-db';
import { GENERAL_CONFIG_KEY, STORE_NAME } from '../constants/storage';
import { createLogger } from '../utils/logger';
import type { ThemeMessage } from '../types/message.types';
import { DARK_THEME, LIGHT_THEME } from '../constants/theme';

const logger = createLogger('use-theme');

/**
 * 主题Hook，提供主题相关的状态和方法
 */
export const useTheme = () => {
  const { theme, setTheme, toggleTheme, initTheme } = useThemeStore();

  // 初始化主题
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // 1. 从 IndexedDB 加载配置
        const indexedDB = IndexedDBManager.getInstance();
        await indexedDB.initialize();
        const savedConfig = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME);
        
        if (savedConfig?.theme) {
          // 2. 设置保存的主题
          const themeToApply = savedConfig.theme === 'dark' ? DARK_THEME : LIGHT_THEME;
          setTheme(themeToApply);
          logger.debug('已加载保存的主题:', themeToApply);
        } else {
          // 3. 如果没有保存的主题，初始化系统主题
          initTheme();
          logger.debug('使用系统主题');
        }
      } catch (error) {
        logger.error('加载主题失败:', error);
        // 4. 出错时使用系统主题
        initTheme();
      }
    };

    void loadTheme();
  }, [setTheme, initTheme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      initTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [initTheme]);

  // 监听主题相关消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GET_CURRENT_THEME') {
        const message: ThemeMessage = {
          type: 'THEME_CHANGED',
          theme
        };
        event.source?.postMessage(message, { targetOrigin: '*' });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [theme]);

  // 同步主题到 IndexedDB 和 DOM
  useEffect(() => {
    const syncTheme = async () => {
      try {
        // 1. 同步到 IndexedDB
        const indexedDB = IndexedDBManager.getInstance();
        await indexedDB.initialize();
        
        const existingConfig = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME) || {};
        const updatedConfig = {
          ...existingConfig,
          theme: theme.mode === 'dark' ? 'dark' : 'light'
        };
        
        await indexedDB.saveData(GENERAL_CONFIG_KEY, updatedConfig, STORE_NAME);
        logger.debug('主题已同步到存储', updatedConfig);

        // 2. 同步到当前文档
        const applyThemeToDocument = (root: HTMLElement) => {
          // 应用颜色变量
          Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
          });

          // 应用字体变量
          root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
          Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
            root.style.setProperty(`--theme-font-size-${key}`, value);
          });

          // 设置主题模式class
          root.classList.remove('light', 'dark');
          root.classList.add(theme.mode);
        };

        applyThemeToDocument(document.documentElement);

        // 3. 同步到所有iframe
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            // 尝试直接设置样式（同域情况下）
            if (iframe.contentDocument) {
              applyThemeToDocument(iframe.contentDocument.documentElement);
            }

            // 通过消息通信设置样式（跨域情况下）
            const message: ThemeMessage = {
              type: 'THEME_CHANGED',
              theme
            };
            iframe.contentWindow?.postMessage(message, '*');
          } catch (error) {
            logger.error('同步主题到iframe失败:', error);
          }
        });
      } catch (error) {
        logger.error('同步主题失败:', error);
      }
    };

    void syncTheme();
  }, [theme]);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}; 