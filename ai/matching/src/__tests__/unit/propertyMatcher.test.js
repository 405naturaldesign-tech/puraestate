/**
 * Property Matcher Unit Tests
 */

const PropertyMatcher = require('../../core/propertyMatcher');
const OpenRouterClient = require('../../client/openRouterClient');
const CacheManager = require('../../cache/cacheManager');

// Mock data
const mockInvestorProfile = {
  id: 'inv_001',
  budget: { min: 100000, max: 500000 },
  riskTolerance: 'moderate',
  targetROI: 12,
  investmentTimeline: 5,
  investmentFocus: 'cashFlow',
  propertyTypes: ['SingleFamily', 'Duplex'],
  preferences: {
    proximity: '50 miles',
    schoolRating: 'top 50%'
  }
};

const mockProperties = [
  {
    id: 'prop_001',
    address: '123 Main St, Austin, TX',
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
    monthlyRentalIncome: 2500,
    monthlyExpenses: 800,
    capRate: 5.1,
    cashOnCashReturn: 17.2,
    debt: 280000,
    value: 350000,
    projectedROI: 16.8,
    daysOnMarket: 25
  },
  {
    id: 'prop_002',
    address: '456 Oak Ave, Denver, CO',
    price: 425000,
    type: 'Duplex',
    yearBuilt: 2018,
    market: 'Denver',
    zipcode: '80202',
    status: 'active',
    appreciation: 3.8,
    monthlyRentalIncome: 3200,
    monthlyExpenses: 1100,
    yearlyRentalIncome: 38400,
    yearlyExpenses: 13200,
    capRate: 5.8,
    cashOnCashReturn: 19.4,
    debt: 340000,
    value: 425000,
    projectedROI: 18.2,
    daysOnMarket: 18
  }
];

describe('PropertyMatcher', () => {
  let matcher;
  let mockClient;
  let mockCache;

  beforeEach(() => {
    mockClient = {
      makeRequest: jest.fn(),
      getCostSummary: jest.fn().mockReturnValue({
        total: 0.25,
        byModel: {},
        requestCount: 2
      })
    };

    mockCache = {
      getMatchingResult: jest.fn().mockReturnValue(null),
      setMatchingResult: jest.fn(),
      getRankingBatch: jest.fn().mockReturnValue(null),
      setRankingBatch: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        totalKeys: 0
      })
    };

    matcher = new PropertyMatcher(mockClient, mockCache);
  });

  describe('Input Validation', () => {
    it('should throw error if investor profile is missing', async () => {
      await expect(matcher.matchProperties(null, mockProperties)).rejects.toThrow();
    });

    it('should throw error if properties array is empty', async () => {
      await expect(matcher.matchProperties(mockInvestorProfile, [])).rejects.toThrow();
    });

    it('should throw error if investor profile missing required fields', async () => {
      const invalidProfile = { id: 'inv_001' };
      await expect(matcher.matchProperties(invalidProfile, mockProperties)).rejects.toThrow();
    });

    it('should throw error if property missing required fields', async () => {
      const invalidProperty = { id: 'prop_001', address: '123 Main' };
      await expect(matcher.matchProperties(mockInvestorProfile, [invalidProperty])).rejects.toThrow();
    });
  });

  describe('Pre-filtering', () => {
    it('should filter properties outside budget', () => {
      const expensiveProperty = {
        ...mockProperties[0],
        price: 1000000
      };

      const filtered = matcher._preFilterProperties([expensiveProperty], mockInvestorProfile);
      expect(filtered.length).toBe(0);
    });

    it('should filter properties not matching type', () => {
      const wrongTypeProperty = {
        ...mockProperties[0],
        type: 'Commercial'
      };

      const filtered = matcher._preFilterProperties([wrongTypeProperty], mockInvestorProfile);
      expect(filtered.length).toBe(0);
    });

    it('should keep properties matching criteria', () => {
      const filtered = matcher._preFilterProperties(mockProperties, mockInvestorProfile);
      expect(filtered.length).toBeGreaterThan(0);
    });
  });

  describe('Score Parsing', () => {
    it('should parse ranking scores from response', () => {
      const response = '[1] 85\n[2] 72\n[3] 91';
      const scores = matcher._parseRankingScores(response, 3);
      expect(scores).toEqual([85, 72, 91]);
    });

    it('should pad scores if parsing incomplete', () => {
      const response = '[1] 85';
      const scores = matcher._parseRankingScores(response, 3);
      expect(scores.length).toBe(3);
      expect(scores[0]).toBe(85);
    });

    it('should handle malformed JSON in scoring response', () => {
      const response = 'Invalid JSON {bad';
      const result = matcher._parseScoringResponse(response);
      expect(result).toHaveProperty('overallScore');
    });
  });

  describe('Batch Creation', () => {
    it('should create correct number of batches', () => {
      const items = Array.from({ length: 250 }, (_, i) => ({ id: i }));
      const batches = matcher._createBatches(items, 100);
      expect(batches.length).toBe(3);
      expect(batches[0].length).toBe(100);
      expect(batches[2].length).toBe(50);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys', () => {
      const key1 = matcher._generateCacheKey(mockInvestorProfile, mockProperties);
      const key2 = matcher._generateCacheKey(mockInvestorProfile, mockProperties);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different profiles', () => {
      const profile2 = { ...mockInvestorProfile, targetROI: 15 };
      const key1 = matcher._generateCacheKey(mockInvestorProfile, mockProperties);
      const key2 = matcher._generateCacheKey(profile2, mockProperties);
      expect(key1).not.toBe(key2);
    });
  });

  describe('Result Building', () => {
    it('should build complete matching result', () => {
      const scoredProperties = [
        {
          ...mockProperties[0],
          overallScore: 85,
          categoryScores: { budgetMatch: 80, roiAchievement: 90 },
          recommendation: 'BUY'
        }
      ];

      const result = matcher._buildMatchingResult(mockInvestorProfile, scoredProperties, {
        totalPropertiesAnalyzed: 10,
        totalPropertiesFiltered: 8,
        totalPropertiesRanked: 5,
        topPropertiesScored: 1
      });

      expect(result).toHaveProperty('investorId', mockInvestorProfile.id);
      expect(result).toHaveProperty('matches');
      expect(result.matches.length).toBe(1);
      expect(result.summary.bestMatchScore).toBe(85);
    });
  });

  describe('Recommendation Logic', () => {
    it('should return STRONG_BUY for score >= 80', () => {
      const scoredProperties = [{ ...mockProperties[0], overallScore: 85 }];
      const result = matcher._buildMatchingResult(mockInvestorProfile, scoredProperties, {});
      expect(result.summary.recommendedAction).toBe('STRONG_BUY');
    });

    it('should return PASS for low scores', () => {
      const scoredProperties = [{ ...mockProperties[0], overallScore: 35 }];
      const result = matcher._buildMatchingResult(mockInvestorProfile, scoredProperties, {});
      expect(result.summary.recommendedAction).toBe('PASS');
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', () => {
      matcher.performanceMetrics.duration = 5000;
      matcher.performanceMetrics.phaseTimes = { ranking: 3000, scoring: 2000 };

      const metrics = matcher.getPerformanceMetrics();
      expect(metrics.duration).toBe(5000);
      expect(metrics.phaseTimes.ranking).toBe(3000);
    });
  });
});
