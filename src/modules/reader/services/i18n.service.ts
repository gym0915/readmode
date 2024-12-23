import { createLogger } from '~/shared/utils/logger'
import i18n from '~/i18n/config'

const logger = createLogger('i18n-service')

class I18nService {
  private static instance: I18nService
  private currentLanguage: string = 'en'

  private constructor() {
    this.initialize()
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  private initialize(): void {
    // 监听语言变化消息
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'LANGUAGE_CHANGED' && message.data?.language) {
        logger.debug('收到语言切换消息:', message.data.language)
        this.updateLanguage(message.data.language)
      }
    })

    // 初始化时获取当前语言设置
    void this.loadCurrentLanguage()
  }

  private async loadCurrentLanguage(): Promise<void> {
    try {
      // 通过消息获取语言配置
      const response = await chrome.runtime.sendMessage({ 
        type: 'GET_GENERAL_CONFIG' 
      })
      
      if (response.error) {
        throw new Error(response.error)
      }

      const language = response.data?.language || 'en'
      logger.debug('从 background 加载语言设置:', language)
      await this.updateLanguage(language)
    } catch (error) {
      logger.error('加载语言设置失败:', error)
    }
  }

  private async updateLanguage(language: string): Promise<void> {
    try {
      this.currentLanguage = language
      await i18n.changeLanguage(language)
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