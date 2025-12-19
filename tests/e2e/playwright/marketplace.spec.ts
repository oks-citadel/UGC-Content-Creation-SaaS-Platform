// =============================================================================
// E2E Tests: Marketplace and Creator Discovery
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Marketplace Search and Discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Login as brand
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/brand\/dashboard/);
  });

  test('search creators by category', async ({ page }) => {
    await page.goto('/marketplace');

    await expect(page.locator('text=Find Creators')).toBeVisible();

    // Filter by category
    await page.selectOption('[name="category"]', 'lifestyle');
    await page.click('text=Search');

    await expect(page.locator('[data-testid="creator-card"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('[data-category="lifestyle"]')).toBeVisible();
  });

  test('filter creators by follower count', async ({ page }) => {
    await page.goto('/marketplace');

    // Set follower range
    await page.fill('[name="minFollowers"]', '10000');
    await page.fill('[name="maxFollowers"]', '100000');
    await page.click('text=Apply Filters');

    // Verify results
    const creatorCards = page.locator('[data-testid="creator-card"]');
    await expect(creatorCards).toHaveCount.greaterThan(0);

    // Check first result is within range
    const followerCount = await page.locator('[data-testid="creator-card"]:first-child [data-testid="follower-count"]').textContent();
    const count = parseInt(followerCount!.replace(/[^0-9]/g, ''));
    expect(count).toBeGreaterThanOrEqual(10000);
    expect(count).toBeLessThanOrEqual(100000);
  });

  test('filter creators by engagement rate', async ({ page }) => {
    await page.goto('/marketplace');

    await page.fill('[name="minEngagement"]', '5');
    await page.click('text=Apply Filters');

    const engagementBadges = page.locator('[data-testid="engagement-rate"]');
    await expect(engagementBadges.first()).toBeVisible();
  });

  test('filter creators by platform', async ({ page }) => {
    await page.goto('/marketplace');

    await page.check('[name="platform-instagram"]');
    await page.check('[name="platform-tiktok"]');
    await page.click('text=Apply Filters');

    await expect(page.locator('[data-platform="instagram"]')).toBeVisible();
  });

  test('filter creators by location', async ({ page }) => {
    await page.goto('/marketplace');

    await page.selectOption('[name="country"]', 'US');
    await page.selectOption('[name="state"]', 'CA');
    await page.click('text=Apply Filters');

    await expect(page.locator('[data-testid="creator-card"]')).toHaveCount.greaterThan(0);
  });

  test('sort creators by different criteria', async ({ page }) => {
    await page.goto('/marketplace');

    // Sort by engagement
    await page.selectOption('[name="sortBy"]', 'engagement-desc');
    await expect(page.locator('[data-testid="creator-card"]:first-child [data-testid="engagement-rate"]')).toBeVisible();

    // Sort by followers
    await page.selectOption('[name="sortBy"]', 'followers-desc');

    // Sort by recent activity
    await page.selectOption('[name="sortBy"]', 'recent-activity');
  });

  test('view creator profile from marketplace', async ({ page }) => {
    await page.goto('/marketplace');

    // Click on creator card
    await page.click('[data-testid="creator-card"]:first-child');

    await expect(page).toHaveURL(/\/creators\/\w+/);
    await expect(page.locator('[data-testid="creator-profile"]')).toBeVisible();
    await expect(page.locator('text=Portfolio')).toBeVisible();
    await expect(page.locator('text=Stats')).toBeVisible();
    await expect(page.locator('text=Past Campaigns')).toBeVisible();
  });

  test('save creator to list', async ({ page }) => {
    await page.goto('/marketplace');

    // Save creator
    await page.hover('[data-testid="creator-card"]:first-child');
    await page.click('[data-testid="save-creator"]');

    await expect(page.locator('text=Saved to list')).toBeVisible();

    // Verify in saved list
    await page.goto('/brand/saved-creators');
    await expect(page.locator('[data-testid="creator-card"]')).toHaveCount.greaterThan(0);
  });

  test('invite creator to campaign', async ({ page }) => {
    await page.goto('/marketplace');

    // Click invite on creator
    await page.hover('[data-testid="creator-card"]:first-child');
    await page.click('[data-testid="invite-creator"]');

    // Select campaign
    await expect(page.locator('text=Invite to Campaign')).toBeVisible();
    await page.selectOption('[name="campaign"]', 'summer-campaign-2024');
    await page.fill('[name="message"]', 'We love your content and would like to invite you to our summer campaign!');
    await page.click('text=Send Invitation');

    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });

  test('compare creators', async ({ page }) => {
    await page.goto('/marketplace');

    // Select multiple creators
    await page.check('[data-testid="creator-card"]:nth-child(1) [data-testid="compare-checkbox"]');
    await page.check('[data-testid="creator-card"]:nth-child(2) [data-testid="compare-checkbox"]');
    await page.check('[data-testid="creator-card"]:nth-child(3) [data-testid="compare-checkbox"]');

    await page.click('text=Compare Selected');

    await expect(page).toHaveURL(/\/marketplace\/compare/);
    await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="comparison-column"]')).toHaveCount(3);
  });
});

test.describe('Creator Campaigns Discovery', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/creator\/dashboard/);
  });

  test('browse available campaigns', async ({ page }) => {
    await page.goto('/creator/discover');

    await expect(page.locator('text=Available Campaigns')).toBeVisible();
    await expect(page.locator('[data-testid="campaign-card"]')).toHaveCount.greaterThan(0);
  });

  test('filter campaigns by category', async ({ page }) => {
    await page.goto('/creator/discover');

    await page.selectOption('[name="category"]', 'fashion');
    await expect(page.locator('[data-category="fashion"]')).toBeVisible();
  });

  test('filter campaigns by budget', async ({ page }) => {
    await page.goto('/creator/discover');

    await page.fill('[name="minBudget"]', '500');
    await page.fill('[name="maxBudget"]', '2000');
    await page.click('text=Apply');

    const budgetLabels = page.locator('[data-testid="campaign-budget"]');
    await expect(budgetLabels.first()).toBeVisible();
  });

  test('filter campaigns by deadline', async ({ page }) => {
    await page.goto('/creator/discover');

    await page.selectOption('[name="deadline"]', 'this-week');
    await expect(page.locator('[data-testid="campaign-card"]')).toHaveCount.greaterThanOrEqual(0);
  });

  test('view campaign details and apply', async ({ page }) => {
    await page.goto('/creator/discover');

    // Click on campaign
    await page.click('[data-testid="campaign-card"]:first-child');

    await expect(page.locator('[data-testid="campaign-details"]')).toBeVisible();
    await expect(page.locator('text=Campaign Brief')).toBeVisible();
    await expect(page.locator('text=Requirements')).toBeVisible();
    await expect(page.locator('text=Budget')).toBeVisible();
    await expect(page.locator('text=Timeline')).toBeVisible();

    // Apply to campaign
    await page.click('text=Apply Now');
    await page.fill('[name="applicationNote"]', 'I would be a great fit for this campaign because of my experience in fashion content.');
    await page.click('text=Submit Application');

    await expect(page.locator('text=Application submitted')).toBeVisible();
  });

  test('view recommended campaigns', async ({ page }) => {
    await page.goto('/creator/discover');

    await page.click('text=Recommended for You');

    await expect(page.locator('[data-testid="recommended-campaigns"]')).toBeVisible();
    await expect(page.locator('[data-testid="match-score"]')).toBeVisible();
  });

  test('track application status', async ({ page }) => {
    await page.goto('/creator/applications');

    await expect(page.locator('text=My Applications')).toBeVisible();

    // Check different statuses
    await expect(page.locator('[data-status="pending"]')).toBeVisible();
    await expect(page.locator('[data-status="approved"]')).toBeVisible();

    // View application details
    await page.click('[data-testid="application-item"]:first-child');
    await expect(page.locator('text=Application Status')).toBeVisible();
  });
});

test.describe('Marketplace Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
  });

  test('view marketplace trends', async ({ page }) => {
    await page.goto('/marketplace/trends');

    await expect(page.locator('text=Marketplace Trends')).toBeVisible();
    await expect(page.locator('[data-testid="trending-categories"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-creators"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-rates"]')).toBeVisible();
  });

  test('view creator pricing insights', async ({ page }) => {
    await page.goto('/marketplace/pricing');

    await expect(page.locator('text=Pricing Insights')).toBeVisible();
    await expect(page.locator('[data-testid="price-by-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-by-platform"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-by-followers"]')).toBeVisible();
  });
});
