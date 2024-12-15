import React, { useState } from 'react'
import { messageService } from '~/core/services/message.service'
import { createLogger } from '~/shared/utils/logger'
import type { CheckLLMConfigResponse } from '~/shared/types/message.types'
import { MessageHandler } from '~/shared/utils/message'
import styles from '../styles/ToolBar.module.css'

const logger = createLogger('summary-button')

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
)

interface SummaryButtonProps {
  onVisibilityChange?: (visible: boolean) => void
}

export const SummaryButton: React.FC<SummaryButtonProps> = ({ onVisibilityChange }) => {
  const [isLoading, setIsLoading] = useState(false)
  const messageHandler = MessageHandler.getInstance()

  const handleClick = async () => {
    try {
      setIsLoading(true)

      // 1. 检查LLM配置
      const response = await messageService.sendToBackground({
        type: 'CHECK_LLM_CONFIG'
      }) as CheckLLMConfigResponse

      if (!response.isConfigured) {
        messageHandler.warningWithLink({
          message: '请先完成模型配置',
          linkText: '前往设置',
          onClick: () => {
            // 发送消息到后台脚本以打开选项页
            chrome.runtime.sendMessage({ 
              type: 'OPEN_OPTIONS_PAGE', 
              hash: '#model' 
            }, (response) => {
              if (chrome.runtime.lastError) {
                messageHandler.error('无法打开设置页面')
                return
              }
              if (!response?.success) {
                messageHandler.error('无法打开设置页面')
              }
            })
          }
        })
        return
      }

      // 如果模型配置验证通过，隐藏工具栏
      onVisibilityChange?.(false)

      // TODO: 继续文章总结逻辑
      
    } catch (error) {
      logger.error('处理总结请求失败:', error)
      messageHandler.error('处理总结请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button 
      className={styles.toolbarButton}
      onClick={handleClick}
      disabled={isLoading}
      title="文章总结"
    >
      <SummaryIcon />
    </button>
  )
} 