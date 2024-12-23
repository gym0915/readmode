import { EThemeMode } from '../../types/theme';
import type { IThemeConfig } from '../../types/theme';

/**
 * 浅色主题配置
 */
export const LIGHT_THEME: IThemeConfig = {
  mode: EThemeMode.LIGHT,
  colors: {
    primary: '#1677ff',
    secondary: '#69b1ff',
    background: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    fontSize: {
      base: '14px',
      small: '12px',
      large: '16px',
    },
  },
};

/**
 * 深色主题配置
 */
export const DARK_THEME: IThemeConfig = {
  mode: EThemeMode.DARK,
  colors: {
    primary: '#1677ff',
    secondary: '#69b1ff',
    background: '#1f2937',
    text: '#ffffff',
    border: '#374151',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    fontSize: {
      base: '14px',
      small: '12px',
      large: '16px',
    },
  },
};

/**
 * 本地存储主题配置的key
 */
export const THEME_STORAGE_KEY = 'readmode_theme'; 