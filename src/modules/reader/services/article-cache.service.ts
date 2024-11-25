import { createLogger } from "~/shared/utils/logger"
import type { IArticle } from "~/modules/reader/types/article.types"

const logger = createLogger("article-cache")

export class ArticleCacheService {
  private cache: Map<number, IArticle>

  constructor() {
    this.cache = new Map()
  }

  /**
   * 缓存文章数据
   */
  set(tabId: number, article: IArticle): void {
    this.cache.set(tabId, article)
    logger.debug(`Cached article for tab ${tabId}`, {
      title: article.title,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * 获取缓存的文章数据
   */
  get(tabId: number): IArticle | undefined {
    const article = this.cache.get(tabId)
    logger.debug(`Retrieved article for tab ${tabId}`, {
      found: !!article,
      title: article?.title ?? 'Not found',
      timestamp: new Date().toISOString()
    })
    return article
  }

  /**
   * 检查是否存在缓存
   */
  has(tabId: number): boolean {
    return this.cache.has(tabId)
  }

  /**
   * 删除缓存的文章数据
   */
  delete(tabId: number): void {
    if (this.cache.has(tabId)) {
      const article = this.cache.get(tabId)
      this.cache.delete(tabId)
      logger.debug(`Cleaned up cache for tab ${tabId}`, {
        title: article?.title ?? 'Unknown',
        timestamp: new Date().toISOString()
      })
    }
  }

  /**
   * 获取当前活动标签页的文章数据
   */
  async getCurrentArticle(): Promise<IArticle | null> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tabs[0]?.id) {
        return this.get(tabs[0].id) ?? null
      }
      return null
    } catch (error) {
      logger.error('Failed to get current article:', error)
      return null
    }
  }
} 