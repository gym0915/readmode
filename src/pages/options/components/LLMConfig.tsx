import React, { useState, useEffect } from "react"
import type { IModelInfo } from "~/modules/llm/types"
import { createLogger, ELogLevel } from "~/shared/utils/logger"
import { MessageHandler } from "~/modules/llm/utils/message"
import { LLMService } from "~/modules/llm"
import { CryptoManager } from "~/shared/utils/crypto-manager"

interface ILLMConfigState {
  apiKey: string
  baseUrl: string
  model?: string
}

// 创建日志记录器和消息处理器
const logger = createLogger('LLMConfig', ELogLevel.DEBUG)
const messageHandler = MessageHandler.getInstance()

export const LLMConfig: React.FC = () => {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [models, setModels] = useState<IModelInfo[]>([])
  const [showApiKey, setShowApiKey] = useState(false)

  /**
   * 加载已保存的配置
   */
  const loadSavedConfig = async () => {
    logger.debug('开始加载已保存配置')
    try {
      const result = await chrome.storage.sync.get('llmConfig')
      if (result.llmConfig) {
        const { apiKey: encryptedApiKey, baseUrl: encryptedBaseUrl, model: savedModel } = result.llmConfig
        
        // 初始化加密管理器并解密数据
        const cryptoManager = CryptoManager.getInstance()
        await cryptoManager.initialize()
        
        const savedApiKey = encryptedApiKey ? await cryptoManager.decrypt(encryptedApiKey) : ''
        const savedBaseUrl = encryptedBaseUrl ? await cryptoManager.decrypt(encryptedBaseUrl) : ''
        
        setApiKey(savedApiKey)
        setBaseUrl(savedBaseUrl)
        setSelectedModel(savedModel || '')
        
        // 如果有保存的配置，自动验证获取模型列表
        if (savedApiKey && savedBaseUrl) {
          logger.debug('开始验证已保存配置')
          const llmService = new LLMService({
            apiKey: savedApiKey,
            baseUrl: savedBaseUrl
          })
          const response = await llmService.validateAndGetModels()
          setModels(response.data)
          messageHandler.success('配置加载成功')
        }
      } else {
        logger.info('未找到已保存的配置')
      }
    } catch (err) {
      messageHandler.handleError(err, '加载配置失败')
    }
  }

  /**
   * 组件挂��时加载配置
   */
  useEffect(() => {
    void loadSavedConfig()
  }, [])

  /**
   * 验证配置并获取模型列表
   */
  const handleValidate = async () => {
    logger.debug('开始验证配置', { baseUrl })
    setIsLoading(true)

    try {
      // 创建 LLM 服务实例
      const llmService = new LLMService({
        apiKey,
        baseUrl
      })

      // 获取模型列表
      const response = await llmService.validateAndGetModels()
      
      if (response.data.length === 0) {
        messageHandler.error('未获取到可用模型，请检查配置')
        return
      }

      setModels(response.data)
      
      // 如果有模型，默认选择第一个
      if (response.data.length > 0) {
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
    logger.info('[LLMConfig] 开始保存LLM配置');
    logger.debug('开始保存配置')
    setIsSaving(true)

    try {
      // 1. 初始化加密管理器
      logger.info('[LLMConfig] 开始初始化加密管理器')
      const cryptoManager = CryptoManager.getInstance()
      await cryptoManager.initialize()
      logger.debug('[LLMConfig] 加密管理器初始化完成')

      // 2. 加密敏感数据
      logger.info('[LLMConfig] 开始加密敏感数据')
      const encryptedApiKey = await cryptoManager.encrypt(apiKey)
      const encryptedBaseUrl = await cryptoManager.encrypt(baseUrl)
      logger.debug('[LLMConfig] 敏感数据加密完成', { 
        apiKeyLength: encryptedApiKey.length,
        baseUrlLength: encryptedBaseUrl.length 
      })

      // 3. 创建配置对象
      logger.info('[LLMConfig] 创建配置对象')
      const config: ILLMConfigState = {
        apiKey: encryptedApiKey,
        baseUrl: encryptedBaseUrl,
        model: selectedModel
      }
      logger.debug('[LLMConfig] 配置对象创建完成', { model: selectedModel })

      // 4. 保存到 Chrome 存储
      logger.info('[LLMConfig] 开始保存配置到Chrome存储')
      await chrome.storage.sync.set({
        llmConfig: config
      })
      logger.debug('[LLMConfig] 配置已保存到Chrome存储')

      // 5. 通知其他部分配置已更新
      logger.info('[LLMConfig] 发送配置更新消息')
      chrome.runtime.sendMessage({
        type: 'LLM_CONFIG_UPDATED',
        data: {
          apiKey,  // 发送解密后的数据给其他组件使用
          baseUrl,
          model: selectedModel
        }
      })
      logger.debug('[LLMConfig] 配置更新消息已发送')

      messageHandler.success('配置保存成功')
    } catch (err) {
      messageHandler.handleError(err, '保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* API Key 输入框 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          API KEY
        </label>
        <div className="relative group">
          <input
            type={showApiKey ? "text" : "password"}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            placeholder="请输入 API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Base URL 输入框和验证按钮 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Base URL
          </label>
          <input
            type="text"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            placeholder="请输入 Base URL"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
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

      {/* 模型选择下���框和保存按钮 */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Model
          </label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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