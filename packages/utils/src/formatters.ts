// =============================================================================
// Formatters - Number, Currency, and Display Formatting
// =============================================================================

import type { Money, CurrencyCode } from '@nexus/types';

const currencyFormats: Record<CurrencyCode, Intl.NumberFormatOptions> = {
  USD: { style: 'currency', currency: 'USD' },
  EUR: { style: 'currency', currency: 'EUR' },
  GBP: { style: 'currency', currency: 'GBP' },
  CAD: { style: 'currency', currency: 'CAD' },
  AUD: { style: 'currency', currency: 'AUD' },
  NGN: { style: 'currency', currency: 'NGN' },
  KES: { style: 'currency', currency: 'KES' },
  ZAR: { style: 'currency', currency: 'ZAR' },
};

export function formatMoney(money: Money, locale = 'en-US'): string {
  const options = currencyFormats[money.currency] || { style: 'currency', currency: money.currency };
  return new Intl.NumberFormat(locale, options).format(money.amount);
}

export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatCompactNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { notation: 'compact', compactDisplay: 'short' }).format(
    value
  );
}

export function formatPercentage(value: number, decimals = 1, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDecimal(value: number, decimals = 2, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function formatVideoDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFollowerCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}

export function formatEngagementRate(rate: number): string {
  return `${rate.toFixed(2)}%`;
}

export function formatROI(roi: number): string {
  const formatted = roi.toFixed(0);
  return roi >= 0 ? `+${formatted}%` : `${formatted}%`;
}

export function formatOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0] || "th");
}

export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length).trim() + ellipsis;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function formatList(items: string[], conjunction = 'and'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0] as string;
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;

  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
}
