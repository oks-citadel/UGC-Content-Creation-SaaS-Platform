import currency from 'currency.js';
import { PrismaClient } from '.prisma/marketplace-service-client';
import axios from 'axios';
import logger from './logger';
import config from '../config';

const prisma = new PrismaClient();

// Currency symbols and formats
export const currencySymbols: { [key: string]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  ZAR: 'R',
};

export const currencyFormats: { [key: string]: any } = {
  USD: { symbol: '$', precision: 2, separator: ',', decimal: '.' },
  EUR: { symbol: '€', precision: 2, separator: '.', decimal: ',' },
  GBP: { symbol: '£', precision: 2, separator: ',', decimal: '.' },
  NGN: { symbol: '₦', precision: 2, separator: ',', decimal: '.' },
  KES: { symbol: 'KSh', precision: 2, separator: ',', decimal: '.' },
  GHS: { symbol: 'GH₵', precision: 2, separator: ',', decimal: '.' },
  ZAR: { symbol: 'R', precision: 2, separator: ',', decimal: '.' },
};

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currencyCode: string): string {
  const format = currencyFormats[currencyCode] || currencyFormats.USD;
  return currency(amount, format).format();
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    // Get exchange rate from database
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    return currency(amount).multiply(rate).value;
  } catch (error) {
    logger.error('Error converting currency:', error);
    throw error;
  }
}

/**
 * Get exchange rate from database or fetch if not available
 */
export async function getExchangeRate(
  baseCurrency: string,
  targetCurrency: string
): Promise<number> {
  try {
    // Check if rate exists in database and is still valid
    const existingRate = await prisma.exchangeRate.findFirst({
      where: {
        baseCurrency,
        targetCurrency,
        validUntil: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingRate) {
      return existingRate.rate.toNumber();
    }

    // Fetch new rate
    const rate = await fetchExchangeRate(baseCurrency, targetCurrency);

    // Store in database (valid for 24 hours)
    await prisma.exchangeRate.create({
      data: {
        baseCurrency,
        targetCurrency,
        rate,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return rate;
  } catch (error) {
    logger.error('Error getting exchange rate:', error);
    throw error;
  }
}

/**
 * Fetch exchange rate from external API
 */
async function fetchExchangeRate(
  baseCurrency: string,
  targetCurrency: string
): Promise<number> {
  try {
    // Using exchangerate-api.com (you can use any forex API)
    const response = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    );

    const rate = response.data.rates[targetCurrency];

    if (!rate) {
      throw new Error(`Exchange rate not found for ${baseCurrency} to ${targetCurrency}`);
    }

    return rate;
  } catch (error) {
    logger.error('Error fetching exchange rate:', error);
    // Fallback rates (should be updated regularly in production)
    const fallbackRates: { [key: string]: number } = {
      'USD_EUR': 0.92,
      'USD_GBP': 0.79,
      'USD_NGN': 1550,
      'USD_KES': 155,
      'USD_GHS': 12,
      'USD_ZAR': 18.5,
    };

    const key = `${baseCurrency}_${targetCurrency}`;
    if (fallbackRates[key]) {
      logger.warn(`Using fallback exchange rate for ${key}`);
      return fallbackRates[key];
    }

    throw new Error('Unable to fetch exchange rate');
  }
}

/**
 * Get supported currencies
 */
export function getSupportedCurrencies(): string[] {
  return config.currency.supported;
}

/**
 * Validate currency code
 */
export function isValidCurrency(currencyCode: string): boolean {
  return config.currency.supported.includes(currencyCode);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  return currencySymbols[currencyCode] || currencyCode;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string, currencyCode: string): number {
  const format = currencyFormats[currencyCode] || currencyFormats.USD;
  return currency(currencyString, format).value;
}

/**
 * Calculate percentage of amount
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return currency(amount).multiply(percentage / 100).value;
}

/**
 * Add amounts safely
 */
export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, amount) => currency(sum).add(amount).value, 0);
}

/**
 * Subtract amounts safely
 */
export function subtractAmounts(amount: number, ...subtractors: number[]): number {
  return subtractors.reduce((result, subtractor) => currency(result).subtract(subtractor).value, amount);
}

/**
 * Compare amounts (returns -1, 0, or 1)
 */
export function compareAmounts(amount1: number, amount2: number): number {
  const diff = currency(amount1).subtract(amount2).value;
  if (diff > 0) return 1;
  if (diff < 0) return -1;
  return 0;
}

export default {
  formatCurrency,
  convertCurrency,
  getExchangeRate,
  getSupportedCurrencies,
  isValidCurrency,
  getCurrencySymbol,
  parseCurrency,
  calculatePercentage,
  addAmounts,
  subtractAmounts,
  compareAmounts,
};
