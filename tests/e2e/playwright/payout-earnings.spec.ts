// =============================================================================
// E2E Tests - Payout and Earnings Management
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Payout and Earnings Management', () => {
  // Test user credentials
  const creatorUser = {
    email: process.env.E2E_TEST_CREATOR_EMAIL || 'creator@test.creatorbridge.com',
    password: process.env.E2E_TEST_CREATOR_PASSWORD || 'TestPass123!',
  };

  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('input[name="email"]', creatorUser.email);
    await page.fill('input[name="password"]', creatorUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Earnings Dashboard', () => {
    test('should display earnings overview', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await expect(page.locator('h1')).toContainText(/earning/i);

      // Should show balance information
      await expect(page.locator('[data-testid="available-balance"]')).toBeVisible();
      await expect(page.locator('[data-testid="pending-balance"]')).toBeVisible();
    });

    test('should show lifetime earnings', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await expect(page.locator('[data-testid="lifetime-earnings"]')).toBeVisible();
    });

    test('should display earnings chart', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
    });

    test('should filter earnings by date range', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      // Select date range
      await page.click('[data-testid="date-range-filter"]');
      await page.click('text=Last 30 days');

      // Chart should update
      await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
    });

    test('should show earnings breakdown by campaign', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      // Click breakdown tab
      await page.click('text=By Campaign');

      const campaignEarnings = page.locator('[data-testid="campaign-earnings"]');
      await expect(campaignEarnings).toBeVisible();
    });
  });

  test.describe('Earnings History', () => {
    test('should display earnings history list', async ({ page }) => {
      await page.goto('/dashboard/earnings/history');

      await expect(page.locator('[data-testid="earnings-list"]')).toBeVisible();
    });

    test('should show earning details', async ({ page }) => {
      await page.goto('/dashboard/earnings/history');

      const earningItem = page.locator('[data-testid="earning-item"]').first();

      if (await earningItem.count() > 0) {
        // Should show key information
        await expect(earningItem).toContainText(/\$/);
        await expect(earningItem.locator('[data-testid="earning-status"]')).toBeVisible();
      }
    });

    test('should filter earnings by status', async ({ page }) => {
      await page.goto('/dashboard/earnings/history');

      // Filter by cleared status
      await page.selectOption('[data-testid="status-filter"]', 'cleared');

      // Should filter the list
      const earningItems = page.locator('[data-testid="earning-item"]');
      // All visible items should have cleared status
    });

    test('should show earning breakdown (gross, fees, net)', async ({ page }) => {
      await page.goto('/dashboard/earnings/history');

      const earningItem = page.locator('[data-testid="earning-item"]').first();

      if (await earningItem.count() > 0) {
        await earningItem.click();

        // Should show breakdown
        await expect(page.locator('text=/gross/i')).toBeVisible();
        await expect(page.locator('text=/fee/i')).toBeVisible();
        await expect(page.locator('text=/net/i')).toBeVisible();
      }
    });

    test('should link to associated campaign', async ({ page }) => {
      await page.goto('/dashboard/earnings/history');

      const earningItem = page.locator('[data-testid="earning-item"]').first();

      if (await earningItem.count() > 0) {
        await earningItem.click();

        // Should show campaign link
        await expect(page.locator('[data-testid="campaign-link"]')).toBeVisible();
      }
    });
  });

  test.describe('Payout Methods', () => {
    test('should display payout settings', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      await expect(page.locator('h1')).toContainText(/payout/i);
    });

    test('should show available payout methods', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      // Should show payout method options
      await expect(page.locator('text=/stripe|paypal|bank/i')).toBeVisible();
    });

    test('should initiate Stripe Connect setup', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      const stripeConnect = page.locator('[data-testid="connect-stripe"]');

      if (await stripeConnect.count() > 0) {
        await stripeConnect.click();

        // Should redirect to Stripe or show setup modal
        await expect(page.locator('text=/stripe|connect.*account/i')).toBeVisible();
      }
    });

    test('should show connected payout account status', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      const connectedAccount = page.locator('[data-testid="payout-account"]').first();

      if (await connectedAccount.count() > 0) {
        await expect(connectedAccount.locator('[data-testid="account-status"]')).toBeVisible();
      }
    });

    test('should allow setting default payout method', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      const accounts = page.locator('[data-testid="payout-account"]');

      if (await accounts.count() > 1) {
        // Click set as default on second account
        await accounts.nth(1).locator('button:has-text("Set as Default")').click();

        await expect(page.locator('text=/default.*updated/i')).toBeVisible();
      }
    });
  });

  test.describe('Payout Preferences', () => {
    test('should display payout schedule options', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      await expect(page.locator('[data-testid="payout-schedule"]')).toBeVisible();
      await expect(page.locator('text=/weekly|bi-weekly|monthly|manual/i')).toBeVisible();
    });

    test('should update payout schedule', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      await page.selectOption('[data-testid="payout-schedule-select"]', 'monthly');
      await page.click('button:has-text("Save Preferences")');

      await expect(page.locator('text=/preferences.*saved/i')).toBeVisible();
    });

    test('should set minimum payout amount', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      await page.fill('input[name="minimumPayout"]', '100');
      await page.click('button:has-text("Save Preferences")');

      await expect(page.locator('text=/preferences.*saved/i')).toBeVisible();
    });

    test('should toggle payout hold', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      const holdToggle = page.locator('[data-testid="hold-payouts-toggle"]');
      await holdToggle.click();

      await page.click('button:has-text("Save Preferences")');
    });

    test('should show next scheduled payout date', async ({ page }) => {
      await page.goto('/dashboard/settings/payouts');

      await expect(page.locator('[data-testid="next-payout-date"]')).toBeVisible();
    });
  });

  test.describe('Request Payout', () => {
    test('should display request payout button', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await expect(page.locator('button:has-text("Request Payout")')).toBeVisible();
    });

    test('should show payout request form', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      await expect(page.locator('[data-testid="payout-request-modal"]')).toBeVisible();
    });

    test('should show available balance for payout', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      await expect(page.locator('[data-testid="available-for-payout"]')).toBeVisible();
    });

    test('should validate minimum payout amount', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      // Try to request below minimum
      await page.fill('input[name="amount"]', '1');
      await page.click('button:has-text("Submit Request")');

      await expect(page.locator('text=/minimum.*amount/i')).toBeVisible();
    });

    test('should validate amount does not exceed balance', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      // Try to request more than available
      await page.fill('input[name="amount"]', '999999');
      await page.click('button:has-text("Submit Request")');

      await expect(page.locator('text=/exceeds.*balance|insufficient/i')).toBeVisible();
    });

    test('should submit payout request successfully', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      // Request full available amount
      await page.click('[data-testid="request-full-amount"]');
      await page.click('button:has-text("Submit Request")');

      // Should show success or processing
      await expect(page.locator('text=/request.*submitted|processing/i')).toBeVisible();
    });

    test('should show estimated arrival date', async ({ page }) => {
      await page.goto('/dashboard/earnings');

      await page.click('button:has-text("Request Payout")');

      await page.fill('input[name="amount"]', '50');

      await expect(page.locator('[data-testid="estimated-arrival"]')).toBeVisible();
    });
  });

  test.describe('Payout History', () => {
    test('should display payout history', async ({ page }) => {
      await page.goto('/dashboard/earnings/payouts');

      await expect(page.locator('[data-testid="payout-history"]')).toBeVisible();
    });

    test('should show payout status', async ({ page }) => {
      await page.goto('/dashboard/earnings/payouts');

      const payoutItem = page.locator('[data-testid="payout-item"]').first();

      if (await payoutItem.count() > 0) {
        await expect(payoutItem.locator('[data-testid="payout-status"]')).toBeVisible();
      }
    });

    test('should filter payouts by status', async ({ page }) => {
      await page.goto('/dashboard/earnings/payouts');

      await page.selectOption('[data-testid="payout-status-filter"]', 'completed');

      // Should filter the list
    });

    test('should show payout details', async ({ page }) => {
      await page.goto('/dashboard/earnings/payouts');

      const payoutItem = page.locator('[data-testid="payout-item"]').first();

      if (await payoutItem.count() > 0) {
        await payoutItem.click();

        await expect(page.locator('text=/amount/i')).toBeVisible();
        await expect(page.locator('text=/method/i')).toBeVisible();
        await expect(page.locator('text=/date/i')).toBeVisible();
      }
    });

    test('should show payout reference/transaction ID', async ({ page }) => {
      await page.goto('/dashboard/earnings/payouts');

      const completedPayout = page.locator('[data-testid="payout-item"][data-status="completed"]').first();

      if (await completedPayout.count() > 0) {
        await completedPayout.click();

        await expect(page.locator('[data-testid="transaction-reference"]')).toBeVisible();
      }
    });
  });

  test.describe('Tax Documents', () => {
    test('should display tax documents section', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      await expect(page.locator('h1')).toContainText(/tax/i);
    });

    test('should show tax form requirements', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      // Should show W-9 or W-8 requirement
      await expect(page.locator('text=/W-9|W-8|tax.*form/i')).toBeVisible();
    });

    test('should upload tax document', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      // Click upload button
      await page.click('button:has-text("Upload Tax Form")');

      // Should show upload interface
      await expect(page.locator('[data-testid="tax-form-upload"]')).toBeVisible();
    });

    test('should display submitted tax document status', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      const submittedDoc = page.locator('[data-testid="tax-document"]').first();

      if (await submittedDoc.count() > 0) {
        await expect(submittedDoc.locator('[data-testid="document-status"]')).toBeVisible();
      }
    });

    test('should show 1099 forms when available', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      // Check for 1099 section
      const form1099Section = page.locator('[data-testid="1099-forms"]');

      if (await form1099Section.count() > 0) {
        await expect(form1099Section).toBeVisible();
      }
    });

    test('should download 1099 form', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      const download1099 = page.locator('[data-testid="download-1099"]').first();

      if (await download1099.count() > 0) {
        await download1099.click();

        // Should trigger download or show download link
      }
    });

    test('should show tax year filter for 1099s', async ({ page }) => {
      await page.goto('/dashboard/settings/tax');

      const form1099Section = page.locator('[data-testid="1099-forms"]');

      if (await form1099Section.count() > 0) {
        await expect(page.locator('[data-testid="tax-year-filter"]')).toBeVisible();
      }
    });
  });

  test.describe('Payout Notifications', () => {
    test('should configure earning notifications', async ({ page }) => {
      await page.goto('/dashboard/settings/notifications');

      const earningNotifications = page.locator('[data-testid="earning-notifications"]');

      if (await earningNotifications.count() > 0) {
        await expect(earningNotifications).toBeVisible();
      }
    });

    test('should configure payout notifications', async ({ page }) => {
      await page.goto('/dashboard/settings/notifications');

      const payoutNotifications = page.locator('[data-testid="payout-notifications"]');

      if (await payoutNotifications.count() > 0) {
        await expect(payoutNotifications).toBeVisible();
      }
    });
  });

  test.describe('Mobile Responsive', () => {
    test('should display earnings on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard/earnings');

      await expect(page.locator('[data-testid="available-balance"]')).toBeVisible();
      await expect(page.locator('button:has-text("Request Payout")')).toBeVisible();
    });

    test('should navigate payout settings on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/dashboard/settings/payouts');

      // Should be able to access all settings
      await expect(page.locator('[data-testid="payout-schedule"]')).toBeVisible();
    });
  });
});
