import { createLogger } from '~/shared/utils/logger'
import { IndexedDBManager } from '~/shared/utils/indexed-db'

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
        selectedModel: modelData?.selectedModel
      }

      // 4. 验证配置是否完整
      const isConfigured = !!(
        config.baseUrl &&
        config.apiKey &&
        config.selectedModel
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
}

/**
 * LLM配置服务单例
 */
export const llmConfigService = new LLMConfigService() 