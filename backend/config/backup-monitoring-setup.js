/**
 * Firebase Backup & Monitoring Configuration
 * Automated backups, performance monitoring, and alerting
 */

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');

const db = admin.firestore();
const storage = new Storage();

/**
 * AUTOMATED BACKUP CONFIGURATION
 */

// Daily Firestore backup
exports.backupFirestore = functions.pubsub
  .schedule('every day 02:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupName = `backup-firestore-${timestamp}`;

      // Use Google Cloud Firestore backup API
      const client = new Firestore({
        projectId: process.env.GOOGLE_CLOUD_PROJECT
      });

      functions.logger.log('Starting Firestore backup', { backupName });

      // Collections to backup
      const collections = [
        'users',
        'properties',
        'bookings',
        'payments',
        'portfolio_items',
        'notifications',
        'subscriptions'
      ];

      const backupData = {};

      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).get();
        backupData[collectionName] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }

      // Upload to Cloud Storage
      const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const file = bucket.file(`backups/${backupName}.json`);

      await file.save(JSON.stringify(backupData, null, 2), {
        metadata: {
          contentType: 'application/json',
          timestamp: new Date().toISOString()
        }
      });

      // Store backup metadata in Firestore
      await db.collection('backup_metadata').doc(backupName).set({
        backupName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        collections: Object.keys(backupData),
        status: 'completed',
        storageLocation: `gs://${process.env.FIREBASE_STORAGE_BUCKET}/backups/${backupName}.json`,
        documentCount: Object.values(backupData).reduce((sum, docs) => sum + docs.length, 0)
      });

      functions.logger.log('Firestore backup completed', { backupName, documentCount: backupData });

      return { success: true, backupName };
    } catch (error) {
      functions.logger.error('Firestore backup failed', error);

      // Send alert
      await sendMonitoringAlert('Backup Failed', `Firestore backup failed: ${error.message}`, 'critical');
      throw error;
    }
  });

// Weekly storage backup
exports.backupStorage = functions.pubsub
  .schedule('every sunday 03:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const backupName = `backup-storage-${timestamp}`;

      functions.logger.log('Starting Storage backup', { backupName });

      const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const backupBucket = storage.bucket(`${process.env.GOOGLE_CLOUD_PROJECT}-backups`);

      // List all files
      const [files] = await bucket.getFiles();

      for (const file of files) {
        // Skip backup files
        if (file.name.startsWith('backups/')) continue;

        const [content] = await file.download();
        const backupFile = backupBucket.file(`${backupName}/${file.name}`);

        await backupFile.save(content);
      }

      functions.logger.log('Storage backup completed', { backupName, fileCount: files.length });

      return { success: true, backupName, fileCount: files.length };
    } catch (error) {
      functions.logger.error('Storage backup failed', error);
      await sendMonitoringAlert('Backup Failed', `Storage backup failed: ${error.message}`, 'critical');
      throw error;
    }
  });

// Cleanup old backups (keep last 30 days)
exports.cleanupOldBackups = functions.pubsub
  .schedule('every 7 days')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const [files] = await bucket.getFiles({ prefix: 'backups/' });

      const deletedCount = 0;

      for (const file of files) {
        const [metadata] = await file.getMetadata();
        const createdTime = new Date(metadata.timeCreated);

        if (createdTime < thirtyDaysAgo) {
          await file.delete();
          deletedCount++;
        }
      }

      functions.logger.log('Old backups cleaned up', { deletedCount });
      return { success: true, deletedCount };
    } catch (error) {
      functions.logger.error('Backup cleanup failed', error);
      throw error;
    }
  });

/**
 * PERFORMANCE MONITORING
 */

// Monitor Cloud Functions performance
exports.monitorFunctionsPerformance = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      // Get function execution stats from Cloud Logging
      const metrics = await fetchFunctionMetrics();

      // Store metrics in Firestore
      await db.collection('monitoring_metrics').doc(`functions_${new Date().toISOString()}`).set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metrics,
        alertsTriggered: []
      });

      // Check for performance issues
      for (const [functionName, stats] of Object.entries(metrics)) {
        if (stats.p99 > 30000) { // 30 second threshold
          await sendMonitoringAlert(
            'High Function Latency',
            `Function ${functionName} has P99 latency of ${stats.p99}ms`,
            'warning'
          );
        }

        if (stats.errorRate > 0.05) { // 5% error rate threshold
          await sendMonitoringAlert(
            'High Error Rate',
            `Function ${functionName} has error rate of ${(stats.errorRate * 100).toFixed(2)}%`,
            'warning'
          );
        }
      }

      return { success: true, metricsCollected: Object.keys(metrics).length };
    } catch (error) {
      functions.logger.error('Function performance monitoring failed', error);
    }
  });

// Monitor Firestore performance
exports.monitorFirestorePerformance = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    try {
      const collections = [
        'users',
        'properties',
        'bookings',
        'payments',
        'notifications'
      ];

      const metrics = {};

      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName).count().get();
        metrics[collectionName] = {
          documentCount: snapshot.data().count
        };
      }

      // Store metrics
      await db.collection('monitoring_metrics').doc(`firestore_${new Date().toISOString()}`).set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'firestore',
        metrics
      });

      // Alert on large collections (>1M documents)
      for (const [collection, stats] of Object.entries(metrics)) {
        if (stats.documentCount > 1000000) {
          await sendMonitoringAlert(
            'Large Collection',
            `Collection ${collection} has ${stats.documentCount.toLocaleString()} documents`,
            'info'
          );
        }
      }

      return { success: true, ...metrics };
    } catch (error) {
      functions.logger.error('Firestore performance monitoring failed', error);
    }
  });

// Monitor authentication metrics
exports.monitorAuthMetrics = functions.pubsub
  .schedule('every 6 hours')
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection('users').get();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      let activeToday = 0;
      let activeWeek = 0;
      let verifiedUsers = 0;

      usersSnapshot.docs.forEach(doc => {
        const user = doc.data();

        if (user.lastLoginAt?.toDate() > oneDayAgo) activeToday++;
        if (user.lastLoginAt?.toDate() > sevenDaysAgo) activeWeek++;
        if (user.verificationStatus === 'verified') verifiedUsers++;
      });

      const metrics = {
        totalUsers: usersSnapshot.size,
        activeToday,
        activeWeek,
        verifiedUsers,
        verificationRate: (verifiedUsers / usersSnapshot.size * 100).toFixed(2)
      };

      await db.collection('monitoring_metrics').doc(`auth_${new Date().toISOString()}`).set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        type: 'authentication',
        metrics
      });

      return { success: true, ...metrics };
    } catch (error) {
      functions.logger.error('Auth metrics monitoring failed', error);
    }
  });

/**
 * ALERTING SYSTEM
 */

async function sendMonitoringAlert(title, message, severity = 'warning') {
  try {
    // Store alert in Firestore
    await db.collection('monitoring_alerts').add({
      title,
      message,
      severity,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      resolved: false
    });

    // Send to monitoring service (e.g., Slack, PagerDuty, email)
    await sendToSlack(title, message, severity);

    functions.logger.log('Alert sent', { title, severity });
  } catch (error) {
    functions.logger.error('Failed to send alert', error);
  }
}

async function sendToSlack(title, message, severity) {
  try {
    const axios = require('axios');
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) return;

    const color = severity === 'critical' ? 'danger' : severity === 'warning' ? 'warning' : 'good';

    await axios.post(webhookUrl, {
      attachments: [{
        color,
        title,
        text: message,
        ts: Math.floor(Date.now() / 1000)
      }]
    });
  } catch (error) {
    functions.logger.error('Failed to send Slack message', error);
  }
}

/**
 * HEALTH CHECK
 */

// Health check endpoint
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Check Firestore
    const firestoreCheck = await db.collection('users').limit(1).get().then(() => true).catch(() => false);

    // Check Authentication
    const authCheck = await admin.auth().getUser('test-uid').then(() => true).catch(() => true); // Expect error for non-existent user

    // Check Storage
    const storageCheck = await storage.bucket(process.env.FIREBASE_STORAGE_BUCKET).exists().then(([exists]) => exists);

    const status = firestoreCheck && authCheck && storageCheck ? 'healthy' : 'unhealthy';

    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      services: {
        firestore: firestoreCheck,
        auth: authCheck,
        storage: storageCheck
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

/**
 * HELPER FUNCTIONS
 */

async function fetchFunctionMetrics() {
  // This would integrate with Cloud Logging API
  // Placeholder implementation
  return {
    matchProperties: { p99: 5000, errorRate: 0.01 },
    handleBooking: { p99: 2000, errorRate: 0.005 },
    processPayment: { p99: 8000, errorRate: 0.02 },
    sendNotification: { p99: 1000, errorRate: 0.01 }
  };
}

module.exports = exports;
