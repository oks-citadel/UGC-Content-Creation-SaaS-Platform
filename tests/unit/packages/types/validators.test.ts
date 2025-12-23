import { describe, it, expect } from 'vitest';

// Type validation utilities
const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const isValidISODate = (value: string): boolean => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && value.includes('T');
};

const isValidURL = (value: string): boolean => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const isValidCurrencyCode = (value: string): boolean => {
  const validCodes = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'KES', 'ZAR'];
  return validCodes.includes(value);
};

const isValidSocialPlatform = (value: string): boolean => {
  const validPlatforms = ['tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat'];
  return validPlatforms.includes(value);
};

const isValidUserRole = (value: string): boolean => {
  const validRoles = ['super_admin', 'admin', 'brand_owner', 'brand_manager', 'brand_member', 'creator', 'agency_owner', 'agency_manager', 'agency_member'];
  return validRoles.includes(value);
};

const isValidAccountType = (value: string): boolean => {
  const validTypes = ['brand', 'creator', 'agency', 'admin'];
  return validTypes.includes(value);
};

describe('Type Validators', () => {
  describe('UUID Validation', () => {
    it('should validate correct UUID v4', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    });

    it('should reject UUIDs with invalid characters', () => {
      expect(isValidUUID('123g4567-e89b-12d3-a456-426614174000')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-z456-426614174000')).toBe(false);
    });
  });

  describe('Email Validation', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('not-an-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('should reject emails with spaces', () => {
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@ example.com')).toBe(false);
    });
  });

  describe('ISO Date String Validation', () => {
    it('should validate correct ISO date strings', () => {
      expect(isValidISODate('2024-01-15T10:30:00.000Z')).toBe(true);
      expect(isValidISODate('2024-01-15T10:30:00Z')).toBe(true);
      expect(isValidISODate('2024-01-15T10:30:00+05:30')).toBe(true);
    });

    it('should reject invalid date strings', () => {
      expect(isValidISODate('not-a-date')).toBe(false);
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate('2024-13-45')).toBe(false);
    });

    it('should reject non-ISO date formats', () => {
      expect(isValidISODate('01/15/2024')).toBe(false);
      expect(isValidISODate('January 15, 2024')).toBe(false);
    });
  });

  describe('URL Validation', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com/path?query=1')).toBe(true);
      expect(isValidURL('https://sub.domain.example.com:8080/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
      expect(isValidURL('example.com')).toBe(false);
    });

    it('should validate URLs with special characters', () => {
      expect(isValidURL('https://example.com/path?name=value&other=test')).toBe(true);
      expect(isValidURL('https://example.com/path#anchor')).toBe(true);
    });
  });

  describe('Currency Code Validation', () => {
    it('should validate supported currency codes', () => {
      expect(isValidCurrencyCode('USD')).toBe(true);
      expect(isValidCurrencyCode('EUR')).toBe(true);
      expect(isValidCurrencyCode('GBP')).toBe(true);
      expect(isValidCurrencyCode('NGN')).toBe(true);
    });

    it('should reject unsupported currency codes', () => {
      expect(isValidCurrencyCode('XYZ')).toBe(false);
      expect(isValidCurrencyCode('usd')).toBe(false);
      expect(isValidCurrencyCode('')).toBe(false);
    });
  });

  describe('Social Platform Validation', () => {
    it('should validate supported social platforms', () => {
      expect(isValidSocialPlatform('tiktok')).toBe(true);
      expect(isValidSocialPlatform('instagram')).toBe(true);
      expect(isValidSocialPlatform('youtube')).toBe(true);
      expect(isValidSocialPlatform('facebook')).toBe(true);
    });

    it('should reject unsupported platforms', () => {
      expect(isValidSocialPlatform('myspace')).toBe(false);
      expect(isValidSocialPlatform('TikTok')).toBe(false);
      expect(isValidSocialPlatform('')).toBe(false);
    });
  });

  describe('User Role Validation', () => {
    it('should validate all user roles', () => {
      expect(isValidUserRole('super_admin')).toBe(true);
      expect(isValidUserRole('admin')).toBe(true);
      expect(isValidUserRole('brand_owner')).toBe(true);
      expect(isValidUserRole('brand_manager')).toBe(true);
      expect(isValidUserRole('creator')).toBe(true);
      expect(isValidUserRole('agency_owner')).toBe(true);
    });

    it('should reject invalid roles', () => {
      expect(isValidUserRole('superadmin')).toBe(false);
      expect(isValidUserRole('ADMIN')).toBe(false);
      expect(isValidUserRole('')).toBe(false);
      expect(isValidUserRole('moderator')).toBe(false);
    });
  });

  describe('Account Type Validation', () => {
    it('should validate all account types', () => {
      expect(isValidAccountType('brand')).toBe(true);
      expect(isValidAccountType('creator')).toBe(true);
      expect(isValidAccountType('agency')).toBe(true);
      expect(isValidAccountType('admin')).toBe(true);
    });

    it('should reject invalid account types', () => {
      expect(isValidAccountType('user')).toBe(false);
      expect(isValidAccountType('Brand')).toBe(false);
      expect(isValidAccountType('')).toBe(false);
    });
  });
});

describe('Schema Validation', () => {
  describe('User Schema', () => {
    const validateUser = (user: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!user.id || !isValidUUID(user.id)) errors.push('Invalid id');
      if (!user.email || !isValidEmail(user.email)) errors.push('Invalid email');
      if (!user.firstName || typeof user.firstName !== 'string') errors.push('Invalid firstName');
      if (!user.lastName || typeof user.lastName !== 'string') errors.push('Invalid lastName');
      if (!user.accountType || !isValidAccountType(user.accountType)) errors.push('Invalid accountType');
      if (!user.role || !isValidUserRole(user.role)) errors.push('Invalid role');

      return { valid: errors.length === 0, errors };
    };

    it('should validate a complete user object', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        accountType: 'creator',
        role: 'creator',
      };

      const result = validateUser(user);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject user with missing required fields', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
      };

      const result = validateUser(user);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject user with invalid email', () => {
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        accountType: 'creator',
        role: 'creator',
      };

      const result = validateUser(user);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email');
    });
  });

  describe('Money Schema', () => {
    const validateMoney = (money: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (typeof money.amount !== 'number' || money.amount < 0) errors.push('Invalid amount');
      if (!money.currency || !isValidCurrencyCode(money.currency)) errors.push('Invalid currency');

      return { valid: errors.length === 0, errors };
    };

    it('should validate correct money object', () => {
      const money = { amount: 99.99, currency: 'USD' };
      const result = validateMoney(money);
      expect(result.valid).toBe(true);
    });

    it('should reject negative amounts', () => {
      const money = { amount: -50, currency: 'USD' };
      const result = validateMoney(money);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid amount');
    });

    it('should reject invalid currency', () => {
      const money = { amount: 100, currency: 'INVALID' };
      const result = validateMoney(money);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid currency');
    });
  });

  describe('Pagination Schema', () => {
    const validatePagination = (params: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (params.page !== undefined && (typeof params.page !== 'number' || params.page < 1)) {
        errors.push('Invalid page');
      }
      if (params.limit !== undefined && (typeof params.limit !== 'number' || params.limit < 1 || params.limit > 100)) {
        errors.push('Invalid limit');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate correct pagination params', () => {
      const params = { page: 1, limit: 20 };
      const result = validatePagination(params);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid page number', () => {
      const params = { page: 0, limit: 20 };
      const result = validatePagination(params);
      expect(result.valid).toBe(false);
    });

    it('should reject limit exceeding maximum', () => {
      const params = { page: 1, limit: 500 };
      const result = validatePagination(params);
      expect(result.valid).toBe(false);
    });

    it('should allow undefined optional params', () => {
      const params = {};
      const result = validatePagination(params);
      expect(result.valid).toBe(true);
    });
  });

  describe('Date Range Schema', () => {
    const validateDateRange = (range: any): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!range.startDate || !isValidISODate(range.startDate)) errors.push('Invalid startDate');
      if (!range.endDate || !isValidISODate(range.endDate)) errors.push('Invalid endDate');

      if (range.startDate && range.endDate) {
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        if (start > end) errors.push('startDate must be before endDate');
      }

      return { valid: errors.length === 0, errors };
    };

    it('should validate correct date range', () => {
      const range = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };
      const result = validateDateRange(range);
      expect(result.valid).toBe(true);
    });

    it('should reject inverted date range', () => {
      const range = {
        startDate: '2024-01-31T00:00:00Z',
        endDate: '2024-01-01T23:59:59Z',
      };
      const result = validateDateRange(range);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('startDate must be before endDate');
    });
  });
});

describe('Edge Cases', () => {
  describe('Empty and Null Values', () => {
    it('should handle null values', () => {
      expect(isValidUUID(null as any)).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
    });

    it('should handle undefined values', () => {
      expect(isValidUUID(undefined as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(isValidUUID('')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('Whitespace Handling', () => {
    it('should reject strings with only whitespace', () => {
      expect(isValidUUID('   ')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should reject emails with leading/trailing spaces', () => {
      expect(isValidEmail(' user@example.com')).toBe(false);
      expect(isValidEmail('user@example.com ')).toBe(false);
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle UUID case insensitively', () => {
      expect(isValidUUID('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('should be case-sensitive for enums', () => {
      expect(isValidSocialPlatform('tiktok')).toBe(true);
      expect(isValidSocialPlatform('TikTok')).toBe(false);
      expect(isValidCurrencyCode('USD')).toBe(true);
      expect(isValidCurrencyCode('usd')).toBe(false);
    });
  });

  describe('Special Characters', () => {
    it('should handle URLs with encoded characters', () => {
      expect(isValidURL('https://example.com/path%20with%20spaces')).toBe(true);
      expect(isValidURL('https://example.com/path?q=hello%20world')).toBe(true);
    });

    it('should handle emails with valid special chars', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
    });
  });

  describe('Numeric Boundaries', () => {
    it('should handle zero values appropriately', () => {
      const validateAmount = (amount: number) => amount >= 0;
      expect(validateAmount(0)).toBe(true);
      expect(validateAmount(-1)).toBe(false);
    });

    it('should handle large numbers', () => {
      const validateAmount = (amount: number) => amount >= 0 && amount < Number.MAX_SAFE_INTEGER;
      expect(validateAmount(999999999)).toBe(true);
      expect(validateAmount(Number.MAX_SAFE_INTEGER)).toBe(false);
    });
  });
});
