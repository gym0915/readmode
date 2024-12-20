import React, { useEffect, useState, useRef, useCallback } from 'react'
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
import { MessageService } from '~/core/services/message.service'
import Typed from 'typed.js'

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
  const typedRef = useRef<Typed | null>(null);
  const typedElementRef = useRef<HTMLDivElement>(null);

  // 清理 Typed 实例
  const cleanupTyped = useCallback(() => {
    if (typedRef.current) {
      typedRef.current.destroy();
      typedRef.current = null;
    }
  }, []);

  // 处理流式内容更新
  const handleStreamContent = useCallback((content: string) => {
    if (!typedElementRef.current) return;
    
    if (!typedRef.current) {
      typedRef.current = new Typed(typedElementRef.current, {
        strings: [''],
        typeSpeed: 20,
        showCursor: true,
        cursorChar: '▋',
        onComplete: () => {
          if (typedRef.current?.cursor) {
            typedRef.current.cursor.remove();
          }
        }
      });
    }
    
    // 只追加新内容
    const currentText = typedElementRef.current.textContent || '';
    const newContent = content.slice(currentText.length);
    
    if (newContent) {
      typedRef.current.destroy();
      typedRef.current = new Typed(typedElementRef.current, {
        strings: [content],
        typeSpeed: 20,
        startDelay: 0,
        showCursor: true,
        cursorChar: '▋',
        onComplete: () => {
          if (typedRef.current?.cursor) {
            typedRef.current.cursor.remove();
          }
        }
      });
    }
  }, []);

  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupTyped();
    };
  }, [cleanupTyped]);

  useEffect(() => {
    const initialize = async () => {
      if (hasError) return;
      
      let port: chrome.runtime.Port | null = null;
      
      try {
        setIsLoading(true);
        setStreamContent('');
        setSummary('');
        
        // 确保之前的连接已关闭
        if (port) {
          port.disconnect();
        }

        // 建立新连接
        const portName = `summary-${Date.now()}`;
        port = chrome.runtime.connect({ name: portName });
        
        logger.debug('建立新的端口连接:', portName);
        
        let accumulatedContent = '';
        
        // 改进消息监听器
        port.onMessage.addListener((message) => {
          logger.debug('收到Port消息:', message);
          
          if (message.type === 'CHAT_RESPONSE') {
            // 处理非流式响应
            if (message.data?.choices?.[0]?.message?.content) {
              const content = message.data.choices[0].message.content;
              logger.debug('收到响应内容:', { contentPreview: content.substring(0, 50) });
              handleStreamContent(content);
              setSummary(content);
            }
          } else if (message.type === 'STREAM_CHUNK') {
            setIsLoading(false)
            accumulatedContent += message.data.content;
            handleStreamContent(accumulatedContent);
            setSummary(accumulatedContent);
          } else if (message.type === 'STREAM_ERROR') {
            setHasError(true);
            setErrorMessage(message.error || '生成总结失败');
            logger.error('响应错误:', message.error);
            setIsLoading(false);
          } else if (message.type === 'STREAM_DONE') {
            // 对于流式响应，使用 accumulatedContent
            if (isStreaming) {
              logger.debug('设置总结内容:', accumulatedContent);
              // setSummary(accumulatedContent);
            }
            setIsLoading(false);
            setIsStreaming(false);
            logger.debug('响应完成，设置总结内容', {
              isStreaming,
              summaryContent: isStreaming ? accumulatedContent : summary
            });
          }
        });

        // 添加连接错误处理
        port.onDisconnect.addListener(() => {
          logger.debug('端口连接断开:', portName);
          if (chrome.runtime.lastError) {
            logger.error('连接错误:', chrome.runtime.lastError);
          }
        });
        
        // 1. 检查配置
        const configResponse = await messageService.sendToBackground({
          type: 'CHECK_LLM_CONFIG'
        }) as CheckLLMConfigResponse;

        if (!configResponse.isConfigured) {
          setIsConfigured(false);
          return;
        }

        setIsConfigured(true);

        // 3. 发送请求
        const response = await messageService.sendToBackground({
          type: 'CHAT_REQUEST',
          data: {
            type: 'SUMMARY',
            title: article.title,
            content: article.textContent,
            portName: port.name
          }
        });
        
        if (response.data?.type === 'STREAM_START') {
          setIsStreaming(true);
        } else {
          port?.disconnect();
        }

      } catch (error) {
        setHasError(true);
        const errorMessage = error instanceof Error 
          ? error.message 
          : '生成总结失败，请稍后重试'
        
        setErrorMessage(errorMessage);
        logger.error('生成总结失败:', {
          error,
          articleTitle: article.title,
          errorType: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          articleLength: article.textContent?.length
        });
        port?.disconnect();
      }

      return () => {
        if (port) {
          logger.debug('清理端口连接');
          port.disconnect();
        }
      };
    };

    void initialize();
  }, [article, hasError]);

  // 重置所有状态
  const resetError = () => {
    setHasError(false);
    setErrorMessage('');
    setStreamContent('');
    setSummary('');
    setIsStreaming(false);
  }

  // 渲染内容
  const renderContent = () => {
    // 添加调试日志
    logger.debug('渲染状态:', {
      isLoading,
      hasError,
      isConfigured,
      isStreaming,
      summaryLength: summary.length,
      hasTypedRef: !!typedRef.current,
      hasTypedElement: !!typedElementRef.current
    });

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
          {isStreaming ? (
            <div 
              ref={typedElementRef}
              className={styles.typedContent}
            />
          ) : (
            <ReactMarkdown>
              {summary}
            </ReactMarkdown>
          )}
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