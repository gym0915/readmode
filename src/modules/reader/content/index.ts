/**
 * 阅读模式内容脚本入口
 * @module ReaderContentScript
 */

import { ReaderContentService } from '../services/reader-content.service'
import { createLogger } from '~/shared/utils/logger'

const logger = createLogger('content')
const readerContent = new ReaderContentService()

// 设置全局标记
declare global {
  interface Window {
    __READMODE_CONTENT_LOADED__: boolean
  }
}

window.__READMODE_CONTENT_LOADED__ = true

// 初始化内容脚本
const initContentScript = async () => {
  try {
    await readerContent.initialize()
    logger.debug('Content script loaded')
  } catch (error) {
    logger.error('Failed to initialize content script:', error)
  }
}

initContentScript() 