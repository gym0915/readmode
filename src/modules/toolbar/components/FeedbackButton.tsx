import React from 'react'
import styles from '../styles/ToolBar.module.css'
import { useI18n } from '~/i18n/hooks/useI18n'

/**
 * 反馈按钮图标组件
 * @component
 * @returns {JSX.Element} 渲染的SVG图标
 */
const FeedbackIcon: React.FC = () => (
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
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

/**
 * 反馈按钮组件
 * @component
 * @returns {JSX.Element} 渲染的按钮组件
 */
export const FeedbackButton: React.FC = () => {
  const { t } = useI18n('reader')
  const feedbackUrl = 'https://cr17b3dxkk.feishu.cn/share/base/form/shrcnQ0gOaeuLXqdLfoCWycP7ad'

  const handleClick = () => {
    window.open(feedbackUrl, '_blank')
  }

  return (
    <button 
      className={styles.toolbarButton}
      onClick={handleClick}
      data-tooltip={t('feedback.button.title')}
    >
      <FeedbackIcon />
    </button>
  )
} 