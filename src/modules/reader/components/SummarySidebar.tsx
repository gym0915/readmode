import React, { useEffect, useState } from 'react'
import styles from './SummarySidebar.module.css'
import type { IArticle } from '../types/article.types'
import { createLogger, ELogLevel } from '~/shared/utils/logger'
import { useReaderStore } from '../store/reader'
import { messageService } from '~/core/services/message.service'
import type { CheckLLMConfigResponse } from '~/shared/types/message.types'
import { MessageHandler } from '~/shared/utils/message'

const logger = createLogger('SummarySidebar', ELogLevel.DEBUG)
const messageHandler = MessageHandler.getInstance()

interface SummarySidebarProps {
  article: IArticle
  onClose: () => void
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({ article, onClose }) => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toggleSummary = useReaderStore((state) => state.toggleSummary)

  useEffect(() => {
    const checkLLMConfig = async () => {
      try {
        setIsLoading(true)
        const response = await messageService.sendToBackground({
          type: 'CHECK_LLM_CONFIG'
        }) as CheckLLMConfigResponse

        setIsConfigured(response.isConfigured)
        logger.info('LLM配置检查结果:', { isConfigured: response.isConfigured })
      } catch (error) {
        logger.error('检查LLM配置失败:', error)
        messageHandler.error('检查模型配置失败')
        setIsConfigured(false)
      } finally {
        setIsLoading(false)
      }
    }

    void checkLLMConfig()

    return () => {
      logger.info('SummarySidebar unmounted')
    }
  }, [article])

  // 渲染配置提示内容
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={styles.placeholder}>
          <p>正在检查模型配置...</p>
        </div>
      )
    }

    if (!isConfigured) {
      return (
        <div className={styles.configPrompt}>
          <div className={styles.promptIcon}>⚙️</div>
          <h3 className={styles.promptTitle}>请先完成模型配置</h3>
          <p className={styles.promptDesc}>
            需要配置 AI 模型才能使用文章总结功能
          </p>
          <button
            className={styles.configButton}
            onClick={() => {
              void chrome.runtime.sendMessage({
                type: 'OPEN_OPTIONS_PAGE',
                hash: '#model'
              })
            }}
          >
            前往设置
          </button>
        </div>
      )
    }

    return (
      <div className={styles.placeholder}>
        <p>正在生成文章总结...</p>
      </div>
    )
  }

  return (
    <div className={styles.container} data-testid="summary-sidebar">
      <div className={styles.header}>
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="关闭总结面板"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className={styles.title}>文章总结</h2>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
} 