// =============================================================================
// Formatters Unit Tests
// =============================================================================

import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  formatNumber,
  formatCompactNumber,
  formatPercentage,
  formatDecimal,
  formatFileSize,
  formatDuration,
  formatVideoDuration,
  formatFollowerCount,
  formatEngagementRate,
  formatROI,
  formatOrdinal,
  truncateText,
  pluralize,
  formatList,
} from '@nexus/utils';

describe('Formatters', () => {
  describe('formatMoney', () => {
    it('should format USD currency correctly', () => {
      const result = formatMoney({ amount: 1234.56, currency: 'USD' });
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format EUR currency correctly', () => {
      const result = formatMoney({ amount: 1234.56, currency: 'EUR' }, 'de-DE');
      expect(result).toContain('1.234,56');
      expect(result).toContain('€');
    });

    it('should handle zero amount', () => {
      const result = formatMoney({ amount: 0, currency: 'USD' });
      expect(result).toContain('0');
    });

    it('should handle large amounts', () => {
      const result = formatMoney({ amount: 1000000, currency: 'USD' });
      expect(result).toContain('1,000,000');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toContain('1,234,567');
    });

    it('should handle decimal numbers', () => {
      const result = formatNumber(1234.56);
      expect(result).toContain('1,234.56');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatCompactNumber', () => {
    it('should format thousands with K', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K');
    });

    it('should format millions with M', () => {
      expect(formatCompactNumber(2500000)).toBe('2.5M');
    });

    it('should format billions with B', () => {
      expect(formatCompactNumber(3500000000)).toBe('3.5B');
    });

    it('should handle small numbers without abbreviation', () => {
      expect(formatCompactNumber(999)).toBe('999');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with default decimals', () => {
      expect(formatPercentage(75.5)).toContain('75.5');
      expect(formatPercentage(75.5)).toContain('%');
    });

    it('should format percentage with custom decimals', () => {
      expect(formatPercentage(75.567, 2)).toContain('75.57');
    });

    it('should handle zero', () => {
      const result = formatPercentage(0);
      expect(result).toContain('0');
    });

    it('should handle 100%', () => {
      const result = formatPercentage(100);
      expect(result).toContain('100');
    });
  });

  describe('formatDecimal', () => {
    it('should format with default 2 decimals', () => {
      expect(formatDecimal(123.456)).toBe('123.46');
    });

    it('should format with custom decimals', () => {
      expect(formatDecimal(123.456, 1)).toBe('123.5');
    });

    it('should pad with zeros if needed', () => {
      expect(formatDecimal(123, 2)).toBe('123.00');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(100)).toBe('100 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle fractional sizes', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should handle zero', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds only', () => {
      expect(formatDuration(45)).toBe('45s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90)).toBe('1m 30s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3661)).toBe('1h 1m');
    });

    it('should format hours only', () => {
      expect(formatDuration(3600)).toBe('1h');
    });

    it('should handle zero', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('formatVideoDuration', () => {
    it('should format MM:SS for short videos', () => {
      expect(formatVideoDuration(90)).toBe('1:30');
    });

    it('should format H:MM:SS for long videos', () => {
      expect(formatVideoDuration(3661)).toBe('1:01:01');
    });

    it('should pad seconds and minutes', () => {
      expect(formatVideoDuration(65)).toBe('1:05');
    });

    it('should handle zero', () => {
      expect(formatVideoDuration(0)).toBe('0:00');
    });
  });

  describe('formatFollowerCount', () => {
    it('should format millions with M suffix', () => {
      expect(formatFollowerCount(1500000)).toBe('1.5M');
    });

    it('should format thousands with K suffix', () => {
      expect(formatFollowerCount(1500)).toBe('1.5K');
    });

    it('should format small numbers without suffix', () => {
      expect(formatFollowerCount(999)).toBe('999');
    });

    it('should handle zero', () => {
      expect(formatFollowerCount(0)).toBe('0');
    });
  });

  describe('formatEngagementRate', () => {
    it('should format engagement rate with 2 decimals', () => {
      expect(formatEngagementRate(5.678)).toBe('5.68%');
    });

    it('should handle zero', () => {
      expect(formatEngagementRate(0)).toBe('0.00%');
    });

    it('should handle high rates', () => {
      expect(formatEngagementRate(15.5)).toBe('15.50%');
    });
  });

  describe('formatROI', () => {
    it('should format positive ROI with + sign', () => {
      expect(formatROI(150)).toBe('+150%');
    });

    it('should format negative ROI without + sign', () => {
      expect(formatROI(-25)).toBe('-25%');
    });

    it('should handle zero', () => {
      expect(formatROI(0)).toBe('+0%');
    });
  });

  describe('formatOrdinal', () => {
    it('should format 1st correctly', () => {
      expect(formatOrdinal(1)).toBe('1st');
    });

    it('should format 2nd correctly', () => {
      expect(formatOrdinal(2)).toBe('2nd');
    });

    it('should format 3rd correctly', () => {
      expect(formatOrdinal(3)).toBe('3rd');
    });

    it('should format 4th and above with th', () => {
      expect(formatOrdinal(4)).toBe('4th');
      expect(formatOrdinal(10)).toBe('10th');
    });

    it('should handle special cases like 11th, 12th, 13th', () => {
      expect(formatOrdinal(11)).toBe('11th');
      expect(formatOrdinal(12)).toBe('12th');
      expect(formatOrdinal(13)).toBe('13th');
    });

    it('should handle 21st, 22nd, 23rd', () => {
      expect(formatOrdinal(21)).toBe('21st');
      expect(formatOrdinal(22)).toBe('22nd');
      expect(formatOrdinal(23)).toBe('23rd');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      expect(truncateText(text, 20)).toBe('This is a very lo...');
    });

    it('should not truncate short text', () => {
      const text = 'Short text';
      expect(truncateText(text, 20)).toBe('Short text');
    });

    it('should use custom ellipsis', () => {
      const text = 'This is a very long text';
      expect(truncateText(text, 15, '…')).toBe('This is a ver…');
    });

    it('should handle exact length', () => {
      const text = 'Exact';
      expect(truncateText(text, 5)).toBe('Exact');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize(1, 'item')).toBe('item');
    });

    it('should return default plural for count > 1', () => {
      expect(pluralize(2, 'item')).toBe('items');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'child', 'children')).toBe('children');
    });

    it('should handle zero as plural', () => {
      expect(pluralize(0, 'item')).toBe('items');
    });
  });

  describe('formatList', () => {
    it('should return empty string for empty array', () => {
      expect(formatList([])).toBe('');
    });

    it('should return single item for array with one element', () => {
      expect(formatList(['apple'])).toBe('apple');
    });

    it('should format two items with conjunction', () => {
      expect(formatList(['apple', 'banana'])).toBe('apple and banana');
    });

    it('should format multiple items with commas and conjunction', () => {
      expect(formatList(['apple', 'banana', 'cherry'])).toBe('apple, banana, and cherry');
    });

    it('should use custom conjunction', () => {
      expect(formatList(['apple', 'banana', 'cherry'], 'or')).toBe('apple, banana, or cherry');
    });
  });
});
