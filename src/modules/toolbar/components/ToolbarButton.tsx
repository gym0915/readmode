import React from 'react';
import styles from '../styles/toolbar.module.css';

/**
 * 工具栏按钮的属性接口
 * @interface IToolbarButtonProps
 * @property {React.ReactNode} icon - 按钮图标
 * @property {string} [title] - 按钮提示文本
 * @property {() => void} [onClick] - 点击事件处理函数
 * @property {string} [className] - 自定义类名
 */
interface IToolbarButtonProps {
  icon: React.ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * 通用工具栏按钮组件
 * @component
 * @param {IToolbarButtonProps} props - 组件属性
 * @returns {JSX.Element} 渲染的按钮组件
 * 
 * @example
 * ```tsx
 * <ToolbarButton
 *   icon={<SettingsIcon />}
 *   title="设置"
 *   onClick={() => console.log('设置按钮点击')}
 * />
 * ```
 */
export const ToolbarButton: React.FC<IToolbarButtonProps> = ({
  icon,
  title,
  onClick,
  className,
}) => {
  return (
    <button
      className={`${styles.toolbarButton} ${className || ''}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className={styles.toolbarIcon}>{icon}</span>
    </button>
  );
}; 