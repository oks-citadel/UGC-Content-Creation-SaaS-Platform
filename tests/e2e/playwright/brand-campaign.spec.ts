// =============================================================================
// E2E Tests: Brand Campaign Management Flow
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Brand Campaign Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as brand user
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/brand\/dashboard/);
  });

  test('create new campaign with all details', async ({ page }) => {
    await page.click('text=Create Campaign');
    await expect(page).toHaveURL(/\/brand\/campaigns\/new/);

    // Step 1: Campaign Details
    await page.fill('[name="title"]', 'Summer Product Launch 2024');
    await page.fill('[name="description"]', 'Looking for lifestyle creators to showcase our new summer collection.');
    await page.selectOption('[name="category"]', 'fashion');
    await page.fill('[name="budget"]', '5000');
    await page.click('text=Next');

    // Step 2: Content Requirements
    await expect(page.locator('text=Content Requirements')).toBeVisible();
    await page.check('[name="contentType-photo"]');
    await page.check('[name="contentType-video"]');
    await page.check('[name="contentType-reel"]');
    await page.fill('[name="minPhotos"]', '3');
    await page.fill('[name="minVideos"]', '1');
    await page.fill('[name="videoMinLength"]', '30');
    await page.fill('[name="videoMaxLength"]', '60');
    await page.click('text=Next');

    // Step 3: Creator Requirements
    await expect(page.locator('text=Creator Requirements')).toBeVisible();
    await page.fill('[name="minFollowers"]', '10000');
    await page.selectOption('[name="platforms"]', ['instagram', 'tiktok']);
    await page.selectOption('[name="creatorCategories"]', ['lifestyle', 'fashion']);
    await page.fill('[name="minEngagementRate"]', '3');
    await page.click('text=Next');

    // Step 4: Timeline
    await expect(page.locator('text=Campaign Timeline')).toBeVisible();
    const today = new Date();
    const startDate = new Date(today.setDate(today.getDate() + 7));
    const endDate = new Date(today.setDate(today.getDate() + 30));

    await page.fill('[name="applicationDeadline"]', formatDate(startDate));
    await page.fill('[name="contentDeadline"]', formatDate(endDate));
    await page.click('text=Next');

    // Step 5: Rights & Usage
    await expect(page.locator('text=Usage Rights')).toBeVisible();
    await page.selectOption('[name="usageRights"]', 'exclusive');
    await page.fill('[name="usageDuration"]', '12');
    await page.selectOption('[name="usagePlatforms"]', ['social', 'web', 'paid-ads']);
    await page.check('[name="requiresApproval"]');
    await page.click('text=Next');

    // Step 6: Review & Launch
    await expect(page.locator('text=Review Campaign')).toBeVisible();
    await expect(page.locator('text=Summer Product Launch 2024')).toBeVisible();
    await expect(page.locator('text=$5,000')).toBeVisible();

    await page.click('text=Launch Campaign');

    // Verify success
    await expect(page.locator('text=Campaign launched successfully')).toBeVisible();
    await expect(page).toHaveURL(/\/brand\/campaigns\/\w+/);
  });

  test('save campaign as draft', async ({ page }) => {
    await page.click('text=Create Campaign');

    // Fill partial details
    await page.fill('[name="title"]', 'Draft Campaign');
    await page.fill('[name="description"]', 'This is a work in progress.');

    // Save as draft
    await page.click('text=Save Draft');

    await expect(page.locator('text=Draft saved')).toBeVisible();

    // Verify in drafts list
    await page.goto('/brand/campaigns?status=draft');
    await expect(page.locator('text=Draft Campaign')).toBeVisible();
  });

  test('duplicate existing campaign', async ({ page }) => {
    await page.goto('/brand/campaigns');

    // Click on existing campaign
    await page.click('text=Previous Campaign');

    // Duplicate
    await page.click('[data-testid="campaign-menu"]');
    await page.click('text=Duplicate');

    await expect(page).toHaveURL(/\/brand\/campaigns\/new\?duplicate=/);
    await expect(page.locator('[name="title"]')).toHaveValue(/Copy of/);
  });

  test('upload campaign brief document', async ({ page }) => {
    await page.click('text=Create Campaign');
    await page.fill('[name="title"]', 'Campaign with Brief');

    // Upload brief
    const fileInput = page.locator('[data-testid="brief-upload"]');
    await fileInput.setInputFiles('tests/fixtures/campaign-brief.pdf');

    await expect(page.locator('text=campaign-brief.pdf')).toBeVisible();
    await expect(page.locator('[data-testid="brief-preview"]')).toBeVisible();
  });

  test('set campaign budget breakdown', async ({ page }) => {
    await page.click('text=Create Campaign');
    await page.fill('[name="title"]', 'Budget Test Campaign');
    await page.fill('[name="budget"]', '10000');

    // Enable detailed budget
    await page.click('text=Set detailed budget');

    await page.fill('[name="budget-content"]', '6000');
    await page.fill('[name="budget-usage-rights"]', '2000');
    await page.fill('[name="budget-bonus"]', '2000');

    // Verify total matches
    await expect(page.locator('[data-testid="budget-total"]')).toHaveText('$10,000');
  });
});

test.describe('Campaign Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/brand\/dashboard/);
  });

  test('review creator applications', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id');
    await page.click('text=Applications');

    await expect(page.locator('[data-testid="application-list"]')).toBeVisible();

    // View application details
    await page.click('[data-testid="application-item"]:first-child');
    await expect(page.locator('text=Creator Profile')).toBeVisible();
    await expect(page.locator('text=Portfolio')).toBeVisible();
    await expect(page.locator('text=Past Campaigns')).toBeVisible();

    // Approve application
    await page.click('text=Approve');
    await expect(page.locator('text=Application approved')).toBeVisible();
  });

  test('reject creator with feedback', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/applications');

    await page.click('[data-testid="application-item"]:nth-child(2)');
    await page.click('text=Decline');

    // Add feedback
    await expect(page.locator('text=Provide feedback')).toBeVisible();
    await page.fill('[name="rejectionReason"]', 'Looking for creators with more experience in fashion content.');
    await page.click('text=Send Feedback');

    await expect(page.locator('text=Application declined')).toBeVisible();
  });

  test('review submitted content', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/content');

    // View pending content
    await expect(page.locator('[data-testid="content-pending"]')).toBeVisible();

    // Open content for review
    await page.click('[data-testid="content-item"]:first-child');
    await expect(page.locator('text=Content Review')).toBeVisible();

    // Check content details
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    await expect(page.locator('text=Caption')).toBeVisible();
    await expect(page.locator('text=Hashtags')).toBeVisible();
  });

  test('approve content with modifications', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/content');
    await page.click('[data-testid="content-item"]:first-child');

    // Request modifications
    await page.click('text=Request Changes');
    await page.fill('[name="changeRequest"]', 'Please update the caption to include our branded hashtag #SummerVibes2024');
    await page.click('text=Send Request');

    await expect(page.locator('text=Change request sent')).toBeVisible();
  });

  test('final approve and download content', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/content');
    await page.click('[data-testid="content-item"][data-status="revised"]');

    // Approve
    await page.click('text=Approve');
    await expect(page.locator('text=Content approved')).toBeVisible();

    // Download
    await page.click('text=Download Assets');

    // Verify download initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.zip');
  });

  test('view campaign analytics', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/analytics');

    await expect(page.locator('text=Campaign Performance')).toBeVisible();
    await expect(page.locator('[data-testid="metric-impressions"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-engagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-reach"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-roi"]')).toBeVisible();

    // Check charts
    await expect(page.locator('[data-testid="chart-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="chart-breakdown"]')).toBeVisible();
  });

  test('export campaign report', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/analytics');

    await page.click('text=Export Report');
    await page.selectOption('[name="format"]', 'pdf');
    await page.click('text=Generate Report');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});

test.describe('Campaign Communication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
  });

  test('send message to creator', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id/creators');

    // Open chat with creator
    await page.click('[data-testid="creator-item"]:first-child');
    await page.click('text=Message');

    // Send message
    await page.fill('[name="message"]', 'Hi! Looking forward to seeing your content for our campaign.');
    await page.click('[data-testid="send-message"]');

    await expect(page.locator('text=Looking forward to seeing')).toBeVisible();
  });

  test('broadcast message to all campaign creators', async ({ page }) => {
    await page.goto('/brand/campaigns/active-campaign-id');
    await page.click('text=Broadcast Message');

    await page.fill('[name="subject"]', 'Important Campaign Update');
    await page.fill('[name="message"]', 'Please note the updated deadline for content submission.');
    await page.click('text=Send to All Creators');

    await expect(page.locator('text=Message sent to 5 creators')).toBeVisible();
  });
});

// Helper function
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
