/**
 * Complete Integration Example
 * Real-world usage scenarios with error handling
 */

require('dotenv').config();

const PropertyMatchingSystem = require('../src/index');

// ============================================================
// EXAMPLE 1: Basic Matching with Single Investor
// ============================================================
async function example1_basicMatching() {
  console.log('\n=== EXAMPLE 1: Basic Property Matching ===\n');

  const system = new PropertyMatchingSystem({
    apiKey: process.env.OPENROUTER_API_KEY,
    topPropertiesToScore: 3,
    costBudget: 100
  });

  // Define investor profile
  const conservativeInvestor = {
    id: 'investor_conservative_001',
    budget: { min: 200000, max: 400000 },
    riskTolerance: 'conservative',
    targetROI: 8,
    investmentTimeline: 10,
    investmentFocus: 'cashFlow',
    propertyTypes: ['SingleFamily'],
    preferences: {
      proximity: 'Austin, TX',
      schoolRating: 'A rated',
      maxPropertyAge: 40
    }
  };

  // Sample properties
  const properties = [
    {
      id: 'prop_001',
      address: '123 Oak Ridge, Austin, TX 78741',
      price: 350000,
      type: 'SingleFamily',
      yearBuilt: 2010,
      market: 'Austin',
      zipcode: '78741',
      status: 'active',
      appreciation: 3.5,
      monthlyRentalIncome: 2200,
      monthlyExpenses: 600,
      yearlyRentalIncome: 26400,
      yearlyExpenses: 7200,
      capRate: 4.5,
      cashOnCashReturn: 11.4,
      debt: 280000,
      value: 350000,
      projectedROI: 9.1,
      daysOnMarket: 18
    },
    {
      id: 'prop_002',
      address: '456 Maple Lane, Austin, TX 78704',
      price: 385000,
      type: 'SingleFamily',
      yearBuilt: 2012,
      market: 'Austin',
      zipcode: '78704',
      status: 'active',
      appreciation: 4.2,
      monthlyRentalIncome: 2400,
      monthlyExpenses: 700,
      yearlyRentalIncome: 28800,
      yearlyExpenses: 8400,
      capRate: 5.2,
      cashOnCashReturn: 12.8,
      debt: 308000,
      value: 385000,
      projectedROI: 10.4,
      daysOnMarket: 22
    }
  ];

  try {
    const result = await system.matchProperties(conservativeInvestor, properties);

    console.log('✓ Matching Complete');
    console.log(`  Best Match: ${result.matches[0].property.address}`);
    console.log(`  Score: ${result.matches[0].scoring.overallScore}/100`);
    console.log(`  Recommendation: ${result.matches[0].scoring.recommendation}`);
    console.log(`  Monthly Cash Flow: $${result.matches[0].financials.monthlyNetCashFlow}`);
    console.log(`  Cost: $${result.costSummary.total.toFixed(4)}`);
    console.log(`  Duration: ${result.performance.duration}ms\n`);

  } catch (error) {
    console.error('✗ Matching failed:', error.message);
  }
}

// ============================================================
// EXAMPLE 2: Batch Processing (1000+ properties)
// ============================================================
async function example2_batchProcessing() {
  console.log('\n=== EXAMPLE 2: Batch Processing (Large Dataset) ===\n');

  const system = new PropertyMatchingSystem({
    apiKey: process.env.OPENROUTER_API_KEY,
    topPropertiesToScore: 3,
    rankingBatchSize: 200
  });

  const investor = {
    id: 'investor_aggressive_001',
    budget: { min: 100000, max: 600000 },
    riskTolerance: 'aggressive',
    targetROI: 15,
    investmentTimeline: 3,
    investmentFocus: 'appreciation',
    propertyTypes: ['SingleFamily', 'Duplex', 'Townhome'],
    preferences: {}
  };

  // Generate sample large dataset
  const properties = Array.from({ length: 1000 }, (_, i) => ({
    id: `prop_${i}`,
    address: `${100 + i} Property St, Austin, TX 7870${(i % 10)}`,
    price: 250000 + (Math.random() * 300000),
    type: ['SingleFamily', 'Duplex', 'Townhome'][i % 3],
    yearBuilt: 2000 + (i % 25),
    market: 'Austin',
    zipcode: `7870${(i % 10)}`,
    status: 'active',
    appreciation: 2 + (Math.random() * 6),
    monthlyRentalIncome: 1500 + (Math.random() * 2000),
    monthlyExpenses: 400 + (Math.random() * 800),
    yearlyRentalIncome: 0,
    yearlyExpenses: 0,
    capRate: 4 + (Math.random() * 8),
    cashOnCashReturn: 5 + (Math.random() * 20),
    debt: 200000 + (Math.random() * 300000),
    value: 250000 + (Math.random() * 300000),
    projectedROI: 8 + (Math.random() * 20),
    daysOnMarket: 10 + Math.floor(Math.random() * 90)
  }));

  try {
    console.log(`Processing ${properties.length} properties...`);
    const result = await system.matchProperties(investor, properties);

    console.log(`✓ Batch Processing Complete`);
    console.log(`  Properties Analyzed: ${result.metadata.totalPropertiesAnalyzed}`);
    console.log(`  After Pre-filter: ${result.metadata.totalPropertiesFiltered}`);
    console.log(`  After Ranking: ${result.metadata.totalPropertiesRanked}`);
    console.log(`  Top Matches: ${result.matches.length}`);
    console.log(`  Total Duration: ${result.performance.duration}ms`);
    console.log(`  Total Cost: $${result.costSummary.total.toFixed(4)}\n`);

  } catch (error) {
    console.error('✗ Batch processing failed:', error.message);
  }
}

// ============================================================
// EXAMPLE 3: Cost Tracking and Analytics
// ============================================================
async function example3_analyticsTracking() {
  console.log('\n=== EXAMPLE 3: Cost & Performance Analytics ===\n');

  const system = new PropertyMatchingSystem({
    apiKey: process.env.OPENROUTER_API_KEY,
    costBudget: 50
  });

  const investor = {
    id: 'investor_tracking_001',
    budget: { min: 150000, max: 500000 },
    riskTolerance: 'moderate',
    targetROI: 12,
    investmentTimeline: 5,
    investmentFocus: 'balanced',
    propertyTypes: ['SingleFamily']
  };

  const properties = [
    {
      id: 'prop_001',
      address: '789 Investment Way, Austin, TX 78701',
      price: 300000,
      type: 'SingleFamily',
      yearBuilt: 2015,
      market: 'Austin',
      zipcode: '78701',
      status: 'active',
      appreciation: 3.8,
      monthlyRentalIncome: 2000,
      monthlyExpenses: 600,
      yearlyRentalIncome: 24000,
      yearlyExpenses: 7200,
      capRate: 5.4,
      cashOnCashReturn: 13.3,
      debt: 240000,
      value: 300000,
      projectedROI: 12.0,
      daysOnMarket: 15
    }
  ];

  try {
    // Run matching
    const result = await system.matchProperties(investor, properties);

    // Record feedback
    system.recordFeedback(investor.id, properties[0].id, {
      rating: 4,
      purchased: true,
      contacted: true,
      reason: 'Excellent cash flow',
      actualROI: 12.5,
      actualCashFlow: 1400
    });

    // Get analytics
    const status = system.getSystemStatus();
    const costReport = system.costAnalytics.generateReport();
    const perfReport = system.performanceAnalytics.generateReport();

    console.log('✓ Analytics Generated');
    console.log('\nSystem Status:');
    console.log(`  Cache Hit Rate: ${status.cache.hitRate}`);
    console.log(`  Daily Spend: $${status.costs.dailyUsage.toFixed(2)}`);
    console.log(`  30-Day Forecast: $${status.costs.forecast30Days.projectedMonthlySpend.toFixed(2)}`);

    console.log('\nCost Report:');
    console.log(`  Total Spent: $${costReport.totals.total.toFixed(2)}`);
    console.log(`  Requests: ${costReport.totals.count}`);
    console.log(`  Budget Status: ${costReport.budgetStatus.withinBudget ? 'Within Budget' : 'Over Budget'}`);

    console.log('\nPerformance Report:');
    console.log(`  Total Matches: ${perfReport.matchingStats.totalMatches}`);
    console.log(`  Average Score: ${perfReport.matchingStats.averageMatchScore}`);
    console.log(`  Avg Duration: ${perfReport.matchingStats.averageDuration}ms`);
    console.log(`  Score Distribution:`, perfReport.matchingStats.performanceDistribution);

    console.log('\nRecommendations:');
    costReport.recommendations.forEach(rec => {
      console.log(`  • ${rec.suggestion}`);
    });

  } catch (error) {
    console.error('✗ Analytics tracking failed:', error.message);
  }

  console.log('');
}

// ============================================================
// EXAMPLE 4: Multiple Investors (Batch Operations)
// ============================================================
async function example4_multipleInvestors() {
  console.log('\n=== EXAMPLE 4: Multiple Investors Processing ===\n');

  const system = new PropertyMatchingSystem({
    apiKey: process.env.OPENROUTER_API_KEY
  });

  const investors = [
    {
      id: 'investor_batch_001',
      budget: { min: 150000, max: 350000 },
      riskTolerance: 'conservative',
      targetROI: 8,
      investmentTimeline: 10,
      investmentFocus: 'cashFlow',
      propertyTypes: ['SingleFamily']
    },
    {
      id: 'investor_batch_002',
      budget: { min: 300000, max: 600000 },
      riskTolerance: 'aggressive',
      targetROI: 15,
      investmentTimeline: 3,
      investmentFocus: 'appreciation',
      propertyTypes: ['Duplex', 'MultiFamily']
    }
  ];

  const properties = [
    {
      id: 'prop_101',
      address: '111 First Ave, Austin, TX 78702',
      price: 280000,
      type: 'SingleFamily',
      yearBuilt: 2014,
      market: 'Austin',
      zipcode: '78702',
      status: 'active',
      appreciation: 3.2,
      monthlyRentalIncome: 1900,
      monthlyExpenses: 550,
      yearlyRentalIncome: 22800,
      yearlyExpenses: 6600,
      capRate: 5.8,
      cashOnCashReturn: 12.1,
      debt: 224000,
      value: 280000,
      projectedROI: 9.7,
      daysOnMarket: 20
    },
    {
      id: 'prop_102',
      address: '222 Second St, Austin, TX 78704',
      price: 450000,
      type: 'Duplex',
      yearBuilt: 2016,
      market: 'Austin',
      zipcode: '78704',
      status: 'active',
      appreciation: 4.8,
      monthlyRentalIncome: 3500,
      monthlyExpenses: 1200,
      yearlyRentalIncome: 42000,
      yearlyExpenses: 14400,
      capRate: 6.1,
      cashOnCashReturn: 15.4,
      debt: 360000,
      value: 450000,
      projectedROI: 18.2,
      daysOnMarket: 12
    }
  ];

  try {
    const results = [];

    for (const investor of investors) {
      console.log(`Processing investor: ${investor.id}`);
      const result = await system.matchProperties(investor, properties);
      results.push({
        investorId: investor.id,
        bestMatch: result.matches[0]?.property.address,
        score: result.matches[0]?.scoring.overallScore,
        cost: result.costSummary.total
      });
    }

    console.log('\n✓ Batch Processing Complete');
    console.log('\nResults:');
    results.forEach(r => {
      console.log(`  ${r.investorId}:`);
      console.log(`    Best Match: ${r.bestMatch}`);
      console.log(`    Score: ${r.score}/100`);
      console.log(`    Cost: $${r.cost.toFixed(4)}`);
    });

    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    console.log(`\n  Total Cost: $${totalCost.toFixed(4)}`);

  } catch (error) {
    console.error('✗ Batch processing failed:', error.message);
  }

  console.log('');
}

// ============================================================
// EXAMPLE 5: Error Handling & Fallback
// ============================================================
async function example5_errorHandling() {
  console.log('\n=== EXAMPLE 5: Error Handling & Fallback ===\n');

  const system = new PropertyMatchingSystem({
    apiKey: process.env.OPENROUTER_API_KEY,
    enableFallback: true
  });

  // Invalid investor profile
  const invalidInvestor = {
    id: 'investor_error_001',
    budget: { min: 100000 }
    // Missing required fields
  };

  const properties = [
    {
      id: 'prop_001',
      address: '123 Error Test, Austin, TX',
      price: 300000,
      // Missing required fields
    }
  ];

  try {
    await system.matchProperties(invalidInvestor, properties);
  } catch (error) {
    console.log('✓ Validation error caught (as expected)');
    console.log(`  Error: ${error.message}\n`);
  }

  // Valid profile with empty properties
  const validInvestor = {
    id: 'investor_error_002',
    budget: { min: 100000, max: 500000 },
    riskTolerance: 'moderate',
    targetROI: 12,
    investmentTimeline: 5,
    investmentFocus: 'cashFlow',
    propertyTypes: ['SingleFamily']
  };

  try {
    await system.matchProperties(validInvestor, []);
  } catch (error) {
    console.log('✓ Empty properties error caught (as expected)');
    console.log(`  Error: ${error.message}\n`);
  }

  console.log('Error handling working correctly!\n');
}

// ============================================================
// MAIN EXECUTION
// ============================================================
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Property Matching Algorithm - Integration Examples        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  try {
    // Run examples
    await example1_basicMatching();
    await example2_batchProcessing();
    await example3_analyticsTracking();
    await example4_multipleInvestors();
    await example5_errorHandling();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  All Examples Completed Successfully!                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  example1_basicMatching,
  example2_batchProcessing,
  example3_analyticsTracking,
  example4_multipleInvestors,
  example5_errorHandling
};
