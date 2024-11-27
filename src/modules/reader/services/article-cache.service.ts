import { createLogger } from "~/shared/utils/logger"
import type { IArticle } from "~/modules/reader/types/article.types"

const logger = createLogger("article-cache")

/**
 * 文章缓存服务
 * 负责管理标签页与文章数据的缓存关系
 * 
 * @class ArticleCacheService
 * @description
 * 这个服务类提供了文章数据的缓存管理功能,主要用于:
 * - 存储已解析的文章数据
 * - 避免重复解析相同页面
 * - 提高阅读模式切换的响应速度
 * 
 * @example
 * const cache = new ArticleCacheService();
 * cache.set(tabId, articleData);
 * const article = cache.get(tabId);
 */
export class ArticleCacheService {
  private cache: Map<number, IArticle>

  constructor() {
    this.cache = new Map()
  }

  /**
   * 缓存文章数据
   * 
   * @param {number} tabId - 标签页ID
   * @param {IArticle} article - 要缓存的文章数据
   * @description
   * 将解析后的文章数据与标签页ID关联存储
   * 
   * @example
   * cache.set(123, articleData);
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
   * 
   * @param {number} tabId - 标签页ID
   * @returns {IArticle | undefined} 缓存的文章数据,如果不存在则返回 undefined
   * 
   * @example
   * const article = cache.get(123);
   * if (article) {
   *   console.log(article.title);
   * }
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
   * 
   * @param {number} tabId - 标签页ID
   * @returns {boolean} 是否存在缓存
   * 
   * @example
   * if (cache.has(123)) {
   *   console.log('Cache exists');
   * }
   */
  has(tabId: number): boolean {
    return this.cache.has(tabId)
  }

  /**
   * 删除缓存的文章数据
   * 
   * @param {number} tabId - 标签页ID
   * @description
   * 当标签页关闭或刷新时,清理对应的缓存数据
   * 
   * @example
   * cache.delete(123);
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
   * 
   * @returns {Promise<IArticle | null>} 当前活动标签页的文章数据
   * @throws {Error} 当查询标签页失败时抛出错误
   * 
   * @example
   * const article = await cache.getCurrentArticle();
   * if (article) {
   *   console.log(article.title);
   * }
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