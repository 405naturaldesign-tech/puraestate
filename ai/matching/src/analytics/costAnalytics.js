/**
 * Cost Analytics
 * Track and analyze API costs for optimization
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

const logger = new Logger('CostAnalytics');

class CostAnalytics {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'analytics');
    this.history = [];
    this.costBudget = options.costBudget || 100; // USD per day
    this.alertThreshold = options.alertThreshold || 0.8; // 80% of budget

    // Ensure directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.costFile = path.join(this.dataDir, 'cost-analytics.json');
    this._loadHistory();
  }

  /**
   * Record API call cost
   */
  recordCost(model, cost, tokens = {}, timestamp = new Date()) {
    const entry = {
      timestamp: timestamp.toISOString(),
      model,
      cost,
      tokens,
      date: timestamp.toISOString().split('T')[0]
    };

    this.history.push(entry);
    this._saveHistory();

    // Check if threshold exceeded
    const dailyCost = this.getDailyCost(timestamp);
    if (dailyCost > (this.costBudget * this.alertThreshold)) {
      logger.warn('Cost threshold alert', {
        dailyCost: dailyCost.toFixed(4),
        budget: this.costBudget,
        thresholdPercentage: ((dailyCost / this.costBudget) * 100).toFixed(1)
      });
    }

    logger.debug('Cost recorded', { model, cost: cost.toFixed(6) });
  }

  /**
   * Get total costs
   */
  getTotalCosts(startDate = null, endDate = null) {
    let filtered = this.history;

    if (startDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      filtered = filtered.filter(e => e.date >= start);
    }

    if (endDate) {
      const end = new Date(endDate).toISOString().split('T')[0];
      filtered = filtered.filter(e => e.date <= end);
    }

    return {
      count: filtered.length,
      total: parseFloat(filtered.reduce((sum, e) => sum + e.cost, 0).toFixed(4)),
      byModel: this._groupByModel(filtered),
      byDate: this._groupByDate(filtered)
    };
  }

  /**
   * Get daily cost
   */
  getDailyCost(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return parseFloat(
      this.history
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.cost, 0)
        .toFixed(4)
    );
  }

  /**
   * Get cost breakdown by model
   */
  getCostByModel() {
    const breakdown = {};

    this.history.forEach(entry => {
      if (!breakdown[entry.model]) {
        breakdown[entry.model] = {
          count: 0,
          cost: 0,
          tokens: 0
        };
      }

      breakdown[entry.model].count += 1;
      breakdown[entry.model].cost += entry.cost;
      breakdown[entry.model].tokens += (entry.tokens.total || 0);
    });

    return Object.entries(breakdown).reduce((acc, [model, data]) => {
      acc[model] = {
        count: data.count,
        cost: parseFloat(data.cost.toFixed(4)),
        avgCostPerCall: parseFloat((data.cost / data.count).toFixed(6)),
        totalTokens: data.tokens,
        avgTokensPerCall: Math.round(data.tokens / data.count)
      };
      return acc;
    }, {});
  }

  /**
   * Get efficiency metrics
   */
  getEfficiencyMetrics() {
    const byModel = this.getCostByModel();
    const metrics = {};

    Object.entries(byModel).forEach(([model, data]) => {
      metrics[model] = {
        costPerThousandTokens: parseFloat((data.cost / (data.totalTokens / 1000)).toFixed(6)),
        callsPerDollar: Math.round(data.count / data.cost),
        tokensPerDollar: Math.round(data.totalTokens / data.cost)
      };
    });

    return metrics;
  }

  /**
   * Get forecast
   */
  getForecast(days = 30) {
    const dailyCosts = this._groupByDate(this.history);
    const dailyValues = Object.values(dailyCosts).map(d => d.total);

    if (dailyValues.length === 0) {
      return {
        projectedMonthlySpend: 0,
        daysRemainingInBudget: 0,
        estimatedAlertDate: null,
        budgetStatus: 'INSUFFICIENT_DATA'
      };
    }

    const averageDailyCost = dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length;
    const projectedMonthlySpend = parseFloat((averageDailyCost * days).toFixed(2));
    const budgetUtilization = (projectedMonthlySpend / (this.costBudget * days)) * 100;

    let budgetStatus = 'ON_TRACK';
    if (budgetUtilization > 100) {
      budgetStatus = 'OVER_BUDGET';
    } else if (budgetUtilization > 80) {
      budgetStatus = 'CAUTION';
    }

    const daysRemainingInBudget = Math.floor((this.costBudget * days - projectedMonthlySpend) / averageDailyCost);
    const estimatedAlertDate = new Date();
    estimatedAlertDate.setDate(estimatedAlertDate.getDate() + Math.floor((this.costBudget * this.alertThreshold) / averageDailyCost));

    return {
      averageDailyCost: parseFloat(averageDailyCost.toFixed(4)),
      projectedMonthlySpend,
      budgetUtilization: `${budgetUtilization.toFixed(1)}%`,
      daysRemainingInBudget: Math.max(0, daysRemainingInBudget),
      estimatedAlertDate: daysRemainingInBudget > 0 ? estimatedAlertDate.toISOString().split('T')[0] : 'Today',
      budgetStatus
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const byModel = this.getCostByModel();
    const efficiency = this.getEfficiencyMetrics();

    // Check which model is least efficient
    const leastEfficient = Object.entries(efficiency).sort(
      (a, b) => a[1].costPerThousandTokens - b[1].costPerThousandTokens
    )[Object.keys(efficiency).length - 1];

    if (leastEfficient) {
      recommendations.push({
        type: 'MODEL_EFFICIENCY',
        issue: `${leastEfficient[0]} has highest cost per 1k tokens`,
        suggestion: `Consider using a more efficient model for this task`,
        potentialSavings: `Up to ${(Object.values(efficiency)[0][1].costPerThousandTokens / leastEfficient[1].costPerThousandTokens * 100).toFixed(0)}% savings`
      });
    }

    // Check for batch opportunities
    const totalCalls = Object.values(byModel).reduce((sum, d) => sum + d.count, 0);
    if (totalCalls > 100) {
      recommendations.push({
        type: 'BATCH_PROCESSING',
        issue: 'High number of individual API calls detected',
        suggestion: 'Implement batch processing for similar requests',
        potentialSavings: 'Up to 20% cost reduction'
      });
    }

    // Cache optimization
    recommendations.push({
      type: 'CACHE_STRATEGY',
      issue: 'Always implement caching for repeated queries',
      suggestion: 'Cache identical investor profiles and property sets',
      potentialSavings: 'Up to 30% based on typical patterns'
    });

    return recommendations;
  }

  /**
   * Export analytics report
   */
  generateReport(filename = 'cost-report.json') {
    const report = {
      generatedAt: new Date().toISOString(),
      totals: this.getTotalCosts(),
      byModel: this.getCostByModel(),
      efficiency: this.getEfficiencyMetrics(),
      forecast: this.getForecast(30),
      recommendations: this.getOptimizationRecommendations(),
      budgetStatus: {
        dailyBudget: this.costBudget,
        alertThreshold: this.alertThreshold,
        currentDayCost: this.getDailyCost(),
        withinBudget: this.getDailyCost() <= this.costBudget
      }
    };

    const reportPath = path.join(this.dataDir, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    logger.info('Cost report generated', { path: reportPath });
    return report;
  }

  /**
   * Group costs by model
   */
  _groupByModel(entries) {
    const grouped = {};

    entries.forEach(entry => {
      if (!grouped[entry.model]) {
        grouped[entry.model] = { count: 0, total: 0 };
      }
      grouped[entry.model].count += 1;
      grouped[entry.model].total += entry.cost;
    });

    return Object.entries(grouped).reduce((acc, [model, data]) => {
      acc[model] = {
        count: data.count,
        total: parseFloat(data.total.toFixed(4))
      };
      return acc;
    }, {});
  }

  /**
   * Group costs by date
   */
  _groupByDate(entries) {
    const grouped = {};

    entries.forEach(entry => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = { count: 0, total: 0 };
      }
      grouped[entry.date].count += 1;
      grouped[entry.date].total += entry.cost;
    });

    return Object.entries(grouped).reduce((acc, [date, data]) => {
      acc[date] = {
        count: data.count,
        total: parseFloat(data.total.toFixed(4))
      };
      return acc;
    }, {});
  }

  /**
   * Load history from file
   */
  _loadHistory() {
    try {
      if (fs.existsSync(this.costFile)) {
        const data = fs.readFileSync(this.costFile, 'utf8');
        this.history = JSON.parse(data);
        logger.debug('Cost history loaded', { entries: this.history.length });
      }
    } catch (error) {
      logger.warn('Could not load cost history', { error: error.message });
      this.history = [];
    }
  }

  /**
   * Save history to file
   */
  _saveHistory() {
    try {
      fs.writeFileSync(this.costFile, JSON.stringify(this.history, null, 2), 'utf8');
    } catch (error) {
      logger.error('Could not save cost history', { error: error.message });
    }
  }
}

module.exports = CostAnalytics;
