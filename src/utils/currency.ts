import Decimal from 'decimal.js';
import axios from 'axios';

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: number;
}

const EXCHANGE_RATES_CACHE = new Map<string, ExchangeRate>();
const CACHE_DURATION = 3600000; // 1 hour

const FIXED_RATES: Record<string, Record<string, number>> = {
  CRC: { USD: 520, EUR: 570, CAD: 390 },
  USD: { CRC: 1 / 520, EUR: 0.92, CAD: 0.75 },
  EUR: { CRC: 1 / 570, USD: 1.09, CAD: 0.82 },
  CAD: { CRC: 1 / 390, USD: 1.33, EUR: 1.22 },
};

export class CurrencyConverter {
  static async getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;

    const cacheKey = `${from}_${to}`;
    const cached = EXCHANGE_RATES_CACHE.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rate;
    }

    try {
      // Try live API (with fallback)
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${from}`,
        { timeout: 5000 }
      );
      const rate = response.data.rates[to];
      if (rate) {
        EXCHANGE_RATES_CACHE.set(cacheKey, {
          from,
          to,
          rate,
          timestamp: Date.now(),
        });
        return rate;
      }
    } catch (error) {
      console.warn('Exchange rate API error, using fixed rates:', error);
    }

    // Fallback to fixed rates
    if (FIXED_RATES[from] && FIXED_RATES[from][to]) {
      return FIXED_RATES[from][to];
    }

    throw new Error(`No exchange rate available for ${from} to ${to}`);
  }

  static convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rate?: number
  ): Decimal {
    const decimal = new Decimal(amount);
    const conversionRate = new Decimal(rate || FIXED_RATES[fromCurrency]?.[toCurrency] || 1);
    return decimal.mul(conversionRate);
  }

  static format(amount: number, currency: string, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  static parse(value: string): number {
    // Remove currency symbols and parse
    return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
  }
}

export const SUPPORTED_CURRENCIES = ['CRC', 'USD', 'EUR', 'CAD'];

export default CurrencyConverter;
