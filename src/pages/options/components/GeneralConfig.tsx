import React, { useState, useCallback, useEffect } from 'react'
import { IndexedDBManager } from '../../../shared/utils/indexed-db'
import { createLogger } from '../../../shared/utils/logger'
import { MessageHandler } from '../../../shared/utils/message'
import { GENERAL_CONFIG_KEY, STORE_NAME } from '../../../shared/constants/storage'
import { useTheme } from '../../../shared/hooks/useTheme'
import { useI18n } from '../../../i18n/hooks/useI18n'
import { EThemeMode } from '../../../types/theme'
import { DARK_THEME, LIGHT_THEME } from '../../../shared/constants/theme'
import { i18nService } from '../../../modules/reader/services/i18n.service'

const logger = createLogger('general-config')
const messageHandler = MessageHandler.getInstance()

interface GeneralConfig {
  theme: 'light' | 'dark'
  autoSummary: boolean
  language: 'zh' | 'en'
}

export const GeneralConfig: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [autoSummary, setAutoSummary] = useState(false)
  const { theme, setTheme } = useTheme()
  const { t, changeLanguage, currentLanguage } = useI18n()
  const [selectedLanguage, setSelectedLanguage] = useState<'zh' | 'en'>('zh')

  // 加载非主题配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const indexedDB = IndexedDBManager.getInstance()
        await indexedDB.initialize()
        const savedConfig = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME) as GeneralConfig | undefined
        
        if (savedConfig) {
          setAutoSummary(savedConfig.autoSummary)
          setSelectedLanguage(savedConfig.language)
          await changeLanguage(savedConfig.language)
          logger.debug('已加载通用配置', savedConfig)
        } else {
          // 如果没有保存的配置，初始化默认配置
          const defaultConfig: GeneralConfig = {
            theme: theme.mode === EThemeMode.DARK ? 'dark' : 'light',
            autoSummary: false,
            language: 'zh'
          }
          
          // 保存默认配置
          await indexedDB.saveData(GENERAL_CONFIG_KEY, defaultConfig, STORE_NAME)
          // 设置默认语言
          await changeLanguage('zh')
          logger.debug('已初始化默认配置', defaultConfig)
        }
      } catch (error) {
        logger.error('加载通用配置失败:', error)
        // 即使出错也确保使用中文
        setSelectedLanguage('zh')
        void changeLanguage('zh')
      }
    }

    void loadConfig()
  }, [])

  // 保存非主题配置
  const handleSave = async () => {
    logger.debug('开始保存配置...')
    setIsSaving(true)
    try {
      const config: GeneralConfig = {
        theme: theme.mode === EThemeMode.DARK ? 'dark' : 'light',
        autoSummary,
        language: selectedLanguage as 'zh' | 'en'
      }
      logger.debug('准备保存的配置:', config)

      const indexedDB = IndexedDBManager.getInstance()
      logger.debug('获取 IndexedDB 实例')
      
      await indexedDB.initialize()
      logger.debug('IndexedDB 初始化完成')
      
      await indexedDB.saveData(GENERAL_CONFIG_KEY, config, STORE_NAME)
      logger.debug('数据已保存到 IndexedDB')

      // 切换语言
      await changeLanguage(selectedLanguage)

      messageHandler.success(t('messages.success'))
    } catch (error) {
      logger.error('保存通用配置失败:', error)
      messageHandler.error(t('messages.error'))
    } finally {
      setIsSaving(false)
      logger.debug('保存流程结束')
    }
  }

  // 处理主题切换
  const handleThemeChange = (newTheme: typeof LIGHT_THEME | typeof DARK_THEME) => {
    setTheme(newTheme)
    messageHandler.success(t('messages.success'))
  }

  // 改自动总结设置的保存逻辑
  const handleAutoSummaryChange = (value: boolean) => {
    setAutoSummary(value)
  }

  // 处理语言切换
  const handleLanguageChange = async (lang: 'zh' | 'en') => {
    try {
      setSelectedLanguage(lang)
      
      // 使用 i18nService 的公共方法处理语言切换
      await i18nService.changeLanguage(lang)
      
      // 保存语言设置到 IndexedDB
      const config: GeneralConfig = {
        theme: theme.mode === EThemeMode.DARK ? 'dark' : 'light',
        autoSummary,
        language: lang
      }
      
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()
      await indexedDB.saveData(GENERAL_CONFIG_KEY, config, STORE_NAME)
      
      logger.debug('语言设置已更新并保存:', lang)
    } catch (error) {
      logger.error('切换语言失败:', error)
      messageHandler.error(t('messages.error'))
    }
  }

  return (
    <div className="space-y-4 p-4">
      {/* 主题设置 - 添加 hidden 类隐藏元素 */}
      <div className="hidden space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings:general.theme.label')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleThemeChange(LIGHT_THEME)}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                theme.mode === EThemeMode.LIGHT
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-sm font-medium">{t('settings:general.theme.options.light')}</span>
            </button>
            <button
              onClick={() => handleThemeChange(DARK_THEME)}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                theme.mode === EThemeMode.DARK
                  ? 'border-blue-500 bg-gray-900 text-white dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white'
              }`}
            >
              <span className="text-sm font-medium">{t('settings:general.theme.options.dark')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 自动总结设置 - 减小与上方的间距 */}
      <div className="space-y-3">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings:general.autoSummary.label')}
          </h2>
          <div className="flex items-center justify-between px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('settings:general.autoSummary.description')}</span>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {autoSummary ? t('settings:general.autoSummary.on') : t('settings:general.autoSummary.off')}
              </span>
              <button
                onClick={() => handleAutoSummaryChange(!autoSummary)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                  autoSummary ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    autoSummary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 语言设置 - 减小与自动总结的间距 */}
      <div className="space-y-3 mt-2">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('settings:general.language.label')}
          </h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={selectedLanguage === 'zh'}
                onChange={() => handleLanguageChange('zh')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('settings:general.language.options.zh')}
              </span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={selectedLanguage === 'en'}
                onChange={() => handleLanguageChange('en')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t('settings:general.language.options.en')}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ���存按钮 - 整上边距 */}
      <div className="pt-3">
        <button
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
            ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
          disabled={isSaving}
          onClick={() => void handleSave()}
        >
          {isSaving ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t('messages.loading')}</span>
            </div>
          ) : t('actions.save')}
        </button>
      </div>
    </div>
  );
} 