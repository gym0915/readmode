/**
 * 日志工具类
 * @module Logger
 * @description
 * 提供统一的日志记录功能，支持不同级别的日志输出和格式化
 */

// 日志级别枚举
export enum ELogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// 日志配置接口
interface ILoggerConfig {
  level: ELogLevel;
  module: string;
  enabled: boolean;
}

/**
 * 日志工具类
 */
export class Logger {
  private config: ILoggerConfig;
  private static readonly TIME_FORMAT = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  constructor(module: string, level: ELogLevel = ELogLevel.INFO) {
    this.config = {
      level,
      module,
      enabled: true
    };
  }

  /**
   * 格式化日志消息
   * @private
   */
  private formatMessage(level: ELogLevel, message: string): string {
    const timestamp = Logger.TIME_FORMAT.format(new Date());
    return `[${timestamp}] [${level}] [${this.config.module}] ${message}`;
  }

  /**
   * 记录调试级别日志
   * @param {string} message - 日志消息
   * @param {any} [data] - 附加数据
   */
  debug(message: string, data?: any): void {
    if (!this.config.enabled || this.config.level > ELogLevel.DEBUG) return;
    console.debug(this.formatMessage(ELogLevel.DEBUG, message), data || '');
  }

  /**
   * 记录信息级别日志
   * @param {string} message - 日志消息
   * @param {any} [data] - 附加数据
   */
  info(message: string, data?: any): void {
    if (!this.config.enabled || this.config.level > ELogLevel.INFO) return;
    console.info(this.formatMessage(ELogLevel.INFO, message), data || '');
  }

  /**
   * 记录警告级别日志
   * @param {string} message - 日志消息
   * @param {any} [data] - 附加数据
   */
  warn(message: string, data?: any): void {
    if (!this.config.enabled || this.config.level > ELogLevel.WARN) return;
    console.warn(this.formatMessage(ELogLevel.WARN, message), data || '');
  }

  /**
   * 记录错误级别日志
   * @param {string} message - 日志消息
   * @param {any} [data] - 附加数据
   */
  error(message: string, data?: any): void {
    if (!this.config.enabled || this.config.level > ELogLevel.ERROR) return;
    console.error(this.formatMessage(ELogLevel.ERROR, message), data || '');
  }

  /**
   * 启用日志记录
   */
  enable(): void {
    this.config.enabled = true;
  }

  /**
   * 禁用日志记录
   */
  disable(): void {
    this.config.enabled = false;
  }

  /**
   * 设置日志级别
   * @param {ELogLevel} level - 日志级别
   */
  setLevel(level: ELogLevel): void {
    this.config.level = level;
  }
}

/**
 * 创建日志记录器
 * @param {string} module - 模块名称
 * @param {ELogLevel} [level] - 日志级别
 * @returns {Logger} 日志记录器实例
 */
export function createLogger(module: string, level?: ELogLevel): Logger {
  return new Logger(module, level);
}