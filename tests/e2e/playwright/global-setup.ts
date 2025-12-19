// =============================================================================
// Playwright Global Setup
// =============================================================================

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Running global setup...');

  // Start browser for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to app
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    await page.goto(`${baseURL}/login`);

    // Setup test accounts if needed
    console.log('Setting up test accounts...');

    // You can perform any global setup tasks here
    // Such as:
    // - Creating test users
    // - Seeding test data
    // - Warming up the application
    // - Setting up authentication states

    console.log('Global setup completed');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
