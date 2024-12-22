import { Logger } from '../utils/logger'
import type { ILLMProvider, ILLMProviderConfig, LLMProviderType } from '../types/provider'
import type { IModelInfo, IChatResponse, IChatStreamResponse } from '../types'

/**
 * OpenAI Provider 实现类
 */
export class OpenAIProvider implements ILLMProvider {
  private readonly logger = Logger.getInstance('OpenAIProvider')

  getType(): LLMProviderType {
    return 'openai'
  }

  getDefaultBaseUrl(): string {
    return 'https://api.openai.com/v1'
  }

  private getHeaders(config: ILLMProviderConfig): HeadersInit {
    return {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    }
  }

  async validateAndGetModels(config: ILLMProviderConfig): Promise<IModelInfo[]> {
    try {
      const url = `${config.baseUrl}/models`
      this.logger.debug('获取模型列表', { url })

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(config),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '获取模型列表失败')
      }

      const data = await response.json()
      return data.data
    } catch (error) {
      this.logger.error('获取模型列表失败', error)
      throw error
    }
  }

  async chat(
    config: ILLMProviderConfig,
    messages: Array<{ role: string; content: string }>
  ): Promise<IChatResponse> {
    try {
      const url = `${config.baseUrl}/chat/completions`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config),
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: false
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '对话请求失败')
      }

      return await response.json()
    } catch (error) {
      this.logger.error('对话请求失败', error)
      throw error
    }
  }

  async streamChat(
    config: ILLMProviderConfig,
    messages: Array<{ role: string; content: string }>,
    onMessage: (chunk: IChatStreamResponse) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): Promise<void> {
    try {
      const url = `${config.baseUrl}/chat/completions`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(config),
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '流式对话请求失败')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete?.()
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() === '') continue
          if (line.trim() === 'data: [DONE]') continue

          try {
            const data = JSON.parse(line.replace(/^data: /, ''))
            if (data?.choices?.[0]?.delta?.content) {
              onMessage({
                content: data.choices[0].delta.content,
                role: data.choices[0].delta.role || 'assistant'
              })
            }
          } catch (error) {
            this.logger.warn('解析流式响应数据失败', { line, error })
          }
        }
      }
    } catch (error) {
      this.logger.error('流式对话请求失败', error)
      if (onError && error instanceof Error) {
        onError(error)
      }
      throw error
    }
  }
} 