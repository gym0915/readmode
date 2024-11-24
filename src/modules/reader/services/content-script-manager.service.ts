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

      if (!results[0].result) {
        logger.debug(`Injecting content script into tab ${tabId}`)
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['modules/reader/content/index.js']
        })
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return true
    } catch (error) {
      logger.error(`Failed to ensure content script in tab ${tabId}:`, error)
      return false
    }
  }
} 