import { createLogger } from '~/shared/utils/logger'
import type { LLMProviderType } from '../types/provider'
import { OpenAIProvider } from './openai.provider'
import { GoogleProvider } from './google.provider'

/**
 * LLM Provider 工厂类
 * 用于创建和管理不同的 LLM Provider
 */
export class LLMProviderFactory {
  private static instance: LLMProviderFactory
  private readonly logger = createLogger('LLMProviderFactory')
  private readonly providers: Map<LLMProviderType, OpenAIProvider | GoogleProvider>

  private constructor() {
    this.providers = new Map()
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('google', new GoogleProvider())
  }

  /**
   * 获取工厂实例
   */
  public static getInstance(): LLMProviderFactory {
    if (!LLMProviderFactory.instance) {
      LLMProviderFactory.instance = new LLMProviderFactory()
    }
    return LLMProviderFactory.instance
  }

  /**
   * 获取指定类型的 Provider
   * @param type Provider 类型
   */
  public getProvider(type: LLMProviderType): OpenAIProvider | GoogleProvider {
    const provider = this.providers.get(type)
    if (!provider) {
      this.logger.error('未找到指定类型的 Provider', { type })
      throw new Error(`未找到指定类型的 Provider: ${type}`)
    }
    return provider
  }

  /**
   * 获取所有支持的 Provider 类型
   */
  public getSupportedTypes(): LLMProviderType[] {
    return Array.from(this.providers.keys())
  }
} 