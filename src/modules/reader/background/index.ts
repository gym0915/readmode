import { createLogger } from "~/shared/utils/logger"
import { IconManagerService } from "../services/icon-manager.service"
import { ContentScriptManagerService } from "../services/content-script-manager.service"
import { ArticleCacheService } from "../services/article-cache.service"
import { messageService } from '~/core/services/message.service'
import { llmConfigService } from '~/core/services/llm-config.service'
import type { Message, ChatRequestMessage, GetLLMConfigResponse, ChatResponseMessage } from '~/shared/types/message.types'
import { LLMService } from '~/modules/llm'
import { decryptText } from '~/shared/utils/crypto'
import { CryptoManager } from "~/shared/utils/crypto-manager"

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
  } else if (message.type === 'CHAT_REQUEST') {
    handleChatRequest(message)
      .then(sendResponse)
      .catch(error => {
        logger.error('处理CHAT_REQUEST消息失败:', error)
        sendResponse({ 
          type: 'CHAT_RESPONSE', 
          error: error instanceof Error ? error.message : '对话请求失败' 
        })
      })
    return true // 表示会异步发送响应
  } else if (message.type === 'GET_LLM_CONFIG') {
    handleGetLLMConfig()
      .then(sendResponse)
      .catch(error => {
        logger.error('处理GET_LLM_CONFIG消息失败:', error)
        sendResponse({ 
          type: 'GET_LLM_CONFIG_RESPONSE',
          error: error instanceof Error ? error.message : '获取配置失败'
        })
      })
    return true
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

/**
 * 处理对话请求
 */
async function handleChatRequest(message: ChatRequestMessage): Promise<ChatResponseMessage> {
  logger.info('开始处理对话请求')
  
  try {
    // 1. 验证LLM配置
    const { isConfigured, config } = await llmConfigService.checkConfig()
    if (!isConfigured || !config) {
      throw new Error('LLM配置未完成')
    }

     // 2. 获取并解密配置
     const configResponse = await messageService.sendToBackground({
      type: 'GET_LLM_CONFIG'
    }) as GetLLMConfigResponse

    if (configResponse.error || !configResponse.data) {
      throw new Error('获取配置失败')
    }

    const { apiKey: encryptedApiKey, baseUrl: encryptedBaseUrl } = configResponse.data
    
    // 解密配置
    // 初始化加密管理器并解密数据
    const cryptoManager = CryptoManager.getInstance()
    await cryptoManager.initialize()
    
    const apiKey = encryptedApiKey ? await cryptoManager.decrypt(encryptedApiKey) : ''
    const baseUrl = encryptedBaseUrl ? await cryptoManager.decrypt(encryptedBaseUrl) : ''

    if (!apiKey || !baseUrl) {
      throw new Error('配置解密失败')
    }

    logger.info('解密后的配置:', { apiKey, baseUrl })

    // 打印解密前的配置
    logger.debug('解密前的配置:', {
      apiKey: apiKey,
      baseUrl: baseUrl,
      model: config.selectedModel
    })

    // 2. 使用传入的解密后的配置创建LLM服务实例
    const llmService = new LLMService({
      apiKey: apiKey,
      baseUrl: baseUrl,
      model: config.selectedModel,
      streaming: true
    })

    // 打印完整的请求参数
    logger.debug('LLM请求参数:', {
      apiKey: `${message.config.apiKey.substring(0, 4)}...${message.config.apiKey.slice(-4)}`, // 部分隐藏
      baseUrl: message.config.baseUrl,
      model: config.selectedModel,
      streaming: true,
      messagesCount: message.messages.length,
      firstMessageRole: message.messages[0]?.role,
      firstMessagePreview: message.messages[0]?.content.substring(0, 50) + '...'
    })

    // 3. 发送对话请求
    const response = await llmService.chat(message.messages)

    return {
      type: 'CHAT_RESPONSE',
      data: response
    }
  } catch (error) {
    logger.error('对话请求失败:', error)
    // 添加更详细的错误信息
    if (error instanceof Error) {
      logger.error('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

/**
 * 处理获取LLM配置请求
 */
async function handleGetLLMConfig(): Promise<GetLLMConfigResponse> {
  try {
    const { config } = await llmConfigService.checkConfig()
    if (!config) {
      throw new Error('未找到LLM配置')
    }

    // 打印配置信息
    logger.debug('获取到的LLM配置:', {
      hasApiKey: !!config.apiKey,
      hasBaseUrl: !!config.baseUrl,
      apiKeyPreview: config.apiKey ? `${config.apiKey.substring(0, 4)}...${config.apiKey.slice(-4)}` : 'undefined',
      baseUrl: config.baseUrl
    })

    return {
      type: 'GET_LLM_CONFIG_RESPONSE',
      data: {
        apiKey: config.apiKey,
        baseUrl: config.baseUrl
      }
    }
  } catch (error) {
    logger.error('获取LLM配置失败:', error)
    throw error
  }
}

// 添加默认导出
export default {} 