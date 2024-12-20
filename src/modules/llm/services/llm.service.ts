import { Logger } from '../utils/logger'
import type { 
  ILLMConfig, 
  IModelsResponse, 
  ILLMError,
  IChatRequest,
  IChatResponse,
  IChatStreamResponse
} from '../types'
import { API_ENDPOINTS, HTTP_HEADERS, CONTENT_TYPES } from '../constants'

/**
 * LLM 服务类
 * 提供与 LLM API 交互的核心功能，包括配置管理、模型列表获取等功能
 * 
 * @example
 * ```typescript
 * const llmService = new LLMService({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://api.example.com'
 * });
 * 
 * const models = await llmService.validateAndGetModels();
 * console.log(models);
 * ```
 */
export class LLMService {
  private config: ILLMConfig
  private readonly logger: Logger
  private static instance: LLMService | null = null

  /**
   * 创建 LLM 服务实例
   * @param config - LLM 服务配置
   * @throws Error 如果配置验证失败
   */
  constructor(config: ILLMConfig) {
    this.config = config
    this.logger = Logger.getInstance('LLMService')
    this.logger.debug('初始化 LLM 服务', { 
      baseUrl: config.baseUrl,
      model: config.model,
      language: config.language,
      streaming: config.streaming,
      apiKey: config.apiKey
    })
    this.validateConfig()
  }

  /**
   * 验证配置是否完整
   * @throws Error 如果必要的配置项缺失
   * @private
   */
  private validateConfig(): void {
    this.logger.debug('开始验证配置')

    if (!this.config.apiKey) {
      const error = new Error('API Key is required')
      this.logger.error('验证失败: API Key 缺失')
      throw error
    }

    if (!this.config.baseUrl) {
      const error = new Error('Base URL is required')
      this.logger.error('验证失败: Base URL 缺失')
      throw error
    }

    // 验证 baseUrl 格式
    try {
      new URL(this.config.baseUrl)
    } catch (error) {
      this.logger.error('验证失败: Base URL 格式无效', { baseUrl: this.config.baseUrl })
      throw new Error('Invalid Base URL format')
    }

    this.logger.info('验证通过', { baseUrl: this.config.baseUrl })
  }

  /**
   * 构建请求头
   * @returns HTTP 请求头
   * @private
   */
  private getHeaders(): HeadersInit {
    this.logger.debug('构建请求头')
    return {
      [HTTP_HEADERS.AUTHORIZATION]: `Bearer ${this.config.apiKey}`,
      [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
    }
  }

  /**
   * 验证配置并获取可用的模型列表
   * @returns Promise<IModelsResponse> 模型列表
   * @throws Error 当验证失败或请求失败时
   * 
   * @example
   * ```typescript
   * try {
   *   const models = await llmService.validateAndGetModels();
   *   console.log('Available models:', models.data);
   * } catch (error) {
   *   console.error('Failed to get models:', error);
   * }
   * ```
   */
  public async validateAndGetModels(): Promise<IModelsResponse> {
    try {
      const url = `${this.config.baseUrl}${API_ENDPOINTS.MODELS}`
      this.logger.debug('开始验证', { url })

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const error = (await response.json()) as ILLMError
        this.logger.error('验证失败', { 
          status: response.status,
          statusText: response.statusText,
          error,
          url
        })
        throw new Error(error.message || '验证失败')
      }

      const data = (await response.json()) as IModelsResponse
      this.logger.info('验证成功', { 
        modelCount: data.data.length,
        models: data.data.map(model => ({
          id: model.id,
          object: model.object,
          created: model.created,
          owned_by: model.owned_by
        }))
      })
      return data
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('验证时发生错误', { 
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          }
        })
      } else {
        this.logger.error('验证时发生未知错误', { error })
      }
      throw error
    }
  }

  /**
   * 更新服务配置
   * @param newConfig - 新的配置信息
   * @throws Error 如果新配置验证失败
   * 
   * @example
   * ```typescript
   * llmService.updateConfig({
   *   model: 'gpt-4',
   *   language: 'zh-CN'
   * });
   * ```
   */
  public updateConfig(newConfig: Partial<ILLMConfig>): void {
    const oldConfig = { ...this.config }
    this.logger.debug('开始更新配置', { oldConfig, newConfig })

    this.config = { ...this.config, ...newConfig }

    try {
      this.validateConfig()
      this.logger.info('配置更新成功', { 
        oldConfig: { 
          baseUrl: oldConfig.baseUrl,
          model: oldConfig.model,
          language: oldConfig.language,
          streaming: oldConfig.streaming
        },
        newConfig: {
          baseUrl: this.config.baseUrl,
          model: this.config.model,
          language: this.config.language,
          streaming: this.config.streaming
        }
      })
    } catch (error) {
      // 如果验证失败，恢复旧配置
      this.config = oldConfig
      this.logger.error('配置更新失败，已恢复原配置', { 
        error: error instanceof Error ? error.message : error 
      })
      throw error
    }
  }

  /**
   * 与模型对话
   * @param messages - 对话消息数组
   * @returns 模型响应
   */
  public async chat(messages: Array<{ role: string; content: string }>): Promise<ReadableStream | IChatResponse> {
    try {
      const url = `${this.config.baseUrl}/chat/completions`
      
      // 在消息末尾添加语言指令
      const messagesWithLanguage = [...messages]
      
      this.logger.debug('开始对话请求', { url, messages: messagesWithLanguage })

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: messagesWithLanguage,
          stream: this.config.streaming
        })
      })

      if (!response.ok) {
        const error = (await response.json()) as ILLMError
        this.logger.error('对话请求失败', { 
          status: response.status,
          statusText: response.statusText,
          error
        })
        throw new Error(error.message || '对话请求失败')
      }

      if (this.config.streaming) {
        this.logger.debug('返回流式响应')
        return response.body!
      } else {
        const data = await response.json() as IChatResponse
        this.logger.debug('对话完成', { response: data })
        return data
      }
    } catch (error) {
      this.logger.error('对话过程发生错误', { error })
      throw error
    }
  }

  /**
   * 流式对话接口
   * @param messages - 对话消息数组
   * @param onMessage - 处理每个消息块的回调函数
   * @param onError - 错误处理回调函数
   * @param onComplete - 对话完成时的回调函数
   * 
   * @example
   * ```typescript
   * await llmService.streamChat(
   *   messages,
   *   (chunk) => console.log(chunk.content),
   *   (error) => console.error(error),
   *   () => console.log('对话完成')
   * );
   * ```
   */
  public async streamChat(
    messages: Array<{ role: string; content: string }>,
    onMessage: (chunk: IChatStreamResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const url = `${this.config.baseUrl}/chat/completions`
      const messagesWithLanguage = [...messages]
      
      this.logger.debug('开始流式对话请求', { 
        url, 
        messages: messagesWithLanguage,
        model: this.config.model
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: this.config.model,
          messages: messagesWithLanguage,
          stream: true
        })
      })

      // 修改错误处理逻辑
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage: string
        try {
          const error = JSON.parse(errorText) as ILLMError
          errorMessage = error.message || '流式对话请求失败'
        } catch {
          errorMessage = errorText || `请求失败: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      this.logger.debug('流式对话请求响应', { response })

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      this.logger.debug('成功获取响应流reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete?.()
          this.logger.debug('流式对话完成')
          break
        }

        // 记录接收到的原始数据
        this.logger.debug('接收到流式数据:', {
          valueLength: value?.length,
          valuePreview: value ? decoder.decode(value.slice(0, 50)) : null
        })

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.trim() === 'data: [DONE]') continue

          try {
            const data = JSON.parse(line.replace(/^data: /, ''))
            if (data?.choices?.[0]?.delta?.content) {
              const chunk: IChatStreamResponse = {
                content: data.choices[0].delta.content,
                role: data.choices[0].delta.role || 'assistant'
              }
              this.logger.debug('解析到新的内容块:', {
                content: chunk.content.substring(0, 50) + '...',
                role: chunk.role
              })
              onMessage(chunk)
            }
          } catch (error) {
            this.logger.warn('解析流式响应数据失败', { 
              line,
              error: error instanceof Error ? error.message : String(error)
            })
          }
        }
      }
    } catch (error) {
      this.logger.error('流式对话过程发生错误', { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        requestDetails: {
          url: `${this.config.baseUrl}/chat/completions`,
          model: this.config.model,
          messageCount: messages.length
        }
      })
      if (onError && error instanceof Error) {
        onError(error)
      }
      throw error
    }
  }
}