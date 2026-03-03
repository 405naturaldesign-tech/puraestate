/**
 * Sentry Configuration for PuraEstate
 * Handles error tracking, performance monitoring, and crash reporting
 */

import * as Sentry from "@sentry/react-native";

export const initializeSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || "development",
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),

    // Release tracking
    release: `${process.env.APP_NAME}@${process.env.APP_VERSION}`,
    dist: process.env.APP_BUILD_NUMBER,

    // Integrations
    integrations: [
      new Sentry.ReactNativeIntegration(),
      new Sentry.NativeIntegration(),
      new Sentry.RoutingInstrumentation(),
    ],

    // Performance Monitoring
    enableNativeCrashHandling: true,
    enableAppHangTracking: true,
    enableNdk: true,
    enableAutoSessionTracking: true,
    enableWatchdogTerminationTracking: true,

    // Session Tracking
    autoSessionTracking: true,
    sessionSampleRate: 1.0,

    // Breadcrumb Configuration
    maxBreadcrumbs: 100,
    attachStacktrace: true,

    // Before sending events
    beforeSend(event, hint) {
      if (process.env.ENVIRONMENT === "development") {
        console.log("Sentry Event:", event);
      }

      // Filter sensitive information
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers["Authorization"];
      }

      return event;
    },

    // Before sending breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filter out health check requests
      if (
        breadcrumb.category === "http" &&
        breadcrumb.data?.url?.includes("/health")
      ) {
        return null;
      }

      return breadcrumb;
    },

    // Ignore errors
    ignoreErrors: [
      // Network errors
      "NetworkError",
      "Network request failed",
      "The network connection was lost",

      // React Native specific
      "Unrecognized font family",
      "Module not found",

      // Third-party errors
      "Script error",
      "top.GLOBALS",

      // Browser extensions
      "chrome-extension://",
      "moz-extension://",
    ],

    // Deny URLs patterns
    denyUrls: [
      /graph\.instagram\.com/i,
      /connect\.facebook\.net/i,
      /platform\.twitter\.com/i,
      /cdn\.segment\.com/i,
    ],
  });

  // Set user context if authenticated
  setUserContext();

  // Set tags for better filtering
  setSentryTags();
};

/**
 * Set user context for Sentry
 */
export const setUserContext = (user?: any) => {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } else {
    Sentry.setUser(null);
  }
};

/**
 * Set common tags for all events
 */
export const setSentryTags = () => {
  Sentry.setTag("environment", process.env.ENVIRONMENT);
  Sentry.setTag("app_version", process.env.APP_VERSION);
  Sentry.setTag("app_build", process.env.APP_BUILD_NUMBER);
  Sentry.setTag("platform", "react-native");
};

/**
 * Capture exception
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
  if (context) {
    Sentry.setContext("exception_context", context);
  }
  Sentry.captureException(error);
};

/**
 * Capture message
 */
export const captureMessage = (
  message: string,
  level: Sentry.SeverityLevel = "info",
  context?: Record<string, any>
) => {
  if (context) {
    Sentry.setContext("message_context", context);
  }
  Sentry.captureMessage(message, level);
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name: string, op: string = "http.request") => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Set breadcrumb
 */
export const setBreadcrumb = (
  message: string,
  category: string = "user-action",
  level: Sentry.SeverityLevel = "info",
  data?: Record<string, any>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
};

/**
 * Export Sentry for use in other modules
 */
export default Sentry;
