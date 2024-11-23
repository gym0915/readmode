import { Readability } from "@mozilla/readability"
import { createLogger } from "~/utils/logger"

const logger = createLogger("content")

// 初始化时输出日志，用于确认 content script 已加载
logger.info("Content script initialized")

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.debug("Received message:", message)
  
  if (message.type === "PARSE_CONTENT") {
    try {
      const documentClone = document.cloneNode(true) as Document
      const reader = new Readability(documentClone)
      const article = reader.parse()
      logger.info("Parsed article:", article)

      if (!article) {
        logger.error("Failed to parse content")
        sendResponse({ error: "Failed to parse content" })
        return
      }

      // 添加发布时间
      const publishedTime = extractPublishTime()
      const result = {
        ...article,
        publishedTime
      }

      logger.debug("Content parsed successfully:", result)
      sendResponse({ data: result })
    } catch (error) {
      logger.error("Error parsing content:", error)
      sendResponse({ error: String(error) })
    }
  }
  return true // 保持消息通道开放
})

// 提取发布时间
function extractPublishTime(): string | null {
  try {
    const metaSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="article:published_time"]',
      'meta[name="publication-date"]',
      'meta[name="publish-date"]',
      'time[datetime]',
      'time[pubdate]'
    ]

    for (const selector of metaSelectors) {
      const element = document.querySelector(selector)
      if (element) {
        if (element instanceof HTMLTimeElement) {
          return element.dateTime
        }
        const content = element.getAttribute('content')
        if (content) {
          return content
        }
      }
    }

    return null
  } catch (error) {
    logger.error("Error extracting publish time:", error)
    return null
  }
} 