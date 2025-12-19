// =============================================================================
// E2E Tests: Creator Onboarding Flow
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Creator Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from homepage
    await page.goto('/');
  });

  test('complete creator registration flow', async ({ page }) => {
    // Navigate to creator signup
    await page.click('text=Join as Creator');
    await expect(page).toHaveURL(/\/signup\/creator/);

    // Step 1: Basic Information
    await page.fill('[name="firstName"]', 'Jane');
    await page.fill('[name="lastName"]', 'Creator');
    await page.fill('[name="email"]', `creator-${Date.now()}@test.com`);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('text=Continue');

    // Step 2: Profile Setup
    await expect(page.locator('text=Tell us about yourself')).toBeVisible();
    await page.fill('[name="displayName"]', 'JaneCreates');
    await page.fill('[name="bio"]', 'Content creator specializing in lifestyle and travel content.');
    await page.selectOption('[name="primaryCategory"]', 'lifestyle');
    await page.click('text=Continue');

    // Step 3: Social Media Connections
    await expect(page.locator('text=Connect your accounts')).toBeVisible();
    // Skip social connections for now
    await page.click('text=Skip for now');

    // Step 4: Portfolio Upload
    await expect(page.locator('text=Showcase your work')).toBeVisible();
    // Upload sample content
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles([
      'tests/fixtures/sample-image-1.jpg',
      'tests/fixtures/sample-image-2.jpg',
    ]);
    await expect(page.locator('.upload-preview')).toHaveCount(2);
    await page.click('text=Continue');

    // Step 5: Payment Setup
    await expect(page.locator('text=Set up payments')).toBeVisible();
    await page.click('text=Connect with Stripe');

    // Mock Stripe Connect OAuth (in test environment)
    await page.waitForURL(/stripe\.com|\/onboarding\/payment-success/);

    // If redirected back, verify success
    if (page.url().includes('/onboarding/payment-success')) {
      await expect(page.locator('text=Payment setup complete')).toBeVisible();
    }

    // Step 6: Terms & Conditions
    await page.click('text=Continue to Terms');
    await expect(page.locator('text=Terms of Service')).toBeVisible();
    await page.check('[name="acceptTerms"]');
    await page.check('[name="acceptCreatorAgreement"]');
    await page.click('text=Complete Registration');

    // Verify completion
    await expect(page).toHaveURL(/\/creator\/dashboard/);
    await expect(page.locator('text=Welcome, JaneCreates')).toBeVisible();
  });

  test('validate email uniqueness during registration', async ({ page }) => {
    await page.goto('/signup/creator');

    // Use existing email
    await page.fill('[name="email"]', 'existing@creatorbridge.com');
    await page.fill('[name="firstName"]', 'Test');
    await page.fill('[name="lastName"]', 'User');
    await page.click('text=Continue');

    // Expect error message
    await expect(page.locator('text=Email already registered')).toBeVisible();
  });

  test('password strength validation', async ({ page }) => {
    await page.goto('/signup/creator');

    // Try weak password
    await page.fill('[name="password"]', '123');
    await page.fill('[name="confirmPassword"]', '123');

    // Expect strength indicator
    await expect(page.locator('.password-strength-weak')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();

    // Try strong password
    await page.fill('[name="password"]', 'SecureP@ssw0rd!');
    await expect(page.locator('.password-strength-strong')).toBeVisible();
  });

  test('resume incomplete onboarding', async ({ page }) => {
    // Login as partially onboarded user
    await page.goto('/login');
    await page.fill('[name="email"]', 'partial-creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    // Should redirect to continue onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('text=Continue where you left off')).toBeVisible();
  });

  test('creator profile photo upload', async ({ page }) => {
    await page.goto('/signup/creator');

    // Complete step 1
    await page.fill('[name="firstName"]', 'Photo');
    await page.fill('[name="lastName"]', 'Test');
    await page.fill('[name="email"]', `photo-${Date.now()}@test.com`);
    await page.fill('[name="password"]', 'SecurePassword123!');
    await page.fill('[name="confirmPassword"]', 'SecurePassword123!');
    await page.click('text=Continue');

    // Upload profile photo
    const photoInput = page.locator('[data-testid="profile-photo-input"]');
    await photoInput.setInputFiles('tests/fixtures/profile-photo.jpg');

    // Verify preview
    await expect(page.locator('[data-testid="profile-photo-preview"]')).toBeVisible();

    // Verify cropping modal appears
    await expect(page.locator('text=Crop your photo')).toBeVisible();
    await page.click('text=Apply');

    // Verify upload success
    await expect(page.locator('[data-testid="profile-photo-success"]')).toBeVisible();
  });
});

test.describe('Creator Profile Completion', () => {
  test.beforeEach(async ({ page }) => {
    // Login as existing creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/creator\/dashboard/);
  });

  test('update profile information', async ({ page }) => {
    await page.goto('/creator/settings/profile');

    // Update bio
    await page.fill('[name="bio"]', 'Updated bio with new content focus areas.');
    await page.click('text=Save Changes');

    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });

  test('add portfolio items', async ({ page }) => {
    await page.goto('/creator/portfolio');
    await page.click('text=Add Content');

    // Upload new portfolio item
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/portfolio-video.mp4');

    // Add metadata
    await page.fill('[name="title"]', 'Summer Campaign 2024');
    await page.fill('[name="description"]', 'Lifestyle content for summer product launch.');
    await page.selectOption('[name="category"]', 'lifestyle');
    await page.click('text=Publish');

    await expect(page.locator('text=Content added to portfolio')).toBeVisible();
  });

  test('set content rates', async ({ page }) => {
    await page.goto('/creator/settings/rates');

    // Set rates for different content types
    await page.fill('[name="rate-photo"]', '150');
    await page.fill('[name="rate-video"]', '500');
    await page.fill('[name="rate-story"]', '100');
    await page.fill('[name="rate-reel"]', '300');

    await page.click('text=Save Rates');
    await expect(page.locator('text=Rates updated successfully')).toBeVisible();
  });

  test('configure notification preferences', async ({ page }) => {
    await page.goto('/creator/settings/notifications');

    // Toggle notification settings
    await page.check('[name="email-new-campaign"]');
    await page.check('[name="email-payment-received"]');
    await page.uncheck('[name="email-marketing"]');
    await page.check('[name="push-new-message"]');

    await page.click('text=Save Preferences');
    await expect(page.locator('text=Preferences saved')).toBeVisible();
  });
});

test.describe('Creator Verification', () => {
  test('submit verification request', async ({ page }) => {
    // Login as unverified creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'unverified-creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/verification');

    // Upload ID document
    await page.locator('[data-testid="id-upload"]').setInputFiles('tests/fixtures/sample-id.jpg');

    // Upload proof of address
    await page.locator('[data-testid="address-upload"]').setInputFiles('tests/fixtures/utility-bill.pdf');

    // Submit verification
    await page.click('text=Submit for Verification');

    await expect(page.locator('text=Verification submitted')).toBeVisible();
    await expect(page.locator('text=Review typically takes 1-2 business days')).toBeVisible();
  });

  test('check verification status', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'pending-verification@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/verification');

    await expect(page.locator('text=Verification Pending')).toBeVisible();
    await expect(page.locator('[data-testid="verification-progress"]')).toHaveAttribute('data-step', 'review');
  });
});
