import { createLogger } from "~/utils/logger"
import { Readability } from '@mozilla/readability'

const logger = createLogger("content")

// 添加全局标记
declare global {
  interface Window {
    __READMODE_CONTENT_LOADED__: boolean
  }
}

// 设置全局标记表示脚本已加载
window.__READMODE_CONTENT_LOADED__ = true

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PARSE_CONTENT") {
    logger.debug("Received parse content message")
    try {
      // 克隆当前文档以避免修改原始 DOM
      const documentClone = document.cloneNode(true) as Document
      const reader = new Readability(documentClone)
      const article = reader.parse()
      
      if (!article) {
        throw new Error("Failed to parse article content")
      }

      // 打印完整的解析结果
      logger.info('Parsed article:', {
        title: article.title,           // 文章标题
        content: article.content,       // 文章正文 HTML
        textContent: article.textContent, // 文章纯文本内容
        length: article.textContent?.length,
        excerpt: article.excerpt,       // 文章摘要
        byline: article.byline,         // 作者信息
        dir: article.dir,               // 文字方向
        siteName: article.siteName      // 网站名称
      })

      sendResponse({ 
        data: article,
        error: null 
      })
    } catch (error) {
      logger.error("Error parsing content:", error)
      sendResponse({ 
        data: null,
        error: error.message 
      })
    }
  }
  return true // 保持消息通道开启
})

logger.debug("Content script loaded") 