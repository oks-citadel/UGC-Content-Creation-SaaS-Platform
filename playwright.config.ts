// =============================================================================
// Playwright Configuration - E2E Testing
// =============================================================================

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e/playwright',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test retry strategy
  retries: process.env.CI ? 2 : 0,

  // Run tests in parallel
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Timeout for each action
    actionTimeout: 10 * 1000,

    // Timeout for navigation
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Test against mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Test against branded browsers
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output folder for test artifacts
  outputDir: 'test-results/',

  // Folder for test artifacts such as screenshots, videos, traces, etc.
  snapshotDir: 'tests/e2e/playwright/snapshots',

  // Global setup
  globalSetup: path.resolve(__dirname, './tests/e2e/playwright/global-setup.ts'),

  // Global teardown
  globalTeardown: path.resolve(__dirname, './tests/e2e/playwright/global-teardown.ts'),

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Limit the number of failures on CI to save resources
  maxFailures: process.env.CI ? 10 : undefined,
});
