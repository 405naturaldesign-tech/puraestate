import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  logLevel: process.env.LOG_LEVEL || 'info',

  // Composio
  composio: {
    apiKey: process.env.COMPOSIO_API_KEY!,
    baseUrl: process.env.COMPOSIO_BASE_URL || 'https://api.composio.dev',
    retryAttempts: parseInt(process.env.COMPOSIO_RETRY_ATTEMPTS || '3'),
    retryDelayMs: parseInt(process.env.COMPOSIO_RETRY_DELAY_MS || '1000'),
  },

  // WhatsApp
  whatsapp: {
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    rateLimitPerMinute: parseInt(process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE || '60'),
  },

  // Database
  database: {
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/puraestatecomposio',
    dbName: process.env.DB_NAME || 'puraestatecomposio',
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    prefix: process.env.REDIS_PREFIX || 'puraestatecomposio:',
  },

  // Queue
  queue: {
    concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '10'),
    attempts: parseInt(process.env.QUEUE_ATTEMPTS || '5'),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY || '2000'),
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET!,
    encryptionKey: process.env.ENCRYPTION_KEY!,
    webhookSecret: process.env.WEBHOOK_SECRET!,
  },

  // Webhook
  webhook: {
    url: process.env.WEBHOOK_URL || 'http://localhost:3000/webhooks',
  },

  // Compliance
  compliance: {
    gdprRetentionDays: parseInt(process.env.GDPR_RETENTION_DAYS || '90'),
    ccpaEnabled: process.env.CCPA_ENABLED === 'true',
  },

  // Analytics
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    sentryDsn: process.env.SENTRY_DSN,
  },

  // Admin
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD,
  },

  // Testing
  test: {
    phoneNumber: process.env.TEST_PHONE_NUMBER,
    investorId: process.env.TEST_INVESTOR_ID,
    agentId: process.env.TEST_AGENT_ID,
  },
};

// Validation
export function validateConfig(): void {
  const requiredKeys = [
    'composio.apiKey',
    'whatsapp.businessAccountId',
    'whatsapp.phoneNumberId',
    'database.mongoUri',
    'security.jwtSecret',
    'security.encryptionKey',
    'security.webhookSecret',
  ];

  for (const key of requiredKeys) {
    const [section, prop] = key.split('.');
    const value = (config as any)[section]?.[prop];
    if (!value) {
      throw new Error(`Missing required config: ${key}`);
    }
  }
}

export default config;
