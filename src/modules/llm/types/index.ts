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