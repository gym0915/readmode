import React from 'react';
import '../theme/toolbar-button-theme.css';
import styles from '../styles/ToolBar.module.css';

/**
 * 写作模式图标组件
 * @component
 * @returns {JSX.Element} 渲染的SVG图标
 */
const WriteIcon: React.FC = () => (
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
    <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
    <path d="M2 2l7.586 7.586"></path>
    <circle cx="11" cy="11" r="2"></circle>
  </svg>
);

/**
 * 写作模式按钮组件的属性接口
 * @interface IWriteButtonProps
 * @property {() => void} [onClick] - 点击事件处理函数
 */
interface IWriteButtonProps {
  onClick?: () => void;
}

/**
 * 写作模式按钮组件
 * 用于切换到写作模式的工具栏按钮
 * 
 * @component
 * @param {IWriteButtonProps} props - 组件属性
 * @returns {JSX.Element} 渲染的写作模式按钮组件
 * 
 * @example
 * ```tsx
 * <WriteButton onClick={() => console.log('写作模式按钮点击')} />
 * ```
 */
export const WriteButton: React.FC<IWriteButtonProps> = ({ onClick }) => {
  return (
    <button 
      className={styles.toolbarButton}
      onClick={onClick}
      title="写作模式"
    >
      <WriteIcon />
    </button>
  );
}; 