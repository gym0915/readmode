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
import { IndexedDBManager } from '~/shared/utils/indexed-db'
import '~/i18n/config'
import i18n from '~/i18n/config'

const logger = createLogger("background")
const iconManager = new IconManagerService()
const contentScriptManager = new ContentScriptManagerService()
const articleCache = new ArticleCacheService()

// 在文件顶部添加 port 管理
const portMap = new Map<string, chrome.runtime.Port>();

// 添加连接监听器
chrome.runtime.onConnect.addListener((port) => {
  logger.debug('收到新的端口连接:', port.name);
  portMap.set(port.name, port);
  
  port.onDisconnect.addListener(() => {
    logger.debug('端口断开连接:', port.name);
    portMap.delete(port.name);
    
    if (chrome.runtime.lastError) {
      logger.error('端口连接错误:', chrome.runtime.lastError);
    }
  });
});

// 添加配置管理相关常量
const GENERAL_CONFIG_KEY = "generalConfig"
const STORE_NAME = "generalConfig"

interface GeneralConfig {
  theme: 'light' | 'dark'
  autoSummary: boolean
  language: 'zh' | 'en'
}

// 从 IndexedDB 加载语言设置
const loadLanguageConfig = async () => {
  try {
    const indexedDB = IndexedDBManager.getInstance()
    await indexedDB.initialize()
    const config = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME) as GeneralConfig | undefined
    
    if (config && config.language) {
      await i18n.changeLanguage(config.language)
      logger.debug('已加载语言配置:', config.language)
    }
  } catch (error) {
    logger.error('加载语言配置失败:', error)
  }
}

// 初始化所有功能
const initializeFeatures = async () => {
  try {
    // 初始化语言配置
    await loadLanguageConfig()

    // 初始化右键菜单
    if (chrome.contextMenus) {
      chrome.contextMenus.create({
        id: 'options',
        title: i18n.t('settings:title'),
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

// 标签激活事件监听器
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
    logger.debug('打开选项页面，目标页签:', message.data?.tab);
    // 使用 hash 参数来指定页签
    chrome.tabs.create({
      url: chrome.runtime.getURL('options.html') + '#model'
    });
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
  } else if (message.type === 'GET_GENERAL_CONFIG') {
    handleGetGeneralConfig()
      .then(config => {
        sendResponse({ data: config, error: null })
      })
      .catch(error => {
        logger.error('处理GET_GENERAL_CONFIG消息失败:', error)
        sendResponse({ data: null, error: String(error) })
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
  logger.info('LLM配置检查结果:', result)
  return {
    type: 'CHECK_LLM_CONFIG_RESPONSE',
    ...result
  }
}

/**
 * 处理对话请求
 */
async function handleChatRequest(message: ChatRequestMessage): Promise<ChatResponseMessage> {
  logger.info('开始处理对话请求', {
    type: message.data.type,
    contentLength: message.data.content?.length
  })
  
  try {
    // 1. 验证LLM配置
    const { isConfigured, config } = await llmConfigService.checkConfig()
    if (!isConfigured || !config) {
      throw new Error('请先完成模型配置')
    }

    // 2. 获取所有配置
    const allConfig = await llmConfigService.getAllConfig()
    logger.info('获取到的配置:', allConfig)

    // 3. 根据请求类型处理消息
    const processedMessages = await prepareMessages(message, allConfig)

    // 4. 创建LLM服务实例
    const llmService = new LLMService({
      apiKey: allConfig.apiKey,
      baseUrl: allConfig.baseUrl,
      model: allConfig.selectedModel,
      language: allConfig.language,
      streaming: allConfig.streaming,
      provider: allConfig.provider
    })

    // 打印请求参数（排除敏感信息）
    logRequestParameters(allConfig, config, processedMessages)

    // 获取端口连接
    const port = message.data.portName ? portMap.get(message.data.portName) : null;
    if (!port) {
      logger.error('Port not found:', {
        portName: message.data.portName,
        availablePorts: Array.from(portMap.keys())
      });
      throw new Error('Port not found');
    }

    let isPortConnected = true;
    port.onDisconnect.addListener(() => {
      isPortConnected = false;
      logger.debug('Port disconnected');
      portMap.delete(message.data.portName!);
    });

    // 5. 根据streaming配置选择对话方式
    if (allConfig.streaming) {
      try {
        await llmService.streamChat(
          processedMessages,
          (chunk) => {
            if (isPortConnected) {
              try {
                port.postMessage({
                  type: 'STREAM_CHUNK',
                  data: {
                    content: chunk.content,
                    role: chunk.role
                  }
                });
                logger.debug('成功发送流式数据块', {
                  contentPreview: chunk.content.substring(0, 50),
                  role: chunk.role
                });
              } catch (error) {
                logger.error('发送流式数据块失败:', error);
                isPortConnected = false;
                portMap.delete(message.data.portName!);
              }
            }
          },
          (error) => {
            if (isPortConnected) {
              port.postMessage({
                type: 'STREAM_ERROR',
                error: error.message
              });
            }
          },
          () => {
            if (isPortConnected) {
              port.postMessage({ type: 'STREAM_DONE' });
            }
          }
        );

        return {
          type: 'CHAT_RESPONSE',
          data: { type: 'STREAM_START' },
          error: null
        };
      } catch (error) {
        if (isPortConnected) {
          port.postMessage({
            type: 'STREAM_ERROR',
            error: error instanceof Error ? error.message : String(error)
          });
        }
        throw error;
      }
    } else {
      // 使用普通对话
      try {
        const responseData = await llmService.chat(processedMessages);
        logger.debug('普通对话响应:', responseData)
        // 过 port 发送响应
        if (isPortConnected) {
          port.postMessage({
            type: 'CHAT_RESPONSE',
            data: responseData,
            error: null
          });
          
          // 发送完成信号
          port.postMessage({ type: 'STREAM_DONE' });
        }

        return {
          type: 'CHAT_RESPONSE',
          data: responseData,
          error: null
        };
      } catch (error) {
        if (isPortConnected) {
          port.postMessage({
            type: 'STREAM_ERROR',
            error: error instanceof Error ? error.message : String(error)
          });
        }
        throw error;
      }
    }
  } catch (error) {
    logger.error('对话请求处理失败:', {
      error,
      type: message.data.type,
      errorType: error instanceof Error ? error.name : 'Unknown'
    });
    throw error;
  }
}

/**
 * 准备对话消息
 */
async function prepareMessages(message: ChatRequestMessage, config: any) {
  if (message.data.type === 'SUMMARY') {
    const language = config.language === 'zh' ? '中文' : '英文'
    return [
      {
        role: 'system',
        content: `你是一个专业的文章总结助手。你的任务是:
1. 提取文章的核心信息,包括:
   - 主要事件和人物
   - 关时间和地点
   - 事件的起因、经过和结果
   - 重要影响和意义
2. 生成一个结构清晰的总结:
   - 标题: 一句话概括文章主题
   - 摘要: 2-3句话简述文章要点
   - 结论: 总结文章的核心观点或启示
   - 详细内容: 分点列出重要信息
3. 总结要求:
   - 保持客观准确
   - 语言简洁清晰
   - 突出重点信息
   - 保留原文的关键数据和引用
   - 总字数控制在500字左右
4. 格式要求
   - 使用 Markdown 格式
   - 标题使用 ###
   - 小标题使用***
   - 列表使用-
   - 重要内容使用加粗或斜体
   - 关键数据使用引用格式`
      },
      {
        role: 'user',
        content: `请使用${language}总结以下文章:\n\n标题: ${message.data.title}\n\n正文:\n${message.data.content}`
      }
    ]
  } else {
    // 普通对话请求
    return message.data.messages || []
  }
}

/**
 * 记录请求参数
 */
function logRequestParameters(allConfig: any, config: any, messages: any[]) {
  logger.debug('LLM请求参数:', {
    apiKey: `${allConfig.apiKey.substring(0, 4)}...${allConfig.apiKey.slice(-4)}`,
    baseUrl: allConfig.baseUrl,
    model: config.selectedModel,
    streaming: allConfig.streaming,
    messagesCount: messages.length,
    firstMessageRole: messages[0]?.role,
    firstMessagePreview: messages[0]?.content.substring(0, 50) + '...'
  })
}

/**
 * 处理获取LLM配置请求
 */
async function handleGetLLMConfig(): Promise<GetLLMConfigResponse> {
  try {
    const { config } = await llmConfigService.checkConfig()
    if (!config) {
      throw new Error('找到LLM配置')
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

/**
 * 处理获取通用配置的请求
 */
async function handleGetGeneralConfig() {
  try {
    const indexedDB = IndexedDBManager.getInstance()
    await indexedDB.initialize()
    const config = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME)
    return config
  } catch (error) {
    logger.error('获取通用配置失败:', error)
    throw error
  }
}

// 添加默认导出
export default {} 