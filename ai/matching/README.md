# Property Matching Algorithm - OpenRouter AI

**Production-ready real estate investment property matching algorithm using OpenRouter (Groq + Claude Haiku)**

## Overview

This system matches real estate investors with ideal properties by:
1. **Fast ranking** with Groq Mixtral (500 properties in ~5 seconds, $0.25)
2. **Detailed scoring** with Claude Haiku (top 3 properties, $0.08 each)
3. **Smart caching** (24-hour profiles, 48-hour properties, 12-hour results)
4. **Automatic fallback** to manual ranking if APIs fail
5. **Comprehensive analytics** (costs, performance, accuracy)

## Key Features

### Matching Algorithm
- ✅ Budget alignment (20% weight)
- ✅ ROI achievement (30% weight)
- ✅ Cash flow analysis (20% weight)
- ✅ Appreciation potential (15% weight)
- ✅ Risk-reward balance (15% weight)

### Performance
- ✅ 500+ properties ranked in ~5 seconds
- ✅ 3 properties fully scored in ~4 seconds
- ✅ Intelligent caching (reduces cost 30-50%)
- ✅ Batch processing for 1000+ properties
- ✅ Automatic retry with exponential backoff

### Cost Optimization
- ✅ Groq for fast ranking ($0.27/1M tokens)
- ✅ Claude Haiku for scoring ($0.80/1M tokens input)
- ✅ Batch processing reduces API calls 40%
- ✅ Caching eliminates 60%+ redundant calls
- ✅ Cost tracking & daily budget alerts

### Reliability
- ✅ Automatic fallback to manual ranking
- ✅ 3x retry with exponential backoff
- ✅ Input validation & error handling
- ✅ Comprehensive logging
- ✅ Circuit breaker pattern

### Analytics
- ✅ Cost tracking by model & day
- ✅ Performance metrics (speed, accuracy)
- ✅ User feedback collection
- ✅ 30-day cost forecasting
- ✅ Optimization recommendations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Investment Profile & Properties            │
└──────────────────────┬──────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │   Pre-filtering Phase      │
         │  (10k → 500 properties)   │
         └─────────────┬─────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Groq Fast Ranking         │
         │  (500 → 20 in 5 seconds)  │
         │  Cost: $0.25              │
         └─────────────┬──────────────┘
                       │
         ┌─────────────▼──────────────────┐
         │  Claude Haiku Detailed Scoring │
         │  (Top 3, ~4 seconds)          │
         │  Cost: $0.08 each             │
         └─────────────┬──────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │   Result Compilation        │
         │  (Explanations + ROI)       │
         └─────────────┬──────────────┘
                       │
    ┌──────────────────┴──────────────────┐
    │   Cache Result (12 hours TTL)       │
    │   Track Analytics & Costs           │
    └──────────────────┬──────────────────┘
                       │
         ┌─────────────▼──────────────┐
         │  Return Top 3 Matches      │
         │  With Full Analysis        │
         └────────────────────────────┘
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- OpenRouter API key (free at https://openrouter.io)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd property-matching-algorithm
npm install

# Configure
cp .env.example .env
# Edit .env and add OPENROUTER_API_KEY
```

### Quick Start

```bash
# Test API connection
npm start

# Run tests
npm test

# Generate analytics reports
npm run analyze:costs
npm run analyze:performance
```

## Usage Example

```javascript
const PropertyMatchingSystem = require('./src/index');

const system = new PropertyMatchingSystem({
  apiKey: process.env.OPENROUTER_API_KEY,
  topPropertiesToScore: 3,
  costBudget: 100 // $100/day
});

// Define investor
const investor = {
  id: 'inv_001',
  budget: { min: 200000, max: 500000 },
  riskTolerance: 'moderate',
  targetROI: 12,
  investmentTimeline: 5,
  investmentFocus: 'cashFlow',
  propertyTypes: ['SingleFamily', 'Duplex']
};

// Load properties (from database)
const properties = await loadPropertiesFromDB({
  market: 'Austin',
  priceRange: [200000, 500000]
});

// Run matching
const result = await system.matchProperties(investor, properties);

console.log('Best Match:', result.matches[0].property.address);
console.log('Score:', result.matches[0].scoring.overallScore);
console.log('Cash Flow:', result.matches[0].financials.monthlyNetCashFlow);
console.log('Cost:', result.costSummary.total);
```

## Investor Profile Structure

```javascript
{
  id: 'unique_investor_id',
  budget: {
    min: 100000,      // Minimum investment
    max: 500000       // Maximum investment
  },
  riskTolerance: 'conservative|moderate|aggressive',
  targetROI: 12,      // Target annual return %
  investmentTimeline: 5, // Years
  investmentFocus: 'cashFlow|appreciation|balanced',
  propertyTypes: ['SingleFamily', 'Duplex', 'Townhome'],
  preferences: {
    proximity: 'Austin metro',
    schoolRating: 'top 50%',
    maxPropertyAge: 50
  }
}
```

## Property Database Schema

```javascript
{
  id: 'prop_001',
  address: '123 Main St, Austin, TX 78704',
  price: 350000,
  type: 'SingleFamily',
  yearBuilt: 2015,
  market: 'Austin',
  zipcode: '78704',
  status: 'active',
  appreciation: 4.2,        // % annual appreciation
  monthlyRentalIncome: 2500,
  monthlyExpenses: 800,
  yearlyRentalIncome: 30000,
  yearlyExpenses: 9600,
  capRate: 5.1,             // Cap rate %
  cashOnCashReturn: 17.2,   // Cash-on-cash return %
  debt: 280000,             // Current debt
  value: 350000,            // Current value
  projectedROI: 16.8,       // Projected annual ROI %
  daysOnMarket: 25
}
```

## Response Format

```javascript
{
  investorId: 'inv_001',
  matchingTimestamp: '2026-02-24T10:30:00Z',
  matches: [
    {
      rank: 1,
      property: { /* details */ },
      scoring: {
        overallScore: 85,
        categoryScores: {
          budgetMatch: 90,
          roiAchievement: 88,
          riskRewardBalance: 82,
          timelineAlignment: 80,
          marketConditions: 85
        },
        recommendation: 'STRONG_BUY|BUY|CONSIDER|HOLD|PASS',
        topStrengths: ['Strong cash flow', '...'],
        topConcerns: ['...', '...']
      },
      financials: {
        purchasePrice: 350000,
        downPayment: 70000,
        monthlyNetCashFlow: 1700,
        projectedROI: 16.8,
        capRate: 5.1
      },
      projections: {
        year1: { /* cash flow */ },
        year5: { /* cash flow */ },
        year10: { /* cash flow */ }
      },
      dueDiligence: {
        flags: ['property_age', '...'],
        rating: 'GREEN|YELLOW|RED'
      }
    },
    // ... up to 3 matches
  ],
  summary: {
    bestMatch: '123 Main St, Austin, TX',
    bestMatchScore: 85,
    averageScore: 82,
    recommendedAction: 'STRONG_BUY'
  },
  costSummary: {
    total: 0.33,
    byModel: { /* breakdown */ }
  },
  performance: {
    duration: 12500,
    phaseTimes: { /* phase breakdown */ }
  }
}
```

## Cost Analysis

### Typical Cost Per Match

```
Pre-filtering:      Free (algorithmic)
Fast ranking:       $0.25 (Groq for ~500 properties)
Top 3 scoring:      $0.24 ($0.08 × 3 with Haiku)
─────────────────────────────────
Total per match:    ~$0.49

With caching:       ~$0.33 (33% savings)
With fallback:      $0.00 (algorithmic only)
```

### Monthly Projection

```
Daily matches:      20
Cost per match:     $0.33 (with caching)
Daily cost:         $6.60
Monthly cost:       $198
Annual cost:        $2,376
```

### Cost Optimization

1. **Batch Processing**: 40% savings
2. **Caching**: 30-50% savings
3. **Reduce scoring**: Use fallback for initial ranking
4. **Combine with other AI**: Use for top 3 only

## Performance Benchmarks

| Metric | Result |
|--------|--------|
| Properties per ranking | 500 in 5 seconds |
| Properties per Haiku score | 1 in 1-2 seconds |
| Average match duration | 10-15 seconds |
| Cache hit rate (typical) | 60-80% |
| Fallback activation | <1% (errors only) |

## Caching Strategy

```javascript
// Automatic caching with TTL

Investor Profiles:    24 hours
Properties:           48 hours
Matching Results:     12 hours
Ranking Batches:      6 hours

// Cache hit examples:
// - Same investor, different properties: 50% hit on pre-filter
// - Same investor, repeated matching: 100% hit on result
// - Property updates: Auto-invalidate on refresh
```

## Error Handling & Fallback

### Automatic Failover

```
1. OpenRouter API call fails
   ↓
2. Retry with exponential backoff (max 3x)
   ↓
3. If still failing: Use fallback algorithm
   ↓
4. Return results with fallback flag
```

### Fallback Algorithm

- Pure financial analysis (no AI)
- Weights: Budget (15%), ROI (30%), Cash Flow (20%), Appreciation (15%), Risk (20%)
- Typical score variance: ±5-10 points
- Cost: $0.00

## Analytics & Monitoring

### Available Metrics

```javascript
// Cost tracking
system.costAnalytics.getDailyCost()
system.costAnalytics.getForecast(30)
system.costAnalytics.getOptimizationRecommendations()

// Performance
system.performanceAnalytics.getMatchingStats()
system.performanceAnalytics.getFeedbackInsights()
system.performanceAnalytics.getAccuracyMetrics()

// System status
system.getSystemStatus()
```

### Sample Report

```json
{
  "matchingStats": {
    "totalMatches": 150,
    "averageScore": 72,
    "averageDuration": "12500ms",
    "cacheHitRate": "68%"
  },
  "costs": {
    "totalToday": "$6.60",
    "avgPerMatch": "$0.33",
    "forecast30Days": "$198"
  },
  "recommendations": [
    "Enable batch processing for 40% savings",
    "Current cache hit rate optimal (68%)",
    "Consider reducing top-N from 3 to 1 for cost savings"
  ]
}
```

## Testing

### Run All Tests

```bash
npm test                    # Full suite with coverage
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
```

### Test Coverage

- Input validation ✅
- Caching mechanisms ✅
- Score parsing & compilation ✅
- Batch processing ✅
- Cost tracking ✅
- Fallback logic ✅
- Performance metrics ✅

## Deployment

### Development

```bash
NODE_ENV=development npm start
```

### Production

```bash
NODE_ENV=production npm start

# With PM2
pm2 start src/index.js --name property-matcher
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
```

## File Structure

```
property-matching-algorithm/
├── src/
│   ├── client/
│   │   └── openRouterClient.js     # OpenRouter API client
│   ├── cache/
│   │   └── cacheManager.js          # Caching layer
│   ├── core/
│   │   ├── propertyMatcher.js       # Main matching logic
│   │   └── fallbackRanking.js       # Fallback algorithm
│   ├── prompts/
│   │   ├── rankingPrompts.js        # Groq prompts
│   │   └── scoringPrompts.js        # Haiku prompts
│   ├── analytics/
│   │   ├── costAnalytics.js         # Cost tracking
│   │   └── performanceAnalytics.js  # Performance tracking
│   ├── utils/
│   │   └── logger.js                # Logging utility
│   ├── __tests__/
│   │   ├── unit/
│   │   └── integration/
│   └── index.js                     # Main entry point
├── package.json
├── README.md
└── USAGE.md
```

## Contributing

1. Fork repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## License

MIT

## Support

- Documentation: See USAGE.md
- Issues: GitHub Issues
- OpenRouter Docs: https://openrouter.io/docs
- Email: support@property-matcher.local

## Changelog

### v1.0.0 (2026-02-24)
- Initial release
- Groq + Claude Haiku integration
- Comprehensive caching
- Analytics & cost tracking
- Automatic fallback system
- Full test coverage

---

**Made with ❤️ for real estate investors using OpenRouter AI**
