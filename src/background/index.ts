import { icons } from "~/assets/icons"
import { createLogger } from "~/utils/logger"

const logger = createLogger("background")

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

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    logger.debug(`Tab ${tabId} is loading, setting icon to disabled`)
    setIconDisabled(tabId)
  } else if (changeInfo.status === "complete") {
    logger.debug(`Tab ${tabId} completed loading, setting icon to enabled`)
    setIconEnabled(tabId)
  }
})

// 监听标签页激活事件，确保切换标签时图标状态正确
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === "complete") {
    setIconEnabled(tabId)
  } else {
    setIconDisabled(tabId)
  }
})

// 添加图标点击事件监听
chrome.action.onClicked.addListener(async (tab) => {
  logger.info(`Icon clicked on tab ${tab.id}`)
  
  if (!tab.id) {
    logger.error("No tab id found")
    return
  }

  try {
    logger.debug(`Checking if content script is injected in tab ${tab.id}`)
    // 先检查 content script 是否已注入
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        console.log("Content script check executed")
        return true
      }
    })
    logger.debug(`Content script check passed for tab ${tab.id}`)

    // 然后发送消息
    logger.debug(`Sending PARSE_CONTENT message to tab ${tab.id}`)
    const response = await chrome.tabs.sendMessage(tab.id, { type: "PARSE_CONTENT" })
    
    if (response.error) {
      logger.error(`Error from content script: ${response.error}`)
    } else {
      logger.info(`Successfully parsed content for tab ${tab.id}`)
      logger.info('Parsed article content:', {
        title: response.title,
        byline: response.byline,
        length: response.content?.length || 0,
        excerpt: response.excerpt || response.content?.substring(0, 150) + '...',
        ...response
      })
    }
  } catch (error) {
    logger.error(`Failed to execute action:`, error)
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