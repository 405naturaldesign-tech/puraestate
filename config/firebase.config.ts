/**
 * Firebase Configuration for PuraEstate
 * Handles analytics, crash reporting, and real-time database
 */

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent, setUserId, setUserProperties } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getPerformance } from "firebase/performance";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Realtime Database and get a reference to the service
export const realtimeDb = getDatabase(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (only if enabled)
let analytics: any = null;
if (typeof window !== "undefined" && process.env.ENABLE_ANALYTICS === "true") {
  analytics = getAnalytics(app);
}

// Initialize Performance Monitoring
const perf = getPerformance(app);

/**
 * Log analytics event
 */
export const logAnalyticsEvent = (
  eventName: string,
  eventParams?: Record<string, any>
) => {
  if (!analytics) return;

  try {
    logEvent(analytics, eventName, {
      ...eventParams,
      timestamp: new Date().toISOString(),
      environment: process.env.ENVIRONMENT,
    });
  } catch (error) {
    console.error("Failed to log analytics event:", error);
  }
};

/**
 * Set analytics user ID
 */
export const setAnalyticsUserId = (userId: string) => {
  if (!analytics) return;

  try {
    setUserId(analytics, userId);
  } catch (error) {
    console.error("Failed to set analytics user ID:", error);
  }
};

/**
 * Set analytics user properties
 */
export const setAnalyticsUserProperties = (properties: Record<string, any>) => {
  if (!analytics) return;

  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error("Failed to set analytics user properties:", error);
  }
};

/**
 * Log property search event
 */
export const logPropertySearchEvent = (searchParams: {
  location?: string;
  propertyType?: string;
  priceRange?: string;
  bedrooms?: number;
  bathrooms?: number;
  resultsCount?: number;
}) => {
  logAnalyticsEvent("property_search", {
    location: searchParams.location,
    property_type: searchParams.propertyType,
    price_range: searchParams.priceRange,
    bedrooms: searchParams.bedrooms,
    bathrooms: searchParams.bathrooms,
    results_count: searchParams.resultsCount,
  });
};

/**
 * Log property view event
 */
export const logPropertyViewEvent = (propertyId: string, propertyData: any) => {
  logAnalyticsEvent("property_view", {
    property_id: propertyId,
    property_type: propertyData.type,
    price: propertyData.price,
    location: propertyData.location,
  });
};

/**
 * Log mortgage calculator use
 */
export const logMortgageCalculatorEvent = (params: {
  loanAmount?: number;
  interestRate?: number;
  loanTerm?: number;
}) => {
  logAnalyticsEvent("mortgage_calculator_used", {
    loan_amount: params.loanAmount,
    interest_rate: params.interestRate,
    loan_term: params.loanTerm,
  });
};

/**
 * Log investment analysis event
 */
export const logInvestmentAnalysisEvent = (params: {
  propertyId?: string;
  analysisType?: string;
}) => {
  logAnalyticsEvent("investment_analysis_used", {
    property_id: params.propertyId,
    analysis_type: params.analysisType,
  });
};

/**
 * Log user authentication event
 */
export const logAuthenticationEvent = (eventType: "login" | "signup" | "logout", provider?: string) => {
  logAnalyticsEvent("user_authentication", {
    event_type: eventType,
    provider: provider || "email",
  });
};

/**
 * Log error event
 */
export const logErrorEvent = (errorData: {
  errorName?: string;
  errorMessage?: string;
  errorStack?: string;
  context?: string;
}) => {
  logAnalyticsEvent("application_error", {
    error_name: errorData.errorName,
    error_message: errorData.errorMessage,
    error_stack: errorData.errorStack,
    context: errorData.context,
  });
};

/**
 * Log crash event
 */
export const logCrashEvent = (crashData: {
  crashReason?: string;
  platform?: string;
  appVersion?: string;
}) => {
  logAnalyticsEvent("app_crash", {
    crash_reason: crashData.crashReason,
    platform: crashData.platform,
    app_version: crashData.appVersion,
  });
};

/**
 * Log performance metrics
 */
export const logPerformanceMetric = (
  metricName: string,
  value: number,
  unit?: string
) => {
  logAnalyticsEvent("performance_metric", {
    metric_name: metricName,
    value: value,
    unit: unit || "ms",
  });
};

/**
 * Get Firebase instance
 */
export default {
  app,
  auth,
  db,
  realtimeDb,
  storage,
  analytics,
  perf,
};
