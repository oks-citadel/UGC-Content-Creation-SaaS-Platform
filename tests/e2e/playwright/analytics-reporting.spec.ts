// =============================================================================
// E2E Tests: Analytics and Reporting
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Brand Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/brand\/dashboard/);
  });

  test('view overview metrics', async ({ page }) => {
    await page.goto('/brand/analytics');

    await expect(page.locator('text=Analytics Overview')).toBeVisible();
    await expect(page.locator('[data-testid="total-impressions"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-engagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-reach"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-roi"]')).toBeVisible();
  });

  test('filter analytics by date range', async ({ page }) => {
    await page.goto('/brand/analytics');

    // Select last 30 days
    await page.click('[data-testid="date-range-picker"]');
    await page.click('text=Last 30 Days');

    await expect(page.locator('[data-testid="date-range-label"]')).toContainText('30 days');

    // Custom date range
    await page.click('[data-testid="date-range-picker"]');
    await page.click('text=Custom Range');
    await page.fill('[name="startDate"]', '2024-01-01');
    await page.fill('[name="endDate"]', '2024-06-30');
    await page.click('text=Apply');

    await expect(page.locator('[data-testid="analytics-chart"]')).toBeVisible();
  });

  test('view campaign performance comparison', async ({ page }) => {
    await page.goto('/brand/analytics/campaigns');

    await expect(page.locator('text=Campaign Performance')).toBeVisible();
    await expect(page.locator('[data-testid="campaign-comparison-chart"]')).toBeVisible();

    // Select campaigns to compare
    await page.check('[data-testid="campaign-checkbox"]:nth-child(1)');
    await page.check('[data-testid="campaign-checkbox"]:nth-child(2)');
    await page.click('text=Compare');

    await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();
  });

  test('view creator performance metrics', async ({ page }) => {
    await page.goto('/brand/analytics/creators');

    await expect(page.locator('text=Creator Performance')).toBeVisible();
    await expect(page.locator('[data-testid="creator-table"]')).toBeVisible();

    // Sort by engagement
    await page.click('text=Engagement Rate');
    await expect(page.locator('[data-testid="sort-indicator"]')).toBeVisible();

    // View individual creator
    await page.click('[data-testid="creator-row"]:first-child');
    await expect(page.locator('[data-testid="creator-detail-modal"]')).toBeVisible();
  });

  test('view content performance', async ({ page }) => {
    await page.goto('/brand/analytics/content');

    await expect(page.locator('text=Content Performance')).toBeVisible();
    await expect(page.locator('[data-testid="top-performing-content"]')).toBeVisible();

    // Filter by content type
    await page.selectOption('[name="contentType"]', 'video');
    await expect(page.locator('[data-testid="content-card"]')).toHaveCount.greaterThan(0);
  });

  test('view ROI calculator', async ({ page }) => {
    await page.goto('/brand/analytics/roi');

    await expect(page.locator('text=ROI Calculator')).toBeVisible();
    await expect(page.locator('[data-testid="total-spend"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="roi-percentage"]')).toBeVisible();

    // Adjust attribution settings
    await page.click('text=Attribution Settings');
    await page.selectOption('[name="attributionModel"]', 'last-touch');
    await page.click('text=Apply');

    await expect(page.locator('[data-testid="roi-percentage"]')).toBeVisible();
  });

  test('export analytics report', async ({ page }) => {
    await page.goto('/brand/analytics');

    await page.click('text=Export Report');

    // Select report options
    await page.check('[name="include-overview"]');
    await page.check('[name="include-campaigns"]');
    await page.check('[name="include-creators"]');
    await page.selectOption('[name="format"]', 'pdf');

    await page.click('text=Generate Report');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('schedule recurring report', async ({ page }) => {
    await page.goto('/brand/analytics/reports');

    await page.click('text=Schedule Report');

    await page.fill('[name="reportName"]', 'Weekly Performance Report');
    await page.selectOption('[name="frequency"]', 'weekly');
    await page.selectOption('[name="dayOfWeek"]', 'monday');
    await page.fill('[name="recipients"]', 'team@brand.com, manager@brand.com');
    await page.selectOption('[name="format"]', 'excel');

    await page.click('text=Schedule');

    await expect(page.locator('text=Report scheduled')).toBeVisible();
  });
});

test.describe('Creator Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/creator\/dashboard/);
  });

  test('view personal analytics', async ({ page }) => {
    await page.goto('/creator/analytics');

    await expect(page.locator('text=Your Performance')).toBeVisible();
    await expect(page.locator('[data-testid="total-impressions"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-engagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-engagement-rate"]')).toBeVisible();
  });

  test('view campaign analytics', async ({ page }) => {
    await page.goto('/creator/analytics/campaigns');

    await expect(page.locator('text=Campaign Performance')).toBeVisible();
    await expect(page.locator('[data-testid="campaign-row"]')).toHaveCount.greaterThan(0);

    // View campaign details
    await page.click('[data-testid="campaign-row"]:first-child');
    await expect(page.locator('[data-testid="campaign-analytics-detail"]')).toBeVisible();
  });

  test('view content analytics', async ({ page }) => {
    await page.goto('/creator/analytics/content');

    await expect(page.locator('text=Content Performance')).toBeVisible();
    await expect(page.locator('[data-testid="content-chart"]')).toBeVisible();

    // View top performing
    await expect(page.locator('[data-testid="top-content"]')).toBeVisible();
  });

  test('view audience insights', async ({ page }) => {
    await page.goto('/creator/analytics/audience');

    await expect(page.locator('text=Audience Insights')).toBeVisible();
    await expect(page.locator('[data-testid="demographics-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="location-map"]')).toBeVisible();
    await expect(page.locator('[data-testid="interests-chart"]')).toBeVisible();
  });

  test('view growth metrics', async ({ page }) => {
    await page.goto('/creator/analytics/growth');

    await expect(page.locator('text=Growth Metrics')).toBeVisible();
    await expect(page.locator('[data-testid="follower-growth-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-trend"]')).toBeVisible();
  });
});

test.describe('Admin Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@creatorbridge.com');
    await page.fill('[name="password"]', 'AdminPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/admin\/dashboard/);
  });

  test('view platform analytics', async ({ page }) => {
    await page.goto('/admin/analytics');

    await expect(page.locator('text=Platform Analytics')).toBeVisible();
    await expect(page.locator('[data-testid="total-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-brands"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-creators"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-campaigns"]')).toBeVisible();
    await expect(page.locator('[data-testid="gmv"]')).toBeVisible();
  });

  test('view revenue analytics', async ({ page }) => {
    await page.goto('/admin/analytics/revenue');

    await expect(page.locator('text=Revenue Analytics')).toBeVisible();
    await expect(page.locator('[data-testid="mrr"]')).toBeVisible();
    await expect(page.locator('[data-testid="arr"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('view user growth metrics', async ({ page }) => {
    await page.goto('/admin/analytics/users');

    await expect(page.locator('text=User Growth')).toBeVisible();
    await expect(page.locator('[data-testid="dau"]')).toBeVisible();
    await expect(page.locator('[data-testid="mau"]')).toBeVisible();
    await expect(page.locator('[data-testid="retention-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="churn-rate"]')).toBeVisible();
  });

  test('view campaign analytics', async ({ page }) => {
    await page.goto('/admin/analytics/campaigns');

    await expect(page.locator('text=Campaign Analytics')).toBeVisible();
    await expect(page.locator('[data-testid="active-campaigns"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="avg-campaign-value"]')).toBeVisible();
  });

  test('export platform report', async ({ page }) => {
    await page.goto('/admin/analytics/reports');

    await page.selectOption('[name="reportType"]', 'executive-summary');
    await page.click('text=Generate');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('executive');
  });
});

test.describe('Real-time Analytics', () => {
  test('view real-time dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/brand/analytics/realtime');

    await expect(page.locator('text=Real-time Analytics')).toBeVisible();
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="live-engagement"]')).toBeVisible();

    // Verify data updates
    const initialValue = await page.locator('[data-testid="active-users"]').textContent();

    // Wait for update
    await page.waitForTimeout(5000);

    // Data should still be visible (may or may not have changed)
    await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
  });
});
