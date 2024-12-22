import { Logger } from '../utils/logger'
import type { ILLMProvider, ILLMProviderConfig, LLMProviderType } from '../types/provider'
import type { IModelInfo, IChatResponse, IChatStreamResponse } from '../types'

/**
 * Google Provider 实现类
 */
export class GoogleProvider implements ILLMProvider {
  private readonly logger = Logger.getInstance('GoogleProvider')

  getType(): LLMProviderType {
    return 'google'
  }

  getDefaultBaseUrl(): string {
    return 'https://generativelanguage.googleapis.com/v1beta'
  }

  private getUrl(config: ILLMProviderConfig, endpoint: string): string {
    return `${config.baseUrl}${endpoint}?key=${config.apiKey}`
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    }
  }

  async validateAndGetModels(config: ILLMProviderConfig): Promise<IModelInfo[]> {
    try {
      const url = this.getUrl(config, '/models')
      this.logger.debug('获取模型列表', { url })

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '获取模型列表失败')
      }

      const data = await response.json()
      
      // 转换 Google 的模型格式为统一格式
      return data.models.map((model: any) => ({
        id: model.name,
        object: 'model',
        created: Date.now(),
        owned_by: 'google'
      }))
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
      const modelName = config.model || 'models/gemini-pro'
      const url = this.getUrl(config, `/${modelName}:generateContent`)
      
      // 转换消息格式为 Google API 格式
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '对话请求失败')
      }

      const data = await response.json()
      
      // 转换 Google 的响应格式为统一格式
      return {
        id: Date.now().toString(),
        object: 'chat.completion',
        created: Date.now(),
        model: modelName,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.candidates[0].content.parts[0].text
          },
          finish_reason: data.candidates[0].finishReason
        }]
      }
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
      const modelName = config.model || 'models/gemini-pro'
      const url = this.getUrl(config, `/${modelName}:streamGenerateContent`)
      
      // 转换消息格式为 Google API 格式
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
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

          try {
            const data = JSON.parse(line)
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
              onMessage({
                content: data.candidates[0].content.parts[0].text,
                role: 'assistant'
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