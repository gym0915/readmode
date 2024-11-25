/**
 * 阅读模式内容处理服务
 * 负责处理页面内容解析和阅读模式切换
 */

import { createLogger } from '~/shared/utils/logger'
import { ReaderFrameService } from './reader-frame.service'
import { ArticleParserService } from './article-parser.service'
import { ArticleCacheService } from './article-cache.service'
import type { IArticle } from '~/modules/reader/types/article.types'
import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { ArticleCard } from '../components/ArticleCard'

const logger = createLogger('reader-content')

export class ReaderContentService {
  private frameService: ReaderFrameService
  private parserService: ArticleParserService
  private articleCache: ArticleCacheService
  private root: HTMLDivElement | null = null

  constructor() {
    this.frameService = new ReaderFrameService()
    this.parserService = new ArticleParserService()
    this.articleCache = new ArticleCacheService()
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.registerMessageListeners()
    this.registerKeyboardListeners()
  }

  /**
   * 注册消息监听器
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
   */
  private registerKeyboardListeners(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.frameService.isVisible()) {
        logger.debug('ESC key pressed, exiting reader mode')
        // 直接调用 handleToggleReaderMode，不需要获取当前文章信息
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
      
      // 创建并渲染 ArticleCard
      this.cleanupRoot()
      this.root = document.createElement('div')
      this.root.id = 'reader-root'
      document.body.appendChild(this.root)
      
      const reactRoot = createRoot(this.root)
      reactRoot.render(React.createElement(ArticleCard, { article }))

      logger.info('Content parsing completed:', {
        title: article.title,
        author: article.byline || 'Unknown',
        site: article.siteName,
        contentLength: article.content.length,
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
  private handleToggleReaderMode(article: IArticle | null, sendResponse: (response: any) => void): void {
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
        this.cleanupRoot() // 先清理可能存在的旧实例
        this.root = document.createElement('div')
        this.root.id = 'reader-root'
        document.body.appendChild(this.root)
        
        const reactRoot = createRoot(this.root)
        reactRoot.render(React.createElement(ArticleCard, { article }))
        
        logger.debug('Article card re-rendered from cache')
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
} 