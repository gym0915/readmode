import { createLogger } from '~/shared/utils/logger'
import type { Message } from './types'

const logger = createLogger('message-service')

/**
 * 消息服务类
 * @class MessageService
 * @description 处理扩展内部的消息传递
 */
export class MessageService {
  private listeners: Map<string, Function[]> = new Map()

  /**
   * 发送消息到内容脚本
   * @param {number} tabId - 目标标签页ID
   * @param {Message} message - 要发送的消息
   * @returns {Promise<any>} 消息响应
   * @throws {Error} 发送失败时抛出错误
   */
  async sendToContent(tabId: number, message: Message): Promise<any> {
    try {
      return await chrome.tabs.sendMessage(tabId, message)
    } catch (error) {
      logger.error('Failed to send message to content script:', error)
      throw error
    }
  }

  /**
   * 发送消息到背景脚本
   * @param {Message} message - 要发送的消息
   * @returns {Promise<any>} 消息响应
   * @throws {Error} 发送失败时抛出错误
   */
  async sendToBackground(message: Message): Promise<any> {
    try {
      return await chrome.runtime.sendMessage(message)
    } catch (error) {
      logger.error('Failed to send message to background:', error)
      throw error
    }
  }

  /**
   * 添加消息监听器
   * @param {string} type - 消息类型
   * @param {Function} callback - 回调函数
   */
  addListener(type: string, callback: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(callback)
  }

  /**
   * 移除消息监听器
   * @param {string} type - 消息类型
   * @param {Function} callback - 要移除的回调函数
   */
  removeListener(type: string, callback: Function): void {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
}

/**
 * 消息服务单例
 * @type {MessageService}
 */
export const messageService = new MessageService()