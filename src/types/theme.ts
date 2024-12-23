/**
 * 主题模式枚举
 */
export enum EThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

/**
 * 主题配置接口
 */
export interface IThemeConfig {
  mode: EThemeMode;
  // 主题颜色变量
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
  // 主题字体配置
  typography: {
    fontFamily: string;
    fontSize: {
      base: string;
      small: string;
      large: string;
    };
  };
}

/**
 * 主题上下文接口
 */
export interface IThemeContext {
  theme: IThemeConfig;
  setTheme: (theme: IThemeConfig) => void;
  toggleTheme: () => void;
} 