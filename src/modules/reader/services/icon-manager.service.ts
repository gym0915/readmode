import { icons } from "~/assets/icons"
import { createLogger } from "~/shared/utils/logger"

const logger = createLogger("icon-manager")

/**
 * 图标管理服务
 * 负责管理扩展图标的状态和显示
 * 
 * @class IconManagerService
 * @description
 * 这个服务类负责管理扩展图标的状态,包括:
 * - 切换图标的启用/禁用状态
 * - 更新图标的显示样式
 * - 响应页面加载状态的变化
 * 
 * @example
 * const iconManager = new IconManagerService();
 * await iconManager.setIconEnabled(tabId);
 */
export class IconManagerService {
  /**
   * 设置图标为禁用状态
   * 
   * @param {number} tabId - 标签页ID
   * @returns {Promise<void>}
   * 
   * @description
   * 将扩展图标设置为灰色且禁用状态,
   * 通常在页面加载或不支持阅读模式时使用
   * 
   * @example
   * await iconManager.setIconDisabled(123);
   */
  async setIconDisabled(tabId: number): Promise<void> {
    await chrome.action.setIcon({
      tabId,
      path: {
        "16": icons["16-gray"],
        "32": icons["32-gray"]
      }
    })
    await chrome.action.disable(tabId)
    logger.debug(`Icon disabled for tab ${tabId}`)
  }

  /**
   * 设置图标为启用状态
   * 
   * @param {number} tabId - 标签页ID
   * @returns {Promise<void>}
   * 
   * @description
   * 将扩展图标设置为正常颜色且可用状态,
   * 通常在页面加载完成且支持阅读模式时使用
   * 
   * @example
   * await iconManager.setIconEnabled(123);
   */
  async setIconEnabled(tabId: number): Promise<void> {
    await chrome.action.setIcon({
      tabId,
      path: {
        "16": icons["16"],
        "32": icons["32"]
      }
    })
    await chrome.action.enable(tabId)
    logger.debug(`Icon enabled for tab ${tabId}`)
  }
} 