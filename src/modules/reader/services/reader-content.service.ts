/**
 * 阅读模式内容处理服务
 * 负责处理页面内容解析和阅读模式切换
 */

import { createLogger } from '~/shared/utils/logger'
import { ReaderFrameService } from './reader-frame.service'
import { ArticleParserService } from './article-parser.service'
import type { IArticle } from '../types/article.types'

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
      const article = await this.parserService.parseDocument(document)
      const isReaderMode = this.frameService.toggleFrame(true)
      
      sendResponse({ 
        data: { ...article, isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error('Error parsing content:', error)
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
      const isReaderMode = this.frameService.toggleFrame(!this.frameService.isVisible())
      sendResponse({ 
        data: { ...article, isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error('Error toggling reader mode:', error)
      sendResponse({ 
        data: null,
        error: String(error) 
      })
    }
  }
} 