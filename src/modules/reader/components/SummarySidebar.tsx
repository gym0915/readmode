import React, { useEffect, useState } from 'react'
import styles from './SummarySidebar.module.css'
import type { IArticle } from '../types/article.types'
import { createLogger, ELogLevel } from '~/shared/utils/logger'
import { useReaderStore } from '../store/reader'
import { messageService } from '~/core/services/message.service'
import type { CheckLLMConfigResponse, GetLLMConfigResponse } from '~/shared/types/message.types'
import { MessageHandler } from '~/shared/utils/message'
import { LLMService } from '~/modules/llm'
import type { IChatResponse } from '~/modules/llm/types'
import { decryptText } from '~/shared/utils/crypto'
import { CryptoManager } from "~/shared/utils/crypto-manager"

const logger = createLogger('SummarySidebar', ELogLevel.DEBUG)
const messageHandler = MessageHandler.getInstance()

interface SummarySidebarProps {
  article: IArticle
  onClose: () => void
}

export const SummarySidebar: React.FC<SummarySidebarProps> = ({ article, onClose }) => {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [summary, setSummary] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const toggleSummary = useReaderStore((state) => state.toggleSummary)

  useEffect(() => {
    const checkLLMConfig = async () => {
      if (hasError) return
      
      try {
        setIsLoading(true)
        const response = await messageService.sendToBackground({
          type: 'CHECK_LLM_CONFIG'
        }) as CheckLLMConfigResponse

        setIsConfigured(response.isConfigured)
        logger.info('LLM配置检查结果:', { isConfigured: response.isConfigured })
      } catch (error) {
        logger.error('检查LLM配置失败:', error)
        setIsConfigured(false)
        setHasError(true)
        setErrorMessage('检查模型配置失败')
      } finally {
        setIsLoading(false)
      }
    }

    void checkLLMConfig()

    return () => {
      logger.info('SummarySidebar unmounted')
    }
  }, [hasError])

  // 生成文章总结
  useEffect(() => {
    const generateSummary = async () => {
      if (!isConfigured || isLoading || hasError) return

      try {
        setIsLoading(true)
        
        // // 1. 获取并解密配置
        // const configResponse = await messageService.sendToBackground({
        //   type: 'GET_LLM_CONFIG'
        // }) as GetLLMConfigResponse

        // if (configResponse.error || !configResponse.data) {
        //   throw new Error('获取配置失败')
        // }

        // const { apiKey: encryptedApiKey, baseUrl: encryptedBaseUrl } = configResponse.data
        
        // // 解密配置
        // // 初始化加密管理器并解密数据
        // const cryptoManager = CryptoManager.getInstance()
        // await cryptoManager.initialize()
        
        // const apiKey = encryptedApiKey ? await cryptoManager.decrypt(encryptedApiKey) : ''
        // const baseUrl = encryptedBaseUrl ? await cryptoManager.decrypt(encryptedBaseUrl) : ''

        // if (!apiKey || !baseUrl) {
        //   throw new Error('配置解密失败')
        // }

        // logger.info('解密后的配置:', { apiKey, baseUrl })

        // 2. 发送总结请求
        const response = await messageService.sendToBackground({
          type: 'CHAT_REQUEST',
          messages: [
            {
              role: 'system',
              content: `你是一个专业的文章总结助手。你的任务是:
1. 提取文章的核心信息,包括:
   - 主要事件和人物
   - 关键时间和地点
   - 事件的起因、经过和结果
   - 重要影响和意义
2. 生成一个结构清晰的总结:
   - 摘要: 2-3句话简述文章要点
   - 详细内容: 分点列出重要信息
   - 结论: 总结文章的核心观点或启示
3. 总结要求:
   - 保持客观准确
   - 语言简洁清晰
   - 突出重点信息
   - 保留原文的关键数据和引用
   - 总字数控制在500字左右`
            },
            {
              role: 'user',
              content: `请总结以下文章:\n\n标题: ${article.title}\n\n正文:\n${article.textContent}`
            }
          ]
          // ,
          // config: {
            // apiKey,
            // baseUrl
          // }
        })

        if (response.error) {
          throw new Error(response.error)
        }

        if (response.data instanceof ReadableStream) {
          // 处理流式响应
          const reader = response.data.getReader()
          let content = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const text = new TextDecoder().decode(value)
            content += text
            setSummary(content)
          }
        } else {
          // 处理非流式响应
          setSummary(response.data.choices[0].message.content)
        }
      } catch (error) {
        logger.error('生成文章总结失败:', error)
        setHasError(true)
        if (error instanceof Error) {
          if (error.message.includes('Invalid Base URL')) {
            setErrorMessage('Base URL 格式不正确')
          } else if (error.message.includes('API Key')) {
            setErrorMessage('API Key 无效')
          } else {
            setErrorMessage('生成文章总结失败')
          }
        } else {
          setErrorMessage('生成文章总结失败')
        }
      } finally {
        setIsLoading(false)
      }
    }

    void generateSummary()
  }, [article, isConfigured, isLoading, hasError])

  // 重置错误状态
  const resetError = () => {
    setHasError(false)
    setErrorMessage('')
  }

  // 渲染内容
  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loading}>正在生成总结...</div>
    }

    if (hasError) {
      return (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button onClick={resetError} className={styles.retryButton}>
            重试
          </button>
        </div>
      )
    }

    if (!isConfigured) {
      return (
        <div className={styles.error}>
          <p>请先完成模型配置</p>
        </div>
      )
    }

    return (
      <div className={styles.summary}>
        <div className={styles.summaryContent}>
          {summary}
        </div>
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