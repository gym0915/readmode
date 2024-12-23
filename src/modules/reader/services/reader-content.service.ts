/**
 * 阅读模式内容处理服务
 * 负责管理页面内容的解析、阅读模式的切换以及与其他服务的协调
 * 
 * @class ReaderContentService
 * @description
 * 这个服务类是阅读模式功能的核心,它整合了多个子服务来实现完整的阅读模式功能。
 * 主要功能包括:
 * - 解析页面内容为可读格式
 * - 管理阅读模式的切换状态
 * - 协调 iframe 和文章卡片的显示
 * - 处理消息通信
 * 
 * @example
 * const readerContent = new ReaderContentService();
 * await readerContent.initialize();
 */

import { createLogger } from '~/shared/utils/logger'
import { ReaderFrameService } from './reader-frame.service'
import { ArticleParserService } from './article-parser.service'
import { ArticleCacheService } from './article-cache.service'
import type { IArticle } from '~/modules/reader/types/article.types'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ReaderApp } from '../components/ReaderApp'
import { IndexedDBManager } from '~/shared/utils/indexed-db'
import { i18nService } from './i18n.service'

const logger = createLogger('reader-content')
const GENERAL_CONFIG_KEY = "generalConfig"
const STORE_NAME = "generalConfig"

interface GeneralConfig {
  theme: 'light' | 'dark'
  autoSummary: boolean
  language: 'zh' | 'en'
}

export class ReaderContentService {
  private frameService: ReaderFrameService
  private parserService: ArticleParserService
  private articleCache: ArticleCacheService
  private root: HTMLDivElement | null = null
  private indexedDB: IndexedDBManager

  private static instance: ReaderContentService

  constructor() {
    this.frameService = new ReaderFrameService()
    this.parserService = new ArticleParserService()
    this.articleCache = new ArticleCacheService()
    this.indexedDB = IndexedDBManager.getInstance()
    void i18nService
  }

  /**
   * 初始化服务
   * 
   * @returns {Promise<void>}
   * @description
   * 这个方法会注册必要的消息监听器和键盘事件监听器。
   * 它是服务启动时的必要步骤。
   * 
   * @example
   * await readerContent.initialize();
   */
  async initialize(): Promise<void> {
    this.registerMessageListeners()
    this.registerKeyboardListeners()
  }

  /**
   * 注册消息监听器
   * 
   * @private
   * @description
   * 这个方法注册了处理内容解析和阅读模式切换的消息监听器。
   * 添加此方法的理由是为了集中管理所有与消息相关的逻辑,提高代码的可维护性。
   */
  private registerMessageListeners(): void {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      logger.debug('Received message:', message)
      
      if (message.type === 'PARSE_CONTENT') {
        this.handleParseContent(sendResponse)
      } else if (message.type === 'TOGGLE_READER_MODE') {
        this.handleToggleReaderMode(message.article, sendResponse)
      }
      
      return true
    })
  }

  /**
   * 注册键盘事件监听器
   * 
   * @private
   * @description
   * 这个方法注册了用于退出阅读模式的键盘事件监听器。
   * 添加此方法的理由是为了提供用户快速退出阅读模式的方式,提高用户体验。
   */
  private registerKeyboardListeners(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.frameService.isVisible()) {
        logger.debug('ESC key pressed, exiting reader mode')
        this.resetReaderState()
        this.handleToggleReaderMode(null, () => {})
      }
    })
  }

  /**
   * 清理 React 根节点
   */
  private cleanupRoot(): void {
    if (this.root) {
      document.body.removeChild(this.root)
      this.root = null
    }
  }

  /**
   * 获取自动总结设置
   */
  private async getAutoSummaryEnabled(): Promise<boolean> {
    try {
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_GENERAL_CONFIG' 
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      logger.debug('获取到的配置:', response.data)
      return response.data?.autoSummary ?? false
    } catch (error) {
      logger.error('获取自动总结设置失败:', error)
      return false
    }
  }

  /**
   * 处理内容解析请求
   */
  private async handleParseContent(sendResponse: (response: any) => void): Promise<void> {
    try {
      logger.info('Starting content parsing:', {
        url: document.URL,
        timestamp: new Date().toISOString()
      })

      const article = await this.parserService.parseDocument(document)
      const isReaderMode = this.frameService.toggleFrame(true)
      
      // 获取自动总结设置
      const autoSummaryEnabled = await this.getAutoSummaryEnabled()
      
      // 创建并渲染 ReaderApp
      this.cleanupRoot()
      this.root = document.createElement('div')
      this.root.id = 'reader-root'
      document.body.appendChild(this.root)
      
      const reactRoot = createRoot(this.root)
      reactRoot.render(React.createElement(ReaderApp, { 
        article,
        autoSummaryEnabled // 传递自动总结设置
      }))

      logger.info('Content parsing completed:', {
        title: article.title,
        author: article.byline || 'Unknown',
        site: article.siteName,
        contentLength: article.content.length,
        autoSummaryEnabled,
        timestamp: new Date().toISOString()
      })

      sendResponse({ 
        data: { ...article, isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error('Content parsing failed:', {
        error: String(error),
        url: document.URL,
        timestamp: new Date().toISOString()
      })
      sendResponse({ 
        data: null,
        error: String(error) 
      })
    }
  }

  /**
   * 处理阅读模式切换请求
   */
  private async handleToggleReaderMode(article: IArticle | null, sendResponse: (response: any) => void): Promise<void> {
    try {
      logger.info('Toggling reader mode:', {
        title: article?.title ?? 'Unknown',
        isCurrentlyVisible: this.frameService.isVisible(),
        timestamp: new Date().toISOString()
      })

      const isReaderMode = this.frameService.toggleFrame(!this.frameService.isVisible())
      
      if (!isReaderMode) {
        // 退出阅读模式时清理
        this.cleanupRoot()
      } else if (article) {
        // 仅在进入阅读模式且有文章数据时重新渲染
        const autoSummaryEnabled = await this.getAutoSummaryEnabled()
        
        this.cleanupRoot() // 先清理可能存在的旧实例
        this.root = document.createElement('div')
        this.root.id = 'reader-root'
        document.body.appendChild(this.root)
        
        const reactRoot = createRoot(this.root)
        reactRoot.render(React.createElement(ReaderApp, { 
          article,
          autoSummaryEnabled 
        }))
        
        logger.debug('Reader app re-rendered from cache')
      }

      logger.debug('Reader mode toggled:', {
        newState: isReaderMode ? 'visible' : 'hidden',
        articleTitle: article?.title ?? 'Unknown',
        timestamp: new Date().toISOString()
      })

      sendResponse({ 
        data: article ? { ...article, isReaderMode } : { isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error('Error toggling reader mode:', {
        error: String(error),
        articleTitle: article?.title ?? 'Unknown',
        timestamp: new Date().toISOString()
      })
      sendResponse({ 
        data: null,
        error: String(error) 
      })
    }
  }

  private resetReaderState(): void {
    const event = new CustomEvent('RESET_READER_STATE')
    document.dispatchEvent(event)
  }
} 