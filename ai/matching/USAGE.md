# Property Matching Algorithm - Complete Usage Guide

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Create `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
LOG_LEVEL=info
NODE_ENV=production
```

### Basic Usage

```javascript
const PropertyMatchingSystem = require('./src/index');

// Initialize system
const system = new PropertyMatchingSystem({
  apiKey: process.env.OPENROUTER_API_KEY,
  topPropertiesToScore: 3,
  costBudget: 100, // $100/day
  enableFallback: true
});

// Define investor profile
const investorProfile = {
  id: 'investor_123',
  budget: { min: 200000, max: 500000 },
  riskTolerance: 'moderate', // conservative|moderate|aggressive
  targetROI: 12, // 12% annual return
  investmentTimeline: 5, // years
  investmentFocus: 'cashFlow', // cashFlow|appreciation|balanced
  propertyTypes: ['SingleFamily', 'Duplex', 'Townhome'],
  preferences: {
    proximity: 'Austin metro area',
    schoolRating: 'top 50%',
    maxPropertyAge: 50
  }
};

// Properties from database
const properties = [
  {
    id: 'prop_001',
    address: '123 Main St, Austin, TX 78704',
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
  // ... more properties
];

// Run matching
async function findMatches() {
  try {
    const result = await system.matchProperties(investorProfile, properties);

    console.log('Best Match:', result.matches[0].property.address);
    console.log('Score:', result.matches[0].scoring.overallScore);
    console.log('Monthly Cash Flow:', result.matches[0].financials.monthlyNetCashFlow);
    console.log('Total Cost:', `$${result.costSummary.total.toFixed(4)}`);

  } catch (error) {
    console.error('Matching failed:', error);
  }
}

findMatches();
```

## Architecture Overview

### 1. Pre-Filtering Phase
- Filters 10,000+ properties by hard constraints
- Budget range
- Property type preferences
- Basic financial viability
- Result: ~100-500 filtered properties

### 2. Fast Ranking Phase (Groq)
- Uses Groq Mixtral 8x7B for speed
- Ranks properties by investor fit
- Batch processes 100 properties at a time
- Cost: ~$0.25 per ranking batch
- Speed: 500 properties in ~5 seconds
- Result: Top 10-20 ranked properties

### 3. Detailed Scoring Phase (Claude Haiku)
- Claude 3 Haiku for accurate scoring
- Scores top 3 properties in detail
- Analyzes financials, risk, market conditions
- Generates cash flow projections
- Performs due diligence assessment
- Cost: ~$0.08 per property scored
- Result: Top 3 fully analyzed properties

### 4. Result Compilation
- Combines all analyses
- Generates explanation for each match
- Calculates ROI and cash flow projections
- Provides investment recommendations

## API Response Format

```javascript
{
  investorId: "investor_123",
  matchingTimestamp: "2026-02-24T10:30:00Z",
  matches: [
    {
      rank: 1,
      property: {
        id: "prop_001",
        address: "123 Main St, Austin, TX",
        type: "SingleFamily",
        price: 350000,
        // ... property details
      },
      scoring: {
        overallScore: 85,
        categoryScores: {
          budgetMatch: 90,
          roiAchievement: 88,
          riskRewardBalance: 82,
          timelineAlignment: 80,
          marketConditions: 85
        },
        recommendation: "STRONG_BUY",
        rationale: "Excellent cash flow with strong appreciation potential",
        topStrengths: [
          "Strong monthly cash flow of $1,700",
          "Below-market purchase price",
          "Appreciating market with 4.2% annual growth"
        ],
        topConcerns: [
          "Property is 9 years old (roof inspection recommended)",
          "Market slightly competitive (25 days on market)"
        ]
      },
      financials: {
        purchasePrice: 350000,
        downPayment: 70000,
        monthlyRentalIncome: 2500,
        monthlyExpenses: 800,
        monthlyNetCashFlow: 1700,
        projectedROI: 16.8,
        capRate: 5.1,
        cashOnCashReturn: 17.2,
        debtToValueRatio: 80
      },
      projections: {
        yearlyProjection: {
          year1: { ... },
          year5: { ... },
          year10: { ... }
        },
        10yearTotalCashFlow: 250000,
        totalReturnProjection: 245
      },
      dueDiligence: {
        dueDiligenceFlagsCount: 2,
        flags: ["property_age", "roof_inspection_needed"],
        overallDueDiligenceRating: "YELLOW"
      },
      matchPercentage: 85
    }
    // ... up to 3 matches
  ],
  summary: {
    bestMatch: "123 Main St, Austin, TX",
    bestMatchScore: 85,
    averageScore: 82,
    recommendedAction: "STRONG_BUY",
    investorAlignment: {
      overallAlignment: 82,
      budgetAlignment: 100,
      roiAlignment: 85,
      timelineAlignment: 80
    }
  },
  costSummary: {
    total: 0.33,
    byModel: {
      "groq/mixtral-8x7b-32768": { requests: 1, totalCost: 0.25 },
      "anthropic/claude-3-haiku-20240307": { requests: 3, totalCost: 0.08 }
    }
  },
  performance: {
    duration: 12500,
    phaseTimes: {
      preFilter: 150,
      ranking: 8000,
      scoring: 4350
    }
  }
}
```

## Advanced Features

### Caching

```javascript
// Cache automatically enabled
// TTL: 24 hours for profiles, 48 hours for properties
// 12 hours for matching results

// Check cache stats
const cacheStats = system.cacheManager.getStats();
console.log('Cache Hit Rate:', cacheStats.hitRate);
console.log('Memory Usage:', cacheStats.memory.megabytes, 'MB');

// Clear specific cache
system.cacheManager.clearNamespace('matching_result');

// Full cache clear
system.clearCache();
```

### Cost Analytics

```javascript
// Get cost summary
const costSummary = system.openRouterClient.getCostSummary();
console.log('Total Cost:', costSummary.total);
console.log('By Model:', costSummary.byModel);

// Get daily costs
const dailyCost = system.costAnalytics.getDailyCost();
console.log('Today\'s Cost:', dailyCost);

// Get forecast
const forecast = system.costAnalytics.getForecast(30);
console.log('30-Day Projection:', forecast.projectedMonthlySpend);
console.log('Budget Status:', forecast.budgetStatus);

// Get optimization recommendations
const recommendations = system.costAnalytics.getOptimizationRecommendations();
console.log('Optimization Tips:', recommendations);
```

### Performance Analytics

```javascript
// Record user feedback
system.recordFeedback('investor_123', 'prop_001', {
  rating: 4, // 1-5 stars
  purchased: true,
  contacted: true,
  reason: 'Perfect cash flow profile',
  actualROI: 17.2, // What they actually achieved
  actualCashFlow: 1850 // Actual monthly cash flow
});

// Get matching statistics
const stats = system.performanceAnalytics.getMatchingStats();
console.log('Average Match Score:', stats.averageMatchScore);
console.log('Performance Distribution:', stats.performanceDistribution);

// Get feedback insights
const insights = system.performanceAnalytics.getFeedbackInsights();
console.log('Average Rating:', insights.averageRating);
console.log('Purchase Rate:', insights.purchaseRate, '%');

// Generate comprehensive report
const reports = system.generateReports();
console.log('Reports generated to analytics/');
```

### System Status

```javascript
// Get complete system status
const status = system.getSystemStatus();
console.log(JSON.stringify(status, null, 2));

// Output includes:
// - Cache statistics
// - Cost tracking
// - Performance metrics
// - Model configurations
// - Forecast data
```

### Testing API

```javascript
// Test OpenRouter connection
const testResult = await system.testAPI();
if (testResult.success) {
  console.log('API Connection: OK');
  console.log('Test Cost:', testResult.cost.total);
} else {
  console.log('API Connection: FAILED', testResult.error);
}
```

## Error Handling & Fallback

### Automatic Fallback

When OpenRouter APIs fail:

1. Retries up to 3 times with exponential backoff
2. Falls back to manual ranking algorithm
3. Uses algorithmic scoring (no AI)
4. Returns results with fallback flag

```javascript
{
  matches: [ /* results */ ],
  metadata: { usingFallback: true }
}
```

### Error Scenarios

```javascript
try {
  const result = await system.matchProperties(investorProfile, properties);
} catch (error) {
  if (error.message.includes('API')) {
    // API error - fallback should have been used
    console.log('Using fallback results');
  } else if (error.message.includes('validation')) {
    // Input validation error
    console.log('Invalid input parameters');
  }
}
```

## Database Integration

### Sample Integration with Property Database

```javascript
const PropertyDatabase = require('./src/adapters/propertyDatabase');

const db = new PropertyDatabase({
  host: 'localhost',
  port: 5432,
  database: 'real_estate'
});

// Fetch properties for matching
const properties = await db.getProperties({
  market: 'Austin',
  priceRange: [100000, 600000],
  status: 'active',
  minROI: 8,
  limit: 500
});

// Run matching
const result = await system.matchProperties(investorProfile, properties);

// Update property metadata with match score
await db.updatePropertyScores(result.matches.map(m => ({
  propertyId: m.property.id,
  investorId: investorProfile.id,
  matchScore: m.matchPercentage,
  recommendation: m.scoring.recommendation
})));
```

## Performance Optimization

### Batch Processing (1000+ properties)

```javascript
// Split properties into batches
const batchSize = 500;
const allResults = [];

for (let i = 0; i < properties.length; i += batchSize) {
  const batch = properties.slice(i, i + batchSize);
  const result = await system.matchProperties(investorProfile, batch);
  allResults.push(...result.matches);
}

// Sort all results
const sorted = allResults.sort((a, b) =>
  b.scoring.overallScore - a.scoring.overallScore
);

console.log('Top 10 Matches:', sorted.slice(0, 10));
```

### Cost Optimization

```javascript
// Option 1: Reduce top properties to score (faster, cheaper)
const system = new PropertyMatchingSystem({
  topPropertiesToScore: 1, // Only score 1 property instead of 3
  rankingBatchSize: 50    // Smaller batches
});

// Option 2: Enable caching for repeated queries
// (Default: on, TTL: 12 hours)

// Option 3: Use fallback for non-critical matches
const result = await system.matchProperties(investorProfile, properties, {
  preFilter: true // Use pre-filtering to reduce load
});
```

## Monitoring & Alerts

### Daily Cost Alert

```javascript
const cron = require('node-cron');

cron.schedule('0 23 * * *', () => {
  const dailyCost = system.costAnalytics.getDailyCost();
  const threshold = 80; // $80/day

  if (dailyCost > threshold) {
    console.warn(`⚠️ Cost Alert: $${dailyCost} spent today (threshold: $${threshold})`);
    // Send email/Slack notification
  }
});
```

### Performance Degradation Alert

```javascript
system.performanceAnalytics.on('performanceDegraded', (metrics) => {
  console.warn('Performance degradation detected:', metrics);
  // Average response time > 15s
  // Cache hit rate < 30%
  // Cost per match > $0.50
});
```

## Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Full test suite with coverage
npm test

# Specific test file
npm test -- propertyMatcher.test.js
```

## Deployment Considerations

### Production Setup

```javascript
const system = new PropertyMatchingSystem({
  apiKey: process.env.OPENROUTER_API_KEY,
  maxRetries: 5,
  timeout: 45000,
  costBudget: 500, // Higher for production
  topPropertiesToScore: 5,
  enableFallback: true,
  rankingBatchSize: 200
});

// Monitor health
setInterval(() => {
  const status = system.getSystemStatus();
  if (status.costs.forecast30Days.budgetStatus === 'OVER_BUDGET') {
    // Alert or throttle requests
  }
}, 3600000); // Every hour
```

### Scaling

For 10,000+ properties per match:

1. **Pre-filtering**: Reduce from 10k to 500-1000 properties
2. **Batch ranking**: 100-200 properties per Groq call
3. **Parallel processing**: Process multiple investor profiles simultaneously
4. **Caching**: Cache investor profiles (24hr), properties (48hr), results (12hr)
5. **Fallback**: Use when approaching rate limits

## Troubleshooting

### Common Issues

**Issue**: API connection fails
- Check OPENROUTER_API_KEY
- Verify network connectivity
- Check OpenRouter status page
- Falls back to manual ranking if enabled

**Issue**: High costs
- Check ranking batch size (increase to 200)
- Enable caching (default: enabled)
- Reduce topPropertiesToScore (default: 3)
- Use pre-filtering

**Issue**: Slow matching
- Increase ranking batch size
- Reduce number of properties
- Check cache hit rate
- Use fallback for speed-critical operations

## Support & Resources

- OpenRouter API Docs: https://openrouter.io/docs
- Groq Mixtral: Fastest open source model
- Claude Haiku: Most cost-effective Claude model
- Cache Strategy: LRU with TTL
- Fallback Algorithm: Pure financial analysis
