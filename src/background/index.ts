import { icons } from "~/assets/icons"
import { createLogger } from "~/utils/logger"

const logger = createLogger("background")

// 添加缓存存储
const articleCache = new Map<number, any>()

// 设置图标为灰色且禁用
const setIconDisabled = async (tabId: number) => {
  await chrome.action.setIcon({
    tabId,
    path: {
      "16": icons["16-gray"],
      "32": icons["32-gray"]
    }
  })
  await chrome.action.disable(tabId)
}

// 设置图标为正常且启用
const setIconEnabled = async (tabId: number) => {
  await chrome.action.setIcon({
    tabId,
    path: {
      "16": icons["16"],
      "32": icons["32"]
    }
  })
  await chrome.action.enable(tabId)
}

// 检查并注入 content script
const ensureContentScript = async (tabId: number) => {
  try {
    // 检查 content script 是否已注入
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.hasOwnProperty('__READMODE_CONTENT_LOADED__')
    })

    // 如果未注入，则注入脚本
    if (!results[0].result) {
      logger.debug(`Injecting content script into tab ${tabId}`)
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/index.js']
      })
      // 等待脚本加载
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return true
  } catch (error) {
    logger.error(`Failed to ensure content script in tab ${tabId}:`, error)
    return false
  }
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    logger.debug(`Tab ${tabId} is loading, setting icon to disabled`)
    setIconDisabled(tabId)
    // 清理缓存
    if (articleCache.has(tabId)) {
      logger.debug(`Cleaning up cache for reloaded tab ${tabId}`)
      articleCache.delete(tabId)
    }
  } else if (changeInfo.status === "complete") {
    logger.debug(`Tab ${tabId} completed loading, setting icon to enabled`)
    setIconEnabled(tabId)
  }
})

// 修改标签页激活事件监听器
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === "complete") {
    await ensureContentScript(tabId)
    setIconEnabled(tabId)
  } else {
    setIconDisabled(tabId)
  }
})

// 修改图标点击事件监听器
chrome.action.onClicked.addListener(async (tab) => {
  logger.info(`Icon clicked on tab ${tab.id}`)
  
  if (!tab.id) {
    logger.error("No tab id found")
    return
  }

  try {
    // 确保 content script 已注入
    const isInjected = await ensureContentScript(tab.id)
    if (!isInjected) {
      throw new Error("Failed to ensure content script")
    }

    // 检查缓存
    const cachedArticle = articleCache.get(tab.id)
    if (cachedArticle) {
      logger.debug(`Using cached article for tab ${tab.id}`)
      // 直接发送切换阅读模式的消息
      const response = await chrome.tabs.sendMessage(tab.id, { 
        type: "TOGGLE_READER_MODE",
        article: cachedArticle 
      })
      return
    }

    // 如果没有缓存，则解析内容
    logger.debug(`Sending PARSE_CONTENT message to tab ${tab.id}`)
    const response = await chrome.tabs.sendMessage(tab.id, { type: "PARSE_CONTENT" })
    
    if (response.error) {
      logger.error(`Error from content script: ${response.error}`)
    } else {
      // 存储解析结果到缓存
      articleCache.set(tab.id, response.data)
      logger.info(`Successfully parsed content for tab ${tab.id}`)
      logger.info('Parsed article content:', {
        title: response.data.title,
        byline: response.data.byline,
        length: response.data.content?.length || 0,
        excerpt: response.data.excerpt || response.data.content?.substring(0, 150) + '...',
        ...response.data
      })
    }
  } catch (error) {
    logger.error(`Failed to execute action:`, error)
  }
})

// 添加标签页关闭事件监听器
chrome.tabs.onRemoved.addListener((tabId) => {
  if (articleCache.has(tabId)) {
    logger.debug(`Cleaning up cache for closed tab ${tabId}`)
    articleCache.delete(tabId)
  }
})

// 添加消息监听器来接收来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.debug(`Received message from content script:`, message)
  if (message.type === 'PARSED_CONTENT') {
    logger.info('Received parsed content:', {
      title: message.data.title,
      byline: message.data.byline,
      length: message.data.content?.length || 0,
      excerpt: message.data.excerpt || message.data.content?.substring(0, 150) + '...',
      ...message.data
    })
  }
  return true // 保持消息通道开放
}) 