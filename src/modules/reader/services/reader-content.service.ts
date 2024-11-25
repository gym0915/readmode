/**
 * 阅读模式内容处理服务
 * 负责处理页面内容解析和阅读模式切换
 */

import { createLogger } from '~/shared/utils/logger'
import { ReaderFrameService } from './reader-frame.service'
import { ArticleParserService } from './article-parser.service'
import type { IArticle } from '~/modules/reader/types/article.types'

const logger = createLogger('reader-content')

export class ReaderContentService {
  private frameService: ReaderFrameService
  private parserService: ArticleParserService

  constructor() {
    this.frameService = new ReaderFrameService()
    this.parserService = new ArticleParserService()
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    this.registerMessageListeners()
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
  private handleToggleReaderMode(article: IArticle, sendResponse: (response: any) => void): void {
    try {
      logger.info('Toggling reader mode:', {
        title: article.title,
        isCurrentlyVisible: this.frameService.isVisible(),
        timestamp: new Date().toISOString()
      })

      const isReaderMode = this.frameService.toggleFrame(!this.frameService.isVisible())
      
      logger.debug('Reader mode toggled:', {
        newState: isReaderMode ? 'visible' : 'hidden',
        articleTitle: article.title,
        timestamp: new Date().toISOString()
      })

      sendResponse({ 
        data: { ...article, isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error('Error toggling reader mode:', {
        error: String(error),
        articleTitle: article.title,
        timestamp: new Date().toISOString()
      })
      sendResponse({ 
        data: null,
        error: String(error) 
      })
    }
  }
} 