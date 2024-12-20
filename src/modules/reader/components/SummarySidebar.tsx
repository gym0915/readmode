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
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
  const [streamContent, setStreamContent] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      if (hasError) return
      
      try {
        setIsLoading(true)
        setStreamContent('')
        setSummary('')
        
        // 1. 检查配置
        const configResponse = await messageService.sendToBackground({
          type: 'CHECK_LLM_CONFIG'
        }) as CheckLLMConfigResponse

        if (!configResponse.isConfigured) {
          setIsConfigured(false)
          return
        }

        setIsConfigured(true)

        // 2. 生成总结
        const response = await messageService.sendToBackground({
          type: 'CHAT_REQUEST',
          data: {
            type: 'SUMMARY',
            title: article.title,
            content: article.textContent,
          }
        })

        // 添加响应数据的调试日志
        logger.debug('收到总结响应:', {
          responseType: response.data instanceof ReadableStream ? 'stream' : typeof response.data,
          hasError: !!response.error,
          dataStructure: response.data instanceof ReadableStream ? 'ReadableStream' : JSON.stringify(response.data)
        })

        if (response.error) {
          throw new Error(response.error)
        }

        // 处理流式响应
        if (response.data instanceof ReadableStream) {
          setIsStreaming(true)
          const reader = response.data.getReader()
          const decoder = new TextDecoder()
          let accumulatedContent = ''
          
          try {
            while (true) {
              const { done, value } = await reader.read()
              
              if (done) {
                setIsStreaming(false)
                // 保存完整的内容
                setSummary(accumulatedContent)
                break
              }
              
              // 解码并累加流式内容
              const text = decoder.decode(value)
              accumulatedContent += text
              setStreamContent(accumulatedContent)
            }
          } catch (error) {
            logger.error('处理流式响应时出错:', {
              error,
              accumulatedContent: accumulatedContent.substring(0, 100) + '...' // 记录部分累积的内容
            })
            throw new Error('处理流式响应时出错，请重试')
          } finally {
            reader.releaseLock()
          }
        } else if (response.data && typeof response.data === 'object') {
          // 处理非流式响应
          if ('choices' in response.data && Array.isArray(response.data.choices)) {
            const content = response.data.choices[0]?.message?.content
            if (content) {
              setSummary(content)
            } else {
              logger.error('响应数据结构异常:', {
                responseData: response.data,
                choices: response.data.choices
              })
              throw new Error('响应数据格式错误')
            }
          } else if ('content' in response.data) {
            // 直接返回内容的情况
            setSummary(response.data.content)
          } else {
            logger.error('未知的响应数据结构:', response.data)
            throw new Error('无法解析的响应数据格式')
          }
        } else {
          logger.error('无效的响应数据类型:', {
            dataType: typeof response.data,
            data: response.data
          })
          throw new Error('无效的响应数据')
        }

      } catch (error) {
        setHasError(true)
        const errorMessage = error instanceof Error 
          ? error.message 
          : '生成总结失败，请稍后重试'
        
        setErrorMessage(errorMessage)
        logger.error('生成总结失败:', {
          error,
          articleTitle: article.title,
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          articleLength: article.textContent?.length
        })
      } finally {
        setIsLoading(false)
        setIsStreaming(false)
      }
    }

    void initialize()
  }, [article, hasError])

  // 重置所有状态
  const resetError = () => {
    setHasError(false)
    setErrorMessage('')
    setStreamContent('')
    setSummary('')
    setIsStreaming(false)
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
          {errorMessage.includes('配置') && (
            <button 
              onClick={() => {
                chrome.runtime.openOptionsPage()
              }}
              className={styles.configButton}
            >
              前往配置
            </button>
          )}
          <button onClick={resetError} className={styles.retryButton}>
            重试
          </button>
        </div>
      )
    }

    if (!isConfigured) {
      return (
        <div className={styles.configPrompt}>
          <div className={styles.promptIcon}>⚙️</div>
          <h3 className={styles.promptTitle}>需要完成模型配置</h3>
          <p className={styles.promptDesc}>请先完成 LLM 模型配置才能使用总结功能</p>
          <button 
            onClick={() => {
              chrome.runtime.openOptionsPage()
            }}
            className={styles.configButton}
          >
            前往配置
          </button>
        </div>
      )
    }

    return (
      <div className={styles.summary}>
        <div className={styles.summaryContent}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // 自定义组件渲染
              h1: ({node, ...props}) => <h1 className={styles.heading1} {...props} />,
              h2: ({node, ...props}) => <h2 className={styles.heading2} {...props} />,
              h3: ({node, ...props}) => <h3 className={styles.heading3} {...props} />,
              p: ({node, ...props}) => <p className={styles.paragraph} {...props} />,
              ul: ({node, ...props}) => <ul className={styles.list} {...props} />,
              ol: ({node, ...props}) => <ol className={styles.orderedList} {...props} />,
              li: ({node, ...props}) => <li className={styles.listItem} {...props} />,
              blockquote: ({node, ...props}) => <blockquote className={styles.blockquote} {...props} />,
              code: ({node, inline, ...props}) => 
                inline ? 
                  <code className={styles.inlineCode} {...props} /> : 
                  <pre className={styles.codeBlock}><code {...props} /></pre>
            }}
          >
            {isStreaming ? streamContent : summary}
          </ReactMarkdown>
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