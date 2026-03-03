/**
 * Firebase Cloud Functions - Analytics & Reporting
 * Portfolio reporting, data aggregation, insights generation
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const PDFDocument = require('pdfkit');
const { Storage } = require('@google-cloud/storage');

const db = admin.firestore();
const storage = new Storage();

/**
 * PORTFOLIO REPORTING
 */

// Generate portfolio report
exports.generateReport = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { reportType, dateRange } = data;
    const userId = context.auth.uid;

    // Get user portfolio
    const portfolioSnapshot = await db.collection('portfolio_items')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .get();

    if (portfolioSnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'No portfolio items found');
    }

    const portfolioItems = portfolioSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate portfolio metrics
    const metrics = calculatePortfolioMetrics(portfolioItems);

    // Get property details
    const properties = await Promise.all(
      portfolioItems.map(item =>
        db.collection('properties').doc(item.propertyId).get()
      )
    );

    const propertyDetails = properties.map((doc, index) => ({
      ...portfolioItems[index],
      ...doc.data()
    }));

    // Generate report based on type
    let report = {};

    switch (reportType) {
      case 'summary':
        report = generateSummaryReport(metrics, propertyDetails);
        break;
      case 'detailed':
        report = await generateDetailedReport(userId, metrics, propertyDetails, dateRange);
        break;
      case 'tax':
        report = generateTaxReport(propertyDetails, dateRange);
        break;
      case 'performance':
        report = generatePerformanceReport(portfolioItems, propertyDetails);
        break;
      default:
        report = generateSummaryReport(metrics, propertyDetails);
    }

    // Store report in database
    const reportRef = db.collection('reports').doc();
    await reportRef.set({
      reportId: reportRef.id,
      userId,
      reportType,
      reportData: report,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Generate PDF if requested
    let pdfUrl = '';
    if (data.generatePDF) {
      pdfUrl = await generatePDFReport(reportRef.id, report);
    }

    return {
      reportId: reportRef.id,
      report,
      pdfUrl,
      message: 'Report generated successfully'
    };
  } catch (error) {
    console.error('Report generation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

function calculatePortfolioMetrics(portfolioItems) {
  const metrics = {
    totalInvestment: 0,
    totalCurrentValue: 0,
    totalAppreciation: 0,
    annualRentIncome: 0,
    overallROI: 0,
    propertyCount: portfolioItems.length,
    diversification: {}
  };

  portfolioItems.forEach(item => {
    metrics.totalInvestment += item.investmentAmount || 0;
    metrics.totalCurrentValue += item.currentValue || 0;
    metrics.totalAppreciation += (item.currentValue - item.investmentAmount) || 0;
    metrics.annualRentIncome += item.rentIncome?.annual || 0;
  });

  metrics.overallROI = metrics.totalInvestment > 0 ?
    ((metrics.totalAppreciation + metrics.annualRentIncome) / metrics.totalInvestment * 100).toFixed(2) :
    0;

  return metrics;
}

function generateSummaryReport(metrics, propertyDetails) {
  return {
    overview: {
      totalInvestment: metrics.totalInvestment,
      currentValue: metrics.totalCurrentValue,
      totalGain: metrics.totalAppreciation,
      gainPercentage: metrics.overallROI,
      annualIncome: metrics.annualRentIncome,
      propertyCount: metrics.propertyCount
    },
    topPerformers: propertyDetails
      .sort((a, b) => (b.expectedReturns?.expectedROI || 0) - (a.expectedReturns?.expectedROI || 0))
      .slice(0, 5)
      .map(p => ({
        title: p.title,
        roi: p.expectedReturns?.expectedROI,
        currentValue: p.currentValue
      })),
    summaryDate: new Date()
  };
}

async function generateDetailedReport(userId, metrics, propertyDetails, dateRange) {
  // Get transactions for period
  const startDate = dateRange?.start ? new Date(dateRange.start) : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const paymentsSnapshot = await db.collection('payments')
    .where('userId', '==', userId)
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();

  const payments = paymentsSnapshot.docs.map(doc => doc.data());

  return {
    period: { start: startDate, end: endDate },
    portfolio: metrics,
    properties: propertyDetails.map(p => ({
      title: p.title,
      address: p.address,
      investmentAmount: p.investmentAmount,
      currentValue: p.currentValue,
      roi: p.expectedReturns?.expectedROI,
      rentIncome: p.rentIncome?.annual
    })),
    transactions: payments,
    generatedDate: new Date()
  };
}

function generateTaxReport(propertyDetails, dateRange) {
  const taxData = {
    rentalIncome: 0,
    capitalGains: 0,
    expenses: [],
    deductions: []
  };

  propertyDetails.forEach(property => {
    if (property.rentIncome?.annual) {
      taxData.rentalIncome += property.rentIncome.annual;
    }

    if (property.currentValue && property.investmentAmount) {
      const gain = property.currentValue - property.investmentAmount;
      if (gain > 0) {
        taxData.capitalGains += gain;
      }
    }
  });

  return {
    period: dateRange,
    rentalIncome: taxData.rentalIncome,
    capitalGains: taxData.capitalGains,
    estimatedTaxLiability: (taxData.rentalIncome + taxData.capitalGains) * 0.25, // Placeholder
    deductionOpportunities: [
      'Property maintenance and repairs',
      'Insurance premiums',
      'Property management fees',
      'Utilities (if applicable)',
      'Advertising for tenants'
    ]
  };
}

function generatePerformanceReport(portfolioItems, propertyDetails) {
  const performanceData = {
    bestPerformers: [],
    underperformers: [],
    averageROI: 0,
    volatility: 0
  };

  const roiValues = propertyDetails.map(p => p.expectedReturns?.expectedROI || 0);
  performanceData.averageROI = roiValues.length > 0 ?
    (roiValues.reduce((a, b) => a + b) / roiValues.length).toFixed(2) :
    0;

  // Sort by performance
  const sorted = propertyDetails
    .sort((a, b) => (b.expectedReturns?.expectedROI || 0) - (a.expectedReturns?.expectedROI || 0));

  performanceData.bestPerformers = sorted.slice(0, 3);
  performanceData.underperformers = sorted.slice(-3);

  return performanceData;
}

async function generatePDFReport(reportId, reportData) {
  try {
    const doc = new PDFDocument();
    const filename = `report-${reportId}.pdf`;
    const bucket = storage.bucket('puraestate-backend.appspot.com');
    const file = bucket.file(`reports/${filename}`);

    // Create write stream
    const stream = file.createWriteStream();

    // Add content to PDF
    doc.fontSize(25).text('PuraEstate Investment Report', 100, 100);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 100, 150);

    // Add portfolio overview
    if (reportData.overview) {
      doc.fontSize(14).text('Portfolio Overview', 100, 200);
      doc.fontSize(11)
        .text(`Total Investment: $${reportData.overview.totalInvestment.toFixed(2)}`, 100, 230)
        .text(`Current Value: $${reportData.overview.currentValue.toFixed(2)}`, 100, 250)
        .text(`Total Gain: $${reportData.overview.totalGain.toFixed(2)}`, 100, 270)
        .text(`Overall ROI: ${reportData.overview.gainPercentage}%`, 100, 290);
    }

    doc.pipe(stream);
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        const [url] = await file.getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000
        });
        resolve(url);
      });
      stream.on('error', reject);
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return '';
  }
}

/**
 * DATA AGGREGATION & ANALYTICS
 */

// Aggregate market data daily
exports.aggregateMarketData = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      // Get all unique locations
      const propertiesSnapshot = await db.collection('properties')
        .where('listingStatus', '==', 'active')
        .get();

      const locationMap = {};

      propertiesSnapshot.docs.forEach(doc => {
        const property = doc.data();
        const city = property.address?.city;
        const state = property.address?.state;

        if (city && state) {
          const key = `${state}-${city}`;
          if (!locationMap[key]) {
            locationMap[key] = [];
          }
          locationMap[key].push(property);
        }
      });

      // Calculate metrics for each location
      const batch = db.batch();

      for (const [location, properties] of Object.entries(locationMap)) {
        const [state, city] = location.split('-');

        const avgPrice = properties.reduce((sum, p) => sum + (p.price?.amount || 0), 0) / properties.length;
        const demandScore = calculateDemandScore(properties);
        const inventoryLevel = properties.length;

        const dataRef = db.collection('market_data').doc(`${location}_${new Date().toISOString().split('T')[0]}`);

        batch.set(dataRef, {
          location: { country: 'US', state, city },
          date: admin.firestore.FieldValue.serverTimestamp(),
          dataType: 'price_trends',
          metrics: {
            avgPrice,
            priceChange: 0, // Calculate from historical data
            demandScore,
            inventoryLevel,
            priceRange: {
              min: Math.min(...properties.map(p => p.price?.amount || 0)),
              max: Math.max(...properties.map(p => p.price?.amount || 0))
            }
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      await batch.commit();

      return { success: true, locations: Object.keys(locationMap).length };
    } catch (error) {
      console.error('Market data aggregation error:', error);
      throw error;
    }
  });

function calculateDemandScore(properties) {
  const baseScore = Math.min(properties.length * 0.5, 10);
  const avgRating = properties.reduce((sum, p) => sum + (p.rating || 0), 0) / properties.length;
  const viewCount = properties.reduce((sum, p) => sum + (p.viewCount || 0), 0);

  return Math.min(baseScore + (avgRating / 5) * 5 + Math.log(viewCount + 1), 100);
}

// Calculate user analytics
exports.calculateUserAnalytics = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      const batch = db.batch();

      const analytics = {
        totalUsers: usersSnapshot.size,
        activeUsers: 0,
        newUsers: 0,
        investorCount: 0,
        agentCount: 0,
        adminCount: 0
      };

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();

        if (user.lastLoginAt?.toDate() > thirtyDaysAgo) {
          analytics.activeUsers++;
        }

        if (user.createdAt?.toDate() > today) {
          analytics.newUsers++;
        }

        switch (user.userType) {
          case 'investor':
            analytics.investorCount++;
            break;
          case 'agent':
            analytics.agentCount++;
            break;
          case 'admin':
            analytics.adminCount++;
            break;
        }
      });

      const analyticsRef = db.collection('admin_analytics').doc('daily_' + new Date().toISOString().split('T')[0]);
      batch.set(analyticsRef, {
        ...analytics,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      await batch.commit();

      return { success: true, ...analytics };
    } catch (error) {
      console.error('User analytics calculation error:', error);
      throw error;
    }
  });

// Aggregate property popularity metrics
exports.aggregatePropertyMetrics = functions.pubsub
  .schedule('every 12 hours')
  .onRun(async (context) => {
    try {
      const propertiesSnapshot = await db.collection('properties')
        .where('listingStatus', '==', 'active')
        .get();

      const batch = db.batch();

      propertiesSnapshot.docs.forEach(doc => {
        const property = doc.data();
        const metricsRef = db.collection('property_metrics').doc(doc.id);

        batch.set(metricsRef, {
          propertyId: doc.id,
          title: property.title,
          viewCount: property.viewCount || 0,
          favoriteCount: property.favoriteCount || 0,
          bookingCount: property.bookingCount || 0,
          engagement: {
            viewsPerDay: (property.viewCount || 0) / 7,
            savesPerView: (property.favoriteCount || 0) / Math.max(property.viewCount || 1, 1)
          },
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });

      await batch.commit();

      return { success: true, propertiesProcessed: propertiesSnapshot.size };
    } catch (error) {
      console.error('Property metrics aggregation error:', error);
      throw error;
    }
  });

/**
 * USER INSIGHTS & RECOMMENDATIONS
 */

// Generate personalized recommendations
exports.generateRecommendations = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    // Get user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = userDoc.data();
    const preferences = user.investmentPreferences;

    // Get user's past views and favorites
    const favoritesSnapshot = await db.collection('favorites')
      .where('userId', '==', userId)
      .limit(20)
      .get();

    const favorites = favoritesSnapshot.docs.map(doc => doc.data());

    // Get recommended properties
    const recommendedSnapshot = await db.collection('properties')
      .where('listingStatus', '==', 'active')
      .where('price.amount', '>=', preferences.minBudget)
      .where('price.amount', '<=', preferences.maxBudget)
      .limit(30)
      .get();

    const recommended = recommendedSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(prop => !favorites.some(fav => fav.propertyId === prop.id));

    // Score and rank recommendations
    const scored = recommended
      .map(prop => ({
        property: prop,
        score: calculatePropertyScore(prop, preferences)
      }))
      .filter(item => item.score > 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      recommendations: scored,
      message: 'Recommendations generated successfully'
    };
  } catch (error) {
    console.error('Recommendation generation error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

function calculatePropertyScore(property, userPreferences) {
  let score = 0;
  const maxScore = 100;

  if (property.price?.amount >= userPreferences.minBudget &&
    property.price?.amount <= userPreferences.maxBudget) {
    score += 40;
  }

  if (userPreferences.propertyTypes.includes(property.propertyType)) {
    score += 20;
  }

  if (userPreferences.locations.some(loc =>
    loc.city === property.address?.city)) {
    score += 20;
  }

  if (property.investmentReturns?.expectedROI >= 10) {
    score += 15;
  }

  if (property.marketData?.demandScore > 7) {
    score += 5;
  }

  return Math.min(score, maxScore);
}

module.exports = exports;
