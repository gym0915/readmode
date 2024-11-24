import { icons } from "~/assets/icons"
import { createLogger } from "~/shared/utils/logger"

const logger = createLogger("icon-manager")

export class IconManagerService {
  /**
   * 设置图标为灰色且禁用
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
   * 设置图标为正常且启用
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