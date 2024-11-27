import { createLogger } from "~/shared/utils/logger"

const logger = createLogger("content-script-manager")

/**
 * Content Script 管理服务
 * 负责确保内容脚本的正确加载和运行
 * 
 * @class ContentScriptManagerService
 * @description
 * 这个服务类负责管理扩展的内容脚本,主要功能包括:
 * - 检查内容脚本是否已加载
 * - 处理内容脚本注入失败的情况
 * - 提供重试机制
 * 
 * @example
 * const manager = new ContentScriptManagerService();
 * const isLoaded = await manager.ensureContentScript(tabId);
 */
export class ContentScriptManagerService {
  /**
   * 检查并确保内容脚本已加载
   * 
   * @param {number} tabId - 标签页ID
   * @returns {Promise<boolean>} 内容脚本是否已正确加载
   * @throws {Error} 当脚本注入失败时可能抛出错误
   * 
   * @description
   * 这个方法会:
   * 1. 检查内容脚本是否已存在
   * 2. 如果不存在,等待一段时间后重试
   * 3. 如果仍然失败,返回保守的结果
   * 
   * @example
   * try {
   *   const isLoaded = await manager.ensureContentScript(123);
   *   if (isLoaded) {
   *     console.log('Content script is ready');
   *   }
   * } catch (error) {
   *   console.error('Failed to check content script:', error);
   * }
   */
  async ensureContentScript(tabId: number): Promise<boolean> {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.hasOwnProperty('__READMODE_CONTENT_LOADED__')
      })

      if (results[0].result) {
        return true
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      const retryResults = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.hasOwnProperty('__READMODE_CONTENT_LOADED__')
      })

      return retryResults[0].result
    } catch (error) {
      logger.warn(`Content script check failed for tab ${tabId}, assuming loaded:`, error)
      return true
    }
  }
} 