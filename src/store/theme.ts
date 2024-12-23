import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { IThemeConfig } from '../types/theme';
import { DARK_THEME, LIGHT_THEME, THEME_STORAGE_KEY } from '../shared/constants/theme';
import { EThemeMode } from '../types/theme';
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('theme-store');

interface IThemeStore {
  theme: IThemeConfig;
  setTheme: (theme: IThemeConfig) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

/**
 * 获取系统主题模式
 */
const getSystemTheme = (): EThemeMode => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? EThemeMode.DARK
    : EThemeMode.LIGHT;
};

export const useThemeStore = create<IThemeStore>()(
  persist(
    (set, get) => ({
      theme: LIGHT_THEME,
      setTheme: (theme: IThemeConfig) => {
        logger.debug('设置主题:', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme =
          currentTheme.mode === EThemeMode.LIGHT ? DARK_THEME : LIGHT_THEME;
        logger.debug('切换主题:', newTheme);
        set({ theme: newTheme });
      },
      initTheme: () => {
        const systemTheme = getSystemTheme();
        const theme = systemTheme === EThemeMode.DARK ? DARK_THEME : LIGHT_THEME;
        logger.debug('初始化主题:', theme);
        set({ theme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          logger.debug('主题状态已恢复:', state.theme);
        }
      },
    }
  )
); 