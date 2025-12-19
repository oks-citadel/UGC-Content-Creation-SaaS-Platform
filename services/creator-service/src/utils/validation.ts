import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email().toLowerCase();

export const urlSchema = z.string().url();

export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/);

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const socialHandleSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9._]+$/, 'Handle can only contain letters, numbers, periods, and underscores');

export const decimalSchema = z.number().or(
  z.string().transform((val) => parseFloat(val))
);

// Validation helpers
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function isValidUrl(url: string): boolean {
  return urlSchema.safeParse(url).success;
}

export function isValidSocialHandle(handle: string): boolean {
  return socialHandleSchema.safeParse(handle).success;
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function normalizeSocialHandle(handle: string): string {
  return handle.toLowerCase().trim().replace(/^@/, '');
}

// File validation
export function isValidFileType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

export function isValidFileSize(size: number, maxSize: number): boolean {
  return size > 0 && size <= maxSize;
}

// Niche validation
const validNiches = [
  'fashion',
  'beauty',
  'fitness',
  'food',
  'travel',
  'tech',
  'gaming',
  'lifestyle',
  'parenting',
  'pets',
  'home',
  'business',
  'education',
  'entertainment',
  'sports',
  'health',
  'art',
  'music',
  'photography',
  'other',
];

export function isValidNiche(niche: string): boolean {
  return validNiches.includes(niche.toLowerCase());
}

export function getValidNiches(): string[] {
  return [...validNiches];
}

// Country validation (ISO 3166-1 alpha-2)
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

// Language validation (ISO 639-1)
export function isValidLanguageCode(code: string): boolean {
  return /^[a-z]{2}$/.test(code);
}

// Engagement rate validation (0-100%)
export function isValidEngagementRate(rate: number): boolean {
  return rate >= 0 && rate <= 1;
}

// Reputation score validation (0-5)
export function isValidReputationScore(score: number): boolean {
  return score >= 0 && score <= 5;
}
