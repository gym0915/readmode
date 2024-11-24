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

// 创建和管理阅读模式 iframe
const createReaderFrame = () => {
  const frame = document.createElement('iframe')
  frame.id = 'readmode-frame'
  frame.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    background: #F8F9FA;
    z-index: 2147483647;
    opacity: 0;
    transition: opacity 0.3s ease;
  `
  return frame
}

// 处理阅读模式切换
const handleReaderMode = (article: any) => {
  const existingFrame = document.getElementById('readmode-frame')
  
  if (existingFrame) {
    // 关闭阅读模式
    existingFrame.style.opacity = '0'
    setTimeout(() => existingFrame.remove(), 300)
    return false
  } else {
    // 开启阅读模式
    const frame = createReaderFrame()
    document.body.appendChild(frame)
    // 等待 DOM 插入后设置透明度以触发过渡动画
    requestAnimationFrame(() => {
      frame.style.opacity = '1'
    })
    return true
  }
}

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

      // 处理阅读模式并获���新状态
      const isReaderMode = handleReaderMode(article)

      // 打印解析结果
      logger.info('Parsed article:', {
        title: article.title,
        content: article.content,
        textContent: article.textContent,
        length: article.textContent?.length,
        excerpt: article.excerpt,
        byline: article.byline,
        dir: article.dir,
        siteName: article.siteName,
        isReaderMode
      })

      sendResponse({ 
        data: { ...article, isReaderMode },
        error: null 
      })
    } catch (error) {
      logger.error("Error parsing content:", error)
      sendResponse({ 
        data: null,
        error: error.message 
      })
    }
  } else if (message.type === "TOGGLE_READER_MODE") {
    // 处理缓存的文章内容
    const isReaderMode = handleReaderMode(message.article)
    sendResponse({ 
      data: { ...message.article, isReaderMode },
      error: null 
    })
  }
  return true // 保持消息通道开启
})

logger.debug("Content script loaded") 