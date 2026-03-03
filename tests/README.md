# PuraEstate Test Suite

Complete testing suite for the PuraEstate platform with 80%+ code coverage.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm run test

# Run specific test suite
npm run test -- --testPathPattern="unit|integration|e2e|security|performance"

# Watch mode
npm run test:watch

# Coverage report
npm run test -- --coverage
```

## Test Suites

### Unit Tests (Configuration & Logger)
- Config loading and validation
- Logger initialization and functionality
- Default configurations

### Integration Tests (APIs & Services)
- Composio API integration
- Firebase authentication and Firestore
- WhatsApp messaging
- API endpoints
- Error handling

### E2E Tests (User Journeys)
- Investor search → booking → payment
- Agent property management
- Admin system management
- WhatsApp conversation flow
- Error recovery

### Security Tests
- Password security
- Token management
- Data encryption
- Input validation
- API security
- Rate limiting

### Performance Tests
- App startup time
- API response time
- Database query performance
- Memory usage
- Search performance
- Matching algorithm

## Test Files

```
config/
  └── config.test.ts          Configuration tests

logger/
  └── logger.test.ts          Logger tests

integration/
  ├── composio.integration.test.ts    Composio API tests
  ├── firebase.integration.test.ts    Firebase tests
  └── api.integration.test.ts         API endpoint tests

security/
  └── security.test.ts        Security control tests

performance/
  └── performance.test.ts     Performance benchmark tests

e2e/
  └── user-journeys.e2e.test.ts      Complete workflow tests

mocks/
  ├── composio.mock.ts        Composio API mocks
  ├── database.mock.ts        MongoDB/Database mocks
  ├── firebase.mock.ts        Firebase service mocks
  └── redis.mock.ts           Redis cache mocks

fixtures/
  └── test-data.ts            Test data and factories

qa-checklist.md             Manual QA checklist
```

## Coverage

Target: **80%+** across all metrics

- **Lines:** 80%+
- **Branches:** 80%+
- **Functions:** 80%+
- **Statements:** 80%+

View coverage report:
```bash
npm run test -- --coverage
open coverage/lcov-report/index.html
```

## Scripts

### Run Tests

```bash
# All tests
npm run test

# With coverage
npm run test -- --coverage

# Watch mode
npm run test:watch

# Unit tests
./scripts/run-tests.sh unit

# Integration tests
./scripts/run-tests.sh integration

# E2E tests
./scripts/run-tests.sh e2e

# Security tests
./scripts/run-tests.sh security

# Performance tests
./scripts/run-tests.sh performance
```

### Platform-Specific

**Linux/macOS:**
```bash
chmod +x scripts/run-tests.sh
./scripts/run-tests.sh all
```

**Windows:**
```bash
scripts/run-tests.bat all
```

## Configuration

### Jest Configuration
File: `jest.config.js`
- Test environment: Node.js
- TypeScript support via ts-jest
- Coverage thresholds: 80%+
- Timeout: 5000ms (configurable per test)

### Test Environment
File: `.env.test`
- Database: MongoDB test instance
- Redis: Test database (1)
- API keys: Test credentials
- JWT secrets: Test values
- Firebase: Test project

## Mocking

### Available Mocks

```typescript
import { mockComposioClient } from '../mocks/composio.mock';
import { connectMockDatabase } from '../mocks/database.mock';
import { mockFirebaseAuth } from '../mocks/firebase.mock';
import { MockCache } from '../mocks/redis.mock';
```

### Using Mocks

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

it('should test with mocks', async () => {
  mockComposioClient.sendMessage.mockResolvedValueOnce({
    messageId: 'msg-123',
    status: 'sent',
  });

  const result = await mockComposioClient.sendMessage();
  expect(result.status).toBe('sent');
});
```

## Test Data

### Predefined Data

```typescript
import { testData } from '../fixtures/test-data';

const user = testData.users.investor;
const property = testData.properties[0];
const booking = testData.bookings[0];
```

### Data Factories

```typescript
import { generateTestUser, generateTestProperty } from '../fixtures/test-data';

const customUser = generateTestUser({ name: 'Custom Name' });
const customProperty = generateTestProperty({ price: 750000 });
```

## Performance Targets

| Metric | Target |
|--------|--------|
| App startup | < 2s |
| API response | < 1s |
| Search response | < 500ms |
| Message processing | < 100ms |
| Database queries | < 500ms |
| Matching algorithm | < 1s |

## CI/CD Integration

### GitHub Actions

Automatically runs on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Stages:
1. Lint code
2. Unit tests
3. Integration tests
4. Security tests
5. Performance tests
6. E2E tests
7. Build project
8. Coverage check
9. Notifications

### Manual CI Run

```bash
npm run lint
npm run test -- --coverage
npm run build
```

## Environment Setup

### Prerequisites

- Node.js 20+
- npm 9+
- MongoDB 6+
- Redis 7+

### Installation

```bash
# Clone and install
git clone <repo>
cd puraestatecomposio
npm install

# Setup test environment
cp .env.example .env.test
```

### Start Services

```bash
# MongoDB
docker run -d -p 27017:27017 mongo:6

# Redis
docker run -d -p 6379:6379 redis:7
```

## Troubleshooting

### MongoDB Connection Error

```bash
# Check if MongoDB is running
mongosh

# Or start with Docker
docker run -d -p 27017:27017 mongo:6
```

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# Or start with Docker
docker run -d -p 6379:6379 redis:7
```

### Tests Timeout

```typescript
// Increase timeout for specific test
jest.setTimeout(30000);

// Or in jest.config.js
testTimeout: 30000
```

### Coverage Not Generated

```bash
# Ensure coverage collection enabled
npm run test -- --coverage --collectCoverageFrom="src/**/*.ts"
```

## Best Practices

1. **Organization**: Group tests by feature/component
2. **Naming**: Clear, descriptive test names
3. **Arrangement**: Arrange-Act-Assert pattern
4. **Mocking**: Mock external dependencies
5. **Isolation**: Each test independent
6. **Cleanup**: Clear mocks after each test
7. **Performance**: Set realistic time thresholds
8. **Documentation**: Comment complex tests

## Examples

### Unit Test

```typescript
describe('Config', () => {
  it('should load port configuration', () => {
    expect(config.port).toBeGreaterThan(0);
  });
});
```

### Integration Test

```typescript
describe('Composio Integration', () => {
  it('should send message successfully', async () => {
    const result = await mockComposioClient.sendMessage();
    expect(result.status).toBe('sent');
  });
});
```

### E2E Test

```typescript
describe('Investor Journey', () => {
  it('should complete booking flow', async () => {
    // Login
    // Search properties
    // Select property
    // Schedule booking
    // Process payment
    // Verify confirmation
  });
});
```

### Performance Test

```typescript
describe('Performance', () => {
  it('should respond within 1 second', async () => {
    const start = Date.now();
    await api.getProperties();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
```

## Documentation

- [Full Testing Guide](../TESTING.md)
- [QA Checklist](./qa-checklist.md)
- [Jest Docs](https://jestjs.io/)
- [Testing Best Practices](https://jestjs.io/docs/en/tutorial-react)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review TESTING.md
3. Check GitHub Issues
4. Contact QA team

## License

Same as main project
