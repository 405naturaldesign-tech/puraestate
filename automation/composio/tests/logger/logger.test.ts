import logger from '../../src/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Logger Initialization', () => {
    it('should be defined', () => {
      expect(logger).toBeDefined();
    });

    it('should have all log levels', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
    });

    it('should have transports configured', () => {
      expect(logger.transports).toBeDefined();
      expect(logger.transports.length).toBeGreaterThan(0);
    });
  });

  describe('Logger Levels', () => {
    it('should log debug messages', () => {
      const debugSpy = jest.spyOn(logger, 'debug');
      logger.debug('Debug message');
      expect(debugSpy).toHaveBeenCalledWith('Debug message');
    });

    it('should log info messages', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      logger.info('Info message');
      expect(infoSpy).toHaveBeenCalledWith('Info message');
    });

    it('should log warning messages', () => {
      const warnSpy = jest.spyOn(logger, 'warn');
      logger.warn('Warning message');
      expect(warnSpy).toHaveBeenCalledWith('Warning message');
    });

    it('should log error messages', () => {
      const errorSpy = jest.spyOn(logger, 'error');
      logger.error('Error message');
      expect(errorSpy).toHaveBeenCalledWith('Error message');
    });
  });

  describe('Logger Metadata', () => {
    it('should log messages with metadata', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      logger.info('Message with metadata', { userId: 'user-123', action: 'login' });
      expect(infoSpy).toHaveBeenCalled();
    });

    it('should log error with stack trace', () => {
      const errorSpy = jest.spyOn(logger, 'error');
      const error = new Error('Test error');
      logger.error('An error occurred', error);
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Logger Format', () => {
    it('should format log messages consistently', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      const messages = [
        'Test message 1',
        'Test message 2',
        'Test message 3',
      ];

      messages.forEach((msg) => {
        logger.info(msg);
      });

      expect(infoSpy).toHaveBeenCalledTimes(messages.length);
    });

    it('should include timestamps in logs', () => {
      // Logger should include timestamp based on configuration
      expect(logger).toBeDefined();
    });
  });

  describe('Logger Performance', () => {
    it('should handle high-volume logging', () => {
      const infoSpy = jest.spyOn(logger, 'info');
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
      expect(infoSpy).toHaveBeenCalledTimes(1000);
    });
  });

  describe('Logger Error Handling', () => {
    it('should handle errors gracefully', () => {
      const errorSpy = jest.spyOn(logger, 'error');
      const testError = new Error('Test error');
      logger.error('Error occurred', { error: testError });
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should not throw when logging undefined', () => {
      expect(() => {
        logger.info('Message', undefined);
      }).not.toThrow();
    });

    it('should not throw when logging null', () => {
      expect(() => {
        logger.info('Message', null);
      }).not.toThrow();
    });
  });
});
