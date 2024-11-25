import { createLogger } from "~/shared/utils/logger"

const logger = createLogger("content-script-manager")

export class ContentScriptManagerService {
  /**
   * 检查并注入 content script
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