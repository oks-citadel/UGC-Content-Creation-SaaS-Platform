# NEXUS Platform - Testing Documentation

Comprehensive testing setup for the NEXUS UGC & Marketing SaaS Platform.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

The NEXUS platform uses a multi-layered testing strategy to ensure code quality, reliability, and performance:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test interactions between different parts of the system
- **E2E Tests**: Test complete user workflows from UI to database
- **Load Tests**: Test system performance under various load conditions

### Testing Stack

- **Vitest**: Fast unit and integration testing framework
- **Playwright**: Cross-browser E2E testing
- **K6**: Load and performance testing
- **Jest**: Alternative testing framework (if needed)
- **Testing Library**: React component testing utilities

## Test Types

### 1. Unit Tests

Located in `tests/unit/`, these tests verify individual functions, classes, and utilities.

**Coverage Areas:**
- Utility functions (formatters, validators)
- Service methods
- Business logic
- Data transformations

**Example:**
```typescript
// tests/unit/packages/utils/formatters.test.ts
describe('formatMoney', () => {
  it('should format USD currency correctly', () => {
    const result = formatMoney({ amount: 1234.56, currency: 'USD' });
    expect(result).toContain('1,234.56');
  });
});
```

### 2. Integration Tests

Located in `tests/integration/`, these tests verify interactions between components, services, and databases.

**Coverage Areas:**
- API endpoints
- Database operations
- Service integrations
- Auth flows
- Campaign lifecycle

**Example:**
```typescript
// tests/integration/auth-flow.test.ts
describe('User Registration', () => {
  it('should successfully register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('tokens');
  });
});
```

### 3. E2E Tests

Located in `tests/e2e/playwright/`, these tests simulate real user interactions across multiple browsers.

**Coverage Areas:**
- Complete user journeys
- UI interactions
- Form submissions
- Navigation flows
- Cross-browser compatibility

**Example:**
```typescript
// tests/e2e/playwright/auth.spec.ts
test('should successfully login with correct credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', testUser.email);
  await page.fill('input[name="password"]', testUser.password);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/\/dashboard/);
});
```

### 4. Load Tests

Located in `tests/load/k6/`, these tests measure system performance under various load conditions.

**Coverage Areas:**
- API throughput
- Response times
- Concurrent users
- Upload performance
- Database query performance

**Example:**
```javascript
// tests/load/k6/api-gateway.js
export const options = {
  stages: [
    { duration: '2m', target: 50 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};
```

## Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL (for integration tests)
- Redis (for integration tests)
- K6 (for load tests)

### Installation

1. **Install dependencies:**
```bash
pnpm install
```

2. **Install Playwright browsers:**
```bash
pnpm exec playwright install
```

3. **Install K6:**
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
https://k6.io/docs/getting-started/installation/
```

4. **Setup test database:**
```bash
# Create test database
createdb nexus_test

# Run migrations
DATABASE_URL=postgresql://localhost/nexus_test pnpm db:migrate

# Seed test data
DATABASE_URL=postgresql://localhost/nexus_test pnpm db:seed
```

### Environment Variables

Create a `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL=postgresql://localhost/nexus_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-jwt-secret
STRIPE_SECRET_KEY=sk_test_mock
OPENAI_API_KEY=sk-mock
AWS_ACCESS_KEY_ID=mock-key
AWS_SECRET_ACCESS_KEY=mock-secret
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test:unit

# Run with watch mode
pnpm test:watch

# Run with UI
pnpm test:ui

# Run with coverage
pnpm test:coverage
```

### Integration Tests

```bash
# Run all integration tests
pnpm test:integration

# Run specific test file
pnpm vitest run tests/integration/auth-flow.test.ts
```

### E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run in UI mode
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run in debug mode
pnpm test:e2e:debug

# Run specific browser
pnpm test:e2e --project=chromium

# Run specific test file
pnpm test:e2e tests/e2e/playwright/auth.spec.ts
```

### Load Tests

```bash
# Run API load test
pnpm test:load

# Run content upload stress test
pnpm test:load:upload

# Run concurrent users simulation
pnpm test:load:concurrent

# Run with custom VUs and duration
k6 run --vus 100 --duration 30s tests/load/k6/api-gateway.js
```

### All Tests

```bash
# Run all tests (unit, integration, E2E)
pnpm test:all
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyFunction', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Integration Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/lib/prisma';

describe('API Endpoint', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: 'test' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.goto('/feature');

    // Interact
    await page.fill('input[name="field"]', 'value');
    await page.click('button[type="submit"]');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

## Best Practices

### General

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Use descriptive test names that explain what is being tested
3. **AAA Pattern**: Arrange, Act, Assert - structure tests clearly
4. **Mock External Services**: Use mocks for third-party APIs (Stripe, OpenAI, etc.)
5. **Clean Up**: Always clean up test data after tests complete

### Unit Tests

- Test one thing at a time
- Mock dependencies
- Cover edge cases and error scenarios
- Aim for 70%+ code coverage

### Integration Tests

- Use real database connections (test database)
- Test actual API responses
- Verify database state changes
- Test error handling and validation

### E2E Tests

- Test critical user journeys
- Use data-testid attributes for stable selectors
- Handle async operations properly
- Test across multiple browsers
- Keep tests stable and reliable

### Load Tests

- Start with realistic scenarios
- Gradually increase load
- Monitor resource usage
- Set appropriate thresholds
- Test failure scenarios

## Test Fixtures

Reusable test data is located in `tests/fixtures/`:

- `users.json`: Test user data
- `campaigns.json`: Test campaign data
- `creators.json`: Test creator profiles

Usage:
```typescript
import users from '@/tests/fixtures/users.json';

const testUser = users.brandUser;
```

## Mocks

Mock implementations for external services in `tests/mocks/`:

- `stripe.mock.ts`: Stripe payment mock
- `openai.mock.ts`: OpenAI API mock
- `storage.mock.ts`: Cloud storage mock

Usage:
```typescript
import { mockStripe } from '@/tests/mocks/stripe.mock';

vi.mock('stripe', () => mockStripe);
```

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

### GitHub Actions Workflow

The `.github/workflows/test.yml` file runs:
1. Unit and integration tests
2. E2E tests across browsers
3. Type checking
4. Linting

### Coverage Reports

Coverage reports are uploaded to Codecov and available in PR comments.

## Debugging

### Vitest Debugging

```bash
# Run with inspect flag
node --inspect-brk ./node_modules/.bin/vitest run

# Use VS Code debugger
# Add breakpoint and press F5
```

### Playwright Debugging

```bash
# Debug mode
pnpm test:e2e:debug

# Trace viewer
playwright show-trace trace.zip

# Screenshots and videos
# Automatically captured on failure
```

### K6 Debugging

```bash
# Verbose output
k6 run --verbose tests/load/k6/api-gateway.js

# Output metrics to JSON
k6 run --out json=results.json tests/load/k6/api-gateway.js
```

## Troubleshooting

### Common Issues

**Database connection errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env.test
- Run migrations: `pnpm db:migrate`

**Playwright browser errors:**
- Run: `pnpm exec playwright install`
- Install system dependencies: `pnpm exec playwright install-deps`

**K6 not found:**
- Install K6: See installation instructions above
- Add to PATH

**Test timeouts:**
- Increase timeout in test configuration
- Check for hanging async operations
- Ensure proper cleanup in afterEach/afterAll

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [K6 Documentation](https://k6.io/docs/)
- [Testing Library](https://testing-library.com/)

## Support

For questions or issues:
1. Check this documentation
2. Review existing tests for examples
3. Consult team leads
4. Create issue in project repository
