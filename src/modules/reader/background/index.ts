import { createLogger } from "~/shared/utils/logger"
import { IconManagerService } from "../services/icon-manager.service"
import { ContentScriptManagerService } from "../services/content-script-manager.service"
import { ArticleCacheService } from "../services/article-cache.service"
import { messageService } from '~/core/services/message.service'
import { llmConfigService } from '~/core/services/llm-config.service'
import type { Message } from '~/shared/types/message.types'

const logger = createLogger("background")
const iconManager = new IconManagerService()
const contentScriptManager = new ContentScriptManagerService()
const articleCache = new ArticleCacheService()

// 初始化所有功能
const initializeFeatures = async () => {
  try {
    // 初始化右键菜单
    if (chrome.contextMenus) {
      chrome.contextMenus.create({
        id: 'options',
        title: '选项',
        contexts: ['action']
      }, () => {
        const error = chrome.runtime.lastError
        if (error) {
          logger.error('创建右键菜单失败:', error)
        } else {
          logger.info('成功创建右键菜单')
        }
      })

      // 监听右键菜单点击事件
      chrome.contextMenus.onClicked.addListener((info) => {
        if (info.menuItemId === 'options') {
          chrome.runtime.openOptionsPage()
        }
      })
    } else {
      logger.warn('contextMenus API 不可用')
    }
  } catch (error) {
    logger.error('初始化功能时发生错误:', error)
  }
}

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
  initializeFeatures()
})

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
  } else if (message.type === 'OPEN_OPTIONS_PAGE') {
    // 处理打开选项页的消息
    try {
      chrome.tabs.create({
        url: chrome.runtime.getURL(`options.html${message.hash || ''}`)
      });
      sendResponse({ success: true });
    } catch (error) {
      logger.error('打开选项页失败:', error);
      sendResponse({ success: false, error });
    }
  } else if (message.type === 'CHECK_LLM_CONFIG') {
    handleCheckLLMConfig()
      .then(sendResponse)
      .catch(error => {
        logger.error('处理CHECK_LLM_CONFIG消息失败:', error)
        sendResponse({ type: 'CHECK_LLM_CONFIG', isConfigured: false })
      })
    return true // 表示会异步发送响应
  }
  return true
})

/**
 * 处理CHECK_LLM_CONFIG消息
 */
async function handleCheckLLMConfig(): Promise<Message> {
  logger.info('开始检查LLM配置')
  const result = await llmConfigService.checkConfig()
  return {
    type: 'CHECK_LLM_CONFIG_RESPONSE',
    ...result
  }
}

// 添加默认导出
export default {} 