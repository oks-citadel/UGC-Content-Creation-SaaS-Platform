// =============================================================================
// E2E Tests - Complete Campaign Creation Flow
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Complete Campaign Creation Flow', () => {
  let brandAccessToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // Register brand user
    await page.goto('/register');
    await page.fill('input[name="email"]', `brand-flow-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'FlowTest123');
    await page.fill('input[name="firstName"]', 'Flow');
    await page.fill('input[name="lastName"]', 'Test');
    await page.click('button[type="submit"]');

    await page.close();
  });

  test.describe('Multi-Step Campaign Creation', () => {
    test('should complete full campaign creation wizard', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Step 1: Campaign Basics
      await test.step('Fill campaign basics', async () => {
        await page.fill('input[name="name"]', 'Complete UGC Campaign');
        await page.fill('textarea[name="description"]', 'Full campaign creation test');
        await page.selectOption('select[name="type"]', 'UGC');
        await page.fill('input[name="tags"]', 'summer, lifestyle, product-launch');

        // Verify next button is enabled
        await expect(page.locator('button:has-text("Next")')).toBeEnabled();
        await page.click('button:has-text("Next")');
      });

      // Step 2: Budget and Timeline
      await test.step('Set budget and timeline', async () => {
        await page.fill('input[name="budget"]', '15000');
        await page.selectOption('select[name="currency"]', 'USD');
        await page.fill('input[name="startDate"]', '2024-06-01');
        await page.fill('input[name="endDate"]', '2024-08-31');

        // Verify budget validation
        await expect(page.locator('text=/Budget.*15,000/i')).toBeVisible();

        await page.click('button:has-text("Next")');
      });

      // Step 3: Target Audience
      await test.step('Define target audience', async () => {
        await page.check('input[value="18-24"]');
        await page.check('input[value="25-34"]');
        await page.check('input[value="female"]');
        await page.check('input[value="male"]');

        // Select locations
        await page.fill('input[name="locations"]', 'United States');
        await page.keyboard.press('Enter');
        await page.fill('input[name="locations"]', 'United Kingdom');
        await page.keyboard.press('Enter');

        await page.click('button:has-text("Next")');
      });

      // Step 4: Campaign Brief
      await test.step('Create campaign brief', async () => {
        await page.fill('textarea[name="overview"]', 'We are launching our summer collection');

        // Set objectives
        await page.fill('input[name="awarenessGoal"]', '80');
        await page.fill('input[name="engagementGoal"]', '15');
        await page.fill('input[name="conversionGoal"]', '5');

        // Select platforms
        await page.check('input[value="tiktok"]');
        await page.check('input[value="instagram"]');
        await page.check('input[value="youtube"]');

        // Content types
        await page.check('input[value="video"]');
        await page.check('input[value="image"]');
        await page.check('input[value="story"]');

        // Key messages
        await page.fill('input[name="keyMessage1"]', 'Sustainable fashion');
        await page.click('button:has-text("Add Message")');
        await page.fill('input[name="keyMessage2"]', 'Affordable luxury');

        // Hashtags
        await page.fill('input[name="hashtags"]', '#SummerStyle #EcoFashion #BrandName');

        await page.click('button:has-text("Next")');
      });

      // Step 5: Deliverables
      await test.step('Define deliverables', async () => {
        // Add TikTok deliverable
        await page.click('button:has-text("Add Deliverable")');
        await page.fill('input[name="deliverableName"]', 'TikTok Product Showcase');
        await page.selectOption('select[name="deliverableType"]', 'TIKTOK');
        await page.fill('textarea[name="deliverableDescription"]', '30-60 second product review');
        await page.fill('input[name="quantity"]', '10');
        await page.fill('input[name="compensation"]', '500');
        await page.fill('input[name="dueDate"]', '2024-07-15');
        await page.click('button:has-text("Save Deliverable")');

        // Add Instagram deliverable
        await page.click('button:has-text("Add Deliverable")');
        await page.fill('input[name="deliverableName"]', 'Instagram Reel');
        await page.selectOption('select[name="deliverableType"]', 'REEL');
        await page.fill('input[name="quantity"]', '5');
        await page.fill('input[name="compensation"]', '400');
        await page.click('button:has-text("Save Deliverable")');

        // Verify deliverables added
        await expect(page.locator('text=TikTok Product Showcase')).toBeVisible();
        await expect(page.locator('text=Instagram Reel')).toBeVisible();

        await page.click('button:has-text("Next")');
      });

      // Step 6: Review and Submit
      await test.step('Review and submit campaign', async () => {
        // Verify all details are shown
        await expect(page.locator('text=Complete UGC Campaign')).toBeVisible();
        await expect(page.locator('text=$15,000')).toBeVisible();
        await expect(page.locator('text=TikTok Product Showcase')).toBeVisible();

        // Save as draft first
        await page.click('button:has-text("Save as Draft")');
        await expect(page.locator('text=/Campaign.*saved.*draft/i')).toBeVisible();

        // Now publish
        await page.click('button:has-text("Publish Campaign")');

        // Confirmation modal
        await expect(page.locator('text=/Are you sure.*publish/i')).toBeVisible();
        await page.click('button:has-text("Yes, Publish")');

        // Success message
        await expect(page.locator('text=/Campaign.*published/i')).toBeVisible();

        // Should redirect to campaign details
        await expect(page).toHaveURL(/\/campaigns\/[^\/]+/);
      });
    });

    test('should validate required fields in each step', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Try to proceed without filling required fields
      await page.click('button:has-text("Next")');

      // Should show validation errors
      await expect(page.locator('text=/name.*required/i')).toBeVisible();

      // Fill name but not description
      await page.fill('input[name="name"]', 'Test');
      await page.click('button:has-text("Next")');

      // Should show description error
      await expect(page.locator('text=/description.*required/i')).toBeVisible();
    });

    test('should allow going back to previous steps', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Step 1
      await page.fill('input[name="name"]', 'Navigation Test');
      await page.fill('textarea[name="description"]', 'Testing navigation');
      await page.click('button:has-text("Next")');

      // Step 2
      await page.fill('input[name="budget"]', '5000');
      await page.click('button:has-text("Next")');

      // Go back
      await page.click('button:has-text("Back")');

      // Should still have budget value
      await expect(page.locator('input[name="budget"]')).toHaveValue('5000');

      // Go back again
      await page.click('button:has-text("Back")');

      // Should still have name and description
      await expect(page.locator('input[name="name"]')).toHaveValue('Navigation Test');
    });

    test('should show progress indicator', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Step 1
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('1 of 6');

      await page.fill('input[name="name"]', 'Progress Test');
      await page.fill('textarea[name="description"]', 'Testing progress');
      await page.click('button:has-text("Next")');

      // Step 2
      await expect(page.locator('[data-testid="step-indicator"]')).toContainText('2 of 6');
    });

    test('should save draft at any step', async ({ page }) => {
      await page.goto('/campaigns/new');

      await page.fill('input[name="name"]', 'Draft Test');
      await page.fill('textarea[name="description"]', 'Testing draft save');

      // Save draft
      await page.click('button:has-text("Save Draft")');

      await expect(page.locator('text=/Draft.*saved/i')).toBeVisible();

      // Navigate away and come back
      await page.goto('/campaigns');
      await page.click('text=Drafts');

      // Should see saved draft
      await expect(page.locator('text=Draft Test')).toBeVisible();
    });

    test('should restore draft on return', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Fill and save draft
      await page.fill('input[name="name"]', 'Restore Test');
      await page.fill('textarea[name="description"]', 'Testing draft restore');
      await page.fill('input[name="budget"]', '7000');
      await page.click('button:has-text("Save Draft")');

      // Get draft ID from URL
      await page.waitForURL(/\/campaigns\/[^\/]+\/edit/);
      const url = page.url();
      const draftId = url.split('/')[4];

      // Navigate away
      await page.goto('/dashboard');

      // Come back to edit draft
      await page.goto(`/campaigns/${draftId}/edit`);

      // Should have saved values
      await expect(page.locator('input[name="name"]')).toHaveValue('Restore Test');
      await expect(page.locator('textarea[name="description"]')).toHaveValue('Testing draft restore');
    });
  });

  test.describe('Campaign Templates', () => {
    test('should use campaign template', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Select template
      await page.click('button:has-text("Use Template")');

      // Choose UGC template
      await page.click('[data-template="ugc-standard"]');

      // Template values should be pre-filled
      await expect(page.locator('input[name="name"]')).not.toBeEmpty();
      await expect(page.locator('textarea[name="description"]')).not.toBeEmpty();
    });

    test('should customize template before creating', async ({ page }) => {
      await page.goto('/campaigns/new');

      await page.click('button:has-text("Use Template")');
      await page.click('[data-template="influencer-collab"]');

      // Customize template
      await page.fill('input[name="name"]', 'Customized Template Campaign');
      await page.fill('input[name="budget"]', '20000');

      await page.click('button:has-text("Create from Template")');

      await expect(page.locator('text=Customized Template Campaign')).toBeVisible();
    });
  });

  test.describe('Campaign Duplication', () => {
    test('should duplicate existing campaign', async ({ page }) => {
      // First create a campaign
      await page.goto('/campaigns/new');
      await page.fill('input[name="name"]', 'Original Campaign');
      await page.fill('textarea[name="description"]', 'Original description');
      await page.fill('input[name="budget"]', '8000');
      await page.click('button:has-text("Create Campaign")');

      // Go to campaigns list
      await page.goto('/campaigns');

      // Find campaign and duplicate
      await page.click('[data-testid="campaign-card"]:has-text("Original Campaign")');
      await page.click('button:has-text("Duplicate")');

      // Should create copy with modified name
      await expect(page.locator('input[name="name"]')).toHaveValue(/Copy of Original Campaign/);
      await expect(page.locator('textarea[name="description"]')).toHaveValue('Original description');
    });
  });
});
