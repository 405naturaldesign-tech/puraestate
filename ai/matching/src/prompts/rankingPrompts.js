/**
 * Prompt Engineering for Ranking
 * Optimized prompts for Groq fast ranking (500 properties in ~5 seconds)
 */

class RankingPrompts {
  /**
   * Generate ranking prompt for batch property evaluation
   * Optimized for speed and token efficiency
   */
  static generateRankingPrompt(properties, investorProfile) {
    const { budget, riskTolerance, targetROI, propertyTypes, investmentTimeline, investmentFocus } = investorProfile;

    const propertyList = properties
      .map((p, idx) => `[${idx + 1}] ${p.address} | Type: ${p.type} | Price: $${p.price} | ROI: ${p.projectedROI}% | Cash Flow: $${p.monthlyRentalIncome - p.monthlyExpenses}`)
      .join('\n');

    return `RAPID PROPERTY RANKING
Budget: $${budget.min}-$${budget.max} | Risk: ${riskTolerance} | Target ROI: ${targetROI}% | Timeline: ${investmentTimeline} | Focus: ${investmentFocus}

PROPERTIES TO RANK:
${propertyList}

TASK: Rank ONLY by overall match to investor profile. Respond with ONLY:
1. [score 0-100]
2. [score 0-100]
...etc

No explanations. Fast ranking only.`;
  }

  /**
   * Generate quick match pre-filtering prompt
   */
  static generatePreFilterPrompt(properties, investorProfile) {
    const { budget, riskTolerance, propertyTypes, investmentFocus } = investorProfile;

    return `QUICK FILTER
Budget: $${budget.min}-$${budget.max} | Risk: ${riskTolerance}

PROPERTIES: ${properties.length}
Types needed: ${propertyTypes.join(', ')}
Focus: ${investmentFocus}

Filter QUICKLY - respond with ONLY comma-separated indices of matching properties.
Example: 1,3,5,7`;
  }

  /**
   * Generate batch ranking with categories
   */
  static generateCategoryRankingPrompt(properties, investorProfile) {
    const { budget, targetROI, investmentFocus } = investorProfile;

    const categories = {
      'Growth': [],
      'Stable': [],
      'Value': [],
      'All': []
    };

    const propertyList = properties
      .map((p, idx) => `[${idx + 1}] $${p.price} | ROI: ${p.projectedROI}% | YoY Growth: ${p.appreciation}% | Debt/Value: ${((p.debt / p.value) * 100).toFixed(1)}%`)
      .join('\n');

    return `CATEGORIZE & RANK
Budget: $${budget.min}-$${budget.max} | Target ROI: ${targetROI}% | Focus: ${investmentFocus}

PROPERTIES:
${propertyList}

CATEGORIES (fast response):
Growth (high appreciation, moderate cash flow)
Stable (good cash flow, stable value)
Value (below market, needs work)

RESPOND: For each category, list TOP 3 indices. Format:
Growth: 1,5,8
Stable: 2,4,9
Value: 3,6,7`;
  }

  /**
   * Generate ROI calculation validation prompt
   */
  static generateROIValidationPrompt(property, investorProfile) {
    const { budget, targetROI } = investorProfile;

    return `QUICK ROI VALIDATION
Property: ${property.address}
Price: $${property.price}
Down Payment Needed (20%): $${property.price * 0.2}
Annual Rental Income: $${property.yearlyRentalIncome}
Annual Expenses: $${property.yearlyExpenses}
Annual Debt Service: $${property.annualDebtService}

Investor Budget: $${budget.max} | Target ROI: ${targetROI}%

Respond ONLY with: YES/NO (if meets target ROI)`;
  }
}

module.exports = RankingPrompts;
