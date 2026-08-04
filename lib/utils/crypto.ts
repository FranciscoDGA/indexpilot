import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0'.repeat(64); // 32 bytes for AES-256

/**
 * Encrypt sensitive data for storage
 */
export function encryptData(data: string): string {
  try {
    const iv = randomBytes(12);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex').length < 32
      ? Buffer.alloc(32)
      : Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split('.');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex').length < 32
      ? Buffer.alloc(32)
      : Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate random string
 */
export function generateRandomString(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Hash string (for comparison, not storage)
 */
export function hashString(str: string): string {
  const { createHash } = require('crypto');
  return createHash('sha256').update(str).digest('hex');
}
