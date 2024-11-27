/**
 * 文章解析服务
 * 负责将网页内容解析为结构化的文章数据
 * 
 * @class ArticleParserService
 * @description
 * 这个服务类使用 Mozilla 的 Readability 库来解析网页内容,
 * 提取出干净的文章结构,包括:
 * - 标题
 * - 作者信息
 * - 文章正文
 * - 摘要
 * - 站点信息
 * 
 * @example
 * const parser = new ArticleParserService();
 * const article = await parser.parseDocument(document);
 */

import { Readability } from '@mozilla/readability'
import { createLogger } from '~/shared/utils/logger'
import type { IArticle } from '../types/article.types'

const logger = createLogger('article-parser')

export class ArticleParserService {
  /**
   * 解析文档内容
   * 
   * @param {Document} document - 要解析的文档对象
   * @returns {Promise<IArticle>} 解析后的文章数据
   * @throws {Error} 当解析失败时抛出错误
   * 
   * @description
   * 使用 Readability 算法解析文档,提取文章的关键信息。
   * 解析过程包括:
   * 1. 克隆文档以避免修改原始DOM
   * 2. 配置解析选项
   * 3. 执行内容提取
   * 4. 格式化输出结果
   * 
   * @example
   * try {
   *   const article = await parser.parseDocument(document);
   *   console.log(article.title);
   * } catch (error) {
   *   console.error('解析失败:', error);
   * }
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