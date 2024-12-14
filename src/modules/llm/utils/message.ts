import { Logger, createLogger, ELogLevel } from '~/shared/utils/logger'
import { toast, ToastOptions, Theme, TypeOptions } from 'react-toastify'

/**
 * 消息类型枚举
 */
export enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

/**
 * 消息详情接口
 */
export interface IMessageDetails {
  [key: string]: unknown
}

/**
 * Toast 配置
 */
const TOAST_CONFIG: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light' as Theme,
  style: {
    minWidth: '320px',
  },
  // 自定义图标
  icon: ({ type }: { type: TypeOptions }) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📝'
    }
  }
}

/**
 * 消息处理类
 * 用于统一处理 LLM 模块的消息提示
 */
export class MessageHandler {
  private static instance: MessageHandler
  private logger: Logger

  private constructor() {
    this.logger = createLogger('MessageHandler', ELogLevel.DEBUG)
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler()
    }
    return MessageHandler.instance
  }

  /**
   * 显示 Toast 消息
   * @private
   */
  private showToast(type: MessageType, message: string) {
    const toastConfig = {
      ...TOAST_CONFIG,
      className: `toast-${type}`,
    }

    switch (type) {
      case MessageType.SUCCESS:
        toast.success(message, toastConfig)
        break
      case MessageType.ERROR:
        toast.error(message, toastConfig)
        break
      case MessageType.WARNING:
        toast.warning(message, toastConfig)
        break
      case MessageType.INFO:
        toast.info(message, toastConfig)
        break
    }
  }

  /**
   * 处理成功消息
   * @param message - 成功消息
   * @param details - 详细信息
   */
  public success(message: string, details?: IMessageDetails): void {
    this.logger.info(message, details)
    this.showToast(MessageType.SUCCESS, message)
  }

  /**
   * 处理错误消息
   * @param message - 错误消息
   * @param details - 错误详情
   */
  public error(message: string, details?: IMessageDetails): void {
    this.logger.error(message, details)
    this.showToast(MessageType.ERROR, message)
  }

  /**
   * 处理信息消息
   * @param message - 信息消息
   * @param details - 详细信息
   */
  public info(message: string, details?: IMessageDetails): void {
    this.logger.info(message, details)
    this.showToast(MessageType.INFO, message)
  }

  /**
   * 处理警告消息
   * @param message - 警告消息
   * @param details - 详细信息
   */
  public warning(message: string, details?: IMessageDetails): void {
    this.logger.warn(message, details)
    this.showToast(MessageType.WARNING, message)
  }

  /**
   * 处理错误对象
   * @param error - 错误对象
   * @param fallbackMessage - 默认错误消息
   */
  public handleError(error: unknown, fallbackMessage: string): void {
    // 记录原始错误信息到日志
    this.logger.error('原始错误', { error })

    if (error instanceof Error) {
      // 处理常见的错误类型
      if (error instanceof TypeError) {
        this.error('输入数据类型错误，请检查输入')
      } else if (error instanceof SyntaxError) {
        this.error('数据格式错误，请检查输入')
      } else if (error.name === 'NetworkError' || error.message.includes('network')) {
        this.error('网络连接失败，请检查网络设置')
      } else if (error.message.toLowerCase().includes('api key')) {
        this.error('API Key 无效或已过期')
      } else if (error.message.toLowerCase().includes('url')) {
        this.error('Base URL 格式不正确')
      } else {
        this.error(error.message)
      }

      // 记录详细错误信息到日志
      this.logger.error('错误详情', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    } else if (typeof error === 'string') {
      this.error(error)
    } else {
      this.error(fallbackMessage)
    }
  }
} 