import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers settings
jest.useRealTimers();

// Cleanup after tests
afterEach(() => {
  jest.clearAllMocks();
});
