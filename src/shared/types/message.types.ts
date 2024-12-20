/**
 * 消息类型定义
 * @description 定义了扩展中使用的所有消息类型
 */
export type MessageType = 
  | 'PARSE_CONTENT'
  | 'TOGGLE_READER_MODE'
  | 'PARSED_CONTENT'
  | 'CHECK_LLM_CONFIG'
  | 'CHECK_LLM_CONFIG_RESPONSE'
  | 'CHAT_REQUEST'
  | 'CHAT_RESPONSE'
  | 'GET_LLM_CONFIG'
  | 'GET_LLM_CONFIG_RESPONSE'
  | 'STREAM_START'
  | 'STREAM_CHUNK'
  | 'STREAM_ERROR'
  | 'STREAM_DONE'

/**
 * 基础消息接口
 * @interface BaseMessage
 * @property {MessageType} type - 消息类型
 */
export interface BaseMessage {
  type: MessageType
}

/**
 * 解析内容消息
 * @interface ParseContentMessage
 * @extends {BaseMessage}
 */
export interface ParseContentMessage extends BaseMessage {
  type: 'PARSE_CONTENT'
}

/**
 * 切换阅读模式消息
 * @interface ToggleReaderModeMessage
 * @extends {BaseMessage}
 * @property {any} article - 文章数据
 */
export interface ToggleReaderModeMessage extends BaseMessage {
  type: 'TOGGLE_READER_MODE'
  article: any // TODO: 使用实际的文章类型
}

/**
 * 已解析内容消息
 * @interface ParsedContentMessage
 * @extends {BaseMessage}
 * @property {any} data - 解析后的数据
 */
export interface ParsedContentMessage extends BaseMessage {
  type: 'PARSED_CONTENT'
  data: any // TODO: 使用实际的解析结果类型
}

/**
 * LLM配置检查请求消息
 * @interface CheckLLMConfigMessage
 * @extends {BaseMessage}
 */
export interface CheckLLMConfigMessage extends BaseMessage {
  type: 'CHECK_LLM_CONFIG'
}

/**
 * LLM配置检查响应消息
 * @interface CheckLLMConfigResponse
 * @extends {BaseMessage}
 */
export interface CheckLLMConfigResponse extends BaseMessage {
  type: 'CHECK_LLM_CONFIG_RESPONSE'
  isConfigured: boolean
  config?: {
    baseUrl?: string
    apiKey?: string
    selectedModel?: string
  }
}

/**
 * 对话请求消息
 */
export interface ChatRequestData {
  type: 'SUMMARY' | 'CHAT'
  title?: string
  content: string
  language?: 'zh' | 'en'
  messages?: Array<{ role: string; content: string }>
  portName?: string
}

export interface ChatRequestMessage extends BaseMessage {
  type: 'CHAT_REQUEST'
  data: ChatRequestData
}

/**
 * 对话响应消息
 */
export interface ChatResponseMessage extends BaseMessage {
  type: 'CHAT_RESPONSE'
  data: ReadableStream | {
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
  } | IStreamStartData  // 添加新的数据类型选项
  error: string | null
}

/**
 * 获取LLM配置请求消息
 */
export interface GetLLMConfigMessage extends BaseMessage {
  type: 'GET_LLM_CONFIG'
}

/**
 * 获取LLM配置响应消息
 */
export interface GetLLMConfigResponse extends BaseMessage {
  type: 'GET_LLM_CONFIG_RESPONSE'
  data?: {
    apiKey: string
    baseUrl: string
  }
  error?: string
}

/**
 * 流式消息类型定义
 */
export interface IStreamStartData {
  type: 'STREAM_START'
}

export interface StreamChunkMessage {
  type: 'STREAM_CHUNK'
  data: {
    content: string
    role: string
  }
}

export interface StreamErrorMessage {
  type: 'STREAM_ERROR'
  error: string
}

export interface StreamDoneMessage {
  type: 'STREAM_DONE'
}

export type StreamMessage = 
  | StreamChunkMessage 
  | StreamErrorMessage 
  | StreamDoneMessage

/**
 * 消息联合类型
 * @type {Message}
 */
export type Message = 
  | ParseContentMessage 
  | ToggleReaderModeMessage
  | ParsedContentMessage
  | CheckLLMConfigMessage
  | CheckLLMConfigResponse
  | ChatRequestMessage
  | ChatResponseMessage
  | GetLLMConfigMessage
  | GetLLMConfigResponse