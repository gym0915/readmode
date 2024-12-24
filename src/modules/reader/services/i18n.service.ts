import { createLogger } from '~/shared/utils/logger'
import i18n from '~/i18n/config'
import { IndexedDBManager } from '~/shared/utils/indexed-db'
import { GENERAL_CONFIG_KEY, STORE_NAME } from '~/shared/constants/storage'

// 添加 GeneralConfig 接口定义
interface GeneralConfig {
  theme: 'light' | 'dark'
  autoSummary: boolean
  language: 'zh' | 'en'
}

const logger = createLogger('i18n-service')

class I18nService {
  private static instance: I18nService
  private currentLanguage: string = 'zh'

  private constructor() {
    this.initialize()
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  private async initialize(): Promise<void> {
    try {
      // 1. 首先尝试从 IndexedDB 加载配置
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()
      const config = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME) as GeneralConfig | undefined
      
      // 2. 如果有保存的配置，使用保存的语言
      if (config?.language) {
        await this.updateLanguage(config.language)
      } else {
        // 3. 如果没有配置，创建默认配置并保存
        const defaultConfig: GeneralConfig = {
          theme: 'light',
          autoSummary: false,
          language: 'zh'
        }
        await indexedDB.saveData(GENERAL_CONFIG_KEY, defaultConfig, STORE_NAME)
        await this.updateLanguage('zh')
      }

      // 4. 监听语言变化消息
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'LANGUAGE_CHANGED' && message.data?.language) {
          logger.debug('收到语言切换消息:', message.data.language)
          void this.updateLanguage(message.data.language)
        }
      })

    } catch (error) {
      logger.error('初始化 i18n 服务失败:', error)
      // 出错时也确保使用中文
      await this.updateLanguage('zh')
    }
  }

  private async updateLanguage(language: string): Promise<void> {
    try {
      this.currentLanguage = language
      await i18n.changeLanguage(language)
      
      // 广播语言变化消息到所有组件
      chrome.runtime.sendMessage({
        type: 'LANGUAGE_CHANGED',
        data: { language }
      }).catch(error => {
        logger.error('发送语言变化消息失败:', error)
      })
      
      logger.debug('语言更新成功:', language)
    } catch (error) {
      logger.error('更新语言失败:', error)
    }
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage
  }
}

// 导出单例实例
export const i18nService = I18nService.getInstance() 