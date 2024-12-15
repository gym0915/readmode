import React from 'react';
import '../theme/toolbar-button-theme.css';
import styles from '../styles/ToolBar.module.css';
import { MessageHandler } from '../../../shared/utils/message';

/**
 * 文章总结图标组件
 * @component
 * @returns {JSX.Element} 渲染的SVG图标
 */
const SummaryIcon: React.FC = () => (
  <svg
    className={styles.toolbarIcon}
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* 文档主体 */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    {/* 折叠的角 */}
    <path d="M14 2v6h6" />
    {/* 缩略线条 */}
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
    {/* 星标/重点标记 */}
    <path d="M9.5 9l1 1 2-2" />
  </svg>
);

/**
 * 文章总结按钮组件的属性接口
 * @interface ISummaryButtonProps
 * @property {boolean} isConfigured - 是否已完成配置
 * @property {() => void} [onClick] - 点击事件处理函数
 */
interface ISummaryButtonProps {
  isConfigured: boolean;
  onClick?: () => void;
}

/**
 * 文章总结按钮组件
 * 用于触发文章总结功能的工具栏按钮
 * 
 * @component
 * @param {ISummaryButtonProps} props - 组件属性
 * @returns {JSX.Element} 渲染的文章总结按钮组件
 */
export const SummaryButton: React.FC<ISummaryButtonProps> = ({ isConfigured, onClick }) => {
  const messageHandler = MessageHandler.getInstance();

  const handleClick = () => {
    if (!isConfigured) {
      // 跳转到选项页的模型配置标签
      const navigateToOptions = () => {
        chrome.tabs.create({
          url: chrome.runtime.getURL('options.html#model-config')
        });
      };

      messageHandler.warningWithLink({
        message: '请先完成模型配置',
        linkText: '前往设置',
        onClick: navigateToOptions
      });
      return;
    }
    onClick?.();
  };

  return (
    <button 
      className={styles.toolbarButton}
      onClick={handleClick}
      title="文章总结"
    >
      <SummaryIcon />
    </button>
  );
}; 