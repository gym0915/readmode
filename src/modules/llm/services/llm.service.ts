import { createLogger } from '~/shared/utils/logger'
import type { 
  ILLMConfig, 
  IModelsResponse, 
  ILLMError,
  IChatRequest,
  IChatResponse,
  IChatStreamResponse
} from '../types'
import { LLMProviderFactory } from '../providers/provider.factory'
import type { LLMProviderType } from '../types/provider'

/**
 * LLM 服务类
 * 提供与 LLM API 交互的核心功能，包括配置管理、模型列表获取等功能
 */
export class LLMService {
  private config: ILLMConfig & { provider: LLMProviderType }
  private readonly logger = createLogger('LLMService')
  private static instance: LLMService | null = null
  private readonly providerFactory = LLMProviderFactory.getInstance()

  /**
   * 创建 LLM 服务实例
   */
  constructor(config: ILLMConfig & { provider: LLMProviderType }) {
    this.config = config
    this.logger.debug('初始化 LLM 服务', { 
      provider: config.provider,
      baseUrl: config.baseUrl,
      model: config.model,
      language: config.language,
      streaming: config.streaming
    })
    this.validateConfig()
  }

  /**
   * 验证配置是否完整
   */
  private validateConfig(): void {
    this.logger.debug('开始验证配置')

    if (!this.config.apiKey) {
      const error = new Error('API Key is required')
      this.logger.error('验证失败: API Key 缺失')
      throw error
    }

    if (!this.config.baseUrl) {
      // 如果没有提供 baseUrl，使用默认值
      const provider = this.providerFactory.getProvider(this.config.provider)
      this.config.baseUrl = provider.getDefaultBaseUrl()
      this.logger.info('使用默认 Base URL', { baseUrl: this.config.baseUrl })
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
   * 验证配置并获取可用的模型列表
   */
  public async validateAndGetModels(): Promise<IModelsResponse> {
    try {
      const provider = this.providerFactory.getProvider(this.config.provider)
      const models = await provider.validateAndGetModels({
        apiKey: this.config.apiKey,
        baseUrl: this.config.baseUrl,
        model: this.config.model
      })

      return {
        object: 'list',
        data: models
      }
    } catch (error) {
      this.logger.error('验证失败', error)
      throw error
    }
  }

  /**
   * 更新服务配置
   */
  public updateConfig(newConfig: Partial<ILLMConfig & { provider: LLMProviderType }>): void {
    const oldConfig = { ...this.config }
    this.logger.debug('开始更新配置', { oldConfig, newConfig })

    this.config = { ...this.config, ...newConfig }

    try {
      this.validateConfig()
      this.logger.info('配置更新成功', { 
        oldConfig: { 
          provider: oldConfig.provider,
          baseUrl: oldConfig.baseUrl,
          model: oldConfig.model,
          language: oldConfig.language,
          streaming: oldConfig.streaming
        },
        newConfig: {
          provider: this.config.provider,
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
   */
  public async chat(messages: Array<{ role: string; content: string }>): Promise<ReadableStream | IChatResponse> {
    try {
      const provider = this.providerFactory.getProvider(this.config.provider)
      
      if (this.config.streaming) {
        // 创建一个 TransformStream 来处理流式响应
        const { readable, writable } = new TransformStream()
        const writer = writable.getWriter()

        // 开始流式对话
        void provider.streamChat(
          {
            apiKey: this.config.apiKey,
            baseUrl: this.config.baseUrl,
            model: this.config.model
          },
          messages,
          async (chunk) => {
            try {
              await writer.write(chunk)
            } catch (error) {
              this.logger.error('写入流数据失败', error)
            }
          },
          async (error) => {
            this.logger.error('流式对话发生错误', error)
            await writer.abort(error)
          },
          async () => {
            try {
              await writer.close()
            } catch (error) {
              this.logger.error('关闭流失败', error)
            }
          }
        )

        return readable
      } else {
        return await provider.chat(
          {
            apiKey: this.config.apiKey,
            baseUrl: this.config.baseUrl,
            model: this.config.model
          },
          messages
        )
      }
    } catch (error) {
      this.logger.error('对话请求失败', error)
      throw error
    }
  }

  /**
   * 流式对话接口
   */
  public async streamChat(
    messages: Array<{ role: string; content: string }>,
    onMessage: (chunk: IChatStreamResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const provider = this.providerFactory.getProvider(this.config.provider)
      
      await provider.streamChat(
        {
          apiKey: this.config.apiKey,
          baseUrl: this.config.baseUrl,
          model: this.config.model
        },
        messages,
        onMessage,
        onError,
        onComplete
      )
    } catch (error) {
      this.logger.error('流式对话请求失败', error)
      throw error
    }
  }
}