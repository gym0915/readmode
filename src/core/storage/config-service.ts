import { createLogger } from '~/shared/utils/logger'

const logger = createLogger('config-service')

/**
 * 阅读器配置接口
 * @interface ReaderConfig
 */
export interface ReaderConfig {
  fontSize: number
  fontFamily: string
  lineHeight: number
  maxWidth: number
  theme: 'light' | 'dark' | 'sepia'
  customCSS?: string
}

/**
 * 配置服务类
 * @class ConfigService
 * @description 管理阅读器配置的存储和检索
 */
export class ConfigService {
  private static readonly STORAGE_KEY = 'reader_config'
  
  private defaultConfig: ReaderConfig = {
    fontSize: 18,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: 1.6,
    maxWidth: 680,
    theme: 'light'
  }

  /**
   * 获取配置
   * @returns {Promise<ReaderConfig>} 当前配置
   */
  async getConfig(): Promise<ReaderConfig> {
    try {
      const result = await chrome.storage.sync.get(ConfigService.STORAGE_KEY)
      return { ...this.defaultConfig, ...result[ConfigService.STORAGE_KEY] }
    } catch (error) {
      logger.error('Failed to get config:', error)
      return this.defaultConfig
    }
  }

  /**
   * 保存配置
   * @param {Partial<ReaderConfig>} config - 要保存的配置
   * @throws {Error} 保存失败时抛出错误
   */
  async saveConfig(config: Partial<ReaderConfig>): Promise<void> {
    try {
      const currentConfig = await this.getConfig()
      const newConfig = { ...currentConfig, ...config }
      await chrome.storage.sync.set({
        [ConfigService.STORAGE_KEY]: newConfig
      })
      logger.info('Config saved successfully')
    } catch (error) {
      logger.error('Failed to save config:', error)
      throw error
    }
  }

  /**
   * 重置配置
   * @throws {Error} 重置失败时抛出错误
   */
  async resetConfig(): Promise<void> {
    try {
      await chrome.storage.sync.remove(ConfigService.STORAGE_KEY)
      logger.info('Config reset to defaults')
    } catch (error) {
      logger.error('Failed to reset config:', error)
      throw error
    }
  }
}

/**
 * 配置服务单例
 * @type {ConfigService}
 */
export const configService = new ConfigService() 