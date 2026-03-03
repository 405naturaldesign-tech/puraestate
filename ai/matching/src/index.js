/**
 * Property Matching Algorithm - Main Entry Point
 * Production-ready OpenRouter AI property matching for real estate investors
 */

require('dotenv').config();

const OpenRouterClient = require('./client/openRouterClient');
const CacheManager = require('./cache/cacheManager');
const PropertyMatcher = require('./core/propertyMatcher');
const CostAnalytics = require('./analytics/costAnalytics');
const PerformanceAnalytics = require('./analytics/performanceAnalytics');
const Logger = require('./utils/logger');

const logger = new Logger('PropertyMatchingAlgorithm');

class PropertyMatchingSystem {
  constructor(options = {}) {
    const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    // Initialize components
    this.openRouterClient = new OpenRouterClient(apiKey, {
      referer: options.referer || 'https://property-matcher.local',
      title: 'Property Matching Algorithm',
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000
    });

    this.cacheManager = new CacheManager({
      ttl: options.cacheTTL || 86400,
      enableMetrics: true
    });

    this.propertyMatcher = new PropertyMatcher(this.openRouterClient, this.cacheManager, {
      rankingBatchSize: options.rankingBatchSize || 100,
      topPropertiesToScore: options.topPropertiesToScore || 3,
      enableFallback: options.enableFallback !== false,
      cacheDuration: options.matchCacheDuration || 43200
    });

    this.costAnalytics = new CostAnalytics({
      costBudget: options.costBudget || 100,
      alertThreshold: options.costAlertThreshold || 0.8
    });

    this.performanceAnalytics = new PerformanceAnalytics();

    logger.info('Property Matching System initialized', {
      cacheEnabled: true,
      fallbackEnabled: options.enableFallback !== false,
      topPropertiesToScore: options.topPropertiesToScore || 3
    });
  }

  /**
   * Main matching function - entry point for consumers
   */
  async matchProperties(investorProfile, properties, options = {}) {
    const startTime = Date.now();

    try {
      logger.info('Starting property matching', {
        investorId: investorProfile.id,
        propertyCount: properties.length
      });

      // Run matching
      const result = await this.propertyMatcher.matchProperties(investorProfile, properties, options);

      // Record analytics
      const duration = Date.now() - startTime;
      this.performanceAnalytics.recordMatch(investorProfile.id, result, {
        propertyCount: properties.length,
        duration
      });

      // Track costs
      if (result.costSummary && result.costSummary.total > 0) {
        this.costAnalytics.recordCost(
          'property_matching',
          result.costSummary.total,
          { requests: result.costSummary.requestCount }
        );
      }

      logger.info('Property matching completed', {
        investorId: investorProfile.id,
        matchesFound: result.matches.length,
        topScore: result.summary.bestMatchScore,
        duration: `${duration}ms`,
        cost: `$${result.costSummary.total.toFixed(4)}`
      });

      return result;

    } catch (error) {
      logger.error('Property matching failed', {
        investorId: investorProfile.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record feedback on a matched property
   */
  recordFeedback(investorId, propertyId, feedback) {
    logger.info('Recording feedback', { investorId, propertyId, rating: feedback.rating });
    this.performanceAnalytics.recordFeedback(investorId, propertyId, feedback);
  }

  /**
   * Get system health and analytics
   */
  getSystemStatus() {
    const cacheStats = this.cacheManager.getStats();
    const costSummary = this.openRouterClient.getCostSummary();
    const matchingStats = this.performanceAnalytics.getMatchingStats();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      cache: {
        hitRate: cacheStats.hitRate,
        totalKeys: cacheStats.totalKeys,
        memory: cacheStats.memory
      },
      costs: {
        total: costSummary.total,
        dailyUsage: this.costAnalytics.getDailyCost(),
        forecast30Days: this.costAnalytics.getForecast(30)
      },
      performance: {
        totalMatches: matchingStats.totalMatches,
        averageScore: matchingStats.averageMatchScore,
        avgDuration: `${matchingStats.averageDuration}ms`,
        scoreDistribution: matchingStats.performanceDistribution
      },
      models: Object.entries(this.openRouterClient.getModels()).reduce((acc, [key, model]) => {
        acc[key] = {
          name: model.name,
          speed: model.speed,
          costPer1kTokens: `$${(model.pricing.input * 1000).toFixed(3)}`
        };
        return acc;
      }, {})
    };
  }

  /**
   * Test API connection and pricing
   */
  async testAPI() {
    logger.info('Testing OpenRouter API connection');

    try {
      const result = await this.openRouterClient.testConnection();
      logger.info('API test successful', { cost: `$${result.cost.total.toFixed(6)}` });
      return { success: true, ...result };
    } catch (error) {
      logger.error('API test failed', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate analytics reports
   */
  generateReports() {
    logger.info('Generating analytics reports');

    return {
      costReport: this.costAnalytics.generateReport('cost-report.json'),
      performanceReport: this.performanceAnalytics.generateReport('performance-report.json'),
      systemStatus: this.getSystemStatus()
    };
  }

  /**
   * Clear cache (use with caution)
   */
  clearCache() {
    logger.warn('Clearing all cached data');
    this.cacheManager.clear();
  }

  /**
   * Reset cost tracking (daily reset)
   */
  resetDailyCostTracking() {
    logger.info('Resetting daily cost tracking');
    this.openRouterClient.resetCostTracking();
  }
}

// Export for use as module
module.exports = PropertyMatchingSystem;

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const system = new PropertyMatchingSystem();

      // Test API connection
      logger.info('Running system tests...');
      const apiTest = await system.testAPI();

      if (!apiTest.success) {
        logger.error('API test failed', apiTest);
        process.exit(1);
      }

      logger.info('System initialized successfully');
      logger.info('System status:', system.getSystemStatus());

      // Example usage
      const investorProfile = {
        id: 'example_investor_001',
        budget: { min: 200000, max: 500000 },
        riskTolerance: 'moderate',
        targetROI: 12,
        investmentTimeline: 5,
        investmentFocus: 'cashFlow',
        propertyTypes: ['SingleFamily', 'Duplex'],
        preferences: {
          proximity: 'Austin metro',
          amenities: 'pool, garage'
        }
      };

      // Sample properties (in production, these come from property database)
      const sampleProperties = [
        {
          id: 'prop_example_001',
          address: '123 Investor Ave, Austin, TX 78704',
          price: 350000,
          type: 'SingleFamily',
          yearBuilt: 2015,
          market: 'Austin',
          zipcode: '78704',
          status: 'active',
          appreciation: 4.2,
          monthlyRentalIncome: 2500,
          monthlyExpenses: 800,
          yearlyRentalIncome: 30000,
          yearlyExpenses: 9600,
          capRate: 5.1,
          cashOnCashReturn: 17.2,
          debt: 280000,
          value: 350000,
          projectedROI: 16.8,
          daysOnMarket: 25
        }
      ];

      logger.info('Example: matching investor to properties');
      logger.info('Note: In production, integrate with property database API');

    } catch (error) {
      logger.error('System initialization failed', { error: error.message });
      process.exit(1);
    }
  })();
}
