import { Logger, createLogger, ELogLevel } from '~/shared/utils/logger'
import { toast, ToastContainer } from 'react-toastify'
import type { ToastOptions, Theme, TypeOptions } from 'react-toastify'
import React, { type ReactNode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-toastify/dist/ReactToastify.css'

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
 * Toast 配置接口
 */
interface IToastConfig extends ToastOptions {
  onClick?: () => void;
  container?: HTMLElement;
}

/**
 * 链接消息配置接口
 */
interface ILinkMessageConfig {
  message: string;
  linkText: string;
  onClick: () => void;
}

/**
 * 获取用于渲染 Toast 的容器元素
 */
const getToastContainer = (): HTMLElement => {
  const containerId = 'global-toast-container'
  let container = document.getElementById(containerId)
  
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.top = '0'
    container.style.right = '0'
    container.style.zIndex = '2147483650'
    document.body.appendChild(container)
  }
  
  return container
}

/**
 * Toast 配置
 */
const TOAST_CONFIG: IToastConfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light' as Theme,
  style: {
    minWidth: '320px',
    cursor: 'pointer',
    zIndex: 2147483650,
  },
  container: getToastContainer(),
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
 * 消息内容组件的属性接口
 */
interface IMessageContentProps {
  message: string
  linkText: string
  onClick: () => void
}

/**
 * 消息内容组件
 */
const MessageContent = React.memo(function MessageContent({ 
  message, 
  linkText, 
  onClick 
}: IMessageContentProps): ReactNode {
  const logger = React.useMemo(() => createLogger('MessageContent', ELogLevel.DEBUG), [])
  
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 使用 requestAnimationFrame 确保 DOM 更新完成
    requestAnimationFrame(() => {
      try {
        onClick()
      } catch (error) {
        logger.error('Error executing onClick', { error })
      }
    })
  }, [onClick, logger])

  return React.createElement('div', 
    { 
      className: 'toast-content',
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }
    },
    message,
    React.createElement('button', 
      {
        className: 'toast-link',
        onClick: handleClick,
        style: {
          color: '#2563eb',
          textDecoration: 'underline',
          background: 'none',
          border: 'none',
          padding: '0',
          cursor: 'pointer',
          font: 'inherit'
        }
      }, 
      linkText
    )
  )
})

/**
 * 初始化 ToastContainer
 */
const initializeToastContainer = () => {
  const containerId = 'toast-root-container'
  let container = document.getElementById(containerId)
  
  if (!container) {
    container = document.createElement('div')
    container.id = containerId
    document.body.appendChild(container)
    
    const root = createRoot(container)
    root.render(
      React.createElement(ToastContainer, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        newestOnTop: false,
        closeOnClick: true,
        rtl: false,
        pauseOnFocusLoss: true,
        draggable: true,
        pauseOnHover: true,
        theme: "light",
        style: {
          zIndex: 2147483650
        }
      })
    )
  }
  
  return container
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
    // 初始化 ToastContainer
    initializeToastContainer()
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
   * 显示带链接的消息
   */
  private showLinkMessage(type: MessageType, config: ILinkMessageConfig): void {
    const messageContent = React.createElement(MessageContent, {
      message: config.message,
      linkText: config.linkText,
      onClick: () => {
        try {
          this.logger.info('Executing onClick callback')
          config.onClick()
        } catch (error) {
          this.logger.error('Error in onClick callback', { error })
        }
      }
    })

    const toastConfig: IToastConfig = {
      ...TOAST_CONFIG,
      className: `toast-${type}`,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false, // 禁用拖动以避免与点击冲突
      style: {
        ...TOAST_CONFIG.style,
        cursor: 'default'
      }
    }

    switch (type) {
      case MessageType.WARNING:
        toast.warning(messageContent, toastConfig)
        break
    }
  }

  /**
   * 显示带链接的警告消息
   */
  public warningWithLink(config: ILinkMessageConfig): void {
    this.logger.warn(config.message);
    this.showLinkMessage(MessageType.WARNING, config);
  }

  /**
   * 显示 Toast 消息
   * @private
   */
  private showToast(type: MessageType, message: string) {
    const toastConfig = {
      ...TOAST_CONFIG,
      className: `toast-${type}`,
      container: getToastContainer(), // 确保使用正确的容器
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
        this.error('数据据格式错误，请检查输')
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