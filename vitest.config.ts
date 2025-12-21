// =============================================================================
// Vitest Configuration - Alternative Testing Framework
// =============================================================================

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Setup files for unit tests only
    setupFiles: ['./tests/unit/setup.ts'],

    // Include patterns
    include: [
      'tests/unit/**/*.test.ts',
    ],

    // Exclude patterns
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },

    // Mocking
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,

    // Timeout
    testTimeout: 10000,

    // Parallel execution
    pool: 'threads',
    maxConcurrency: 4,

    // Reporters
    reporters: ['default'],

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
