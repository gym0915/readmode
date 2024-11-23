import { icons } from "~/assets/icons"
import { createLogger } from "~/utils/logger"

const logger = createLogger("background")

// 设置图标为灰色且禁用
const setIconDisabled = async (tabId: number) => {
  await chrome.action.setIcon({
    tabId,
    path: {
      "16": icons["16-gray"],
      "32": icons["32-gray"]
    }
  })
  await chrome.action.disable(tabId)
}

// 设置图标为正常且启用
const setIconEnabled = async (tabId: number) => {
  await chrome.action.setIcon({
    tabId,
    path: {
      "16": icons["16"],
      "32": icons["32"]
    }
  })
  await chrome.action.enable(tabId)
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading") {
    logger.debug(`Tab ${tabId} is loading, setting icon to disabled`)
    setIconDisabled(tabId)
  } else if (changeInfo.status === "complete") {
    logger.debug(`Tab ${tabId} completed loading, setting icon to enabled`)
    setIconEnabled(tabId)
  }
})

// 监听标签页激活事件，确保切换标签时图标状态正确
chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  if (tab.status === "complete") {
    setIconEnabled(tabId)
  } else {
    setIconDisabled(tabId)
  }
}) 