import React, { useState, useEffect } from "react"
import type { IModelInfo } from "~/modules/llm/types"
import { createLogger, ELogLevel } from "~/shared/utils/logger"
import { MessageHandler } from "~/shared/utils/message"
import { LLMService } from "~/modules/llm"
import { CryptoManager } from "~/shared/utils/crypto-manager"
import { IndexedDBManager } from "~/shared/utils/indexed-db"

// 常量定义
const MODEL_DATA_KEY = "modelData"
const STORAGE_CONFIG_KEY = "llmConfig"

interface ILLMConfigState {
  apiKey: string
  baseUrl: string
  model?: string
}

interface IModelData {
  selectedModel: string
  modelList: IModelInfo[]
  streaming: boolean
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
  const [streaming, setStreaming] = useState(false)

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
        setStreaming(modelData.streaming ?? false)
        logger.debug('已从 IndexedDB 加载模型数据', { 
          modelCount: modelData.modelList.length,
          selectedModel: modelData.selectedModel,
          streaming: modelData.streaming 
        })
      }

      // 加载加密的配置数据
      const result = await chrome.storage.local.get(STORAGE_CONFIG_KEY)
      if (result[STORAGE_CONFIG_KEY]) {
        const { 
          apiKey: encryptedApiKey, 
          baseUrl: encryptedBaseUrl
        } = result[STORAGE_CONFIG_KEY]
        
        // 初始化加密管理器并解密数据
        const cryptoManager = CryptoManager.getInstance()
        await cryptoManager.initialize()
        
        const savedApiKey = encryptedApiKey ? await cryptoManager.decrypt(encryptedApiKey) : ''
        const savedBaseUrl = encryptedBaseUrl ? await cryptoManager.decrypt(encryptedBaseUrl) : ''
        
        setApiKey(savedApiKey)
        setBaseUrl(savedBaseUrl)
        logger.debug('已加载加密配置')
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
   * 验证配置并获取模型列表
   */
  const handleValidate = async () => {
    logger.debug('开始验证配置', { baseUrl })
    setIsLoading(true)

    try {
      const llmService = new LLMService({
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
      // 保存模型数据到 IndexedDB
      const indexedDB = IndexedDBManager.getInstance()
      await indexedDB.initialize()
      await indexedDB.saveData(MODEL_DATA_KEY, {
        selectedModel,
        modelList: models,
        streaming
      })
      logger.debug('模型数据已保存到 IndexedDB')

      // 加密并保存敏感配置到 Chrome Storage
      const cryptoManager = CryptoManager.getInstance()
      await cryptoManager.initialize()

      const encryptedApiKey = await cryptoManager.encrypt(apiKey)
      const encryptedBaseUrl = await cryptoManager.encrypt(baseUrl)

      const config: ILLMConfigState = {
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
          apiKey,
          baseUrl,
          model: selectedModel,
          modelList: models,
          streaming
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

      {/* 模型选择下拉框和保存按钮 */}
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

        {/* 流式输出开关 */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-700">流式输出</span>
            <p className="text-xs text-gray-500">启用后将逐字显示 AI 的输出内容</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{streaming ? '开启' : '关闭'}</span>
            <button
              type="button"
              onClick={() => setStreaming(!streaming)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                streaming ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                  streaming ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
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