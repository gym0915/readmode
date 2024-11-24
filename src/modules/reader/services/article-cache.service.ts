import { createLogger } from "~/shared/utils/logger"
import type { IArticle } from "~/modules/reader/types/article.types"

const logger = createLogger("article-cache")

export class ArticleCacheService {
  private cache: Map<number, IArticle>

  constructor() {
    this.cache = new Map()
  }

  set(tabId: number, article: IArticle): void {
    this.cache.set(tabId, article)
    logger.debug(`Cached article for tab ${tabId}`)
  }

  get(tabId: number): IArticle | undefined {
    return this.cache.get(tabId)
  }

  has(tabId: number): boolean {
    return this.cache.has(tabId)
  }

  delete(tabId: number): void {
    if (this.cache.has(tabId)) {
      this.cache.delete(tabId)
      logger.debug(`Cleaned up cache for tab ${tabId}`)
    }
  }
} 