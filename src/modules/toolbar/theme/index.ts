import './toolbar-button-theme.css';

export const TOOLBAR_THEMES = ['light', 'dark'] as const;
export type ToolbarTheme = typeof TOOLBAR_THEMES[number]; 