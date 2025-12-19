// =============================================================================
// Test Setup - Global Configuration
// =============================================================================

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

// Extend matchers
import '@testing-library/jest-dom';

// Global test timeout
const TEST_TIMEOUT = 10000;

// Setup before all tests
beforeAll(async () => {
  console.log('Setting up test environment...');

  // Connect to test database
  await prisma.$connect();

  // Connect to Redis
  await redis.connect();

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost/nexus_test';
}, TEST_TIMEOUT);

// Cleanup after all tests
afterAll(async () => {
  console.log('Cleaning up test environment...');

  // Disconnect from database
  await prisma.$disconnect();

  // Disconnect from Redis
  await redis.quit();
}, TEST_TIMEOUT);

// Setup before each test
beforeEach(async () => {
  // Clear all data before each test
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }

  // Clear Redis cache
  await redis.flushdb();
});

// Cleanup after each test
afterEach(() => {
  // Clear all timers
  vi.clearAllTimers();

  // Clear all mocks
  vi.clearAllMocks();
});

// Mock environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.OPENAI_API_KEY = 'sk-mock-openai-key';
process.env.AWS_ACCESS_KEY_ID = 'mock-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'mock-secret-key';
process.env.AWS_S3_BUCKET = 'nexus-test-bucket';

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
});

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

export {};
