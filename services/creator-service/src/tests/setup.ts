// Test setup file
// This file runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/nexus_creators_test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.LOG_LEVEL = 'silent';

// Mock logger to avoid console output during tests
jest.mock('../lib/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

// Global test timeout
jest.setTimeout(10000);
