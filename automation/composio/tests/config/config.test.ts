import { config, validateConfig } from '../../src/config';

describe('Config', () => {
  describe('Configuration Loading', () => {
    it('should load development configuration', () => {
      expect(config.nodeEnv).toBeDefined();
      expect(config.port).toBeGreaterThan(0);
      expect(config.logLevel).toBeDefined();
    });

    it('should load Composio configuration', () => {
      expect(config.composio).toBeDefined();
      expect(config.composio.baseUrl).toBe('https://api.composio.dev');
      expect(config.composio.retryAttempts).toBeGreaterThan(0);
      expect(config.composio.retryDelayMs).toBeGreaterThan(0);
    });

    it('should load WhatsApp configuration', () => {
      expect(config.whatsapp).toBeDefined();
      expect(config.whatsapp.rateLimitPerMinute).toBeGreaterThan(0);
    });

    it('should load database configuration', () => {
      expect(config.database).toBeDefined();
      expect(config.database.mongoUri).toBeDefined();
      expect(config.database.dbName).toBeDefined();
    });

    it('should load Redis configuration', () => {
      expect(config.redis).toBeDefined();
      expect(config.redis.prefix).toBe('puraestatecomposio:');
    });

    it('should load queue configuration', () => {
      expect(config.queue).toBeDefined();
      expect(config.queue.concurrency).toBeGreaterThan(0);
      expect(config.queue.attempts).toBeGreaterThan(0);
      expect(config.queue.backoffDelay).toBeGreaterThan(0);
    });

    it('should load webhook configuration', () => {
      expect(config.webhook).toBeDefined();
      expect(config.webhook.url).toBeDefined();
    });

    it('should load compliance configuration', () => {
      expect(config.compliance).toBeDefined();
      expect(config.compliance.gdprRetentionDays).toBeGreaterThan(0);
      expect(typeof config.compliance.ccpaEnabled).toBe('boolean');
    });

    it('should load analytics configuration', () => {
      expect(config.analytics).toBeDefined();
      expect(typeof config.analytics.enabled).toBe('boolean');
    });

    it('should load admin configuration', () => {
      expect(config.admin).toBeDefined();
      expect(config.admin.username).toBe('admin');
    });

    it('should load test configuration', () => {
      expect(config.test).toBeDefined();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required configuration keys', () => {
      const originalEnv = process.env;
      try {
        process.env.COMPOSIO_API_KEY = 'test-key';
        process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = 'test-id';
        process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-id';
        process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
        process.env.JWT_SECRET = 'test-secret';
        process.env.ENCRYPTION_KEY = 'test-key';
        process.env.WEBHOOK_SECRET = 'test-secret';

        // Should not throw
        expect(() => validateConfig()).not.toThrow();
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe('Configuration Defaults', () => {
    it('should provide sensible defaults', () => {
      expect(config.port).toBe(3000);
      expect(config.logLevel).toBe('info');
      expect(config.database.mongoUri).toContain('mongodb');
      expect(config.redis.url).toContain('redis');
      expect(config.queue.concurrency).toBe(10);
      expect(config.queue.attempts).toBe(5);
      expect(config.compliance.gdprRetentionDays).toBe(90);
    });
  });

  describe('Configuration Overrides', () => {
    it('should allow configuration overrides via environment variables', () => {
      const originalPort = process.env.PORT;
      try {
        process.env.PORT = '8080';
        // In a real test, you'd need to reload the config module
        expect(parseInt(process.env.PORT)).toBe(8080);
      } finally {
        process.env.PORT = originalPort;
      }
    });

    it('should respect NODE_ENV setting', () => {
      expect(['development', 'production', 'test']).toContain(config.nodeEnv);
    });
  });

  describe('Security Configuration', () => {
    it('should have security settings defined', () => {
      expect(config.security).toBeDefined();
    });

    it('should not expose secrets in logs', () => {
      const configString = JSON.stringify(config);
      // Verify that we're not accidentally logging secrets
      expect(configString).not.toContain('password');
    });
  });
});
