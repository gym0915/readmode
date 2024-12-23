import React, { useState, useCallback, useMemo } from 'react'
import { messageService } from '~/core/services/message.service'
import { createLogger } from '~/shared/utils/logger'
import type { CheckLLMConfigResponse } from '~/shared/types/message.types'
import { MessageHandler } from '~/shared/utils/message'
import styles from '../styles/ToolBar.module.css'
import { useReaderStore } from '~/modules/reader/store/reader'
import { useI18n } from '~/i18n/hooks/useI18n'

const logger = createLogger('summary-button')
const messageHandler = MessageHandler.getInstance()

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
    {/* 三条水平线代表文本概要 */}
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="14" y2="12" />
    <line x1="4" y1="18" x2="12" y2="18" />
  </svg>
)

interface SummaryButtonProps {
  onVisibilityChange?: (visible: boolean) => void
  onClick?: () => void
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ onVisibilityChange, onClick }) => {
  const [isLoading, setIsLoading] = useState(false)
  const toggleSummary = useReaderStore((state) => state.toggleSummary)
  const { t } = useI18n('reader')

  const handleClick = useCallback(async () => {
    if (isLoading) return

    try {
      onClick?.()
      toggleSummary()
    } catch (error) {
      logger.error('处理总结请求失败:', error)
      messageHandler.error(t('summary.error.process'))
    }
  }, [isLoading, onClick, toggleSummary, t])

  return (
    <button 
      className={styles.toolbarButton}
      onClick={handleClick}
      disabled={isLoading}
      data-tooltip={t('summary.button.title')}
    >
      <SummaryIcon />
    </button>
  )
} 