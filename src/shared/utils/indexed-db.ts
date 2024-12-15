import { createLogger, ELogLevel } from "./logger"

const logger = createLogger("IndexedDB", ELogLevel.DEBUG)

export class IndexedDBManager {
  private static instance: IndexedDBManager
  private db: IDBDatabase | null = null
  private readonly dbName = "readmode"
  private readonly storeName = "llmModels"
  private readonly version = 1

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
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = (event) => {
        logger.error("数据库打开失败", event)
        reject(new Error("数据库打开失败"))
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        logger.debug("数据库打开成功")
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
          logger.debug("创建数据存储对象成功")
        }
      }
    })
  }

  public async saveData(key: string, value: any): Promise<void> {
    if (!this.db) {
      throw new Error("数据库未初始化")
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.put(value, key)

      request.onsuccess = () => {
        logger.debug("数据保存成功", { key })
        resolve()
      }

      request.onerror = (event) => {
        logger.error("数据保存失败", event)
        reject(new Error("数据保存失败"))
      }
    })
  }

  public async getData(key: string): Promise<any> {
    if (!this.db) {
      throw new Error("数据库未初始化")
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        logger.debug("数据读取成功", { key, value: request.result })
        resolve(request.result)
      }

      request.onerror = (event) => {
        logger.error("数据读取失败", event)
        reject(new Error("数据读取失败"))
      }
    })
  }
} 