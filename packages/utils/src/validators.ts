// =============================================================================
// Validators - Input Validation Utilities
// =============================================================================

import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

// URL validation
export const urlSchema = z.string().url('Invalid URL');

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

// UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const uuidSchema = z.string().regex(uuidRegex, 'Invalid UUID');

export function isValidUUID(id: string): boolean {
  return uuidRegex.test(id);
}

// Phone validation (basic international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const phoneSchema = z.string().regex(phoneRegex, 'Invalid phone number');

export function isValidPhone(phone: string): boolean {
  return phoneRegex.test(phone.replace(/[\s\-().]/g, ''));
}

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: 'weak' | 'fair' | 'good' | 'strong';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else suggestions.push('Add special characters');

  const labels: Record<number, 'weak' | 'fair' | 'good' | 'strong'> = {
    0: 'weak',
    1: 'weak',
    2: 'fair',
    3: 'fair',
    4: 'good',
    5: 'good',
    6: 'strong',
  };

  return {
    score,
    label: labels[Math.min(score, 6)] as 'weak' | 'fair' | 'good' | 'strong',
    suggestions,
  };
}

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export function isValidUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}

// Slug validation
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

export function isValidSlug(slug: string): boolean {
  return slugSchema.safeParse(slug).success;
}

// Hashtag validation
const hashtagRegex = /^#?[a-zA-Z0-9_]+$/;

export function isValidHashtag(hashtag: string): boolean {
  return hashtagRegex.test(hashtag);
}

export function normalizeHashtag(hashtag: string): string {
  const cleaned = hashtag.replace(/^#/, '').toLowerCase();
  return `#${cleaned}`;
}

// Social handle validation
const handlePatterns: Record<string, RegExp> = {
  tiktok: /^@?[a-zA-Z0-9_.]{2,24}$/,
  instagram: /^@?[a-zA-Z0-9_.]{1,30}$/,
  twitter: /^@?[a-zA-Z0-9_]{1,15}$/,
  youtube: /^@?[a-zA-Z0-9_-]{3,30}$/,
  linkedin: /^[a-zA-Z0-9-]{3,100}$/,
};

export function isValidSocialHandle(handle: string, platform: string): boolean {
  const pattern = handlePatterns[platform.toLowerCase()];
  return pattern ? pattern.test(handle) : true;
}

// Credit card validation (basic Luhn check)
export function isValidCreditCard(number: string): boolean {
  const cleaned = number.replace(/\D/g, '');

  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i] as string, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Date range validation
export function isValidDateRange(start: Date, end: Date): boolean {
  return start <= end;
}

// Money validation
export function isValidMoney(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0;
}

// Aspect ratio validation
const validAspectRatios = ['1:1', '4:5', '9:16', '16:9', '4:3', '3:4'];

export function isValidAspectRatio(ratio: string): boolean {
  return validAspectRatios.includes(ratio);
}

// File validation
const mimeTypePatterns: Record<string, RegExp> = {
  image: /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/,
  video: /^video\/(mp4|webm|quicktime|x-msvideo)$/,
  audio: /^audio\/(mpeg|mp3|wav|ogg|aac)$/,
  document: /^application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
};

export function isValidMimeType(mimeType: string, category: keyof typeof mimeTypePatterns): boolean {
  const pattern = mimeTypePatterns[category];
  return pattern ? pattern.test(mimeType) : false;
}

export function getFileCategory(
  mimeType: string
): 'image' | 'video' | 'audio' | 'document' | 'unknown' {
  for (const [category, pattern] of Object.entries(mimeTypePatterns)) {
    if (pattern.test(mimeType)) {
      return category as 'image' | 'video' | 'audio' | 'document';
    }
  }
  return 'unknown';
}
