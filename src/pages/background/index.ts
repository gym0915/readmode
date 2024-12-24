import { IndexedDBManager } from "~/shared/utils/indexed-db"

// 监听关闭数据库连接的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CLOSE_INDEXEDDB_CONNECTION') {
    const indexedDB = IndexedDBManager.getInstance()
    if (indexedDB.isConnected()) {
      indexedDB.closeConnection()
    }
    sendResponse({ success: true })
  }
}) 