// =============================================================================
// Unit Test Setup - Minimal Configuration (no database required)
// =============================================================================

import { vi, beforeEach, afterEach } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.OPENAI_API_KEY = 'sk-mock-openai-key';

// Cleanup after each test
afterEach(() => {
  vi.clearAllTimers();
  vi.clearAllMocks();
});

export {};
