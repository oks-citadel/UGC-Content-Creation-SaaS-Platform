// =============================================================================
// E2E Tests - Data Hub Integration
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Data Hub Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Data Hub Dashboard', () => {
    test('should display Data Hub dashboard', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('h1')).toContainText('Data Hub');
      await expect(page.locator('[data-testid="data-stats"]')).toBeVisible();
    });

    test('should show data source connections', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('[data-testid="data-sources"]')).toBeVisible();
    });

    test('should display live event feed', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('[data-testid="live-events"]')).toBeVisible();
    });

    test('should show segment overview', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('[data-testid="segments-overview"]')).toBeVisible();
    });
  });

  test.describe('Events Page', () => {
    test('should navigate to events page', async ({ page }) => {
      await page.goto('/dashboard/data-hub');
      await page.click('text=Events');

      await expect(page).toHaveURL(/\/data-hub\/events/);
      await expect(page.locator('h1')).toContainText('Events');
    });

    test('should display real-time event stream', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      await expect(page.locator('[data-testid="event-stream"]')).toBeVisible();
    });

    test('should filter events by type', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      await page.selectOption('select[name="eventType"]', 'page_view');

      // Verify filtered results
      await expect(page.locator('[data-testid="event-row"]').first()).toContainText('page_view');
    });

    test('should filter events by date range', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      await page.click('[data-testid="date-range-picker"]');
      await page.click('text=Last 24 hours');

      await expect(page.locator('[data-testid="event-stream"]')).toBeVisible();
    });

    test('should search events by user ID', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      await page.fill('input[placeholder*="Search"]', 'user_123');
      await page.keyboard.press('Enter');

      // Results should be filtered
      await expect(page.locator('[data-testid="event-stream"]')).toBeVisible();
    });

    test('should expand event details', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      await page.click('[data-testid="event-row"]:first-child');

      await expect(page.locator('[data-testid="event-details"]')).toBeVisible();
      await expect(page.locator('text=Payload')).toBeVisible();
    });

    test('should pause/resume live stream', async ({ page }) => {
      await page.goto('/dashboard/data-hub/events');

      const pauseButton = page.locator('button:has-text("Pause")');
      await pauseButton.click();

      await expect(page.locator('button:has-text("Resume")')).toBeVisible();
    });
  });

  test.describe('Profiles Page', () => {
    test('should navigate to profiles page', async ({ page }) => {
      await page.goto('/dashboard/data-hub');
      await page.click('text=Profiles');

      await expect(page).toHaveURL(/\/data-hub\/profiles/);
      await expect(page.locator('h1')).toContainText('Profiles');
    });

    test('should display profile list', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');

      await expect(page.locator('table')).toBeVisible();
      await expect(page.locator('th:has-text("Profile")')).toBeVisible();
    });

    test('should search profiles by email', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');

      await page.fill('input[placeholder*="Search"]', 'sarah');

      // Wait for search results
      await page.waitForTimeout(500);
      await expect(page.locator('tbody tr')).toHaveCount(1);
    });

    test('should filter profiles by source', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');

      await page.selectOption('select[name="source"]', 'web');

      await expect(page.locator('[data-testid="profile-row"]').first()).toBeVisible();
    });

    test('should open profile detail modal', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');

      await page.click('[data-testid="profile-row"]:first-child');

      await expect(page.locator('[data-testid="profile-modal"]')).toBeVisible();
      await expect(page.locator('text=Profile Details')).toBeVisible();
    });

    test('should display profile traits', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');
      await page.click('[data-testid="profile-row"]:first-child');

      await expect(page.locator('text=Traits')).toBeVisible();
      await expect(page.locator('text=Lifetime Value')).toBeVisible();
    });

    test('should display profile segments', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');
      await page.click('[data-testid="profile-row"]:first-child');

      await expect(page.locator('text=Segments')).toBeVisible();
    });

    test('should paginate profile list', async ({ page }) => {
      await page.goto('/dashboard/data-hub/profiles');

      await expect(page.locator('button:has-text("Next")')).toBeVisible();
      await page.click('button:has-text("Next")');

      await expect(page.locator('button:has-text("1")')).toBeVisible();
    });
  });

  test.describe('Segments Page', () => {
    test('should navigate to segments page', async ({ page }) => {
      await page.goto('/dashboard/data-hub');
      await page.click('text=Segments');

      await expect(page).toHaveURL(/\/data-hub\/segments/);
      await expect(page.locator('h1')).toContainText('Segments');
    });

    test('should display segment cards', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');

      await expect(page.locator('[data-testid="segment-card"]')).toHaveCount(6);
    });

    test('should filter segments by type', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');

      await page.selectOption('select[name="type"]', 'DYNAMIC');

      const cards = page.locator('[data-testid="segment-card"]');
      await expect(cards.first().locator('text=DYNAMIC')).toBeVisible();
    });

    test('should search segments by name', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');

      await page.fill('input[placeholder*="Search"]', 'High-Value');

      await expect(page.locator('[data-testid="segment-card"]')).toHaveCount(1);
    });

    test('should open create segment modal', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');

      await page.click('button:has-text("Create Segment")');

      await expect(page.locator('[data-testid="create-segment-modal"]')).toBeVisible();
    });

    test('should fill create segment form', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');
      await page.click('button:has-text("Create Segment")');

      await page.fill('input[placeholder*="Segment Name"]', 'Test Segment');
      await page.fill('textarea[placeholder*="Describe"]', 'Test description');
      await page.selectOption('select[name="type"]', 'DYNAMIC');

      await expect(page.locator('button:has-text("Create")')).toBeEnabled();
    });

    test('should navigate to segment detail', async ({ page }) => {
      await page.goto('/dashboard/data-hub/segments');

      await page.click('[data-testid="segment-card"]:first-child');

      await expect(page).toHaveURL(/\/data-hub\/segments\/\w+/);
    });
  });

  test.describe('Consent Page', () => {
    test('should navigate to consent page', async ({ page }) => {
      await page.goto('/dashboard/data-hub');
      await page.click('text=Consent');

      await expect(page).toHaveURL(/\/data-hub\/consent/);
      await expect(page.locator('h1')).toContainText('Consent');
    });

    test('should display consent overview', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');

      await expect(page.locator('[data-testid="consent-stats"]')).toBeVisible();
    });

    test('should show consent purposes tab', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');

      await page.click('text=Consent Purposes');
      await expect(page.locator('[data-testid="purposes-grid"]')).toBeVisible();
    });

    test('should show audit log tab', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');

      await page.click('text=Audit Log');
      await expect(page.locator('table')).toBeVisible();
    });

    test('should show compliance tab', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');

      await page.click('text=Compliance');
      await expect(page.locator('text=GDPR')).toBeVisible();
      await expect(page.locator('text=CCPA')).toBeVisible();
    });

    test('should toggle compliance region', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');
      await page.click('text=Compliance');

      const toggle = page.locator('[data-testid="gdpr-toggle"]');
      await toggle.click();

      // Toggle state should change
      await expect(toggle).toBeChecked();
    });

    test('should open add purpose modal', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');

      await page.click('button:has-text("Add Purpose")');

      await expect(page.locator('[data-testid="add-purpose-modal"]')).toBeVisible();
    });

    test('should filter audit log', async ({ page }) => {
      await page.goto('/dashboard/data-hub/consent');
      await page.click('text=Audit Log');

      await page.selectOption('select[name="action"]', 'opt_in');

      await expect(page.locator('tbody tr')).toBeVisible();
    });
  });

  test.describe('Data Integration', () => {
    test('should display connected data sources', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('[data-testid="data-source-card"]')).toBeVisible();
    });

    test('should add new data source', async ({ page }) => {
      await page.goto('/dashboard/data-hub');
      await page.click('button:has-text("Add Source")');

      await expect(page.locator('[data-testid="add-source-modal"]')).toBeVisible();
    });

    test('should show data source health status', async ({ page }) => {
      await page.goto('/dashboard/data-hub');

      await expect(page.locator('[data-testid="source-health"]')).toBeVisible();
    });
  });
});
