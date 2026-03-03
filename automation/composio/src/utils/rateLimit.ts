import NodeCache from 'node-cache';
import config from '../config';
import logger from '../logger';

class RateLimiter {
  private cache: NodeCache;
  private maxRequests: number;
  private windowMs: number;

  constructor() {
    this.maxRequests = config.whatsapp.rateLimitPerMinute;
    this.windowMs = 60 * 1000; // 1 minute

    // Initialize cache with 2-minute TTL
    this.cache = new NodeCache({ stdTTL: 120, checkperiod: 60 });
  }

  async checkLimit(phoneNumber: string): Promise<boolean> {
    const key = `rate_limit:${phoneNumber}`;
    const current = this.cache.get<number>(key) || 0;

    if (current >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { phoneNumber, current, limit: this.maxRequests });
      return false;
    }

    this.cache.set(key, current + 1, this.windowMs / 1000);
    return true;
  }

  async getRemaining(phoneNumber: string): Promise<number> {
    const key = `rate_limit:${phoneNumber}`;
    const current = this.cache.get<number>(key) || 0;
    return Math.max(0, this.maxRequests - current);
  }

  async reset(phoneNumber: string): Promise<void> {
    const key = `rate_limit:${phoneNumber}`;
    this.cache.del(key);
  }

  async resetAll(): Promise<void> {
    this.cache.flushAll();
  }

  getStats(): {
    keys: number;
    ksize: number;
    vsize: number;
  } {
    return this.cache.getStats();
  }
}

export default new RateLimiter();
