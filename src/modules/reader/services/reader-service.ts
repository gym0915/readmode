/**
 * 阅读模式主服务
 * 负责协调和管理所有阅读模式相关的子服务
 * 
 * @class ReaderService
 * @description
 * 这个服务类是阅读模式的主要入口点,它负责:
 * - 协调其他子服务的工作
 * - 管理阅读模式的整体生命周期
 * - 提供统一的阅读模式控制接口
 * - 处理服务之间的通信
 * 
 * @example
 * const reader = new ReaderService();
 * await reader.initialize();
 */

import { createLogger } from '~/shared/utils/logger'
import { ReaderContentService } from './reader-content.service'
import { IconManagerService } from './icon-manager.service'
import { ContentScriptManagerService } from './content-script-manager.service'
import { ArticleCacheService } from './article-cache.service'

const logger = createLogger('reader')

export class ReaderService {
  private contentService: ReaderContentService
  private iconManager: IconManagerService
  private contentScriptManager: ContentScriptManagerService
  private articleCache: ArticleCacheService

  constructor() {
    this.contentService = new ReaderContentService()
    this.iconManager = new IconManagerService()
    this.contentScriptManager = new ContentScriptManagerService()
    this.articleCache = new ArticleCacheService()
  }

  /**
   * 初始化阅读模式服务
   * 
   * @returns {Promise<void>}
   * @description
   * 初始化所有子服务并设置必要的事件监听器
   * 
   * @example
   * await reader.initialize();
   */
  async initialize(): Promise<void> {
    await this.contentService.initialize()
    this.setupEventListeners()
    logger.info('Reader service initialized')
  }

  /**
   * 设置事件监听器
   * 
   * @private
   * @description
   * 设置标签页更新、激活等事件的监听器
   */
  private setupEventListeners(): void {
    // 标签页更新事件
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this))
    // 标签页激活事件
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this))
    // 扩展图标点击事件
    chrome.action.onClicked.addListener(this.handleActionClicked.bind(this))
  }

  /**
   * 处理标签页更新事件
   * 
   * @private
   * @param {number} tabId - 标签页ID
   * @param {chrome.tabs.TabChangeInfo} changeInfo - 变更信息
   */
  private async handleTabUpdated(
    tabId: number, 
    changeInfo: chrome.tabs.TabChangeInfo
  ): Promise<void> {
    if (changeInfo.status === 'loading') {
      await this.iconManager.setIconDisabled(tabId)
      this.articleCache.delete(tabId)
    } else if (changeInfo.status === 'complete') {
      await this.iconManager.setIconEnabled(tabId)
    }
  }

  /**
   * 处理标签页激活事件
   * 
   * @private
   * @param {chrome.tabs.TabActiveInfo} activeInfo - 激活信息
   */
  private async handleTabActivated(
    { tabId }: chrome.tabs.TabActiveInfo
  ): Promise<void> {
    const tab = await chrome.tabs.get(tabId)
    if (tab.status === 'complete') {
      await this.contentScriptManager.ensureContentScript(tabId)
      await this.iconManager.setIconEnabled(tabId)
    } else {
      await this.iconManager.setIconDisabled(tabId)
    }
  }

  /**
   * 处理扩展图标点击事件
   * 
   * @private
   * @param {chrome.tabs.Tab} tab - 当前标签页
   */
  private async handleActionClicked(tab: chrome.tabs.Tab): Promise<void> {
    if (!tab.id) return

    try {
      const isInjected = await this.contentScriptManager.ensureContentScript(tab.id)
      if (!isInjected) {
        throw new Error('Failed to ensure content script')
      }

      const cachedArticle = this.articleCache.get(tab.id)
      if (cachedArticle) {
        await chrome.tabs.sendMessage(tab.id, {
          type: 'TOGGLE_READER_MODE',
          article: cachedArticle
        })
        return
      }

      const response = await chrome.tabs.sendMessage(tab.id, { type: 'PARSE_CONTENT' })
      if (response.error) {
        logger.error(`Error from content script: ${response.error}`)
      } else {
        this.articleCache.set(tab.id, response.data)
      }
    } catch (error) {
      logger.error('Failed to execute action:', error)
    }
  }
} 