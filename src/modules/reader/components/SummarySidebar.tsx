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
import { icons } from '~/assets/icons'

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
    
    // 只追加
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

  // 将 initialize 函数提取到 useEffect 外部
  const initialize = useCallback(async () => {
    // 重置所有状态
    setIsLoading(true);
    setStreamContent('');
    setSummary('');
    setHasError(false);
    setErrorMessage('');
    setIsStreaming(false);
    cleanupTyped();
    
    let port: chrome.runtime.Port | null = null;
    
    try {
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
             setSummary(accumulatedContent);
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
          const error = chrome.runtime.lastError;
          logger.error('连接错误:', error);
          setHasError(true);
          setErrorMessage('连接已断开，请重试');
          setIsLoading(false);
        }
      });
      
      // 1. 检查配置
      const configResponse = await messageService.sendToBackground({
        type: 'CHECK_LLM_CONFIG'
      }) as CheckLLMConfigResponse;

      if (!configResponse.isConfigured) {
        setIsConfigured(false);
        setIsLoading(false);
        logger.warn('LLM 模型未配置');
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
      logger.error('检查配置失败:', error);
      setHasError(true);
      setErrorMessage('配置检查失败');
      setIsLoading(false);
      return;
    } finally {
      // 确保在组件卸载或重新初始化时清理端口连接
      return () => {
        if (port) {
          logger.debug('清理端口连接');
          port.disconnect();
          port = null;
        }
      };
    }
  }, [article, cleanupTyped]); // 添加必要的依赖

  // 使用 useEffect 调用 initialize
  useEffect(() => {
    void initialize();
  }, [initialize]);

  // 重置所有状态
  const resetError = useCallback(() => {
    setHasError(false);
    setErrorMessage('');
    setStreamContent('');
    setSummary('');
    setIsStreaming(false);
    cleanupTyped();
  }, [cleanupTyped]);

  // 1. 添加一个新的处理函数
  const handleOpenOptions = useCallback(() => {
    try {
      chrome.runtime.sendMessage({ 
        type: 'OPEN_OPTIONS_PAGE',
        data: { tab: 'llm' }
      }, (response) => {
        if (chrome.runtime.lastError) {
          logger.error('打开配置页面失败:', chrome.runtime.lastError);
          messageHandler.error('打开配置页面失败');
        }
      });
    } catch (error) {
      logger.error('发送消息失败:', error);
      messageHandler.error('打开配置页面失败');
    }
  }, []);

  // 添加重新总结的处理函数
  const handleRefresh = useCallback(() => {
    resetError();
    void initialize();
  }, [resetError, initialize]); // 添加 initialize 作为依赖

  // 渲染内容
  const renderContent = () => {
    // 添加试日志
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
      return (
        <div className={styles.loading}>
          <div className={styles.loadingIcon}>
            <svg 
              className={styles.spinner} 
              viewBox="0 0 50 50"
            >
              <circle
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
            </svg>
          </div>
          <div className={styles.loadingText}>
            正在生成总结<span className={styles.dots}>...</span>
          </div>
        </div>
      )
    }

    if (hasError) {
      return (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <div className={styles.buttonGroup}>
            <button 
              onClick={handleOpenOptions}
              className={styles.configButton}
            >
              前往配置
            </button>
            <button 
              onClick={handleRefresh} 
              className={styles.retryButton}
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    if (!isConfigured) {
      return (
        <div className={styles.configPrompt}>
          <div className={styles.promptIcon}>⚙️</div>
          <p className={styles.promptDesc}>
            需要配置 AI 模型才能使用总结功能
          </p>
          <button 
            onClick={handleOpenOptions}
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
        <div className={styles.headerLeft}>
          <img 
            src={icons['32']}
            alt="Readfun Logo" 
            className={styles.logo}
            onError={(e) => {
              console.error('Logo 加载失败', e);
            }}
          />
          <h2 className={styles.title}>Readfun</h2>
        </div>
        <div className={styles.headerButtons}>
          <button 
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="重新总结"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 20.75C16.9706 20.75 21 16.7206 21 11.75C21 6.77944 16.9706 2.75 12 2.75C7.02944 2.75 3 6.77944 3 11.75"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M3 6.75V11.75H8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
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
        </div>
      </div>
      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  )
} 