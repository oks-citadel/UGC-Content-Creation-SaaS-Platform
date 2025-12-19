// =============================================================================
// Jest Configuration - Root
// =============================================================================

/** @type {import('jest').Config} */
module.exports = {
  // Use projects configuration for monorepo
  projects: [
    '<rootDir>/packages/*/jest.config.js',
    '<rootDir>/services/*/jest.config.js',
    '<rootDir>/apps/*/jest.config.js',
  ],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/index.ts',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Test match patterns
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module path aliases
  moduleNameMapper: {
    '^@nexus/(.*)$': '<rootDir>/packages/$1/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform files
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },

  // Test environment
  testEnvironment: 'node',

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Max workers for parallel execution
  maxWorkers: '50%',

  // Test timeout
  testTimeout: 10000,
};
