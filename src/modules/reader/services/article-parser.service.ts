/**
 * 文章解析服务
 * 负责解析页面内容为可读格式
 */

import { Readability } from '@mozilla/readability'
import { createLogger } from '~/shared/utils/logger'
import type { IArticle } from '../types/article.types'

const logger = createLogger('article-parser')

export class ArticleParserService {
  /**
   * 解析文档内容
   * @param document 文档对象
   */
  async parseDocument(document: Document): Promise<IArticle> {
    try {
      const documentClone = document.cloneNode(true) as Document
      const reader = new Readability(documentClone)
      const article = reader.parse()
      
      if (!article) {
        throw new Error('Failed to parse article content')
      }

      logger.info('Article parsed successfully:', {
        title: article.title,
        byline: article.byline || 'Unknown author',
        siteName: article.siteName,
        excerpt: article.excerpt,
        contentLength: article.content?.length || 0,
        textLength: article.textContent?.length || 0,
        direction: article.dir || 'ltr',
        timestamp: new Date().toISOString()
      })

      logger.debug('Article content details:', {
        titleLength: article.title?.length || 0,
        hasMetadata: !!article.byline || !!article.siteName,
        excerptLength: article.excerpt?.length || 0,
        contentPreview: article.textContent?.slice(0, 150) + '...'
      })

      return {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        siteName: article.siteName
      }
    } catch (error) {
      logger.error('Error parsing document:', {
        error,
        url: document.URL,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }
} 