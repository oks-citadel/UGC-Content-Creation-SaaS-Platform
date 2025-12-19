// =============================================================================
// Validators Unit Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidUrl,
  isValidUUID,
  isValidPhone,
  isValidPassword,
  getPasswordStrength,
  isValidUsername,
  isValidSlug,
  isValidHashtag,
  normalizeHashtag,
  isValidSocialHandle,
  isValidCreditCard,
  isValidDateRange,
  isValidMoney,
  isValidAspectRatio,
  isValidMimeType,
  getFileCategory,
} from '@nexus/utils';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@company.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://subdomain.example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhone('+14155552671')).toBe(true);
      expect(isValidPhone('+442071838750')).toBe(true);
      expect(isValidPhone('+1 (415) 555-2671')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc')).toBe(false);
      expect(isValidPhone('+1234567890123456')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('SecurePass123')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('alllowercase')).toBe(false);
      expect(isValidPassword('ALLUPPERCASE')).toBe(false);
      expect(isValidPassword('NoNumbers')).toBe(false);
    });
  });

  describe('getPasswordStrength', () => {
    it('should rate weak passwords', () => {
      const result = getPasswordStrength('weak');
      expect(result.label).toBe('weak');
      expect(result.score).toBeLessThan(3);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should rate fair passwords', () => {
      const result = getPasswordStrength('FairPass1');
      expect(result.label).toBe('fair');
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('should rate good passwords', () => {
      const result = getPasswordStrength('GoodPass123');
      expect(result.label).toBe('good');
      expect(result.score).toBeGreaterThanOrEqual(4);
    });

    it('should rate strong passwords', () => {
      const result = getPasswordStrength('Str0ng!P@ssw0rd');
      expect(result.label).toBe('strong');
      expect(result.score).toBe(6);
      expect(result.suggestions.length).toBe(0);
    });
  });

  describe('isValidUsername', () => {
    it('should validate correct usernames', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('test_user')).toBe(true);
      expect(isValidUsername('UserName')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(isValidUsername('ab')).toBe(false); // too short
      expect(isValidUsername('user-name')).toBe(false); // hyphen not allowed
      expect(isValidUsername('user@name')).toBe(false); // special char
      expect(isValidUsername('a'.repeat(31))).toBe(false); // too long
    });
  });

  describe('isValidSlug', () => {
    it('should validate correct slugs', () => {
      expect(isValidSlug('my-campaign')).toBe(true);
      expect(isValidSlug('campaign-2024')).toBe(true);
      expect(isValidSlug('test')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('My Campaign')).toBe(false); // spaces
      expect(isValidSlug('CAMPAIGN')).toBe(false); // uppercase
      expect(isValidSlug('campaign_name')).toBe(false); // underscore
      expect(isValidSlug('campaign-')).toBe(false); // trailing hyphen
    });
  });

  describe('isValidHashtag', () => {
    it('should validate correct hashtags', () => {
      expect(isValidHashtag('#ugc')).toBe(true);
      expect(isValidHashtag('ugc')).toBe(true);
      expect(isValidHashtag('#UGC2024')).toBe(true);
    });

    it('should reject invalid hashtags', () => {
      expect(isValidHashtag('#ugc campaign')).toBe(false);
      expect(isValidHashtag('#ugc-campaign')).toBe(false);
    });
  });

  describe('normalizeHashtag', () => {
    it('should normalize hashtags with # prefix', () => {
      expect(normalizeHashtag('ugc')).toBe('#ugc');
      expect(normalizeHashtag('#ugc')).toBe('#ugc');
    });

    it('should convert to lowercase', () => {
      expect(normalizeHashtag('UGC')).toBe('#ugc');
      expect(normalizeHashtag('#UGC2024')).toBe('#ugc2024');
    });
  });

  describe('isValidSocialHandle', () => {
    it('should validate TikTok handles', () => {
      expect(isValidSocialHandle('@creator', 'tiktok')).toBe(true);
      expect(isValidSocialHandle('creator123', 'tiktok')).toBe(true);
    });

    it('should validate Instagram handles', () => {
      expect(isValidSocialHandle('@instagram_user', 'instagram')).toBe(true);
      expect(isValidSocialHandle('user.name', 'instagram')).toBe(true);
    });

    it('should validate Twitter handles', () => {
      expect(isValidSocialHandle('@twitter', 'twitter')).toBe(true);
      expect(isValidSocialHandle('user_123', 'twitter')).toBe(true);
    });

    it('should reject invalid handles', () => {
      expect(isValidSocialHandle('@a', 'tiktok')).toBe(false); // too short
      expect(isValidSocialHandle('@' + 'a'.repeat(25), 'tiktok')).toBe(false); // too long
    });
  });

  describe('isValidCreditCard', () => {
    it('should validate correct credit card numbers (Luhn check)', () => {
      expect(isValidCreditCard('4532015112830366')).toBe(true); // Visa
      expect(isValidCreditCard('5425233430109903')).toBe(true); // Mastercard
    });

    it('should reject invalid credit card numbers', () => {
      expect(isValidCreditCard('1234567890123456')).toBe(false);
      expect(isValidCreditCard('123')).toBe(false);
      expect(isValidCreditCard('abcd')).toBe(false);
    });

    it('should handle formatted card numbers', () => {
      expect(isValidCreditCard('4532-0151-1283-0366')).toBe(true);
      expect(isValidCreditCard('4532 0151 1283 0366')).toBe(true);
    });
  });

  describe('isValidDateRange', () => {
    it('should validate correct date ranges', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      expect(isValidDateRange(start, end)).toBe(true);
    });

    it('should allow same date for start and end', () => {
      const date = new Date('2024-01-01');
      expect(isValidDateRange(date, date)).toBe(true);
    });

    it('should reject invalid date ranges', () => {
      const start = new Date('2024-12-31');
      const end = new Date('2024-01-01');
      expect(isValidDateRange(start, end)).toBe(false);
    });
  });

  describe('isValidMoney', () => {
    it('should validate valid money amounts', () => {
      expect(isValidMoney(100)).toBe(true);
      expect(isValidMoney(0)).toBe(true);
      expect(isValidMoney(99.99)).toBe(true);
    });

    it('should reject invalid money amounts', () => {
      expect(isValidMoney(-10)).toBe(false);
      expect(isValidMoney(NaN)).toBe(false);
      expect(isValidMoney(Infinity)).toBe(false);
    });
  });

  describe('isValidAspectRatio', () => {
    it('should validate common aspect ratios', () => {
      expect(isValidAspectRatio('1:1')).toBe(true);
      expect(isValidAspectRatio('16:9')).toBe(true);
      expect(isValidAspectRatio('9:16')).toBe(true);
      expect(isValidAspectRatio('4:5')).toBe(true);
    });

    it('should reject invalid aspect ratios', () => {
      expect(isValidAspectRatio('16/9')).toBe(false);
      expect(isValidAspectRatio('21:9')).toBe(false);
      expect(isValidAspectRatio('invalid')).toBe(false);
    });
  });

  describe('isValidMimeType', () => {
    it('should validate image mime types', () => {
      expect(isValidMimeType('image/jpeg', 'image')).toBe(true);
      expect(isValidMimeType('image/png', 'image')).toBe(true);
      expect(isValidMimeType('image/webp', 'image')).toBe(true);
    });

    it('should validate video mime types', () => {
      expect(isValidMimeType('video/mp4', 'video')).toBe(true);
      expect(isValidMimeType('video/webm', 'video')).toBe(true);
    });

    it('should reject invalid mime types', () => {
      expect(isValidMimeType('image/bmp', 'image')).toBe(false);
      expect(isValidMimeType('video/mp4', 'image')).toBe(false);
    });
  });

  describe('getFileCategory', () => {
    it('should categorize image files', () => {
      expect(getFileCategory('image/jpeg')).toBe('image');
      expect(getFileCategory('image/png')).toBe('image');
    });

    it('should categorize video files', () => {
      expect(getFileCategory('video/mp4')).toBe('video');
      expect(getFileCategory('video/quicktime')).toBe('video');
    });

    it('should categorize audio files', () => {
      expect(getFileCategory('audio/mpeg')).toBe('audio');
      expect(getFileCategory('audio/wav')).toBe('audio');
    });

    it('should categorize document files', () => {
      expect(getFileCategory('application/pdf')).toBe('document');
    });

    it('should return unknown for unrecognized types', () => {
      expect(getFileCategory('application/octet-stream')).toBe('unknown');
      expect(getFileCategory('text/plain')).toBe('unknown');
    });
  });
});
