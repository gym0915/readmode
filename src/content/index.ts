import { createLogger } from "~/utils/logger"

const logger = createLogger("content")

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PARSE_CONTENT") {
    logger.debug("Received parse content message")
    try {
      // TODO: 实现文章解析逻辑
      sendResponse({ data: "Content parsed" })
    } catch (error) {
      logger.error("Error parsing content:", error)
      sendResponse({ error: error.message })
    }
  }
  return true // 保持消息通道开启
})

logger.debug("Content script loaded") 