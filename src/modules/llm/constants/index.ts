/**
 * API 相关常量
 */
export const API_ENDPOINTS = {
  MODELS: '/models',
} as const

/**
 * 错误类型常量
 */
export const ERROR_TYPES = {
  VALIDATION_ERROR: 'validation_error',
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
} as const

/**
 * HTTP 请求头常量
 */
export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
} as const

/**
 * 内容类型常量
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
} as const 