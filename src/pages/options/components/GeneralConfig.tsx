import React, { useState, useEffect, useCallback } from "react"
import { createLogger, ELogLevel } from "~/shared/utils/logger"
import { IndexedDBManager } from "~/shared/utils/indexed-db"
import { MessageHandler } from "~/shared/utils/message"

const logger = createLogger("GeneralConfig", ELogLevel.DEBUG)
const messageHandler = MessageHandler.getInstance()
const GENERAL_CONFIG_KEY = "generalConfig"
const STORE_NAME = "generalConfig"

interface GeneralConfig {
  theme: 'light' | 'dark'
  autoSummary: boolean
  language: 'zh' | 'en'
}

export const GeneralConfig: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false)
  const [autoSummary, setAutoSummary] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>('light')
  const [selectedLanguage, setSelectedLanguage] = useState('zh')

  // 加载保存的配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const indexedDB = IndexedDBManager.getInstance()
        await indexedDB.initialize()
        const savedConfig = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME) as GeneralConfig | undefined
        
        if (savedConfig) {
          setSelectedTheme(savedConfig.theme)
          setAutoSummary(savedConfig.autoSummary)
          setSelectedLanguage(savedConfig.language)
          logger.debug('已加载通用配置', savedConfig)
        }
      } catch (error) {
        logger.error('加载通用配置失败:', error)
      }
    }

    void loadConfig()
  }, [])

  // 保存配置
  const handleSave = async () => {
    logger.debug('开始保存配置...')
    setIsSaving(true)
    try {
      const config: GeneralConfig = {
        theme: selectedTheme,
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

      messageHandler.success('设置已保存')
    } catch (error) {
      logger.error('保存通用配置失败:', error)
      messageHandler.error('保存失败')
    } finally {
      setIsSaving(false)
      logger.debug('保存流程结束')
    }
  }

  // 修改自动总结设置的保存逻辑
  const handleAutoSummaryChange = useCallback(async (enabled: boolean) => {
    try {
      setAutoSummary(enabled)
      const config: GeneralConfig = {
        theme: selectedTheme,
        autoSummary: enabled,
        language: selectedLanguage as 'zh' | 'en'
      }
      
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()
      await indexedDB.saveData(GENERAL_CONFIG_KEY, config, STORE_NAME)
      
      logger.debug('自动总结设置已保存', config)
      messageHandler.success('设置已保存')
    } catch (error) {
      logger.error('保存自动总结设置失败:', error)
      messageHandler.error('保存失败')
    }
  }, [selectedTheme, selectedLanguage])

  return (
    <div className="p-8 space-y-6">
      {/* 主题设置 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            主题设置
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedTheme('light')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                selectedTheme === 'light'
                  ? 'border-blue-500 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-sm font-medium">日间模式</span>
            </button>
            <button
              onClick={() => setSelectedTheme('dark')}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
                selectedTheme === 'dark'
                  ? 'border-blue-500 bg-gray-900 text-white'
                  : 'border-gray-200 bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              <span className="text-sm font-medium">夜间模式</span>
            </button>
          </div>
        </div>
      </div>

      {/* 自动总结设置 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          自动总结
        </label>
        <div className="flex items-center justify-between px-4 py-2 border border-gray-200 rounded-lg">
          <span className="text-sm text-gray-700">自动总结文章内容</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{autoSummary ? '开启' : '关闭'}</span>
            <button
              onClick={() => handleAutoSummaryChange(!autoSummary)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                autoSummary ? 'bg-blue-600' : 'bg-gray-200'
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

      {/* 语言设置 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          语言设置
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={selectedLanguage === 'zh'}
              onChange={() => setSelectedLanguage('zh')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">中文</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="radio"
              checked={selectedLanguage === 'en'}
              onChange={() => setSelectedLanguage('en')}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">English</span>
          </label>
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="pt-4">
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
              <span>保存中...</span>
            </div>
          ) : '保存'}
        </button>
      </div>
    </div>
  )
} 