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
      const documentClone = document.cloneNode(true) as Document;
      
      // 开启debug模式的配置选项
      const readerOptions = {
        debug: false,
        // 可以添加其他配置
        // charThreshold: 500,
        // classesToPreserve: ['article-content', 'article-summary']
      };

      const reader = new Readability(documentClone, readerOptions);
      
      // 添加更详细的日志
      //logger.info('Readability parsing started with debug mode');
      
      const article = reader.parse();
      
      // 打印详细的解析结果
      logger.info('Readability output:', {
        title: article?.title,
        excerpt:article?.excerpt,
        textcContent:article?.textContent,
        excerptLength: article?.excerpt?.length,
        contentLength: article?.content?.length,
        textContentLength: article?.textContent?.length,
        byline: article?.byline,
        siteName: article?.siteName,
        timestamp: article?.publishedTime,
        dir: article?.dir
        // 添加更多你想看的信息
      });

      if (!article) {
        throw new Error('Failed to parse article content');
      }

      return {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        siteName: article.siteName
      };
    } catch (error) {
      logger.error('Error parsing article:', error);
      throw error;
    }
  }
} 