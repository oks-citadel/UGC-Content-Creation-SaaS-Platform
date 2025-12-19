// =============================================================================
// Global Test Setup - Vitest
// =============================================================================

import { execSync } from 'child_process';
import dotenv from 'dotenv';

export default async function globalSetup() {
  console.log('Running global test setup...');

  // Load test environment variables
  dotenv.config({ path: '.env.test' });

  // Run database migrations for test database
  try {
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    });

    console.log('Database migrations completed');
  } catch (error) {
    console.error('Failed to run database migrations:', error);
    throw error;
  }

  // Seed test data (optional)
  try {
    console.log('Seeding test data...');
    execSync('npx prisma db seed', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    });

    console.log('Test data seeded');
  } catch (error) {
    console.warn('Failed to seed test data (this may be expected):', error);
  }

  console.log('Global test setup completed');

  return () => {
    // Global teardown function
    console.log('Global test teardown completed');
  };
}
