/**
 * LLM 服务配置接口
 */
export interface ILLMConfig {
  apiKey: string
  baseUrl: string
  model?: string
  language?: string
  streaming?: boolean
}

/**
 * 模型信息接口
 */
export interface IModelInfo {
  id: string
  object?: string
  created?: number
  owned_by?: string
}

/**
 * 模型列表响应接口
 */
export interface IModelsResponse {
  object: string
  data: IModelInfo[]
}

/**
 * LLM 错误接口
 */
export interface ILLMError {
  code: string
  message: string
  type: string
  param?: string
}

/**
 * 对话请求接口
 */
export interface IChatRequest {
  messages: Array<{
    role: string
    content: string
  }>
}

/**
 * 对话响应接口
 */
export interface IChatResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string | null
  }>
} 