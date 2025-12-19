// =============================================================================
// E2E Tests - Brand Portal Journey
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Brand Portal Journey', () => {
  const brandUser = {
    email: `brand-${Date.now()}@example.com`,
    password: 'BrandPass123',
    firstName: 'Test',
    lastName: 'Brand',
  };

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('/register');
    await page.fill('input[name="email"]', brandUser.email);
    await page.fill('input[name="password"]', brandUser.password);
    await page.fill('input[name="firstName"]', brandUser.firstName);
    await page.fill('input[name="lastName"]', brandUser.lastName);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Organization Setup', () => {
    test('should create brand organization', async ({ page }) => {
      await page.goto('/organizations/new');

      await page.fill('input[name="name"]', 'Test Brand Inc.');
      await page.selectOption('select[name="type"]', 'BRAND');
      await page.fill('input[name="website"]', 'https://testbrand.com');
      await page.fill('textarea[name="description"]', 'We create amazing products');

      // Upload logo
      await page.setInputFiles('input[name="logo"]', './tests/fixtures/brand-logo.png');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/Organization.*created/i')).toBeVisible();
    });
  });

  test.describe('Campaign Creation Flow', () => {
    test('should create a new UGC campaign', async ({ page }) => {
      await page.goto('/campaigns/new');

      // Step 1: Basic Info
      await page.fill('input[name="name"]', 'Summer Product Launch');
      await page.fill('textarea[name="description"]', 'Campaign for our new summer collection');
      await page.selectOption('select[name="type"]', 'UGC');

      await page.click('button:has-text("Next")');

      // Step 2: Budget & Timeline
      await page.fill('input[name="budget"]', '10000');
      await page.fill('input[name="startDate"]', '2024-06-01');
      await page.fill('input[name="endDate"]', '2024-08-31');

      await page.click('button:has-text("Next")');

      // Step 3: Brief
      await page.fill('textarea[name="overview"]', 'We need authentic UGC for our summer collection');
      await page.check('input[value="tiktok"]');
      await page.check('input[value="instagram"]');

      await page.click('button:has-text("Next")');

      // Step 4: Deliverables
      await page.click('button:has-text("Add Deliverable")');
      await page.fill('input[name="deliverableName"]', 'TikTok Video');
      await page.selectOption('select[name="deliverableType"]', 'TIKTOK');
      await page.fill('input[name="quantity"]', '5');
      await page.fill('input[name="compensation"]', '500');

      await page.click('button:has-text("Save Deliverable")');

      // Submit campaign
      await page.click('button:has-text("Create Campaign")');

      await expect(page.locator('text=/Campaign.*created/i')).toBeVisible();
    });

    test('should save campaign as draft', async ({ page }) => {
      await page.goto('/campaigns/new');

      await page.fill('input[name="name"]', 'Draft Campaign');
      await page.fill('textarea[name="description"]', 'This is a draft');

      await page.click('button:has-text("Save as Draft")');

      await expect(page.locator('text=/Draft.*saved/i')).toBeVisible();
      await expect(page).toHaveURL(/\/campaigns/);
    });
  });

  test.describe('Campaign Management', () => {
    test.beforeEach(async ({ page }) => {
      // Create a campaign first
      await page.goto('/campaigns/new');
      await page.fill('input[name="name"]', 'Test Campaign');
      await page.fill('textarea[name="description"]', 'Test description');
      await page.selectOption('select[name="type"]', 'UGC');
      await page.fill('input[name="budget"]', '5000');
      await page.click('button:has-text("Create Campaign")');
      await page.waitForURL(/\/campaigns\/[^\/]+/);
    });

    test('should view campaign details', async ({ page }) => {
      await page.goto('/campaigns');

      await page.click('[data-testid="campaign-card"]:first-child');

      await expect(page.locator('h1')).toContainText('Test Campaign');
      await expect(page.locator('text=Budget')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
    });

    test('should edit campaign', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');

      await page.click('button:has-text("Edit")');

      await page.fill('input[name="name"]', 'Updated Campaign Name');
      await page.fill('textarea[name="description"]', 'Updated description');

      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('h1')).toContainText('Updated Campaign Name');
    });

    test('should publish campaign', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');

      await page.click('button:has-text("Publish")');

      // Confirm publish
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('[data-testid="campaign-status"]')).toContainText('Active');
    });

    test('should pause active campaign', async ({ page }) => {
      // First publish the campaign
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('button:has-text("Publish")');
      await page.click('button:has-text("Confirm")');

      // Now pause it
      await page.click('button:has-text("Pause")');
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('[data-testid="campaign-status"]')).toContainText('Paused');
    });
  });

  test.describe('Application Review', () => {
    test('should view applications for campaign', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');

      await page.click('text=Applications');

      await expect(page.locator('[data-testid="applications-list"]')).toBeVisible();
    });

    test('should filter applications by status', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Applications');

      await page.selectOption('select[name="status"]', 'PENDING');

      const statusBadges = await page.locator('[data-testid="application-status"]').allTextContents();
      expect(statusBadges.every((status) => status.includes('Pending'))).toBeTruthy();
    });

    test('should review and approve application', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Applications');

      // Click on first application
      await page.click('[data-testid="application-card"]:first-child');

      // Review creator profile
      await expect(page.locator('[data-testid="creator-profile"]')).toBeVisible();

      // Approve application
      await page.click('button:has-text("Approve")');

      // Add approval message
      await page.fill('textarea[name="message"]', 'Looking forward to working with you!');

      await page.click('button:has-text("Confirm Approval")');

      await expect(page.locator('text=/Application.*approved/i')).toBeVisible();
    });

    test('should reject application with reason', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Applications');

      await page.click('[data-testid="application-card"]:first-child');

      await page.click('button:has-text("Reject")');

      await page.fill('textarea[name="reason"]', 'Not a good fit for this campaign');

      await page.click('button:has-text("Confirm Rejection")');

      await expect(page.locator('text=/Application.*rejected/i')).toBeVisible();
    });
  });

  test.describe('Content Review', () => {
    test('should view submitted content', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Content');

      await expect(page.locator('[data-testid="content-list"]')).toBeVisible();
    });

    test('should approve content submission', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Content');

      await page.click('[data-testid="content-card"]:first-child');

      // Preview content
      await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();

      // Approve
      await page.click('button:has-text("Approve")');

      await page.fill('textarea[name="feedback"]', 'Great work! Approved.');

      await page.click('button:has-text("Confirm Approval")');

      await expect(page.locator('text=/Content.*approved/i')).toBeVisible();
    });

    test('should request revisions', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Content');

      await page.click('[data-testid="content-card"]:first-child');

      await page.click('button:has-text("Request Revisions")');

      await page.fill('textarea[name="feedback"]', 'Please adjust the lighting and add brand logo');

      await page.click('button:has-text("Send Revision Request")');

      await expect(page.locator('text=/Revision.*requested/i')).toBeVisible();
    });
  });

  test.describe('Campaign Analytics', () => {
    test('should view campaign analytics', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Analytics');

      // Should show key metrics
      await expect(page.locator('[data-testid="total-applications"]')).toBeVisible();
      await expect(page.locator('[data-testid="approved-creators"]')).toBeVisible();
      await expect(page.locator('[data-testid="content-submissions"]')).toBeVisible();

      // Should show charts
      await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
    });

    test('should export analytics report', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Analytics');

      // Click export
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export Report")');

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Billing and Payments', () => {
    test('should view campaign spending', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Billing');

      await expect(page.locator('[data-testid="budget-spent"]')).toBeVisible();
      await expect(page.locator('[data-testid="budget-remaining"]')).toBeVisible();
    });

    test('should process creator payment', async ({ page }) => {
      await page.goto('/campaigns');
      await page.click('[data-testid="campaign-card"]:first-child');
      await page.click('text=Payments');

      // Find pending payment
      await page.click('[data-testid="payment-card"]:has-text("Pending"):first-child');

      await page.click('button:has-text("Process Payment")');

      // Confirm payment
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('text=/Payment.*processed/i')).toBeVisible();
    });
  });
});
