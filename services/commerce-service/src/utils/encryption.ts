import CryptoJS from 'crypto-js';
import config from '../config';

/**
 * Encrypt sensitive data
 */
export const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, config.jwt.secret).toString();
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, config.jwt.secret);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hash data (one-way)
 */
export const hash = (data: string): string => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Generate random token
 */
export const generateToken = (length: number = 32): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};
