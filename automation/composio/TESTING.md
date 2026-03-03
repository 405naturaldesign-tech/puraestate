# PuraEstate Testing Documentation

## Overview

This document provides comprehensive testing guidance for the PuraEstate platform. The testing suite includes unit tests, integration tests, E2E tests, security tests, and performance tests.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── config/                     # Config tests
├── logger/                     # Logger tests
├── integration/                # Integration tests
│   ├── composio.integration.test.ts
│   ├── firebase.integration.test.ts
│   └── api.integration.test.ts
├── security/                   # Security tests
├── performance/                # Performance tests
├── e2e/                        # End-to-end tests
│   └── user-journeys.e2e.test.ts
├── mocks/                      # Mock implementations
│   ├── composio.mock.ts
│   ├── database.mock.ts
│   ├── firebase.mock.ts
│   └── redis.mock.ts
├── fixtures/                   # Test data
│   └── test-data.ts
└── qa-checklist.md            # Manual QA checklist
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- MongoDB (for integration tests)
- Redis (for integration tests)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd puraestatecomposio

# Install dependencies
npm install

# Setup test environment
cp .env.example .env.test
```

### Running Tests

#### Run all tests
```bash
npm run test
```

#### Run specific test suite
```bash
# Unit tests only
./scripts/run-tests.sh unit

# Integration tests only
./scripts/run-tests.sh integration

# E2E tests only
./scripts/run-tests.sh e2e

# Security tests only
./scripts/run-tests.sh security

# Performance tests only
./scripts/run-tests.sh performance
```

#### Watch mode
```bash
npm run test:watch
```

#### Generate coverage report
```bash
npm run test -- --coverage
```

### Platform-Specific Commands

**macOS/Linux:**
```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh all
```

**Windows:**
```bash
scripts/run-tests.bat all
```

## Test Categories

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Files:**
- `tests/config/config.test.ts` - Configuration loading and validation
- `tests/logger/logger.test.ts` - Logger functionality

**Coverage Target:** 80%+

**Command:**
```bash
npm run test -- --testPathPattern="(config|logger)"
```

**Example:**
```typescript
describe('Config', () => {
  it('should load development configuration', () => {
    expect(config.port).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests

Test interactions between multiple components.

**Files:**
- `tests/integration/composio.integration.test.ts` - Composio API integration
- `tests/integration/firebase.integration.test.ts` - Firebase integration
- `tests/integration/api.integration.test.ts` - API endpoints

**Coverage Target:** 80%+

**Command:**
```bash
npm run test -- --testPathPattern="integration"
```

**Example:**
```typescript
describe('Composio Integration Tests', () => {
  it('should send WhatsApp message successfully', async () => {
    const result = await mockComposioClient.sendMessage();
    expect(result.status).toBe('sent');
  });
});
```

### 3. E2E Tests

Test complete user workflows from start to finish.

**Files:**
- `tests/e2e/user-journeys.e2e.test.ts` - Complete user journeys

**Coverage Target:** Critical paths only

**Command:**
```bash
npm run test -- --testPathPattern="e2e"
```

**Scenarios:**
1. Investor Journey: Search → Match → Booking → Payment
2. Agent Journey: Property Management → Booking Handling
3. Admin Journey: System Management
4. WhatsApp Conversation Flow

### 4. Security Tests

Test security controls and vulnerabilities.

**Files:**
- `tests/security/security.test.ts` - Security controls

**Coverage Target:** All critical security areas

**Command:**
```bash
npm run test -- --testPathPattern="security"
```

**Areas:**
- Password security
- Token security
- Data encryption
- Input validation
- API security
- Authentication

### 5. Performance Tests

Test performance metrics and targets.

**Files:**
- `tests/performance/performance.test.ts` - Performance benchmarks

**Coverage Target:** All performance-critical areas

**Command:**
```bash
npm run test -- --testPathPattern="performance"
```

**Targets:**
- App startup: < 2s
- API response: < 1s
- Search response: < 500ms
- Message processing: < 100ms

## Mocking Strategy

### Composio Mock

```typescript
import { mockComposioClient } from '../mocks/composio.mock';

// Use mock in tests
mockComposioClient.sendMessage.mockResolvedValueOnce({
  messageId: 'msg-123',
  status: 'sent',
});
```

### Database Mock

```typescript
import { connectMockDatabase, disconnectMockDatabase } from '../mocks/database.mock';

beforeAll(async () => {
  await connectMockDatabase();
});

afterAll(async () => {
  await disconnectMockDatabase();
});
```

### Firebase Mock

```typescript
import { mockFirebaseAuth } from '../mocks/firebase.mock';

mockFirebaseAuth.signInWithEmailAndPassword.mockResolvedValueOnce({
  user: { uid: 'user-123', email: 'user@example.com' }
});
```

### Redis Mock

```typescript
import { MockCache } from '../mocks/redis.mock';

const cache = new MockCache();
cache.set('key', 'value', 3600);
expect(cache.get('key')).toBe('value');
```

## Test Data

Test data is provided in `tests/fixtures/test-data.ts`:

```typescript
import { testData, generateTestUser, generateTestProperty } from '../fixtures/test-data';

// Use predefined test data
const user = testData.users.investor;
const property = testData.properties[0];

// Generate custom test data
const customUser = generateTestUser({ name: 'Custom User' });
const customProperty = generateTestProperty({ price: 750000 });
```

## Coverage Requirements

### Minimum Coverage Thresholds

- **Lines:** 80%
- **Branches:** 80%
- **Functions:** 80%
- **Statements:** 80%

### Checking Coverage

```bash
# Generate coverage report
npm run test -- --coverage

# Coverage report locations
# - Console output
# - HTML: ./coverage/lcov-report/index.html
# - JSON: ./coverage/coverage-summary.json
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Workflow file:** `.github/workflows/test.yml`

**Stages:**
1. Unit tests (15 min)
2. Integration tests (30 min)
3. Security tests (15 min)
4. Performance tests (20 min)
5. E2E tests (45 min)
6. Build (10 min)
7. Coverage check
8. Notifications

### Manual Trigger

```bash
# Run CI tests locally
npm run test -- --coverage
npm run lint
npm run build
```

## Best Practices

### 1. Test Organization

- One describe block per unit/component
- Clear, descriptive test names
- Arrange-Act-Assert pattern

```typescript
describe('UserService', () => {
  it('should authenticate user with valid credentials', () => {
    // Arrange
    const credentials = { email: 'user@example.com', password: 'password123' };

    // Act
    const result = userService.authenticate(credentials);

    // Assert
    expect(result.success).toBe(true);
  });
});
```

### 2. Mocking

- Mock external dependencies
- Use mock factories for complex mocks
- Clear reset between tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  mockComposioClient.reset();
});
```

### 3. Async Testing

- Use async/await
- Set appropriate timeouts
- Handle promise rejections

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### 4. Performance Testing

- Measure actual execution time
- Set realistic thresholds
- Track trends over time

```typescript
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;
expect(duration).toBeLessThan(1000);
```

## Troubleshooting

### MongoDB Connection Fails

```bash
# Start MongoDB
docker run -d -p 27017:27017 mongo:6

# Or use local installation
mongod
```

### Redis Connection Fails

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7

# Or use local installation
redis-server
```

### Tests Timeout

```bash
# Increase timeout in jest.config.js
testTimeout: 30000 // 30 seconds
```

### Coverage Not Generated

```bash
# Check coverage configuration
cat jest.config.js

# Ensure all files are covered
npm run test -- --coverage --collectCoverageFrom="src/**/*.ts"
```

### Mock Not Working

```typescript
// Ensure mock is imported before the module
jest.mock('../module');
import { module } from '../module';

// Clear mock between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Performance Benchmarks

### Current Targets

| Metric | Target | Current |
|--------|--------|---------|
| App startup | < 2s | 0.5s |
| API response | < 1s | 0.2s |
| Search | < 500ms | 0.1s |
| Message processing | < 100ms | 0.05s |
| Matching algorithm | < 1s | 0.3s |

### Measuring Performance

```bash
# Run performance tests
npm run test -- --testPathPattern="performance"

# Generate performance report
npm run test -- --testPathPattern="performance" --verbose
```

## Manual Testing

See `tests/qa-checklist.md` for comprehensive manual testing scenarios:

- Authentication & Authorization
- Property Management
- Booking Management
- Payment Processing
- WhatsApp Integration
- Admin Dashboard
- Error Handling
- Device Testing
- Network Condition Testing

## Test Data Seeding

### Development Database

```bash
# Seed development database
npm run seed:dev

# Reset database
npm run seed:reset

# Specific seed
npm run seed:properties
```

### Test Database

Automatically populated during test execution using mocks.

## Reporting

### Test Report

```bash
npm run test -- --reporters=default --reporters=jest-junit
```

### Coverage Report

```bash
# HTML report
open coverage/lcov-report/index.html

# Text report
npm run test -- --coverage --coverageReporters=text-summary
```

### Performance Report

```bash
npm run test -- --testPathPattern="performance" --verbose
```

## FAQ

**Q: How do I add a new test?**
A: Create a new `.test.ts` file in the appropriate tests directory following the existing structure and naming conventions.

**Q: How do I increase test timeout?**
A: Add `jest.setTimeout(30000)` in the test file or configure in `jest.config.js`.

**Q: How do I debug a failing test?**
A: Use `npm run test -- --testNamePattern="test name" --verbose` or add breakpoints with `debugger;`.

**Q: How do I mock a module?**
A: Use `jest.mock()` at the top of the test file before importing the module.

**Q: How do I run tests in parallel?**
A: By default, Jest runs tests in parallel. Use `--maxWorkers=1` to run serially.

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Composio API Docs](https://composio.dev/docs)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

## Contact

For testing-related questions or issues:
- Create an issue on the repository
- Contact the QA team
- Review the TESTING.md documentation
