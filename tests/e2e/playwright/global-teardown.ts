// =============================================================================
// Playwright Global Teardown
// =============================================================================

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Running global teardown...');

  try {
    // Cleanup tasks
    // - Remove test data
    // - Close database connections
    // - Clean up temporary files

    console.log('Global teardown completed');
  } catch (error) {
    console.error('Global teardown failed:', error);
  }
}

export default globalTeardown;
