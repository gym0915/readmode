import React, { useState, useEffect } from "react"
import type { IModelInfo } from "~/modules/llm/types"
import { createLogger } from "~/shared/utils/logger"
import { MessageHandler } from "~/shared/utils/message"
import { LLMService } from "~/modules/llm"
import { CryptoManager } from "~/shared/utils/crypto-manager"
import { IndexedDBManager } from "~/shared/utils/indexed-db"
import { LLMProviderFactory } from "~/modules/llm/providers/provider.factory"
import type { LLMProviderType } from "~/modules/llm/types/provider"

// 常量定义
const MODEL_DATA_KEY = "modelData"
const STORAGE_CONFIG_KEY = "llmConfig"

interface ILLMConfigState {
  provider: LLMProviderType
  apiKey: string
  baseUrl: string
  model?: string
}

interface IModelData {
  selectedModel: string
  modelList: IModelInfo[]
  language: 'zh' | 'en'
  provider: LLMProviderType
}

// 创建日志记录器和消息处理器
const logger = createLogger('LLMConfig')
const messageHandler = MessageHandler.getInstance()
const providerFactory = LLMProviderFactory.getInstance()

export const LLMConfig: React.FC = () => {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [models, setModels] = useState<IModelInfo[]>([])
  const [showApiKey, setShowApiKey] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<'zh' | 'en'>('zh')
  const [selectedProvider, setSelectedProvider] = useState<LLMProviderType>('openai')

  /**
   * 加载已保存的配置
   */
  const loadSavedConfig = async () => {
    logger.debug('开始加载已保存配置')
    try {
      // 初始化 IndexedDB
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()

      // 加载模型数据
      const modelData = await indexedDB.getData(MODEL_DATA_KEY) as IModelData | undefined
      if (modelData) {
        setModels(modelData.modelList)
        setSelectedModel(modelData.selectedModel)
        setSelectedLanguage(modelData.language ?? 'zh')
        setSelectedProvider(modelData.provider ?? 'openai')
        logger.debug('已从 IndexedDB 加载模型数据', { 
          modelCount: modelData.modelList.length,
          selectedModel: modelData.selectedModel,
          language: modelData.language,
          provider: modelData.provider
        })
      }

      // 加载加密的配置数据
      const result = await chrome.storage.local.get(STORAGE_CONFIG_KEY)
      if (result[STORAGE_CONFIG_KEY]) {
        const { 
          apiKey: encryptedApiKey, 
          baseUrl: encryptedBaseUrl,
          provider = 'openai'
        } = result[STORAGE_CONFIG_KEY]
        
        // 初始化加密管理器并解密数据
        const cryptoManager = CryptoManager.getInstance()
        await cryptoManager.initialize()
        
        const savedApiKey = encryptedApiKey ? await cryptoManager.decrypt(encryptedApiKey) : ''
        const savedBaseUrl = encryptedBaseUrl ? await cryptoManager.decrypt(encryptedBaseUrl) : ''
        
        setApiKey(savedApiKey)
        setBaseUrl(savedBaseUrl)
        setSelectedProvider(provider)
        logger.debug('已加载加密配置', {
          hasApiKey: !!savedApiKey,
          hasBaseUrl: !!savedBaseUrl,
          provider
        })
      }
    } catch (err) {
      messageHandler.handleError(err, '加载配置失败')
    }
  }

  /**
   * 组件挂载时加载配置
   */
  useEffect(() => {
    void loadSavedConfig()
  }, [])

  /**
   * 当切换 Provider 时，重置 baseUrl 默认值
   */
  useEffect(() => {
    const provider = providerFactory.getProvider(selectedProvider)
    
    // Google 供应商时始终使用默认地址
    if (selectedProvider === 'google') {
      setBaseUrl(provider.getDefaultBaseUrl())
      return
    }
    
    // OpenAI 供应商时，如果没有保存的地址，则使用默认地址
    if (selectedProvider === 'openai') {
      // 从 storage 中获取保存的配置
      chrome.storage.local.get(STORAGE_CONFIG_KEY).then(async (result) => {
        if (result[STORAGE_CONFIG_KEY]?.baseUrl) {
          // 如果有保存的地址，解密并使用
          const cryptoManager = CryptoManager.getInstance()
          await cryptoManager.initialize()
          const savedBaseUrl = await cryptoManager.decrypt(result[STORAGE_CONFIG_KEY].baseUrl)
          if (savedBaseUrl) {
            setBaseUrl(savedBaseUrl)
            return
          }
        }
        // 如果没有保存的地址，使用默认地址
        setBaseUrl(provider.getDefaultBaseUrl())
      }).catch((err) => {
        logger.error('获取保存的配置失败', err)
        // 出错时使用默认地址
        setBaseUrl(provider.getDefaultBaseUrl())
      })
    }
  }, [selectedProvider]) // 移除 baseUrl 依赖，避免循环

  /**
   * 验证配置并获取模型列表
   */
  const handleValidate = async () => {
    logger.debug('开始验证配置', { baseUrl })
    setIsLoading(true)

    try {
      const llmService = new LLMService({
        provider: selectedProvider,
        apiKey,
        baseUrl
      })

      const response = await llmService.validateAndGetModels()
      
      if (response.data.length === 0) {
        messageHandler.error('未获取到可用模型，请检查配置')
        return
      }

      setModels(response.data)
      logger.debug('成功获取模型列表', { count: response.data.length })
      
      // 如果没有选中的模型，默认选择第一个
      if (!selectedModel && response.data.length > 0) {
        setSelectedModel(response.data[0].id)
        logger.debug('自动选择默认模型', { model: response.data[0].id })
      }

      messageHandler.success('验证成功，已获取可用模型')
    } catch (err) {
      messageHandler.handleError(err, '验证失败')
      setModels([])
      setSelectedModel("")
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 保存配置
   */
  const handleSave = async () => {
    logger.info('开始保存LLM配置')
    setIsSaving(true)

    try {
      // 存模型数���到 IndexedDB
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()
      await indexedDB.saveData(MODEL_DATA_KEY, {
        selectedModel,
        modelList: models,
        language: selectedLanguage,
        provider: selectedProvider
      })
      logger.debug('模型数据已保存到 IndexedDB')

      // 加密并保存敏感配置到 Chrome Storage
      const cryptoManager = CryptoManager.getInstance()
      await cryptoManager.initialize()

      const encryptedApiKey = await cryptoManager.encrypt(apiKey)
      const encryptedBaseUrl = await cryptoManager.encrypt(baseUrl)

      const config: ILLMConfigState = {
        provider: selectedProvider,
        apiKey: encryptedApiKey,
        baseUrl: encryptedBaseUrl,
        model: selectedModel
      }

      await chrome.storage.local.set({
        [STORAGE_CONFIG_KEY]: config
      })
      logger.debug('加密配置已保存到 Chrome Storage')

      // 通知其他组件配置已更新
      chrome.runtime.sendMessage({
        type: 'LLM_CONFIG_UPDATED',
        data: {
          provider: selectedProvider,
          apiKey,
          baseUrl,
          model: selectedModel,
          modelList: models,
          language: selectedLanguage
        }
      })

      messageHandler.success('配置保存成功')
    } catch (err) {
      messageHandler.handleError(err, '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Provider 选择 */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          模型服务商
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSelectedProvider('openai')}
            className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
              selectedProvider === 'openai'
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
            </svg>
            <span className="text-sm font-medium">OpenAI</span>
          </button>
          <button
            onClick={() => setSelectedProvider('google')}
            className={`flex items-center justify-center px-4 py-3 border rounded-lg transition-colors ${
              selectedProvider === 'google'
                ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-sm font-medium">Google</span>
          </button>
        </div>
      </div>

      {/* API Key 输入框 */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          密钥设置
        </h2>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
            placeholder={`请输入 ${selectedProvider === 'openai' ? 'OpenAI' : 'Google'} API Key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Base URL 输入框和验证按钮 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            接口地址
          </h2>
          <div className="space-y-1">
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
              placeholder="请输入 Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
            {selectedProvider === 'openai' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 px-1">
                默认https://api.openai.com/v1,支持 OpenAI 通用接口的第三方服务商
              </p>
            )}
          </div>
        </div>
        
        {/* 验证按钮 */}
        <button
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
            ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
          disabled={isLoading || !apiKey || !baseUrl}
          onClick={() => void handleValidate()}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>验证中...</span>
            </div>
          ) : '验证'}
        </button>
      </div>

      {/* 模型选择下拉框 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            模型选择
          </h2>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-gray-100"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="">请选择模型</option>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.id}
              </option>
            ))}
          </select>
        </div>

        {/* 语言设置 */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            返回语言
          </h2>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={selectedLanguage === 'zh'}
                onChange={() => setSelectedLanguage('zh')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">中文</span>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                checked={selectedLanguage === 'en'}
                onChange={() => setSelectedLanguage('en')}
                className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">English</span>
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          className={`w-full px-4 py-2.5 rounded-lg font-medium text-white 
            ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
            transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]`}
          disabled={isSaving || !selectedModel}
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