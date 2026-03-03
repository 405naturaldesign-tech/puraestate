/**
 * Prompt Engineering for Scoring
 * Detailed prompts for Claude Haiku final scoring (top 3 properties)
 */

class ScoringPrompts {
  /**
   * Generate detailed scoring prompt for top property
   */
  static generateDetailedScoringPrompt(property, investorProfile) {
    const {
      budget,
      riskTolerance,
      targetROI,
      investmentTimeline,
      investmentFocus,
      preferences
    } = investorProfile;

    const financialMetrics = this._formatFinancialMetrics(property);
    const riskFactors = this._formatRiskFactors(property, investorProfile);

    return `COMPREHENSIVE PROPERTY SCORING

INVESTOR PROFILE:
- Budget: $${budget.min.toLocaleString()}-$${budget.max.toLocaleString()}
- Timeline: ${investmentTimeline} years
- Target ROI: ${targetROI}%
- Risk Tolerance: ${riskTolerance} (1=conservative, 5=aggressive)
- Focus: ${investmentFocus}
- Preferences: ${Object.entries(preferences).map(([k, v]) => \`\${k}: \${v}\`).join(', ')}

PROPERTY DETAILS:
\`\`\`
Address: ${property.address}
Type: ${property.type} | Year Built: ${property.yearBuilt}
Market: ${property.market} | Zip: ${property.zipcode}
Status: ${property.status} | Appreciation (5yr avg): ${property.appreciation}%
\`\`\`

FINANCIAL METRICS:
${financialMetrics}

RISK FACTORS:
${riskFactors}

SCORE THIS PROPERTY (0-100) considering:
1. Budget Match (20%): Does down payment and ongoing costs fit?
2. ROI Achievement (30%): Does it meet or exceed ${targetROI}% target?
3. Risk-Reward Balance (20%): Does ROI justify risk level?
4. Timeline Alignment (15%): Can goals be met in ${investmentTimeline} years?
5. Market Conditions (15%): Is market healthy? Is it appreciating?

Respond with JSON:
{
  "overallScore": 0-100,
  "categoryScores": {
    "budgetMatch": 0-100,
    "roiAchievement": 0-100,
    "riskRewardBalance": 0-100,
    "timelineAlignment": 0-100,
    "marketConditions": 0-100
  },
  "recommendation": "STRONG BUY|BUY|HOLD|PASS",
  "rationale": "2-3 sentences explaining the score",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "topConcerns": ["concern1", "concern2"],
  "cashFlowProjection": {
    "year1": 0,
    "year5": 0,
    "year10": 0
  }
}`;
  }

  /**
   * Generate comparison prompt for top 3 properties
   */
  static generateComparisonPrompt(properties, investorProfile) {
    const { budget, targetROI, investmentTimeline, investmentFocus } = investorProfile;

    const propertyComparisons = properties.map((p, idx) => `
PROPERTY ${idx + 1}: ${p.address}
- Price: $${p.price.toLocaleString()} | Cash Flow: $${(p.monthlyRentalIncome - p.monthlyExpenses).toLocaleString()}/month
- ROI: ${p.projectedROI}% | Appreciation: ${p.appreciation}% | Debt/Value: ${((p.debt / p.value) * 100).toFixed(1)}%
- Market Score: ${p.marketScore}/100 | Risk Score: ${p.riskScore}/100
`).join('\n');

    return `TOP 3 PROPERTY COMPARISON

Investor Goal: ${targetROI}% ROI in ${investmentTimeline} years, Budget $${budget.max.toLocaleString()}, Focus: ${investmentFocus}

${propertyComparisons}

COMPARE and rank for this investor:
1. Which property aligns BEST with investor goals?
2. Which offers best risk-adjusted returns?
3. Which is easiest to manage/exit?

Respond with JSON:
{
  "ranking": [1, 2, 3],
  "rankingRationale": "Why this order?",
  "bestForThis Investor": "property number and why",
  "comparisonTable": {
    "property1": {
      "strengths": ["..."],
      "weaknesses": ["..."],
      "bestFor": "investor type"
    },
    "property2": {...},
    "property3": {...}
  },
  "investmentSequence": "If investing in multiple: which order and why?"
}`;
  }

  /**
   * Generate due diligence prompt
   */
  static generateDueDiligencePrompt(property) {
    return `DUE DILIGENCE CHECKLIST

Property: ${property.address}
Price: $${property.price.toLocaleString()}

Based on available data, assess:

1. LOCATION RISK: ${property.market} market health, neighborhood trends
2. PROPERTY RISK: Age (${property.yearBuilt}), condition, type (${property.type})
3. MARKET RISK: Is this market appreciating at ${property.appreciation}% sustainable?
4. FINANCIAL RISK: Can it handle expenses while maintaining ${property.monthlyRentalIncome - property.monthlyExpenses}$+ monthly cash flow?
5. LIQUIDITY RISK: How hard would it be to sell quickly if needed?

Respond with JSON:
{
  "dueDiligenceFlagsCount": 0-10,
  "flags": ["flag1", "flag2"],
  "recommendedInspections": ["inspection1", "inspection2"],
  "questionsForAgent": ["q1", "q2"],
  "dealBreakerWarnings": ["warning1"] or [],
  "overallDueDiligenceRating": "GREEN|YELLOW|RED"
}`;
  }

  /**
   * Generate cash flow projection prompt
   */
  static generateCashFlowPrompt(property, investorProfile) {
    const { budget } = investorProfile;
    const downPayment = property.price * 0.2;
    const remainingLoan = property.price * 0.8;

    return `10-YEAR CASH FLOW PROJECTION

PROPERTY: ${property.address}
Initial Investment: $${budget.min.toLocaleString()}-$${downPayment.toLocaleString()}
Purchase Price: $${property.price.toLocaleString()}
Financing: ${remainingLoan > 0 ? \`\$\${remainingLoan.toLocaleString()} at 6.5% over 30 years\` : 'Cash'}

YEAR 1 ASSUMPTIONS:
- Rental Income: $${property.monthlyRentalIncome.toLocaleString()}/month (${property.yearlyRentalIncome.toLocaleString()}/year)
- Operating Expenses: $${property.monthlyExpenses.toLocaleString()}/month
- Debt Service (if financed): $${(remainingLoan * 0.065 / 12).toLocaleString()}/month
- Appreciation Rate: ${property.appreciation}%/year

Project cash flows for years 1, 5, 10 accounting for:
- 3% annual rental income growth
- 2% annual expense growth
- Property appreciation
- Tax implications (use standard rates)

Respond with JSON:
{
  "yearlyProjection": {
    "year1": {
      "grossIncome": 0,
      "expenses": 0,
      "debtService": 0,
      "netCashFlow": 0,
      "cumulativeCashFlow": 0
    },
    "year5": {...},
    "year10": {...}
  },
  "10yearTotalCashFlow": 0,
  "projectedPropertyValue": {
    "year1": 0,
    "year5": 0,
    "year10": 0
  },
  "breakEvenPoint": "X years",
  "totalReturnProjection": "percentage"
}`;
  }

  /**
   * Format financial metrics for prompt
   */
  static _formatFinancialMetrics(property) {
    const monthlyNetCF = property.monthlyRentalIncome - property.monthlyExpenses;
    const annualNetCF = monthlyNetCF * 12;
    const roiPercent = (annualNetCF / (property.price * 0.2)) * 100;

    return `
Purchase Price: $${property.price.toLocaleString()}
Down Payment (20%): $${(property.price * 0.2).toLocaleString()}
Monthly Rent: $${property.monthlyRentalIncome.toLocaleString()}
Monthly Expenses: $${property.monthlyExpenses.toLocaleString()}
Monthly Net Cash Flow: $${monthlyNetCF.toLocaleString()}
Annual Gross Income: $${property.yearlyRentalIncome.toLocaleString()}
Annual Net Cash Flow: $${annualNetCF.toLocaleString()}
Cash-on-Cash Return: ${roiPercent.toFixed(2)}%
Debt-to-Value Ratio: ${((property.debt / property.value) * 100).toFixed(1)}%
Cap Rate: ${property.capRate.toFixed(2)}%
Price-to-Rent Ratio: ${(property.price / (property.monthlyRentalIncome * 12)).toFixed(2)}x
`;
  }

  /**
   * Format risk factors for prompt
   */
  static _formatRiskFactors(property, investorProfile) {
    const factors = [];

    // Market risk
    factors.push(`Market Risk: ${property.market} - ${property.appreciation}% appreciation trend`);

    // Property age risk
    const propertyAge = new Date().getFullYear() - property.yearBuilt;
    if (propertyAge > 50) {
      factors.push(`Age Risk: Property is ${propertyAge} years old (older than 50 years)`);
    }

    // Appreciation vs goal
    if (property.projectedROI < investorProfile.targetROI) {
      factors.push(`ROI Risk: ${property.projectedROI}% projected vs ${investorProfile.targetROI}% target`);
    }

    // Debt burden
    if ((property.debt / property.value) > 0.7) {
      factors.push(`Leverage Risk: High debt-to-value ratio at ${((property.debt / property.value) * 100).toFixed(1)}%`);
    }

    // Liquidity
    factors.push(`Liquidity: ${property.daysOnMarket} average days on market in this area`);

    return factors.map(f => `- ${f}`).join('\n');
  }
}

module.exports = ScoringPrompts;
