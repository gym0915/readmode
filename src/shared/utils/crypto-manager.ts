import { Logger } from '../../modules/llm/utils/logger';
import { generateUserSpecificKey, generateRandomKey, validateKeyStrength } from './crypto';

const logger = Logger.getInstance('CryptoManager');

/**
 * 密钥管理器
 * 负责密钥的生成、存储和获取，以及数据的加密解密
 */
export class CryptoManager {
  private static readonly KEY_STORAGE_NAME = 'llm_encryption_key';
  private static readonly KEY_VERSION = 'v1';
  private static instance: CryptoManager;
  private encryptionKey: string | null = null;
  private cryptoKey: CryptoKey | null = null;

  private constructor() {}

  /**
   * 获取CryptoManager单例
   */
  static getInstance(): CryptoManager {
    if (!CryptoManager.instance) {
      CryptoManager.instance = new CryptoManager();
      logger.debug('创建新的CryptoManager实例');
    }
    return CryptoManager.instance;
  }

  /**
   * 初始化密钥管理器
   * 尝试从存储中获取密钥，如果不存在则生成新密钥
   */
  async initialize(): Promise<void> {
    try {
      logger.info('开始初始化密钥管理器');
      // 尝试获取已存储的密钥
      const stored = await chrome.storage.local.get([CryptoManager.KEY_STORAGE_NAME]);
      
      if (stored[CryptoManager.KEY_STORAGE_NAME]) {
        this.encryptionKey = stored[CryptoManager.KEY_STORAGE_NAME];
        logger.info('成功加载已存储的密钥');
        
        // 验证已存储密钥的有效性
        if (!validateKeyStrength(this.encryptionKey)) {
          logger.warn('已存储的密钥不满足当前的强度要求，将重新生成');
          await this.resetKey();
        }
      } else {
        logger.info('未找到已存储的密钥，将生成新密钥');
        // 生成新密钥
        const newKey = await this.generateNewKey();
        // 存储密钥
        await this.storeKey(newKey);
        this.encryptionKey = newKey;
        logger.info('成功生成并存储新密钥');
      }

      // 初始化 CryptoKey
      await this.initializeCryptoKey();
    } catch (error) {
      logger.error('密钥初始化失败', { error });
      throw new Error('密钥初始化失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 初始化 CryptoKey
   */
  private async initializeCryptoKey(): Promise<void> {
    try {
      if (!this.encryptionKey) {
        throw new Error('加密密钥未初始化');
      }

      const encoder = new TextEncoder();
      const keyData = encoder.encode(this.encryptionKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
      
      this.cryptoKey = await crypto.subtle.importKey(
        'raw',
        hashBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
      );
      
      logger.debug('CryptoKey初始化成功');
    } catch (error) {
      logger.error('CryptoKey初始化失败', { error });
      throw error;
    }
  }

  /**
   * 生成新密钥
   * 结合用户特定信息和随机生成的密钥
   */
  private async generateNewKey(): Promise<string> {
    try {
      logger.debug('开始生成新密钥');
      const userKey = await generateUserSpecificKey();
      const randomKey = generateRandomKey();
      const combinedKey = `${userKey}.${randomKey}.${CryptoManager.KEY_VERSION}`;
      
      if (!validateKeyStrength(combinedKey)) {
        const error = new Error('生成的密钥强度不足');
        logger.error('密钥强度验证失败', { error });
        throw error;
      }
      
      logger.debug('成功生成新密钥');
      return combinedKey;
    } catch (error) {
      logger.error('生成新密钥失败', { error });
      throw new Error('生成新密钥失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 存储密钥到本地存储
   */
  private async storeKey(key: string): Promise<void> {
    try {
      logger.debug('开始存储密钥');
      await chrome.storage.local.set({
        [CryptoManager.KEY_STORAGE_NAME]: key
      });
      logger.debug('密钥存储成功');
    } catch (error) {
      logger.error('存储密钥失败', { error });
      throw new Error('存储密钥失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 获取当前密钥
   */
  getKey(): string {
    if (!this.encryptionKey) {
      const error = new Error('加密密钥未初始化');
      logger.error('获取密钥失败', { error });
      throw error;
    }
    return this.encryptionKey;
  }

  /**
   * 重置密钥
   * 生成新密钥并替换旧密钥
   */
  async resetKey(): Promise<void> {
    try {
      logger.info('开始重置密钥');
      const newKey = await this.generateNewKey();
      await this.storeKey(newKey);
      this.encryptionKey = newKey;
      await this.initializeCryptoKey();
      logger.info('密钥重置成功');
    } catch (error) {
      logger.error('密钥重置失败', { error });
      throw new Error('密钥重置失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 加密数据
   * @param data 要加密的数据
   * @returns 加密后的数据（Base64编码）
   */
  async encrypt(data: string): Promise<string> {
    try {
      if (!this.cryptoKey) {
        throw new Error('CryptoKey未初始化');
      }

      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = encoder.encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.cryptoKey,
        encodedData
      );

      // 将 IV 和加密数据合并并转换为 Base64
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('数据加密失败', { error });
      throw new Error('数据加密失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据（Base64编码）
   * @returns 解密后的数据
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!this.cryptoKey) {
        throw new Error('CryptoKey未初始化');
      }

      // 解码 Base64
      const combined = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      // 分离 IV 和加密数据
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        this.cryptoKey,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      logger.error('数据解密失败', { error });
      throw new Error('数据解密失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }
} 