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

      logger.info('Successfully parsed article:', {
        title: article.title,
        length: article.content?.length || 0
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
      logger.error('Error parsing document:', error)
      throw error
    }
  }
} 