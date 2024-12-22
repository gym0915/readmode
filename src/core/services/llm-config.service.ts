import { createLogger } from '~/shared/utils/logger'
import { IndexedDBManager } from '~/shared/utils/indexed-db'
import { CryptoManager } from '~/shared/utils/crypto-manager'

const logger = createLogger('llm-config-service')

const STORAGE_KEY = 'llmConfig'

export interface LLMConfig {
  baseUrl?: string
  apiKey?: string
  selectedModel?: string
}

/**
 * LLM配置服务类
 * @class LLMConfigService
 * @description 管理LLM配置的存储和检索
 */
export class LLMConfigService {
  private indexedDB: IndexedDBManager

  constructor() {
    this.indexedDB = IndexedDBManager.getInstance()
  }
  


  /**
   * 检查LLM配置是否完整
   * @returns {Promise<{isConfigured: boolean, config?: LLMConfig}>}
   */
  async checkConfig(): Promise<{ isConfigured: boolean; config?: LLMConfig }> {
    try {
      // 1. 检查chrome.storage.local中的配置
      const result = await chrome.storage.local.get(STORAGE_KEY)
      logger.info('检查LLM配置:', result)
      const storageConfig = result[STORAGE_KEY] || {}

      // 2. 检查IndexedDB中的模型配置
      await this.indexedDB.initialize()
      const modelData = await this.indexedDB.getData('modelData')

      // 3. 合并配置
      const config = {
        ...storageConfig,
        selectedModel: modelData?.selectedModel,
        provider: modelData?.provider || 'openai'
      }

      // 4. 验证配置是否完整
      const isConfigured = !!(
        config.baseUrl &&
        config.apiKey &&
        config.selectedModel &&
        config.provider
      )

      return {
        isConfigured,
        config: isConfigured ? config : undefined
      }
    } catch (error) {
      logger.error('检查LLM配置失败:', error)
      return { isConfigured: false }
    }
  }

  /**
   * 保存基础配置（baseUrl和apiKey）
   * @param {Partial<LLMConfig>} config 
   */
  async saveBasicConfig(config: Pick<LLMConfig, 'baseUrl' | 'apiKey'>): Promise<void> {
    try {
      await chrome.storage.local.set({
        [STORAGE_KEY]: config
      })
      logger.info('LLM基础配置保存成功')
    } catch (error) {
      logger.error('保存LLM基础配置失败:', error)
      throw error
    }
  }

  /**
   * 获取完整的LLM配置信息
   * @returns {Promise<{
   *   baseUrl?: string
   *   apiKey?: string
   *   selectedModel?: string
   *   modelList?: Array<IModelInfo>
   *   streaming?: boolean
   *   language?: 'zh' | 'en'
   * }>}
   */
  async getAllConfig() {
    try {
      // 1. 初始化IndexedDB
      await this.indexedDB.initialize()
      
      // 2. 获取模型数据
      const modelData = await this.indexedDB.getData('modelData')
      logger.debug('从IndexedDB获取的模型数据:', {
        hasModelData: !!modelData,
        selectedModel: modelData?.selectedModel,
        modelCount: modelData?.modelList?.length
      })

      // 3. 获取加密的基础配置
      const result = await chrome.storage.local.get(STORAGE_KEY)
      const encryptedConfig = result[STORAGE_KEY] || {}
      
      // 4. 解密配置
      let decryptedBaseUrl: string | undefined
      let decryptedApiKey: string | undefined
      
      if (encryptedConfig.baseUrl || encryptedConfig.apiKey) {
        const cryptoManager = CryptoManager.getInstance()
        await cryptoManager.initialize()
        
        if (encryptedConfig.baseUrl) {
          decryptedBaseUrl = await cryptoManager.decrypt(encryptedConfig.baseUrl)
        }
        if (encryptedConfig.apiKey) {
          decryptedApiKey = await cryptoManager.decrypt(encryptedConfig.apiKey)
        }
      }

      // 5. 合并所有配置
      const fullConfig = {
        baseUrl: decryptedBaseUrl,
        apiKey: decryptedApiKey,
        selectedModel: modelData?.selectedModel,
        modelList: modelData?.modelList || [],
        streaming: modelData?.streaming || false,
        language: modelData?.language || 'zh',
        provider: modelData?.provider || 'openai'
      }

      logger.info('获取完整LLM配置成功', {
        hasBaseUrl: !!fullConfig.baseUrl,
        hasApiKey: !!fullConfig.apiKey,
        selectedModel: fullConfig.selectedModel,
        modelCount: fullConfig.modelList.length,
        streaming: fullConfig.streaming,
        language: fullConfig.language,
        provider: fullConfig.provider
      })

      return fullConfig
    } catch (error) {
      logger.error('获取LLM完整配置失败:', error)
      throw error
    }
  }
}

/**
 * LLM配置服务单例
 */
export const llmConfigService = new LLMConfigService() 