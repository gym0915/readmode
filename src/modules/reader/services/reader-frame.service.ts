/**
 * iframe 管理服务
 * 负责创建和管理阅读模式的 iframe 容器
 * 
 * @class ReaderFrameService
 * @description
 * 这个服务类负责管理阅读模式的 iframe 容器,主要功能包括:
 * - 创建阅读模式的 iframe 容器
 * - 管理 iframe 的显示状态
 * - 处理 iframe 的动画效果
 * - 提供 iframe 状态查询接口
 * 
 * @example
 * const frameService = new ReaderFrameService();
 * const isVisible = frameService.toggleFrame(true);
 */

import { createLogger } from '~/shared/utils/logger'

const logger = createLogger('reader-frame')

export class ReaderFrameService {
  private readonly FRAME_ID = 'readmode-frame'

  /**
   * 创建阅读模式框架
   * 
   * @private
   * @returns {HTMLIFrameElement} 创建的 iframe 元素
   * 
   * @description
   * 创建一个全屏的 iframe 元素,用于显示阅读模式内容。
   * 设置了必要的样式属性:
   * - 固定定位和全屏显示
   * - 最高层级确保显示
   * - 透明度动画过渡效果
   * 
   * @example
   * const frame = this.createFrame();
   * document.body.appendChild(frame);
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
      opacity: 0.5;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: opacity;
    `
    return frame
  }

  /**
   * 检查阅读模式是否可见
   * 
   * @returns {boolean} 阅读模式是否可见
   * 
   * @description
   * 通过检查 DOM 中是否存在指定 ID 的 iframe 来判断
   * 阅读模式是否处于可见状态
   * 
   * @example
   * if (frameService.isVisible()) {
   *   console.log('Reader mode is active');
   * }
   */
  isVisible(): boolean {
    return !!document.getElementById(this.FRAME_ID)
  }

  /**
   * 切换阅读模式显示状态
   * 
   * @param {boolean} show - 是否显示阅读模式
   * @returns {boolean} 切换后的显示状态
   * 
   * @description
   * 这个方法负责处理阅读模式的显示和隐藏:
   * 1. 如果需要隐藏,会先执行淡出动画再移除 iframe
   * 2. 如果需要显示,会创建新的 iframe 并执行淡入动画
   * 3. 使用 requestAnimationFrame 确保动画流畅
   * 
   * @example
   * // 显示阅读模式
   * frameService.toggleFrame(true);
   * 
   * // 隐藏阅读模式
   * frameService.toggleFrame(false);
   */
  toggleFrame(show: boolean): boolean {
    const existingFrame = document.getElementById(this.FRAME_ID) as HTMLIFrameElement
    
    if (existingFrame && !show) {
      existingFrame.style.opacity = '0'
      setTimeout(() => existingFrame.remove(), 400)
      logger.debug('Reader frame removed')
      return false
    } else if (!existingFrame && show) {
      const frame = this.createFrame()
      document.body.appendChild(frame)
      setTimeout(() => {
        requestAnimationFrame(() => {
          frame.style.opacity = '1'
        })
      }, 0)
      logger.debug('Reader frame created')
      return true
    }
    return this.isVisible()
  }
} 