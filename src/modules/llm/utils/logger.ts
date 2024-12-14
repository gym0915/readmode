/**
 * 日志级别枚举
 * @enum {string}
 */
export enum LogLevel {
  /** 调试信息 */
  DEBUG = 'DEBUG',
  /** 普通信息 */
  INFO = 'INFO',
  /** 警告信息 */
  WARN = 'WARN',
  /** 错误信息 */
  ERROR = 'ERROR',
}

/**
 * 日志数据接口
 * @interface ILogData
 */
export interface ILogData {
  /** 键值对形式的日志数据 */
  [key: string]: unknown
}

/**
 * 日志工具类
 * 用于统一管理 LLM 模块的日志输出，采用单例模式确保每个模块只有一个日志实例
 * 
 * @example
 * ```typescript
 * const logger = Logger.getInstance('MyModule');
 * logger.info('操作成功', { data: 'some data' });
 * logger.error('操作失败', { error: new Error('error message') });
 * ```
 */
export class Logger {
  private module: string
  private static instances: Map<string, Logger> = new Map()

  private constructor(module: string) {
    this.module = module
  }

  /**
   * 获取 Logger 实例
   * @param module - 模块名称
   * @returns Logger 实例
   * @throws Error 如果模块名称为空
   */
  public static getInstance(module: string): Logger {
    if (!module) {
      throw new Error('Module name is required')
    }

    if (!this.instances.has(module)) {
      this.instances.set(module, new Logger(module))
    }
    return this.instances.get(module)!
  }

  /**
   * 格式化日志消息
   * @param level - 日志级别
   * @param message - 日志消息
   * @param data - 附加数据
   * @returns 格式化后的日志消息
   */
  private formatMessage(level: LogLevel, message: string, data?: ILogData): string {
    const timestamp = new Date().toISOString()
    const dataStr = data ? JSON.stringify(data, null, 2) : ''
    return `[${timestamp}] [${level}] [${this.module}] ${message}${dataStr ? ' ' + dataStr : ''}`
  }

  /**
   * 记录调试级别日志
   * @param message - 日志消息
   * @param data - 附加数据
   * @example
   * ```typescript
   * logger.debug('调试信息', { key: 'value' });
   * ```
   */
  public debug(message: string, data?: ILogData): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data))
    }
  }

  /**
   * 记录信息级别日志
   * @param message - 日志消息
   * @param data - 附加数据
   * @example
   * ```typescript
   * logger.info('操作成功', { result: 'success' });
   * ```
   */
  public info(message: string, data?: ILogData): void {
    console.info(this.formatMessage(LogLevel.INFO, message, data))
  }

  /**
   * 记录警告级别日志
   * @param message - 日志消息
   * @param data - 附加数据
   * @example
   * ```typescript
   * logger.warn('性能警告', { metrics: { cpu: 90 } });
   * ```
   */
  public warn(message: string, data?: ILogData): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, data))
  }

  /**
   * 记录错误级别日志
   * @param message - 日志消息
   * @param data - 附加数据
   * @example
   * ```typescript
   * logger.error('操作失败', { error: new Error('error message') });
   * ```
   */
  public error(message: string, data?: ILogData): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, data))
  }
} 