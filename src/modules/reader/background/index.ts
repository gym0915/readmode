import { createLogger } from "~/shared/utils/logger"
import { IconManagerService } from "../services/icon-manager.service"
import { ContentScriptManagerService } from "../services/content-script-manager.service"
import { ArticleCacheService } from "../services/article-cache.service"

const logger = createLogger("background")
const iconManager = new IconManagerService()
const contentScriptManager = new ContentScriptManagerService()
const articleCache = new ArticleCacheService()

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    iconManager.setIconDisabled(tabId)
    articleCache.delete(tabId)
  } else if (changeInfo.status === "complete") {
    iconManager.setIconEnabled(tabId)
  }
})

// 标签页激活事件监听器
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === "complete") {
    await contentScriptManager.ensureContentScript(tabId)
    await iconManager.setIconEnabled(tabId)
  } else {
    await iconManager.setIconDisabled(tabId)
  }
})

// 图标点击事件监听器
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return

  try {
    const isInjected = await contentScriptManager.ensureContentScript(tab.id)
    if (!isInjected) {
      throw new Error("Failed to ensure content script")
    }

    const cachedArticle = articleCache.get(tab.id)
    if (cachedArticle) {
      await chrome.tabs.sendMessage(tab.id, { 
        type: "TOGGLE_READER_MODE",
        article: cachedArticle 
      })
      return
    }

    const response = await chrome.tabs.sendMessage(tab.id, { type: "PARSE_CONTENT" })
    
    if (response.error) {
      logger.error(`Error from content script: ${response.error}`)
    } else {
      articleCache.set(tab.id, response.data)
    }
  } catch (error) {
    logger.error(`Failed to execute action:`, error)
  }
})

// 标签页关闭事件监听器
chrome.tabs.onRemoved.addListener((tabId) => {
  articleCache.delete(tabId)
})

// 消息监听器
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PARSED_CONTENT' && sender.tab?.id) {
    articleCache.set(sender.tab.id, message.data)
  }
  return true
})

// 添加默认导出
export default {} 