/**
 * Performance Analytics
 * Track matching accuracy, quality, and system performance
 */

const fs = require('fs');
const path = require('path');
const Logger = require('../utils/logger');

const logger = new Logger('PerformanceAnalytics');

class PerformanceAnalytics {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.join(process.cwd(), 'analytics');
    this.matches = [];
    this.feedback = [];

    // Ensure directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.matchFile = path.join(this.dataDir, 'performance-analytics.json');
    this._loadHistory();
  }

  /**
   * Record a matching result
   */
  recordMatch(investorId, matchingResult, metadata = {}) {
    const record = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      investorId,
      matchCount: matchingResult.matches?.length || 0,
      topMatchScore: matchingResult.matches?.[0]?.scoring?.overallScore || 0,
      averageScore: matchingResult.summary?.averageScore || 0,
      duration: matchingResult.performance?.duration || 0,
      costSummary: matchingResult.costSummary || {},
      metadata
    };

    this.matches.push(record);
    this._saveHistory();

    logger.debug('Match recorded', {
      investorId,
      topScore: record.topMatchScore,
      duration: `${record.duration}ms`
    });
  }

  /**
   * Record user feedback on a match
   */
  recordFeedback(investorId, propertyId, feedback) {
    const record = {
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      investorId,
      propertyId,
      rating: feedback.rating, // 1-5
      purchased: feedback.purchased || false,
      contacted: feedback.contacted || false,
      reason: feedback.reason || '',
      notes: feedback.notes || '',
      actualROI: feedback.actualROI || null,
      actualCashFlow: feedback.actualCashFlow || null
    };

    this.feedback.push(record);
    this._saveHistory();

    logger.info('Feedback recorded', {
      investorId,
      propertyId,
      rating: record.rating,
      purchased: record.purchased
    });
  }

  /**
   * Get matching statistics
   */
  getMatchingStats(startDate = null, endDate = null) {
    let filtered = this.matches;

    if (startDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      filtered = filtered.filter(m => m.date >= start);
    }

    if (endDate) {
      const end = new Date(endDate).toISOString().split('T')[0];
      filtered = filtered.filter(m => m.date <= end);
    }

    if (filtered.length === 0) {
      return {
        totalMatches: 0,
        averageMatchScore: 0,
        averageTopMatchScore: 0,
        averageDuration: 0,
        medianDuration: 0,
        performanceDistribution: {}
      };
    }

    const scores = filtered.map(m => m.averageScore);
    const topScores = filtered.map(m => m.topMatchScore);
    const durations = filtered.map(m => m.duration);

    return {
      totalMatches: filtered.length,
      averageMatchScore: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
      averageTopMatchScore: parseFloat((topScores.reduce((a, b) => a + b, 0) / topScores.length).toFixed(2)),
      medianScore: this._calculateMedian(scores),
      averageDuration: parseFloat((durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(0)),
      medianDuration: this._calculateMedian(durations),
      fastestMatch: Math.min(...durations),
      slowestMatch: Math.max(...durations),
      performanceDistribution: this._getPerformanceDistribution(scores),
      topMatchDistribution: this._getPerformanceDistribution(topScores)
    };
  }

  /**
   * Get feedback insights
   */
  getFeedbackInsights(startDate = null, endDate = null) {
    let filtered = this.feedback;

    if (startDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      filtered = filtered.filter(f => f.date >= start);
    }

    if (endDate) {
      const end = new Date(endDate).toISOString().split('T')[0];
      filtered = filtered.filter(f => f.date <= end);
    }

    if (filtered.length === 0) {
      return {
        totalFeedback: 0,
        averageRating: 0,
        purchaseRate: 0,
        contactRate: 0,
        ratingDistribution: {}
      };
    }

    const ratings = filtered.map(f => f.rating);
    const purchased = filtered.filter(f => f.purchased).length;
    const contacted = filtered.filter(f => f.contacted).length;

    return {
      totalFeedback: filtered.length,
      averageRating: parseFloat((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)),
      purchaseRate: parseFloat(((purchased / filtered.length) * 100).toFixed(1)),
      contactRate: parseFloat(((contacted / filtered.length) * 100).toFixed(1)),
      ratingDistribution: this._getRatingDistribution(ratings),
      topReasons: this._getTopReasons(filtered.map(f => f.reason)),
      averageActualROI: this._calculateAverageActualROI(filtered),
      averageActualCashFlow: this._calculateAverageActualCashFlow(filtered)
    };
  }

  /**
   * Get accuracy metrics (comparing predictions vs actual outcomes)
   */
  getAccuracyMetrics() {
    const withActuals = this.feedback.filter(f => f.actualROI !== null || f.actualCashFlow !== null);

    if (withActuals.length === 0) {
      return {
        sampleSize: 0,
        roiPredictionAccuracy: 0,
        cashFlowPredictionAccuracy: 0,
        recommendations: []
      };
    }

    // This would require matching with original projections
    // For now, return placeholder
    return {
      sampleSize: withActuals.length,
      roiPredictionAccuracy: 'Data collection in progress',
      cashFlowPredictionAccuracy: 'Data collection in progress',
      recommendations: [
        'Continue collecting feedback for 30+ properties to establish baseline accuracy',
        'Compare predicted vs actual ROI after 12 months',
        'Track cash flow predictions accuracy quarterly'
      ]
    };
  }

  /**
   * Get daily performance trend
   */
  getDailyTrend(days = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trend = {};

    this.matches
      .filter(m => {
        const mDate = new Date(m.date);
        return mDate >= startDate && mDate <= endDate;
      })
      .forEach(m => {
        if (!trend[m.date]) {
          trend[m.date] = {
            matches: 0,
            totalScore: 0,
            totalDuration: 0,
            totalCost: 0
          };
        }

        trend[m.date].matches += 1;
        trend[m.date].totalScore += m.averageScore;
        trend[m.date].totalDuration += m.duration;
        trend[m.date].totalCost += (m.costSummary?.total || 0);
      });

    return Object.entries(trend)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .reduce((acc, [date, data]) => {
        acc[date] = {
          matches: data.matches,
          avgScore: parseFloat((data.totalScore / data.matches).toFixed(2)),
          avgDuration: parseFloat((data.totalDuration / data.matches).toFixed(0)),
          totalCost: parseFloat(data.totalCost.toFixed(4))
        };
        return acc;
      }, {});
  }

  /**
   * Generate comprehensive report
   */
  generateReport(filename = 'performance-report.json') {
    const report = {
      generatedAt: new Date().toISOString(),
      matchingStats: this.getMatchingStats(),
      feedbackInsights: this.getFeedbackInsights(),
      accuracyMetrics: this.getAccuracyMetrics(),
      dailyTrend: this.getDailyTrend(30),
      topPerformingInvestors: this._getTopPerformingInvestors(10),
      recommendations: this._getRecommendations()
    };

    const reportPath = path.join(this.dataDir, filename);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    logger.info('Performance report generated', { path: reportPath });
    return report;
  }

  /**
   * Calculate median
   */
  _calculateMedian(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Get performance distribution
   */
  _getPerformanceDistribution(scores) {
    const distribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    scores.forEach(score => {
      if (score >= 80) distribution.excellent += 1;
      else if (score >= 60) distribution.good += 1;
      else if (score >= 40) distribution.fair += 1;
      else distribution.poor += 1;
    });

    return Object.entries(distribution).reduce((acc, [key, count]) => {
      acc[key] = { count, percentage: parseFloat(((count / scores.length) * 100).toFixed(1)) };
      return acc;
    }, {});
  }

  /**
   * Get rating distribution
   */
  _getRatingDistribution(ratings) {
    const distribution = {};

    for (let i = 1; i <= 5; i++) {
      const count = ratings.filter(r => r === i).length;
      distribution[i] = {
        count,
        percentage: parseFloat(((count / ratings.length) * 100).toFixed(1))
      };
    }

    return distribution;
  }

  /**
   * Get top reasons for feedback
   */
  _getTopReasons(reasons) {
    const counts = {};

    reasons.forEach(reason => {
      if (reason) {
        counts[reason] = (counts[reason] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }

  /**
   * Calculate average actual ROI
   */
  _calculateAverageActualROI(feedback) {
    const withROI = feedback.filter(f => f.actualROI !== null);
    if (withROI.length === 0) return null;

    return parseFloat(
      (withROI.reduce((sum, f) => sum + f.actualROI, 0) / withROI.length).toFixed(2)
    );
  }

  /**
   * Calculate average actual cash flow
   */
  _calculateAverageActualCashFlow(feedback) {
    const withCF = feedback.filter(f => f.actualCashFlow !== null);
    if (withCF.length === 0) return null;

    return parseFloat(
      (withCF.reduce((sum, f) => sum + f.actualCashFlow, 0) / withCF.length).toFixed(2)
    );
  }

  /**
   * Get top performing investors
   */
  _getTopPerformingInvestors(limit) {
    const investorStats = {};

    this.matches.forEach(match => {
      if (!investorStats[match.investorId]) {
        investorStats[match.investorId] = {
          matches: 0,
          totalScore: 0
        };
      }

      investorStats[match.investorId].matches += 1;
      investorStats[match.investorId].totalScore += match.topMatchScore;
    });

    return Object.entries(investorStats)
      .map(([investorId, stats]) => ({
        investorId,
        matches: stats.matches,
        avgScore: parseFloat((stats.totalScore / stats.matches).toFixed(2))
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, limit);
  }

  /**
   * Get recommendations
   */
  _getRecommendations() {
    const stats = this.getMatchingStats();
    const feedback = this.getFeedbackInsights();
    const recommendations = [];

    if (stats.averageMatchScore < 50) {
      recommendations.push('Average match scores are low. Review prompt optimization and weighting algorithms.');
    }

    if (stats.averageDuration > 15000) {
      recommendations.push('Average matching time exceeds 15 seconds. Consider batch processing or caching improvements.');
    }

    if (feedback.purchaseRate < 20) {
      recommendations.push('Property purchase rate is below 20%. Verify matching criteria alignment with investor feedback.');
    }

    if (feedback.averageRating < 3) {
      recommendations.push('Average user rating below 3/5. Collect detailed feedback to improve matching algorithm.');
    }

    return recommendations;
  }

  /**
   * Load history from file
   */
  _loadHistory() {
    try {
      if (fs.existsSync(this.matchFile)) {
        const data = fs.readFileSync(this.matchFile, 'utf8');
        const parsed = JSON.parse(data);
        this.matches = parsed.matches || [];
        this.feedback = parsed.feedback || [];
        logger.debug('Performance history loaded', { matches: this.matches.length, feedback: this.feedback.length });
      }
    } catch (error) {
      logger.warn('Could not load performance history', { error: error.message });
    }
  }

  /**
   * Save history to file
   */
  _saveHistory() {
    try {
      fs.writeFileSync(
        this.matchFile,
        JSON.stringify({ matches: this.matches, feedback: this.feedback }, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Could not save performance history', { error: error.message });
    }
  }
}

module.exports = PerformanceAnalytics;
