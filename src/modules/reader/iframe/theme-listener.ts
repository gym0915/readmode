import { createLogger } from '../../../shared/utils/logger';
import type { ThemeMessage } from '../../../shared/types/message.types';
import type { IThemeConfig } from '../../../types/theme';

const logger = createLogger('theme-listener');

/**
 * 应用主题到当前文档
 */
const applyTheme = (theme: IThemeConfig) => {
  const root = document.documentElement;

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

/**
 * 初始化主题监听器
 */
export const initThemeListener = () => {
  // 监听来自父窗口的主题变更消息
  window.addEventListener('message', (event) => {
    try {
      const message = event.data as ThemeMessage;
      if (message.type === 'THEME_CHANGED') {
        logger.debug('收到主题变更消息:', message.theme);
        applyTheme(message.theme);
      }
    } catch (error) {
      logger.error('处理主题消息失败:', error);
    }
  });

  // 请求当前主题
  window.parent.postMessage({ type: 'GET_CURRENT_THEME' }, '*');
}; 