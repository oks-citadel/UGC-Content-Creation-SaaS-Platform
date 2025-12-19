// =============================================================================
// Crypto Utilities
// =============================================================================

import { nanoid, customAlphabet } from 'nanoid';

// ID generation
export function generateId(size = 21): string {
  return nanoid(size);
}

export function generateShortId(size = 8): string {
  return nanoid(size);
}

const numericNanoid = customAlphabet('0123456789', 6);
export function generateNumericCode(size = 6): string {
  return numericNanoid(size);
}

const alphanumericNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
export function generateAlphanumericCode(size = 8): string {
  return alphanumericNanoid(size);
}

const urlSafeNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_', 16);
export function generateUrlSafeToken(size = 16): string {
  return urlSafeNanoid(size);
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// API key generation
export function generateApiKey(prefix = 'nx'): { key: string; keyPrefix: string; keyHash: string } {
  const id = generateShortId(8);
  const secret = generateUrlSafeToken(32);
  const key = `${prefix}_${id}_${secret}`;
  const keyPrefix = `${prefix}_${id}`;

  // In production, use proper hashing (bcrypt/argon2)
  const keyHash = btoa(key);

  return { key, keyPrefix, keyHash };
}

// Token generation for email verification, password reset, etc.
export function generateSecureToken(size = 32): string {
  const array = new Uint8Array(size);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < size; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Discount/promo code generation
export function generatePromoCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Referral code generation
export function generateReferralCode(userId: string): string {
  const userPart = userId.slice(0, 4).toUpperCase();
  const randomPart = generateAlphanumericCode(4);
  return `${userPart}${randomPart}`;
}

// Simple string hashing (for non-security purposes like caching keys)
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate consistent hash for object (for caching)
export function objectHash(obj: unknown): string {
  return simpleHash(JSON.stringify(obj));
}

// Webhook signature verification helper
export function createHmacSignature(payload: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    return crypto.subtle
      .importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then((key) => crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
      .then((signature) =>
        Array.from(new Uint8Array(signature))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      );
  }
  // Fallback - in production use a proper crypto library
  return Promise.resolve(simpleHash(payload + secret));
}

export function verifyHmacSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  return createHmacSignature(payload, secret).then((expected) => expected === signature);
}

// Obfuscation helpers
export function obfuscateId(id: string, salt = 'nexus'): string {
  const combined = `${salt}:${id}`;
  return btoa(combined).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function deobfuscateId(obfuscated: string, salt = 'nexus'): string | null {
  try {
    const padded = obfuscated.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    const [decodedSalt, id] = decoded.split(':');
    if (decodedSalt !== salt || !id) return null;
    return id;
  } catch {
    return null;
  }
}
