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
  await loadLanguageConfig()
  
  const root = document.getElementById("root")
  if (root) {
    createRoot(root).render(
      <React.StrictMode>
        <Options />
        <ToastContainer />
      </React.StrictMode>
    )
  }
}

// 启动应用
void initializeApp() 