/**
 * Firebase Cloud Functions Configuration
 * Deployment settings and environment setup for PuraEstate
 */

// firebase.json - Root configuration
const firebaseConfig = {
  "projects": {
    "default": "puraestate-backend"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-functions-debug.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run lint"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
};

// .env.local - Environment variables for Cloud Functions
const envConfig = `
# Stripe
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@puraestate.com

# Firebase
FIREBASE_PROJECT_ID=puraestate-backend
FIREBASE_STORAGE_BUCKET=puraestate-backend.appspot.com
FIREBASE_DATABASE_URL=https://puraestate-backend.firebaseio.com

# Google Cloud
GOOGLE_CLOUD_PROJECT=puraestate-backend
GOOGLE_CLOUD_REGION=us-central1

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_key
PROPERTY_VALUATION_API_KEY=your_valuation_api_key

# App Settings
NODE_ENV=production
LOG_LEVEL=info
MAX_REQUEST_SIZE=10485760
REQUEST_TIMEOUT=540000
`;

// functions/package.json
const packageJson = {
  "name": "puraestate-functions",
  "description": "PuraEstate Firebase Cloud Functions",
  "version": "1.0.0",
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log",
    "lint": "eslint .",
    "test": "jest"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0",
    "stripe": "^14.0.0",
    "twilio": "^4.0.0",
    "@sendgrid/mail": "^7.7.0",
    "@google-cloud/storage": "^7.0.0",
    "pdfkit": "^0.13.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "express": "^4.18.0",
    "lodash": "^4.17.21",
    "moment": "^2.29.0",
    "validator": "^13.11.0"
  },
  "devDependencies": {
    "firebase-functions-test": "^3.1.0",
    "jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0"
  }
};

// functions/index.js - Main entry point
const functionsIndex = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./config/service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'puraestate-backend',
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

// Configure logging
functions.logger.log('Firebase Admin SDK initialized', {
  projectId: process.env.FIREBASE_PROJECT_ID
});

// Import all function modules
const authFunctions = require('./functions/auth');
const mainFunctions = require('./functions/main');
const analyticsFunctions = require('./functions/analytics');
const userFunctions = require('./functions/users');
const propertyFunctions = require('./functions/properties');
const notificationFunctions = require('./functions/notifications');

// Export all functions
module.exports = {
  // Auth functions
  ...authFunctions,

  // Main business logic functions
  ...mainFunctions,

  // Analytics and reporting
  ...analyticsFunctions,

  // User management
  ...userFunctions,

  // Property management
  ...propertyFunctions,

  // Notifications
  ...notificationFunctions
};
`;

// functions/middleware/auth.js - Authentication middleware
const authMiddleware = `
const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Verify user authentication
 */
exports.verifyAuth = (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }
  return context.auth;
};

/**
 * Verify user authorization
 */
exports.verifyUserType = (userType, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  if (context.auth.token.userType !== userType && context.auth.token.userType !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      \`User must be \${userType} to perform this action\`
    );
  }

  return context.auth;
};

/**
 * Rate limiting middleware
 */
const rateLimitStore = new Map();

exports.rateLimit = (userId, limit = 100, windowMs = 60000) => {
  const now = Date.now();
  const key = userId;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= limit) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many requests. Please try again later.'
    );
  }

  recentRequests.push(now);
  rateLimitStore.set(key, recentRequests);
};

/**
 * Data validation middleware
 */
exports.validateInput = (data, schema) => {
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];

    // Check required
    if (rules.required && !value) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        \`\${key} is required\`
      );
    }

    // Check type
    if (value && rules.type && typeof value !== rules.type) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        \`\${key} must be of type \${rules.type}\`
      );
    }

    // Check length
    if (value && rules.minLength && value.length < rules.minLength) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        \`\${key} must be at least \${rules.minLength} characters\`
      );
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        \`\${key} must be no more than \${rules.maxLength} characters\`
      );
    }

    // Custom validation
    if (value && rules.validate && !rules.validate(value)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        rules.validationMessage || \`\${key} is invalid\`
      );
    }
  }
};
`;

// functions/middleware/error-handler.js
const errorHandler = `
const functions = require('firebase-functions');

/**
 * Global error handler
 */
exports.handleError = (error, context = {}) => {
  console.error('Error:', {
    message: error.message,
    code: error.code,
    context,
    stack: error.stack
  });

  // Map common errors to HTTP error codes
  if (error instanceof functions.https.HttpsError) {
    return error;
  }

  if (error.message.includes('permission')) {
    return new functions.https.HttpsError('permission-denied', error.message);
  }

  if (error.message.includes('not found') || error.message.includes('404')) {
    return new functions.https.HttpsError('not-found', error.message);
  }

  if (error.message.includes('already exists')) {
    return new functions.https.HttpsError('already-exists', error.message);
  }

  // Generic internal error for unknown errors
  return new functions.https.HttpsError('internal', 'An internal server error occurred');
};

/**
 * Error logging wrapper
 */
exports.withErrorHandling = (handler) => {
  return async (data, context) => {
    try {
      return await handler(data, context);
    } catch (error) {
      throw exports.handleError(error, { data, userId: context.auth?.uid });
    }
  };
};
`;

// functions/middleware/logging.js
const logging = `
const functions = require('firebase-functions');

/**
 * Request/response logging
 */
exports.logRequest = (functionName, context) => {
  functions.logger.log(\`Function \${functionName} called\`, {
    userId: context.auth?.uid,
    userType: context.auth?.token.userType,
    timestamp: new Date().toISOString()
  });
};

/**
 * Performance logging
 */
exports.measurePerformance = (functionName) => {
  return (handler) => {
    return async (data, context) => {
      const startTime = Date.now();

      try {
        const result = await handler(data, context);
        const duration = Date.now() - startTime;

        functions.logger.info(\`\${functionName} completed\`, {
          duration: \`\${duration}ms\`,
          userId: context.auth?.uid,
          status: 'success'
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        functions.logger.error(\`\${functionName} failed\`, {
          duration: \`\${duration}ms\`,
          userId: context.auth?.uid,
          error: error.message,
          status: 'error'
        });

        throw error;
      }
    };
  };
};
`;

module.exports = {
  firebaseConfig,
  envConfig,
  packageJson,
  functionsIndex,
  authMiddleware,
  errorHandler,
  logging
};
