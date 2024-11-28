import React from 'react';
import '../theme/toolbar-button-theme.css';
import styles from '../styles/ToolBar.module.css';

/**
 * 设置图标组件
 * @component
 * @returns {JSX.Element} 渲染的SVG图标
 */
const SettingsIcon: React.FC = () => (
  <svg
    className={styles.toolbarIcon}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/**
 * 设置按钮组件的属性接口
 * @interface ISettingsButtonProps
 * @property {() => void} [onClick] - 点击事件处理函数
 */
interface ISettingsButtonProps {
  onClick?: () => void;
}

/**
 * 设置按钮组件
 * 使用通用的ToolbarButton组件，传入设置图标
 * 
 * @component
 * @param {ISettingsButtonProps} props - 组件属性
 * @returns {JSX.Element} 渲染的设置按钮组件
 * 
 * @example
 * ```tsx
 * <SettingsButton onClick={() => console.log('设置按钮点击')} />
 * ```
 */
export const SettingsButton: React.FC<ISettingsButtonProps> = ({ onClick }) => {
  return (
    <button 
      className={styles.toolbarButton}
      onClick={onClick}
      title="设置"
    >
      <SettingsIcon />
    </button>
  );
}; 