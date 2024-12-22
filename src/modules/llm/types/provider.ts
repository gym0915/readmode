import type { IModelInfo, IChatResponse, IChatStreamResponse } from './index'

/**
 * LLM Provider 类型
 */
export type LLMProviderType = 'openai' | 'google'

/**
 * LLM Provider 配置接口
 */
export interface ILLMProviderConfig {
  apiKey: string
  baseUrl: string
  model?: string
}

/**
 * LLM Provider 接口
 * 定义了所有 AI 提供商需要实现的方法
 */
export interface ILLMProvider {
  /**
   * 获取提供商类型
   */
  getType(): LLMProviderType

  /**
   * 获取默认的 base URL
   */
  getDefaultBaseUrl(): string

  /**
   * 验证配置并获取可用模型列表
   */
  validateAndGetModels(config: ILLMProviderConfig): Promise<IModelInfo[]>

  /**
   * 发送对话请求
   */
  chat(config: ILLMProviderConfig, messages: Array<{ role: string; content: string }>): Promise<IChatResponse>

  /**
   * 发送流式对话请求
   */
  streamChat(
    config: ILLMProviderConfig,
    messages: Array<{ role: string; content: string }>,
    onMessage: (chunk: IChatStreamResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void>
} 