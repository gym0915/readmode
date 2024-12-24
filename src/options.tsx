import React from "react"
import { createRoot } from "react-dom/client"
import Options from "~/pages/options/Options"
import { ToastContainer } from 'react-toastify'
import "./style.css"
import 'react-toastify/dist/ReactToastify.css'

// 导入 i18n 配置
import './i18n/config'
import { IndexedDBManager } from "./shared/utils/indexed-db"
import { GENERAL_CONFIG_KEY, STORE_NAME } from "./shared/constants/storage"
import i18n from "./i18n/config"
import { createLogger } from "./shared/utils/logger"

const logger = createLogger('options')

// 从 IndexedDB 加载语言设置
const loadLanguageConfig = async () => {
  try {
    const indexedDB = IndexedDBManager.getInstance()
    await indexedDB.initialize()
    const config = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME)
    
    if (config && config.language) {
      await i18n.changeLanguage(config.language)
      logger.debug('已加载语言配置:', config.language)
    }
  } catch (error) {
    logger.error('加载语言配置失败:', error)
  }
}

// 初始化应用
const initializeApp = async () => {
  try {
    // 1. 首先尝试加载保存的语言配置
    const indexedDB = IndexedDBManager.getInstance()
    await indexedDB.initialize()
    const config = await indexedDB.getData(GENERAL_CONFIG_KEY, STORE_NAME)
    
    // 2. 如果有配置就使用配置的语言，否则使用中文
    const language = config?.language || 'zh'
    await i18n.changeLanguage(language)
    logger.debug('初始化语言设置:', language)
    
    // 3. 渲染应用
    const root = document.getElementById("root")
    if (root) {
      createRoot(root).render(
        <React.StrictMode>
          <Options />
          <ToastContainer />
        </React.StrictMode>
      )
    }
  } catch (error) {
    logger.error('初始化应用失败:', error)
    // 出错时使用中文
    await i18n.changeLanguage('zh')
  }
}

// 确保在 DOMContentLoaded 后初始化
document.addEventListener('DOMContentLoaded', () => {
  void initializeApp()
}) 