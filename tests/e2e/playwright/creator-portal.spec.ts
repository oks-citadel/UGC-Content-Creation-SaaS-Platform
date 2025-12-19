// =============================================================================
// E2E Tests - Creator Portal Journey
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Creator Portal Journey', () => {
  const creatorUser = {
    email: `creator-${Date.now()}@example.com`,
    password: 'CreatorPass123',
    firstName: 'Test',
    lastName: 'Creator',
  };

  test.beforeAll(async ({ browser }) => {
    // Setup: Create creator account
    const page = await browser.newPage();
    await page.goto('/register');
    await page.fill('input[name="email"]', creatorUser.email);
    await page.fill('input[name="password"]', creatorUser.password);
    await page.fill('input[name="firstName"]', creatorUser.firstName);
    await page.fill('input[name="lastName"]', creatorUser.lastName);
    await page.click('button[type="submit"]');
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', creatorUser.email);
    await page.fill('input[name="password"]', creatorUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Profile Setup', () => {
    test('should complete creator profile', async ({ page }) => {
      // Navigate to profile setup
      await page.goto('/creator/profile/setup');

      // Fill in bio
      await page.fill('textarea[name="bio"]', 'Content creator specializing in lifestyle and tech');

      // Select niches
      await page.click('button[data-testid="select-niche"]');
      await page.click('text=Lifestyle');
      await page.click('text=Technology');
      await page.click('text=Fashion');

      // Add social media links
      await page.fill('input[name="tiktok"]', '@testcreator');
      await page.fill('input[name="instagram"]', '@testcreator');
      await page.fill('input[name="youtube"]', '@testcreator');

      // Upload profile photo
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./tests/fixtures/profile-photo.jpg');

      // Save profile
      await page.click('button[type="submit"]');

      // Verify success
      await expect(page.locator('text=/Profile.*updated/i')).toBeVisible();
    });

    test('should add portfolio items', async ({ page }) => {
      await page.goto('/creator/profile/portfolio');

      // Add portfolio item
      await page.click('button:has-text("Add Portfolio Item")');

      await page.fill('input[name="title"]', 'My Best TikTok');
      await page.fill('input[name="url"]', 'https://tiktok.com/@creator/video/123');
      await page.selectOption('select[name="platform"]', 'tiktok');
      await page.fill('textarea[name="description"]', 'Viral video about tech products');

      // Add metrics
      await page.fill('input[name="views"]', '1000000');
      await page.fill('input[name="likes"]', '50000');
      await page.fill('input[name="comments"]', '2000');

      await page.click('button:has-text("Save")');

      // Verify portfolio item added
      await expect(page.locator('text=My Best TikTok')).toBeVisible();
    });

    test('should set rates and availability', async ({ page }) => {
      await page.goto('/creator/profile/rates');

      // Set base rates
      await page.fill('input[name="tiktokVideoRate"]', '500');
      await page.fill('input[name="instagramPostRate"]', '300');
      await page.fill('input[name="instagramStoryRate"]', '150');

      // Set availability
      await page.check('input[name="availableForWork"]');
      await page.fill('input[name="weeklyCapacity"]', '5');

      // Save
      await page.click('button:has-text("Save Rates")');

      await expect(page.locator('text=/Rates.*updated/i')).toBeVisible();
    });
  });

  test.describe('Campaign Discovery', () => {
    test('should browse available campaigns', async ({ page }) => {
      await page.goto('/creator/campaigns');

      // Should show campaigns list
      await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();

      // Should have filter options
      await expect(page.locator('select[name="filter-type"]')).toBeVisible();
      await expect(page.locator('select[name="filter-niche"]')).toBeVisible();
    });

    test('should filter campaigns by type', async ({ page }) => {
      await page.goto('/creator/campaigns');

      // Filter by UGC
      await page.selectOption('select[name="filter-type"]', 'UGC');

      // Wait for results
      await page.waitForSelector('[data-testid="campaign-card"]');

      // Verify all shown campaigns are UGC
      const campaignTypes = await page.locator('[data-testid="campaign-type"]').allTextContents();
      expect(campaignTypes.every((type) => type.includes('UGC'))).toBeTruthy();
    });

    test('should search campaigns', async ({ page }) => {
      await page.goto('/creator/campaigns');

      await page.fill('input[name="search"]', 'summer');
      await page.press('input[name="search"]', 'Enter');

      await page.waitForSelector('[data-testid="campaign-card"]');

      // Verify search results
      const results = page.locator('[data-testid="campaign-card"]');
      expect(await results.count()).toBeGreaterThan(0);
    });

    test('should view campaign details', async ({ page }) => {
      await page.goto('/creator/campaigns');

      // Click first campaign
      await page.click('[data-testid="campaign-card"]:first-child');

      // Should show campaign details
      await expect(page.locator('[data-testid="campaign-details"]')).toBeVisible();
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Budget')).toBeVisible();
      await expect(page.locator('text=Deliverables')).toBeVisible();
    });
  });

  test.describe('Campaign Application', () => {
    test('should apply to a campaign', async ({ page }) => {
      await page.goto('/creator/campaigns');

      // View campaign
      await page.click('[data-testid="campaign-card"]:first-child');

      // Click apply button
      await page.click('button:has-text("Apply Now")');

      // Fill application form
      await page.fill(
        'textarea[name="message"]',
        'I would love to create content for this campaign. I have experience in this niche.'
      );
      await page.fill('input[name="proposedRate"]', '750');
      await page.fill('input[name="deliveryDays"]', '7');

      // Select portfolio items
      await page.check('input[data-portfolio-id]:first-child');

      // Submit application
      await page.click('button:has-text("Submit Application")');

      // Verify success
      await expect(page.locator('text=/Application.*submitted/i')).toBeVisible();
    });

    test('should view submitted applications', async ({ page }) => {
      await page.goto('/creator/applications');

      // Should show applications list
      await expect(page.locator('[data-testid="applications-list"]')).toBeVisible();

      // Filter by status
      await page.selectOption('select[name="status"]', 'PENDING');

      const statusBadges = await page.locator('[data-testid="application-status"]').allTextContents();
      expect(statusBadges.every((status) => status.includes('Pending'))).toBeTruthy();
    });

    test('should withdraw pending application', async ({ page }) => {
      await page.goto('/creator/applications');

      // Find pending application
      const pendingApp = page.locator('[data-testid="application-card"]:has-text("Pending")').first();

      // Click withdraw button
      await pendingApp.locator('button:has-text("Withdraw")').click();

      // Confirm withdrawal
      await page.click('button:has-text("Yes, Withdraw")');

      // Verify withdrawal
      await expect(page.locator('text=/Application.*withdrawn/i')).toBeVisible();
    });
  });

  test.describe('Content Submission', () => {
    test('should submit content for approved campaign', async ({ page }) => {
      await page.goto('/creator/applications?status=APPROVED');

      // Click on approved application
      await page.click('[data-testid="application-card"]:first-child');

      // Navigate to submission
      await page.click('button:has-text("Submit Content")');

      // Upload content
      await page.setInputFiles('input[name="contentFile"]', './tests/fixtures/sample-video.mp4');

      // Add description
      await page.fill('textarea[name="description"]', 'Here is my content submission');

      // Add hashtags
      await page.fill('input[name="hashtags"]', '#brand #ugc #content');

      // Submit
      await page.click('button:has-text("Submit for Review")');

      // Verify success
      await expect(page.locator('text=/Content.*submitted/i')).toBeVisible();
    });

    test('should view content feedback', async ({ page }) => {
      await page.goto('/creator/submissions');

      // Click on submission
      await page.click('[data-testid="submission-card"]:first-child');

      // Should show feedback section
      await expect(page.locator('[data-testid="feedback-section"]')).toBeVisible();
    });

    test('should resubmit content with revisions', async ({ page }) => {
      await page.goto('/creator/submissions');

      // Find submission with revision request
      const revisionSubmission = page.locator('[data-testid="submission-card"]:has-text("Revision Requested")').first();
      await revisionSubmission.click();

      // Make revisions
      await page.click('button:has-text("Upload New Version")');
      await page.setInputFiles('input[name="contentFile"]', './tests/fixtures/sample-video-revised.mp4');
      await page.fill('textarea[name="revisionNotes"]', 'Made the requested changes');

      await page.click('button:has-text("Submit Revision")');

      await expect(page.locator('text=/Revision.*submitted/i')).toBeVisible();
    });
  });

  test.describe('Earnings and Payments', () => {
    test('should view earnings dashboard', async ({ page }) => {
      await page.goto('/creator/earnings');

      // Should show earnings summary
      await expect(page.locator('[data-testid="total-earnings"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-earnings"]')).toBeVisible();
      await expect(page.locator('[data-testid="paid-earnings"]')).toBeVisible();

      // Should show earnings chart
      await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
    });

    test('should view payment history', async ({ page }) => {
      await page.goto('/creator/earnings/history');

      // Should show payments table
      await expect(page.locator('[data-testid="payments-table"]')).toBeVisible();

      // Filter by date range
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.fill('input[name="endDate"]', '2024-12-31');
      await page.click('button:has-text("Apply Filter")');

      // Should update results
      await page.waitForSelector('[data-testid="payment-row"]');
    });

    test('should request payout', async ({ page }) => {
      await page.goto('/creator/earnings');

      // Click request payout
      await page.click('button:has-text("Request Payout")');

      // Enter amount
      await page.fill('input[name="amount"]', '500');

      // Select payment method
      await page.selectOption('select[name="paymentMethod"]', 'bank_transfer');

      // Submit request
      await page.click('button:has-text("Submit Request")');

      // Verify success
      await expect(page.locator('text=/Payout.*requested/i')).toBeVisible();
    });

    test('should set up payment method', async ({ page }) => {
      await page.goto('/creator/settings/payment');

      // Add bank account
      await page.click('button:has-text("Add Bank Account")');

      await page.fill('input[name="accountHolderName"]', 'Test Creator');
      await page.fill('input[name="accountNumber"]', '1234567890');
      await page.fill('input[name="routingNumber"]', '021000021');

      await page.click('button:has-text("Save")');

      await expect(page.locator('text=/Payment.*method.*added/i')).toBeVisible();
    });
  });

  test.describe('Analytics', () => {
    test('should view performance analytics', async ({ page }) => {
      await page.goto('/creator/analytics');

      // Should show key metrics
      await expect(page.locator('[data-testid="total-views"]')).toBeVisible();
      await expect(page.locator('[data-testid="engagement-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="total-campaigns"]')).toBeVisible();

      // Should show charts
      await expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
    });

    test('should filter analytics by date range', async ({ page }) => {
      await page.goto('/creator/analytics');

      // Select date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('text=Last 30 Days');

      // Charts should update
      await page.waitForSelector('[data-testid="performance-chart"]');
    });
  });
});
