/**
 * Fallback Ranking System
 * Pure algorithmic ranking when AI APIs fail
 * Used as safety net for production reliability
 */

const Logger = require('../utils/logger');

const logger = new Logger('FallbackRanking');

class FallbackRanking {
  constructor() {
    this.weights = {
      budgetFit: 0.15,
      roiMatch: 0.30,
      cashFlowStrength: 0.20,
      appreciation: 0.15,
      riskAdjustment: 0.20
    };
  }

  /**
   * Rank properties using manual algorithm
   */
  rankProperties(properties, investorProfile) {
    logger.info('Starting fallback ranking', { propertyCount: properties.length });

    const rankedProperties = properties.map(property => {
      const score = this._calculatePropertyScore(property, investorProfile);

      return {
        ...property,
        rankingScore: score,
        fallbackRanking: true,
        rankedAt: new Date()
      };
    });

    // Sort by score descending
    rankedProperties.sort((a, b) => b.rankingScore - a.rankingScore);

    logger.info('Fallback ranking complete', {
      topScore: rankedProperties[0]?.rankingScore,
      bottomScore: rankedProperties[rankedProperties.length - 1]?.rankingScore
    });

    return rankedProperties;
  }

  /**
   * Score a single property
   */
  scoreProperty(property, investorProfile) {
    logger.info(`Scoring property with fallback: ${property.address}`);

    const categoryScores = {
      budgetMatch: this._scoreBudgetMatch(property, investorProfile),
      roiAchievement: this._scoreROIAchievement(property, investorProfile),
      riskRewardBalance: this._scoreRiskRewardBalance(property, investorProfile),
      timelineAlignment: this._scoreTimelineAlignment(property, investorProfile),
      marketConditions: this._scoreMarketConditions(property, investorProfile)
    };

    const overallScore = Math.round(
      Object.entries(this.weights).reduce((sum, [key, weight]) => {
        const scoreKey = Object.keys(categoryScores).find(k => k.includes(key.replace('budgetFit', 'budgetMatch').replace('roiMatch', 'roiAchievement').replace('cashFlowStrength', 'cashFlowStrength')));
        return sum + ((categoryScores[scoreKey] || 50) * weight);
      }, 0)
    );

    const recommendation = this._getRecommendation(overallScore);

    return {
      overallScore,
      categoryScores,
      recommendation,
      rationale: `Property scores ${overallScore}/100 based on budget fit, ROI achievement, risk-reward balance, timeline alignment, and market conditions.`,
      topStrengths: this._getTopStrengths(property, investorProfile, categoryScores),
      topConcerns: this._getTopConcerns(property, investorProfile, categoryScores),
      fallbackScoring: true
    };
  }

  /**
   * Calculate composite property score
   */
  _calculatePropertyScore(property, investorProfile) {
    const budgetFitScore = this._scoreBudgetMatch(property, investorProfile);
    const roiMatchScore = this._scoreROIAchievement(property, investorProfile);
    const cashFlowScore = this._scoreCashFlow(property);
    const appreciationScore = this._scoreAppreciation(property, investorProfile);
    const riskAdjustmentScore = this._scoreRiskAdjustment(property, investorProfile);

    const composite =
      (budgetFitScore * this.weights.budgetFit) +
      (roiMatchScore * this.weights.roiMatch) +
      (cashFlowScore * this.weights.cashFlowStrength) +
      (appreciationScore * this.weights.appreciation) +
      (riskAdjustmentScore * this.weights.riskAdjustment);

    return Math.round(composite);
  }

  /**
   * Score budget match (0-100)
   */
  _scoreBudgetMatch(property, investorProfile) {
    const { budget } = investorProfile;
    const downPayment = property.price * 0.2;

    // Perfect score if exactly at target
    if (downPayment >= budget.min && downPayment <= budget.max) {
      const midpoint = (budget.min + budget.max) / 2;
      const distance = Math.abs(downPayment - midpoint);
      const range = (budget.max - budget.min) / 2;
      return Math.round(100 - (distance / range) * 50);
    }

    // Below min = harder to finance, score down
    if (downPayment < budget.min) {
      return Math.round((downPayment / budget.min) * 80);
    }

    // Above max = out of budget
    if (downPayment > budget.max) {
      return Math.max(0, Math.round((budget.max / downPayment) * 50));
    }

    return 50;
  }

  /**
   * Score ROI achievement (0-100)
   */
  _scoreROIAchievement(property, investorProfile) {
    const { targetROI } = investorProfile;
    const downPayment = property.price * 0.2;
    const annualCashFlow = (property.monthlyRentalIncome - property.monthlyExpenses) * 12;
    const propertyROI = (annualCashFlow / downPayment) * 100;

    // Perfect score if meets or exceeds target
    if (propertyROI >= targetROI) {
      const excess = Math.min(propertyROI - targetROI, targetROI * 0.5); // Cap bonus
      return Math.min(100, Math.round(80 + (excess / (targetROI * 0.5)) * 20));
    }

    // Score proportional to distance from target
    const ratio = propertyROI / targetROI;
    return Math.round(ratio * 100);
  }

  /**
   * Score cash flow strength (0-100)
   */
  _scoreCashFlow(property) {
    const monthlyNetCF = property.monthlyRentalIncome - property.monthlyExpenses;

    if (monthlyNetCF <= 0) {
      return 0; // Negative cash flow is unacceptable
    }

    // Score based on ratio to monthly rent
    const monthlyRent = property.monthlyRentalIncome;
    const cfRatio = monthlyNetCF / monthlyRent;

    if (cfRatio > 0.4) return 100; // Excellent (40%+ margin)
    if (cfRatio > 0.3) return 85;  // Very good (30-40% margin)
    if (cfRatio > 0.2) return 70;  // Good (20-30% margin)
    if (cfRatio > 0.1) return 50;  // Fair (10-20% margin)
    return 30; // Poor (<10% margin)
  }

  /**
   * Score appreciation potential (0-100)
   */
  _scoreAppreciation(property, investorProfile) {
    const appreciation = property.appreciation || 0;

    if (investorProfile.investmentFocus === 'appreciation') {
      if (appreciation > 5) return 95;
      if (appreciation > 4) return 85;
      if (appreciation > 3) return 70;
      if (appreciation > 2) return 50;
      if (appreciation > 1) return 30;
      return 10;
    }

    // For cash flow focus, appreciation is nice but not critical
    if (appreciation > 5) return 85;
    if (appreciation > 4) return 75;
    if (appreciation > 3) return 60;
    if (appreciation > 2) return 50;
    if (appreciation > 1) return 40;
    return 20;
  }

  /**
   * Score risk-reward balance (0-100)
   */
  _scoreRiskAdjustment(property, investorProfile) {
    const { riskTolerance } = investorProfile;
    const debtRatio = property.debt / property.value;
    const propertyAge = new Date().getFullYear() - property.yearBuilt;

    let riskScore = 50;

    // Leverage risk
    if (debtRatio > 0.8) {
      riskScore -= 20; // High leverage = high risk
    } else if (debtRatio > 0.6) {
      riskScore -= 10;
    } else if (debtRatio < 0.3) {
      riskScore += 10; // Low leverage = lower risk
    }

    // Property age risk
    if (propertyAge > 100) {
      riskScore -= 15;
    } else if (propertyAge > 50) {
      riskScore -= 10;
    } else if (propertyAge < 10) {
      riskScore += 10; // New construction = lower risk
    }

    // Adjust for investor risk tolerance
    if (riskTolerance === 'conservative') {
      riskScore = Math.max(0, riskScore - 15);
    } else if (riskTolerance === 'moderate') {
      // No adjustment
    } else if (riskTolerance === 'aggressive') {
      riskScore = Math.min(100, riskScore + 15);
    }

    return Math.max(0, Math.min(100, riskScore));
  }

  /**
   * Score budget match for detailed scoring (0-100)
   */
  _scoreBudgetMatch(property, investorProfile) {
    return this._scoreBudgetMatch(property, investorProfile);
  }

  /**
   * Score timeline alignment (0-100)
   */
  _scoreTimelineAlignment(property, investorProfile) {
    const { investmentTimeline, investmentFocus } = investorProfile;
    const appreciation = property.appreciation || 2;

    // Short timeline: need good cash flow
    if (investmentTimeline <= 3) {
      const monthlyNetCF = property.monthlyRentalIncome - property.monthlyExpenses;
      if (monthlyNetCF > 500) return 85;
      if (monthlyNetCF > 200) return 70;
      if (monthlyNetCF > 0) return 50;
      return 20;
    }

    // Long timeline: can rely on appreciation
    if (investmentTimeline > 10) {
      if (appreciation > 4) return 90;
      if (appreciation > 3) return 75;
      if (appreciation > 2) return 60;
      return 40;
    }

    // Medium timeline: balance both
    const cfScore = this._scoreCashFlow(property);
    const appScore = appreciation > 3 ? 80 : appreciation > 2 ? 60 : 40;
    return Math.round((cfScore + appScore) / 2);
  }

  /**
   * Score market conditions (0-100)
   */
  _scoreMarketConditions(property, investorProfile) {
    const appreciation = property.appreciation || 2;
    const daysOnMarket = property.daysOnMarket || 45;

    let score = 50;

    // Market momentum
    if (appreciation > 5) score += 30;
    else if (appreciation > 3) score += 20;
    else if (appreciation > 2) score += 10;
    else score -= 5;

    // Liquidity
    if (daysOnMarket < 20) score += 15; // Seller's market
    else if (daysOnMarket < 45) score += 5;
    else if (daysOnMarket > 120) score -= 15; // Buyer's market

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get recommendation based on overall score
   */
  _getRecommendation(score) {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 70) return 'BUY';
    if (score >= 60) return 'CONSIDER';
    if (score >= 50) return 'HOLD';
    return 'PASS';
  }

  /**
   * Get top strengths based on component scores
   */
  _getTopStrengths(property, investorProfile, categoryScores) {
    const strengths = [];

    if (categoryScores.budgetMatch > 75) {
      strengths.push('Excellent budget alignment');
    }

    if (categoryScores.roiAchievement > 75) {
      strengths.push('Strong ROI potential');
    }

    if (categoryScores.riskRewardBalance > 75) {
      strengths.push('Favorable risk-reward balance');
    }

    if (categoryScores.marketConditions > 75) {
      strengths.push('Strong market conditions');
    }

    if (property.monthlyRentalIncome - property.monthlyExpenses > 500) {
      strengths.push('Robust monthly cash flow');
    }

    if (property.appreciation > 4) {
      strengths.push('High appreciation potential');
    }

    return strengths.slice(0, 3);
  }

  /**
   * Get top concerns based on component scores
   */
  _getTopConcerns(property, investorProfile, categoryScores) {
    const concerns = [];

    if (categoryScores.budgetMatch < 50) {
      concerns.push('Budget misalignment');
    }

    if (categoryScores.roiAchievement < 50) {
      concerns.push('ROI below target');
    }

    if (categoryScores.riskRewardBalance < 50) {
      concerns.push('Unfavorable risk profile');
    }

    if (property.monthlyRentalIncome - property.monthlyExpenses < 100) {
      concerns.push('Thin cash flow margins');
    }

    if ((property.debt / property.value) > 0.75) {
      concerns.push('High leverage');
    }

    if (new Date().getFullYear() - property.yearBuilt > 50) {
      concerns.push('Aging property');
    }

    return concerns.slice(0, 3);
  }
}

module.exports = FallbackRanking;
