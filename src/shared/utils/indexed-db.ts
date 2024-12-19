import { createLogger, ELogLevel } from "./logger"

const logger = createLogger("IndexedDB", ELogLevel.DEBUG)

export class IndexedDBManager {
  private static instance: IndexedDBManager
  private db: IDBDatabase | null = null
  private readonly dbName = "readmode"
  private readonly version = 2
  private readonly stores = ["llmModels", "generalConfig"]

  private constructor() {}

  public static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager()
    }
    return IndexedDBManager.instance
  }

  public async initialize(): Promise<void> {
    if (this.db) return

    return new Promise((resolve, reject) => {
      logger.debug("开始打开数据库", { dbName: this.dbName, version: this.version })
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = (event) => {
        logger.error("数据库打开失败", event)
        reject(new Error("数据库打开失败"))
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        logger.debug("数据库打开成功", {
          dbName: this.db.name,
          version: this.db.version,
          objectStoreNames: Array.from(this.db.objectStoreNames)
        })
        resolve()
      }

      request.onupgradeneeded = (event) => {
        logger.debug("数据库需要升级", { 
          oldVersion: event.oldVersion,
          newVersion: event.newVersion
        })
        
        const db = (event.target as IDBOpenDBRequest).result
        
        // 检查并创建所需的存储对象
        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName)
            logger.debug(`创建数据存储对象成功: ${storeName}`)
          } else {
            logger.debug(`数据存储对象已存在: ${storeName}`)
          }
        })
      }
    })
  }

  public async saveData(key: string, value: any, storeName: string = "llmModels"): Promise<void> {
    if (!this.db) {
      logger.error("数据库未初始化")
      throw new Error("数据库未初始化")
    }

    if (!this.stores.includes(storeName)) {
      logger.error(`不存在的存储对象: ${storeName}`)
      throw new Error(`不存在的存储对象: ${storeName}`)
    }

    if (!this.db.objectStoreNames.contains(storeName)) {
      logger.error(`存储对象未创建: ${storeName}`)
      throw new Error(`存储对象未创建: ${storeName}`)
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readwrite")
        const store = transaction.objectStore(storeName)
        const request = store.put(value, key)

        request.onsuccess = () => {
          logger.debug("数据保存成功", { key, storeName, value })
          resolve()
        }

        request.onerror = (event) => {
          logger.error("数据保存失败", event)
          reject(new Error("数据保存失败"))
        }
      } catch (error) {
        logger.error("创建事务失败", error)
        reject(error)
      }
    })
  }

  public async getData(key: string, storeName: string = "llmModels"): Promise<any> {
    if (!this.db) {
      logger.error("数据库未初始化")
      throw new Error("数据库未初始化")
    }

    if (!this.stores.includes(storeName)) {
      logger.error(`不存在的存储对象: ${storeName}`)
      throw new Error(`不存在的存储对象: ${storeName}`)
    }

    if (!this.db.objectStoreNames.contains(storeName)) {
      logger.error(`存储对象未创建: ${storeName}`)
      throw new Error(`存储对象未创建: ${storeName}`)
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([storeName], "readonly")
        const store = transaction.objectStore(storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          logger.debug("数据读取成功", { key, storeName, value: request.result })
          resolve(request.result)
        }

        request.onerror = (event) => {
          logger.error("数据读取失败", event)
          reject(new Error("数据读取失败"))
        }
      } catch (error) {
        logger.error("创建事务失败", error)
        reject(error)
      }
    })
  }

  public async deleteDatabase(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName)

      request.onsuccess = () => {
        logger.debug("数据库删除成功")
        resolve()
      }

      request.onerror = (event) => {
        logger.error("数据库删除失败", event)
        reject(new Error("数据库删除失败"))
      }
    })
  }
} 