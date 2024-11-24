/**
 * iframe 管理服务
 * 负责创建和管理阅读模式的 iframe
 */

import { createLogger } from '~/shared/utils/logger'

const logger = createLogger('reader-frame')

export class ReaderFrameService {
  private readonly FRAME_ID = 'readmode-frame'

  /**
   * 创建阅读模式框架
   */
  private createFrame(): HTMLIFrameElement {
    const frame = document.createElement('iframe')
    frame.id = this.FRAME_ID
    frame.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      border: none;
      background: #F8F9FA;
      z-index: 2147483647;
      opacity: 0;
      transition: opacity 0.3s ease;
      will-change: opacity;
    `
    return frame
  }

  /**
   * 检查阅读模式是否可见
   */
  isVisible(): boolean {
    return !!document.getElementById(this.FRAME_ID)
  }

  /**
   * 切换阅读模式显示状态
   * @param show 是否显示
   * @returns 当前显示状态
   */
  toggleFrame(show: boolean): boolean {
    const existingFrame = document.getElementById(this.FRAME_ID) as HTMLIFrameElement
    
    if (existingFrame && !show) {
      existingFrame.style.opacity = '0'
      setTimeout(() => existingFrame.remove(), 300)
      logger.debug('Reader frame removed')
      return false
    } else if (!existingFrame && show) {
      const frame = this.createFrame()
      document.body.appendChild(frame)
      requestAnimationFrame(() => {
        frame.style.opacity = '1'
      })
      logger.debug('Reader frame created')
      return true
    }
    return this.isVisible()
  }
} 