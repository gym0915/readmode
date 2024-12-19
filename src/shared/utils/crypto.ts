import { Logger } from '../../modules/llm/utils/logger';

const logger = Logger.getInstance('Crypto');

/**
 * 生成用户特定的密钥
 * 基于设备信息和时间戳生成唯一密钥
 */
export const generateUserSpecificKey = async (): Promise<string> => {
  try {
    // 获取设备信息
    const platformInfo = await chrome.runtime.getPlatformInfo()
    
    // 使用设备信息和时间戳生成唯一标识
    const uniqueInfo = {
      os: platformInfo.os,
      arch: platformInfo.arch,
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    }
    
    // 组合信息
    const combinedInfo = JSON.stringify(uniqueInfo)
    
    // 使用 Web Crypto API 生成密钥
    const encoder = new TextEncoder()
    const data = encoder.encode(combinedInfo)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashBase64 = btoa(String.fromCharCode(...hashArray))
    
    return hashBase64
  } catch (error) {
    logger.error('生成密钥失败', { error })
    // 如果获取平台信息失败，使用备���方案
    const fallbackInfo = {
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2),
      userAgent: navigator.userAgent
    }
    
    const combinedInfo = JSON.stringify(fallbackInfo)
    const encoder = new TextEncoder()
    const data = encoder.encode(combinedInfo)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashBase64 = btoa(String.fromCharCode(...hashArray))
    
    return hashBase64
  }
}

/**
 * 生成随机密钥
 * 使用加密安全的随机数生成器
 */
export const generateRandomKey = (): string => {
  try {
    // 使用 Web Crypto API 生成随机字节
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  } catch (error) {
    logger.error('生成随机密钥失败', { error });
    throw error;
  }
};

/**
 * 验证密钥强度
 * @param key 待验证的密钥
 * @returns boolean 是否满足强度要求
 */
export const validateKeyStrength = (key: string): boolean => {
  const MIN_KEY_LENGTH = 32;
  const REQUIRED_PATTERNS = [
    /[A-Z]/, // 大写字母
    /[a-z]/, // 小写字母
    /[0-9]/, // 数字
    /[^A-Za-z0-9]/ // 特殊字符
  ];

  if (key.length < MIN_KEY_LENGTH) {
    logger.warn('密钥长度不足', { length: key.length, required: MIN_KEY_LENGTH });
    return false;
  }

  const missingPatterns = REQUIRED_PATTERNS.filter(pattern => !pattern.test(key));
  if (missingPatterns.length > 0) {
    logger.warn('密钥复杂度不足', { missingPatterns: missingPatterns.length });
    return false;
  }

  return true;
};

/**
 * 解密文本
 * @param encryptedText 加密的文本
 * @returns 解密后的文本
 */
export async function decryptText(encryptedText?: string): Promise<string> {
  if (!encryptedText) return ''
  
  try {
    // TODO: 实现实际的解密逻辑
    return encryptedText
  } catch (error) {
    console.error('解密失败:', error)
    return ''
  }
}