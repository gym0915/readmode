/**
 * 错误处理工具
 * @module ErrorHandling
 * @description
 * 提供统一的错误处理和错误类型定义
 */

import { createLogger } from './logger';

const logger = createLogger('error-handling');

// 自定义错误类型
export class ReaderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'ReaderError';
  }
}

/**
 * 错误代码枚举
 */
export enum EErrorCode {
  CONTENT_SCRIPT_INJECTION_FAILED = 'CONTENT_SCRIPT_INJECTION_FAILED',
  ARTICLE_PARSE_FAILED = 'ARTICLE_PARSE_FAILED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} context - 错误上下文
 * @returns {ReaderError} 标准化的错误对象
 */
export function handleError(error: Error, context: string): ReaderError {
  logger.error(`Error in ${context}:`, error);

  if (error instanceof ReaderError) {
    return error;
  }

  // 根据错误类型返回标准化的错误
  if (error.name === 'TimeoutError') {
    return new ReaderError(
      '操作超时',
      EErrorCode.TIMEOUT,
      { context, originalError: error }
    );
  }

  return new ReaderError(
    error.message || '未知错误',
    EErrorCode.UNKNOWN,
    { context, originalError: error }
  );
}

/**
 * 异步操作包装器
 * @param {Function} operation - 异步操作
 * @param {string} context - 操作上下文
 * @returns {Promise<T>} 操作结果
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw handleError(error as Error, context);
  }
} 