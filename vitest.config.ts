// =============================================================================
// Vitest Configuration - Alternative Testing Framework
// =============================================================================

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global setup/teardown
    globalSetup: ['./tests/global-setup.ts'],
    setupFiles: ['./tests/setup.ts'],

    // Include patterns
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'packages/**/src/**/*.test.ts',
      'services/**/src/**/*.test.ts',
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/playwright/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/*.stories.{ts,tsx}',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Mocking
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      },
    },

    // Reporters
    reporters: ['verbose', 'json', 'html'],

    // Watch mode
    watch: false,
  },

  // Resolve aliases
  resolve: {
    alias: {
      '@nexus/types': path.resolve(__dirname, './packages/types/src'),
      '@nexus/utils': path.resolve(__dirname, './packages/utils/src'),
      '@nexus/ui': path.resolve(__dirname, './packages/ui/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
