/**
 * Cache Manager
 * Handles caching of properties, investor profiles, and matching results
 */

const crypto = require('crypto');
const NodeCache = require('node-cache');
const Logger = require('../utils/logger');

const logger = new Logger('CacheManager');

class CacheManager {
  constructor(options = {}) {
    // Memory cache with 24 hour TTL
    this.memoryCache = new NodeCache({
      stdTTL: options.ttl || 86400,
      checkperiod: options.checkperiod || 3600,
      useClones: true
    });

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0
    };

    this.enableMetrics = options.enableMetrics !== false;
  }

  /**
   * Generate cache key from input
   */
  generateKey(namespace, identifier) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(identifier))
      .digest('hex');
    return `${namespace}:${hash}`;
  }

  /**
   * Get value from cache
   */
  get(namespace, identifier) {
    const key = this.generateKey(namespace, identifier);
    const value = this.memoryCache.get(key);

    if (this.enableMetrics) {
      if (value !== undefined) {
        this.stats.hits += 1;
        logger.debug(`Cache HIT: ${namespace}`, { key: key.substring(0, 20) });
      } else {
        this.stats.misses += 1;
        logger.debug(`Cache MISS: ${namespace}`, { key: key.substring(0, 20) });
      }
    }

    return value;
  }

  /**
   * Set value in cache
   */
  set(namespace, identifier, value, ttl = null) {
    const key = this.generateKey(namespace, identifier);

    if (ttl) {
      this.memoryCache.set(key, value, ttl);
    } else {
      this.memoryCache.set(key, value);
    }

    if (this.enableMetrics) {
      this.stats.sets += 1;
    }

    logger.debug(`Cache SET: ${namespace}`, {
      key: key.substring(0, 20),
      ttl: ttl ? `${ttl}s` : 'default'
    });

    return true;
  }

  /**
   * Delete from cache
   */
  delete(namespace, identifier) {
    const key = this.generateKey(namespace, identifier);
    const deleted = this.memoryCache.del(key);

    if (this.enableMetrics && deleted > 0) {
      this.stats.deletes += 1;
    }

    logger.debug(`Cache DELETE: ${namespace}`, { key: key.substring(0, 20), deleted });
    return deleted > 0;
  }

  /**
   * Clear entire namespace
   */
  clearNamespace(namespace) {
    const keys = this.memoryCache.keys();
    const namespacedKeys = keys.filter(k => k.startsWith(`${namespace}:`));

    namespacedKeys.forEach(key => this.memoryCache.del(key));

    logger.info(`Cache cleared: ${namespace}`, { keysDeleted: namespacedKeys.length });
    return namespacedKeys.length;
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.flushAll();
    logger.info('All cache cleared');
  }

  /**
   * Get cached investor profile
   */
  getInvestorProfile(investorId) {
    return this.get('investor_profile', { investorId });
  }

  /**
   * Set cached investor profile (24 hour TTL)
   */
  setInvestorProfile(investorId, profile) {
    return this.set('investor_profile', { investorId }, profile, 86400);
  }

  /**
   * Get cached property
   */
  getProperty(propertyId) {
    return this.get('property', { propertyId });
  }

  /**
   * Set cached property (48 hour TTL for property data)
   */
  setProperty(propertyId, property) {
    return this.set('property', { propertyId }, property, 172800);
  }

  /**
   * Get cached matching result
   */
  getMatchingResult(investorId, resultKey) {
    return this.get('matching_result', { investorId, resultKey });
  }

  /**
   * Set cached matching result (12 hour TTL)
   */
  setMatchingResult(investorId, resultKey, result) {
    return this.set('matching_result', { investorId, resultKey }, result, 43200);
  }

  /**
   * Get cached ranking batch
   */
  getRankingBatch(batchKey) {
    return this.get('ranking_batch', { batchKey });
  }

  /**
   * Set cached ranking batch (6 hour TTL)
   */
  setRankingBatch(batchKey, results) {
    return this.set('ranking_batch', { batchKey }, results, 21600);
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const keys = this.memoryCache.keys();
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalKeys: keys.length,
      keysByNamespace: this._groupKeysByNamespace(keys),
      memory: {
        estimatedBytes: this._estimateMemory()
      }
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0
    };
    logger.info('Cache statistics reset');
  }

  /**
   * Group keys by namespace
   */
  _groupKeysByNamespace(keys) {
    return keys.reduce((acc, key) => {
      const namespace = key.split(':')[0];
      acc[namespace] = (acc[namespace] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Estimate memory usage
   */
  _estimateMemory() {
    const keys = this.memoryCache.keys();
    let bytes = 0;

    keys.forEach(key => {
      const value = this.memoryCache.get(key);
      bytes += key.length * 2; // UTF-16
      bytes += JSON.stringify(value).length * 2;
    });

    return {
      bytes,
      kilobytes: (bytes / 1024).toFixed(2),
      megabytes: (bytes / 1024 / 1024).toFixed(2)
    };
  }
}

module.exports = CacheManager;
