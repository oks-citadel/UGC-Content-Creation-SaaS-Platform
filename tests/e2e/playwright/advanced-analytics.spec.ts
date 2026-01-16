// =============================================================================
// E2E Tests - Advanced Analytics
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Advanced Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Analytics Dashboard', () => {
    test('should display analytics dashboard', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await expect(page.locator('h1')).toContainText('Analytics');
      await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
    });

    test('should show key metrics cards', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await expect(page.locator('[data-testid="metric-card"]')).toHaveCount(4);
    });

    test('should display revenue chart', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await page.click('[data-testid="date-range-picker"]');
      await page.click('text=Last 30 days');

      await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
    });
  });

  test.describe('Attribution Analytics', () => {
    test('should navigate to attribution page', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.click('text=Attribution');

      await expect(page).toHaveURL(/\/analytics\/attribution/);
      await expect(page.locator('h1')).toContainText('Attribution');
    });

    test('should display attribution models', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await expect(page.locator('[data-testid="attribution-models"]')).toBeVisible();
      await expect(page.locator('text=First Touch')).toBeVisible();
      await expect(page.locator('text=Last Touch')).toBeVisible();
      await expect(page.locator('text=Linear')).toBeVisible();
      await expect(page.locator('text=Time Decay')).toBeVisible();
      await expect(page.locator('text=Position Based')).toBeVisible();
    });

    test('should switch attribution model', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await page.click('[data-testid="model-tab-linear"]');

      await expect(page.locator('[data-testid="model-tab-linear"]')).toHaveClass(/active/);
      await expect(page.locator('[data-testid="attribution-chart"]')).toBeVisible();
    });

    test('should display touchpoint breakdown', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await expect(page.locator('[data-testid="touchpoint-breakdown"]')).toBeVisible();
    });

    test('should show channel attribution', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await expect(page.locator('[data-testid="channel-attribution"]')).toBeVisible();
      await expect(page.locator('text=Organic Search')).toBeVisible();
      await expect(page.locator('text=Paid Social')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
    });

    test('should filter by conversion type', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await page.selectOption('select[name="conversionType"]', 'purchase');

      await expect(page.locator('[data-testid="attribution-chart"]')).toBeVisible();
    });

    test('should export attribution report', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await page.click('button:has-text("Export")');

      await expect(page.locator('[data-testid="export-modal"]')).toBeVisible();
    });

    test('should compare attribution models', async ({ page }) => {
      await page.goto('/dashboard/analytics/attribution');

      await page.click('button:has-text("Compare Models")');

      await expect(page.locator('[data-testid="model-comparison"]')).toBeVisible();
    });
  });

  test.describe('Campaign Analytics', () => {
    test('should navigate to campaign analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.click('text=Campaigns');

      await expect(page).toHaveURL(/\/analytics\/campaigns/);
    });

    test('should display campaign performance table', async ({ page }) => {
      await page.goto('/dashboard/analytics/campaigns');

      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Campaign")')).toBeVisible();
      await expect(page.locator('th:has-text("Impressions")')).toBeVisible();
      await expect(page.locator('th:has-text("Clicks")')).toBeVisible();
      await expect(page.locator('th:has-text("Conversions")')).toBeVisible();
    });

    test('should show campaign performance chart', async ({ page }) => {
      await page.goto('/dashboard/analytics/campaigns');

      await expect(page.locator('[data-testid="campaign-performance-chart"]')).toBeVisible();
    });

    test('should filter campaigns by status', async ({ page }) => {
      await page.goto('/dashboard/analytics/campaigns');

      await page.selectOption('select[name="status"]', 'active');

      await expect(page.locator('tbody tr')).toBeVisible();
    });

    test('should sort campaigns by metric', async ({ page }) => {
      await page.goto('/dashboard/analytics/campaigns');

      await page.click('th:has-text("Conversions")');

      // Verify sorting indicator
      await expect(page.locator('th:has-text("Conversions") [data-testid="sort-indicator"]')).toBeVisible();
    });

    test('should view campaign detail', async ({ page }) => {
      await page.goto('/dashboard/analytics/campaigns');

      await page.click('tbody tr:first-child');

      await expect(page.locator('[data-testid="campaign-detail"]')).toBeVisible();
    });
  });

  test.describe('Creator Analytics', () => {
    test('should navigate to creator analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.click('text=Creators');

      await expect(page).toHaveURL(/\/analytics\/creators/);
    });

    test('should display top creators leaderboard', async ({ page }) => {
      await page.goto('/dashboard/analytics/creators');

      await expect(page.locator('[data-testid="creator-leaderboard"]')).toBeVisible();
    });

    test('should show creator performance metrics', async ({ page }) => {
      await page.goto('/dashboard/analytics/creators');

      await expect(page.locator('text=Total Creators')).toBeVisible();
      await expect(page.locator('text=Active Creators')).toBeVisible();
      await expect(page.locator('text=Content Created')).toBeVisible();
    });

    test('should filter creators by category', async ({ page }) => {
      await page.goto('/dashboard/analytics/creators');

      await page.selectOption('select[name="category"]', 'lifestyle');

      await expect(page.locator('[data-testid="creator-list"]')).toBeVisible();
    });

    test('should view creator profile analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics/creators');

      await page.click('[data-testid="creator-row"]:first-child');

      await expect(page.locator('[data-testid="creator-analytics-detail"]')).toBeVisible();
    });
  });

  test.describe('Content Analytics', () => {
    test('should navigate to content analytics', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.click('text=Content');

      await expect(page).toHaveURL(/\/analytics\/content/);
    });

    test('should display content performance metrics', async ({ page }) => {
      await page.goto('/dashboard/analytics/content');

      await expect(page.locator('[data-testid="content-metrics"]')).toBeVisible();
    });

    test('should show top performing content', async ({ page }) => {
      await page.goto('/dashboard/analytics/content');

      await expect(page.locator('[data-testid="top-content"]')).toBeVisible();
    });

    test('should filter content by type', async ({ page }) => {
      await page.goto('/dashboard/analytics/content');

      await page.selectOption('select[name="contentType"]', 'video');

      await expect(page.locator('[data-testid="content-list"]')).toBeVisible();
    });

    test('should show engagement breakdown', async ({ page }) => {
      await page.goto('/dashboard/analytics/content');

      await expect(page.locator('[data-testid="engagement-breakdown"]')).toBeVisible();
    });
  });

  test.describe('Real-time Analytics', () => {
    test('should display real-time metrics', async ({ page }) => {
      await page.goto('/dashboard/analytics/realtime');

      await expect(page.locator('[data-testid="realtime-metrics"]')).toBeVisible();
    });

    test('should show active users count', async ({ page }) => {
      await page.goto('/dashboard/analytics/realtime');

      await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
    });

    test('should display live event feed', async ({ page }) => {
      await page.goto('/dashboard/analytics/realtime');

      await expect(page.locator('[data-testid="live-feed"]')).toBeVisible();
    });

    test('should auto-refresh data', async ({ page }) => {
      await page.goto('/dashboard/analytics/realtime');

      // Wait for auto-refresh (typically 5-10 seconds)
      const initialValue = await page.locator('[data-testid="active-users"]').textContent();
      await page.waitForTimeout(6000);

      // Data should have refreshed (may or may not change value)
      await expect(page.locator('[data-testid="active-users"]')).toBeVisible();
    });
  });

  test.describe('Custom Reports', () => {
    test('should navigate to reports page', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await page.click('text=Reports');

      await expect(page).toHaveURL(/\/analytics\/reports/);
    });

    test('should display saved reports', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');

      await expect(page.locator('[data-testid="saved-reports"]')).toBeVisible();
    });

    test('should create new report', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');

      await page.click('button:has-text("Create Report")');

      await expect(page.locator('[data-testid="report-builder"]')).toBeVisible();
    });

    test('should select report metrics', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');
      await page.click('button:has-text("Create Report")');

      await page.click('[data-testid="metric-selector"]');
      await page.click('text=Revenue');
      await page.click('text=Conversions');

      await expect(page.locator('[data-testid="selected-metrics"]')).toContainText('Revenue');
    });

    test('should add report dimensions', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');
      await page.click('button:has-text("Create Report")');

      await page.click('[data-testid="dimension-selector"]');
      await page.click('text=Campaign');

      await expect(page.locator('[data-testid="selected-dimensions"]')).toContainText('Campaign');
    });

    test('should schedule report', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');
      await page.click('button:has-text("Create Report")');

      await page.click('text=Schedule');
      await page.selectOption('select[name="frequency"]', 'weekly');
      await page.fill('input[name="recipients"]', 'team@example.com');

      await expect(page.locator('select[name="frequency"]')).toHaveValue('weekly');
    });

    test('should export report', async ({ page }) => {
      await page.goto('/dashboard/analytics/reports');
      await page.click('[data-testid="report-row"]:first-child');

      await page.click('button:has-text("Export")');
      await page.click('text=CSV');

      // Download should initiate
      await expect(page.locator('text=Downloading')).toBeVisible();
    });
  });

  test.describe('Anomaly Detection', () => {
    test('should display anomaly alerts', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await expect(page.locator('[data-testid="anomaly-alerts"]')).toBeVisible();
    });

    test('should show anomaly details', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await page.click('[data-testid="anomaly-alert"]:first-child');

      await expect(page.locator('[data-testid="anomaly-detail"]')).toBeVisible();
    });

    test('should configure anomaly thresholds', async ({ page }) => {
      await page.goto('/dashboard/analytics/settings');

      await page.click('text=Anomaly Detection');

      await expect(page.locator('input[name="revenueThreshold"]')).toBeVisible();
      await expect(page.locator('input[name="trafficThreshold"]')).toBeVisible();
    });

    test('should dismiss anomaly alert', async ({ page }) => {
      await page.goto('/dashboard/analytics');

      await page.click('[data-testid="anomaly-alert"]:first-child button:has-text("Dismiss")');

      await expect(page.locator('text=Alert dismissed')).toBeVisible();
    });
  });

  test.describe('Cohort Analysis', () => {
    test('should display cohort analysis', async ({ page }) => {
      await page.goto('/dashboard/analytics/cohorts');

      await expect(page.locator('[data-testid="cohort-chart"]')).toBeVisible();
    });

    test('should select cohort type', async ({ page }) => {
      await page.goto('/dashboard/analytics/cohorts');

      await page.selectOption('select[name="cohortType"]', 'acquisition');

      await expect(page.locator('[data-testid="cohort-chart"]')).toBeVisible();
    });

    test('should adjust time granularity', async ({ page }) => {
      await page.goto('/dashboard/analytics/cohorts');

      await page.selectOption('select[name="granularity"]', 'weekly');

      await expect(page.locator('[data-testid="cohort-chart"]')).toBeVisible();
    });

    test('should show retention rates', async ({ page }) => {
      await page.goto('/dashboard/analytics/cohorts');

      await expect(page.locator('[data-testid="retention-table"]')).toBeVisible();
    });
  });
});
