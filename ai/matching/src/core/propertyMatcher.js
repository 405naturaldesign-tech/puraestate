/**
 * Property Matching Algorithm
 * Core matching logic combining fast ranking (Groq) and detailed scoring (Claude Haiku)
 */

const OpenRouterClient = require('../client/openRouterClient');
const CacheManager = require('../cache/cacheManager');
const RankingPrompts = require('../prompts/rankingPrompts');
const ScoringPrompts = require('../prompts/scoringPrompts');
const Logger = require('../utils/logger');
const FallbackRanking = require('./fallbackRanking');

const logger = new Logger('PropertyMatcher');

class PropertyMatcher {
  constructor(openRouterClient, cacheManager, options = {}) {
    this.client = openRouterClient;
    this.cache = cacheManager;
    this.fallbackRanking = new FallbackRanking();

    this.config = {
      rankingBatchSize: options.rankingBatchSize || 100,
      topPropertiesToScore: options.topPropertiesToScore || 3,
      enableFallback: options.enableFallback !== false,
      cacheDuration: options.cacheDuration || 43200, // 12 hours
      ...options
    };

    this.matchingResults = [];
    this.performanceMetrics = {
      startTime: null,
      endTime: null,
      duration: null,
      phaseTimes: {}
    };
  }

  /**
   * Main matching function - orchestrates the entire matching process
   */
  async matchProperties(investorProfile, properties, options = {}) {
    const startTime = Date.now();
    logger.info('Starting property matching process', {
      investorId: investorProfile.id,
      propertyCount: properties.length,
      topN: this.config.topPropertiesToScore
    });

    try {
      // Validate inputs
      this._validateInputs(investorProfile, properties);

      // Check cache for recent results
      const cacheKey = this._generateCacheKey(investorProfile, properties);
      const cachedResult = this.cache.getMatchingResult(investorProfile.id, cacheKey);
      if (cachedResult) {
        logger.info('Returning cached matching result', { investorId: investorProfile.id });
        return cachedResult;
      }

      // Phase 1: Pre-filtering (optional)
      let filteredProperties = properties;
      if (options.preFilter !== false) {
        const preFilterStart = Date.now();
        filteredProperties = await this._preFilterProperties(properties, investorProfile);
        this.performanceMetrics.phaseTimes.preFilter = Date.now() - preFilterStart;
        logger.info(`Pre-filtering complete: ${properties.length} → ${filteredProperties.length} properties`);
      }

      // Phase 2: Fast ranking with Groq
      const rankingStart = Date.now();
      const rankedProperties = await this._rankPropertiesWithGroq(filteredProperties, investorProfile);
      this.performanceMetrics.phaseTimes.ranking = Date.now() - rankingStart;
      logger.info(`Ranking complete: processed ${filteredProperties.length} properties in ${this.performanceMetrics.phaseTimes.ranking}ms`);

      // Phase 3: Extract top properties
      const topProperties = rankedProperties.slice(0, this.config.topPropertiesToScore);
      logger.info(`Selected top ${topProperties.length} properties for detailed scoring`);

      // Phase 4: Detailed scoring with Claude Haiku
      const scoringStart = Date.now();
      const scoredProperties = await this._scorePropertiesWithHaiku(topProperties, investorProfile);
      this.performanceMetrics.phaseTimes.scoring = Date.now() - scoringStart;
      logger.info(`Scoring complete: ${topProperties.length} properties scored in ${this.performanceMetrics.phaseTimes.scoring}ms`);

      // Phase 5: Generate final report
      const result = this._buildMatchingResult(
        investorProfile,
        scoredProperties,
        {
          totalPropertiesAnalyzed: properties.length,
          totalPropertiesFiltered: filteredProperties.length,
          totalPropertiesRanked: rankedProperties.length,
          topPropertiesScored: scoredProperties.length
        }
      );

      // Cache result
      this.cache.setMatchingResult(investorProfile.id, cacheKey, result, this.config.cacheDuration);

      // Track performance
      this.performanceMetrics.endTime = Date.now();
      this.performanceMetrics.duration = this.performanceMetrics.endTime - startTime;

      logger.info('Property matching complete', {
        duration: `${this.performanceMetrics.duration}ms`,
        topMatches: result.matches.length,
        totalCost: `$${result.costSummary.total.toFixed(4)}`
      });

      return result;

    } catch (error) {
      logger.error('Error during property matching', { error: error.message });

      if (this.config.enableFallback) {
        logger.info('Switching to fallback ranking due to error');
        return await this._matchPropertiesWithFallback(investorProfile, properties);
      }

      throw error;
    }
  }

  /**
   * Phase 1: Pre-filter properties based on hard constraints
   */
  async _preFilterProperties(properties, investorProfile) {
    const { budget, propertyTypes, investmentFocus } = investorProfile;

    logger.info('Pre-filtering properties based on hard constraints');

    return properties.filter(property => {
      // Budget constraint
      if (property.price < budget.min || property.price > budget.max) {
        return false;
      }

      // Property type filter
      if (propertyTypes.length > 0 && !propertyTypes.includes(property.type)) {
        return false;
      }

      // Basic financial viability
      if (investmentFocus === 'cashFlow' && (property.monthlyRentalIncome - property.monthlyExpenses) < 0) {
        return false;
      }

      if (investmentFocus === 'appreciation' && property.appreciation < 2) {
        return false;
      }

      return true;
    });
  }

  /**
   * Phase 2: Rank properties using Groq (fast, cost-effective)
   */
  async _rankPropertiesWithGroq(properties, investorProfile) {
    logger.info('Starting Groq ranking phase', { propertyCount: properties.length });

    const batches = this._createBatches(properties, this.config.rankingBatchSize);
    const rankedProperties = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchKey = `ranking_batch_${i}_${Date.now()}`;

      // Check cache first
      const cachedBatchRanking = this.cache.getRankingBatch(batchKey);
      if (cachedBatchRanking) {
        logger.info(`Using cached ranking for batch ${i + 1}/${batches.length}`);
        rankedProperties.push(...cachedBatchRanking);
        continue;
      }

      logger.info(`Processing ranking batch ${i + 1}/${batches.length} (${batch.length} properties)`);

      try {
        // Use Groq for fast ranking
        const rankingPrompt = RankingPrompts.generateRankingPrompt(batch, investorProfile);

        const response = await this.client.makeRequest(
          'groq_ranking',
          [{ role: 'user', content: rankingPrompt }],
          { temperature: 0.2, maxTokens: 1000 }
        );

        // Parse scores
        const scores = this._parseRankingScores(response.content, batch.length);
        const batchRanked = batch.map((property, idx) => ({
          ...property,
          rankingScore: scores[idx] || 50,
          rankedAt: new Date()
        }));

        // Sort by score descending
        batchRanked.sort((a, b) => b.rankingScore - a.rankingScore);

        // Cache batch results
        this.cache.setRankingBatch(batchKey, batchRanked);
        rankedProperties.push(...batchRanked);

        logger.debug(`Batch ${i + 1} ranking scores: ${scores.slice(0, 3).join(', ')}...`);

      } catch (error) {
        logger.error(`Error ranking batch ${i + 1}`, { error: error.message });

        // Fall back to manual ranking for this batch
        if (this.config.enableFallback) {
          logger.info(`Using fallback ranking for batch ${i + 1}`);
          const fallbackRanked = this.fallbackRanking.rankProperties(batch, investorProfile);
          rankedProperties.push(...fallbackRanked);
        } else {
          throw error;
        }
      }
    }

    // Sort all properties by ranking score
    rankedProperties.sort((a, b) => b.rankingScore - a.rankingScore);

    return rankedProperties;
  }

  /**
   * Phase 3: Score top properties using Claude Haiku (detailed analysis)
   */
  async _scorePropertiesWithHaiku(topProperties, investorProfile) {
    logger.info('Starting Claude Haiku scoring phase', { propertyCount: topProperties.length });

    const scoredProperties = [];

    for (let i = 0; i < topProperties.length; i++) {
      const property = topProperties[i];

      try {
        logger.info(`Scoring property ${i + 1}/${topProperties.length}: ${property.address}`);

        // Generate detailed scoring
        const scoringPrompt = ScoringPrompts.generateDetailedScoringPrompt(property, investorProfile);

        const response = await this.client.makeRequest(
          'claude_scoring',
          [{ role: 'user', content: scoringPrompt }],
          { temperature: 0.3, maxTokens: 2000 }
        );

        // Parse scoring response
        const scoreData = this._parseScoringResponse(response.content);

        // Generate cash flow projection
        const cashFlowPrompt = ScoringPrompts.generateCashFlowPrompt(property, investorProfile);
        const cashFlowResponse = await this.client.makeRequest(
          'claude_scoring',
          [{ role: 'user', content: cashFlowPrompt }],
          { temperature: 0.2, maxTokens: 1500 }
        );

        const cashFlowData = this._parseCashFlowResponse(cashFlowResponse.content);

        // Generate due diligence assessment
        const dueDiligencePrompt = ScoringPrompts.generateDueDiligencePrompt(property);
        const dueDiligenceResponse = await this.client.makeRequest(
          'claude_scoring',
          [{ role: 'user', content: dueDiligencePrompt }],
          { temperature: 0.2, maxTokens: 1000 }
        );

        const dueDiligenceData = this._parseDueDiligenceResponse(dueDiligenceResponse.content);

        // Combine all data
        const scoredProperty = {
          ...property,
          ...scoreData,
          cashFlowProjection: cashFlowData,
          dueDiligence: dueDiligenceData,
          scoringTimestamp: new Date(),
          matchScore: scoreData.overallScore
        };

        scoredProperties.push(scoredProperty);

      } catch (error) {
        logger.error(`Error scoring property: ${property.address}`, { error: error.message });

        // Use fallback scoring
        if (this.config.enableFallback) {
          logger.info(`Using fallback scoring for ${property.address}`);
          const fallbackScore = this.fallbackRanking.scoreProperty(property, investorProfile);
          scoredProperties.push({ ...property, ...fallbackScore });
        } else {
          throw error;
        }
      }
    }

    return scoredProperties;
  }

  /**
   * Fallback matching using only manual ranking (if API fails)
   */
  async _matchPropertiesWithFallback(investorProfile, properties) {
    logger.warn('Using complete fallback matching (no AI ranking/scoring)');

    const filtered = this._preFilterProperties(properties, investorProfile);
    const ranked = this.fallbackRanking.rankProperties(filtered, investorProfile);
    const topProperties = ranked.slice(0, this.config.topPropertiesToScore);
    const scored = topProperties.map(p => ({
      ...p,
      ...this.fallbackRanking.scoreProperty(p, investorProfile)
    }));

    return this._buildMatchingResult(investorProfile, scored, {
      totalPropertiesAnalyzed: properties.length,
      totalPropertiesFiltered: filtered.length,
      totalPropertiesRanked: ranked.length,
      topPropertiesScored: scored.length,
      usingFallback: true
    });
  }

  /**
   * Build final matching result
   */
  _buildMatchingResult(investorProfile, scoredProperties, metadata) {
    const costSummary = this.client.getCostSummary();

    return {
      investorId: investorProfile.id,
      matchingTimestamp: new Date(),
      metadata,
      matches: scoredProperties.map((property, idx) => ({
        rank: idx + 1,
        property: {
          id: property.id,
          address: property.address,
          type: property.type,
          price: property.price,
          market: property.market,
          yearBuilt: property.yearBuilt,
          status: property.status
        },
        scoring: {
          overallScore: property.overallScore,
          categoryScores: property.categoryScores,
          recommendation: property.recommendation,
          rationale: property.rationale,
          topStrengths: property.topStrengths || [],
          topConcerns: property.topConcerns || []
        },
        financials: {
          purchasePrice: property.price,
          downPayment: property.price * 0.2,
          monthlyRentalIncome: property.monthlyRentalIncome,
          monthlyExpenses: property.monthlyExpenses,
          monthlyNetCashFlow: property.monthlyRentalIncome - property.monthlyExpenses,
          projectedROI: property.projectedROI,
          capRate: property.capRate,
          cashOnCashReturn: property.cashOnCashReturn,
          debtToValueRatio: (property.debt / property.value) * 100
        },
        projections: property.cashFlowProjection || {},
        dueDiligence: property.dueDiligence || {},
        matchPercentage: Math.round(property.overallScore)
      })),
      summary: {
        bestMatch: scoredProperties[0]?.address || 'N/A',
        bestMatchScore: scoredProperties[0]?.overallScore || 0,
        averageScore: Math.round(
          scoredProperties.reduce((sum, p) => sum + (p.overallScore || 0), 0) / scoredProperties.length
        ),
        recommendedAction: this._getRecommendedAction(scoredProperties),
        investorAlignment: this._calculateInvestorAlignment(investorProfile, scoredProperties)
      },
      costSummary: {
        total: costSummary.total,
        byModel: costSummary.byModel,
        requestCount: costSummary.requestCount
      },
      performance: {
        duration: this.performanceMetrics.duration,
        phaseTimes: this.performanceMetrics.phaseTimes
      }
    };
  }

  /**
   * Parse ranking scores from Groq response
   */
  _parseRankingScores(content, expectedCount) {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      const scores = lines
        .map(line => {
          const match = line.match(/\[\d+\]\s*(\d+)/);
          return match ? parseInt(match[1]) : null;
        })
        .filter(score => score !== null)
        .slice(0, expectedCount);

      // Pad with default scores if needed
      while (scores.length < expectedCount) {
        scores.push(50);
      }

      return scores;
    } catch (error) {
      logger.warn('Error parsing ranking scores, using defaults', { error: error.message });
      return Array(expectedCount).fill(50);
    }
  }

  /**
   * Parse detailed scoring response from Claude
   */
  _parseScoringResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in scoring response');
        return this._defaultScoringResponse();
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Error parsing scoring response', { error: error.message });
      return this._defaultScoringResponse();
    }
  }

  /**
   * Parse cash flow response from Claude
   */
  _parseCashFlowResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { year1: 0, year5: 0, year10: 0 };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Error parsing cash flow response', { error: error.message });
      return { year1: 0, year5: 0, year10: 0 };
    }
  }

  /**
   * Parse due diligence response from Claude
   */
  _parseDueDiligenceResponse(content) {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { flags: [], rating: 'YELLOW' };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      logger.warn('Error parsing due diligence response', { error: error.message });
      return { flags: [], rating: 'YELLOW' };
    }
  }

  /**
   * Default scoring response for fallback
   */
  _defaultScoringResponse() {
    return {
      overallScore: 50,
      categoryScores: {
        budgetMatch: 50,
        roiAchievement: 50,
        riskRewardBalance: 50,
        timelineAlignment: 50,
        marketConditions: 50
      },
      recommendation: 'HOLD',
      rationale: 'Unable to fully evaluate due to API limitations',
      topStrengths: ['Needs manual review'],
      topConcerns: ['Incomplete analysis']
    };
  }

  /**
   * Get recommended action based on scores
   */
  _getRecommendedAction(scoredProperties) {
    if (!scoredProperties.length) return 'REVIEW_MANUALLY';

    const topScore = scoredProperties[0].overallScore || 0;

    if (topScore >= 80) return 'STRONG_BUY';
    if (topScore >= 70) return 'BUY';
    if (topScore >= 60) return 'CONSIDER';
    if (topScore >= 50) return 'HOLD';
    return 'PASS';
  }

  /**
   * Calculate investor alignment score
   */
  _calculateInvestorAlignment(investorProfile, scoredProperties) {
    if (!scoredProperties.length) return 0;

    const avgScore = scoredProperties.reduce((sum, p) => sum + (p.overallScore || 0), 0) / scoredProperties.length;

    return {
      overallAlignment: Math.round(avgScore),
      budgetAlignment: this._calculateBudgetAlignment(investorProfile, scoredProperties),
      roiAlignment: this._calculateROIAlignment(investorProfile, scoredProperties),
      timelineAlignment: Math.round(
        scoredProperties.reduce((sum, p) => sum + (p.categoryScores?.timelineAlignment || 50), 0) / scoredProperties.length
      )
    };
  }

  /**
   * Calculate budget alignment
   */
  _calculateBudgetAlignment(investorProfile, scoredProperties) {
    const matchesWithinBudget = scoredProperties.filter(
      p => p.price <= investorProfile.budget.max
    ).length;

    return Math.round((matchesWithinBudget / scoredProperties.length) * 100);
  }

  /**
   * Calculate ROI alignment
   */
  _calculateROIAlignment(investorProfile, scoredProperties) {
    const meetsROITarget = scoredProperties.filter(
      p => p.projectedROI >= investorProfile.targetROI
    ).length;

    return Math.round((meetsROITarget / scoredProperties.length) * 100);
  }

  /**
   * Create batches from array
   */
  _createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Generate cache key
   */
  _generateCacheKey(investorProfile, properties) {
    const profileHash = JSON.stringify({
      budget: investorProfile.budget,
      riskTolerance: investorProfile.riskTolerance,
      investmentFocus: investorProfile.investmentFocus
    });

    const propertyIds = properties.map(p => p.id).sort().join(',');

    return `${profileHash}_${propertyIds}`.substring(0, 100);
  }

  /**
   * Validate inputs
   */
  _validateInputs(investorProfile, properties) {
    if (!investorProfile) {
      throw new Error('Investor profile is required');
    }

    if (!Array.isArray(properties) || properties.length === 0) {
      throw new Error('Properties array is required and must not be empty');
    }

    if (!investorProfile.id) {
      throw new Error('Investor profile must have an ID');
    }

    const requiredProfileFields = ['budget', 'riskTolerance', 'targetROI', 'investmentTimeline'];
    for (const field of requiredProfileFields) {
      if (!(field in investorProfile)) {
        throw new Error(`Investor profile must have ${field}`);
      }
    }

    const requiredPropertyFields = ['id', 'address', 'price', 'type', 'monthlyRentalIncome', 'monthlyExpenses'];
    for (const property of properties) {
      for (const field of requiredPropertyFields) {
        if (!(field in property)) {
          throw new Error(`Property missing required field: ${field}`);
        }
      }
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      costSummary: this.client.getCostSummary(),
      cacheSummary: this.cache.getStats()
    };
  }
}

module.exports = PropertyMatcher;
