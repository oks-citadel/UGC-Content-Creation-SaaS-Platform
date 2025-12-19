// =============================================================================
// E2E Tests: Billing and Subscription Management
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Brand Subscription Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as brand
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/brand\/dashboard/);
  });

  test('view current subscription', async ({ page }) => {
    await page.goto('/brand/settings/billing');

    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('[data-testid="plan-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-price"]')).toBeVisible();
    await expect(page.locator('[data-testid="billing-cycle"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
  });

  test('upgrade subscription plan', async ({ page }) => {
    await page.goto('/brand/settings/billing');
    await page.click('text=Upgrade Plan');

    await expect(page.locator('text=Choose Your Plan')).toBeVisible();

    // Select Pro plan
    await page.click('[data-plan="pro"]');
    await page.click('text=Continue');

    // Payment confirmation
    await expect(page.locator('text=Confirm Upgrade')).toBeVisible();
    await expect(page.locator('text=Pro Plan - $1,999/month')).toBeVisible();

    // Confirm
    await page.click('text=Confirm Upgrade');

    await expect(page.locator('text=Subscription upgraded')).toBeVisible();
    await expect(page.locator('[data-testid="plan-name"]')).toContainText('Pro');
  });

  test('downgrade subscription plan', async ({ page }) => {
    await page.goto('/brand/settings/billing');
    await page.click('text=Change Plan');

    // Select lower tier
    await page.click('[data-plan="starter"]');
    await page.click('text=Continue');

    // Downgrade warning
    await expect(page.locator('text=Downgrade Warning')).toBeVisible();
    await expect(page.locator('text=You may lose access to some features')).toBeVisible();

    // Confirm downgrade
    await page.check('[name="confirmDowngrade"]');
    await page.click('text=Confirm Downgrade');

    await expect(page.locator('text=Plan will change at end of billing period')).toBeVisible();
  });

  test('update payment method', async ({ page }) => {
    await page.goto('/brand/settings/billing');
    await page.click('text=Update Payment Method');

    // Stripe Elements iframe
    const stripeFrame = page.frameLocator('iframe[name*="stripe"]');

    await stripeFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
    await stripeFrame.locator('[placeholder="MM / YY"]').fill('12/28');
    await stripeFrame.locator('[placeholder="CVC"]').fill('123');
    await stripeFrame.locator('[placeholder="ZIP"]').fill('12345');

    await page.click('text=Save Card');

    await expect(page.locator('text=Payment method updated')).toBeVisible();
    await expect(page.locator('text=•••• 4242')).toBeVisible();
  });

  test('view billing history', async ({ page }) => {
    await page.goto('/brand/settings/billing/history');

    await expect(page.locator('text=Billing History')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-row"]')).toHaveCount.greaterThan(0);

    // Download invoice
    await page.click('[data-testid="invoice-row"]:first-child [data-testid="download-invoice"]');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('view usage and limits', async ({ page }) => {
    await page.goto('/brand/settings/billing/usage');

    await expect(page.locator('text=Usage This Period')).toBeVisible();
    await expect(page.locator('[data-testid="campaigns-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="creators-used"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-used"]')).toBeVisible();

    // Check progress bars
    await expect(page.locator('[data-testid="usage-bar"]')).toHaveCount(3);
  });

  test('cancel subscription', async ({ page }) => {
    await page.goto('/brand/settings/billing');
    await page.click('text=Cancel Subscription');

    await expect(page.locator('text=We\'re sorry to see you go')).toBeVisible();

    // Select cancellation reason
    await page.selectOption('[name="cancellationReason"]', 'too-expensive');
    await page.fill('[name="feedback"]', 'The pricing is above our budget.');

    // Confirm cancellation
    await page.click('text=Cancel Subscription');

    await expect(page.locator('text=Subscription cancelled')).toBeVisible();
    await expect(page.locator('text=Access until')).toBeVisible();
  });

  test('reactivate cancelled subscription', async ({ page }) => {
    await page.goto('/brand/settings/billing');

    // If subscription is cancelled
    await expect(page.locator('text=Your subscription is cancelled')).toBeVisible();
    await page.click('text=Reactivate');

    await expect(page.locator('text=Subscription reactivated')).toBeVisible();
  });

  test('apply coupon code', async ({ page }) => {
    await page.goto('/brand/settings/billing');
    await page.click('text=Add Coupon');

    await page.fill('[name="couponCode"]', 'SAVE20');
    await page.click('text=Apply');

    await expect(page.locator('text=Coupon applied')).toBeVisible();
    await expect(page.locator('[data-testid="discount-amount"]')).toBeVisible();
  });
});

test.describe('Enterprise Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'enterprise@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
  });

  test('view enterprise invoice', async ({ page }) => {
    await page.goto('/brand/settings/billing');

    await expect(page.locator('text=Enterprise Plan')).toBeVisible();
    await expect(page.locator('text=Invoice Billing')).toBeVisible();
    await expect(page.locator('[data-testid="net-terms"]')).toBeVisible();
  });

  test('request usage report', async ({ page }) => {
    await page.goto('/brand/settings/billing/reports');

    await page.selectOption('[name="reportType"]', 'detailed-usage');
    await page.fill('[name="startDate"]', '2024-01-01');
    await page.fill('[name="endDate"]', '2024-12-31');
    await page.click('text=Generate Report');

    await expect(page.locator('text=Report generated')).toBeVisible();

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });
});

test.describe('Creator Earnings & Payouts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/creator\/dashboard/);
  });

  test('view earnings dashboard', async ({ page }) => {
    await page.goto('/creator/earnings');

    await expect(page.locator('text=Your Earnings')).toBeVisible();
    await expect(page.locator('[data-testid="available-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-balance"]')).toBeVisible();
    await expect(page.locator('[data-testid="lifetime-earnings"]')).toBeVisible();
  });

  test('view earnings breakdown', async ({ page }) => {
    await page.goto('/creator/earnings');

    await page.click('text=View Breakdown');

    await expect(page.locator('[data-testid="earnings-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-by-campaign"]')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-by-content-type"]')).toBeVisible();
  });

  test('request payout', async ({ page }) => {
    await page.goto('/creator/earnings');

    await page.click('text=Request Payout');

    await expect(page.locator('text=Request Payout')).toBeVisible();
    await expect(page.locator('[data-testid="available-amount"]')).toBeVisible();

    // Enter amount
    await page.fill('[name="amount"]', '500');

    // Select payout method
    await page.selectOption('[name="payoutMethod"]', 'stripe');

    await page.click('text=Request Payout');

    await expect(page.locator('text=Payout requested')).toBeVisible();
    await expect(page.locator('text=Processing typically takes 2-3 business days')).toBeVisible();
  });

  test('setup payout method', async ({ page }) => {
    await page.goto('/creator/settings/payout');

    await expect(page.locator('text=Payout Methods')).toBeVisible();

    // Add bank account
    await page.click('text=Add Bank Account');
    await page.fill('[name="accountHolder"]', 'Jane Creator');
    await page.fill('[name="routingNumber"]', '110000000');
    await page.fill('[name="accountNumber"]', '000123456789');
    await page.selectOption('[name="accountType"]', 'checking');

    await page.click('text=Add Account');

    await expect(page.locator('text=Bank account added')).toBeVisible();
  });

  test('view payout history', async ({ page }) => {
    await page.goto('/creator/earnings/history');

    await expect(page.locator('text=Payout History')).toBeVisible();
    await expect(page.locator('[data-testid="payout-row"]')).toHaveCount.greaterThan(0);

    // View payout details
    await page.click('[data-testid="payout-row"]:first-child');
    await expect(page.locator('text=Payout Details')).toBeVisible();
    await expect(page.locator('[data-testid="payout-status"]')).toBeVisible();
  });

  test('download tax documents', async ({ page }) => {
    await page.goto('/creator/settings/tax');

    await expect(page.locator('text=Tax Documents')).toBeVisible();

    // Download 1099
    if (await page.locator('[data-testid="1099-available"]').isVisible()) {
      await page.click('text=Download 1099');
      const download = await page.waitForEvent('download');
      expect(download.suggestedFilename()).toContain('1099');
    }
  });

  test('submit W-9 form', async ({ page }) => {
    await page.goto('/creator/settings/tax');

    await page.click('text=Submit W-9');

    // Fill W-9 form
    await page.fill('[name="legalName"]', 'Jane Marie Creator');
    await page.fill('[name="businessName"]', '');
    await page.selectOption('[name="taxClassification"]', 'individual');
    await page.fill('[name="address"]', '123 Creator Lane');
    await page.fill('[name="city"]', 'Los Angeles');
    await page.selectOption('[name="state"]', 'CA');
    await page.fill('[name="zip"]', '90001');
    await page.fill('[name="ssn"]', '***-**-1234'); // Masked input

    // Sign
    await page.check('[name="certifyAccurate"]');
    await page.fill('[name="signature"]', 'Jane Creator');

    await page.click('text=Submit W-9');

    await expect(page.locator('text=W-9 submitted')).toBeVisible();
  });
});

test.describe('Payment Processing', () => {
  test('handle failed payment', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand-failed-payment@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    // Should see payment failed banner
    await expect(page.locator('text=Payment failed')).toBeVisible();
    await expect(page.locator('text=Update payment method')).toBeVisible();

    await page.click('text=Update payment method');
    await expect(page).toHaveURL(/\/brand\/settings\/billing/);
  });

  test('handle subscription past due', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'brand-past-due@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    // Should see past due warning
    await expect(page.locator('text=Your account is past due')).toBeVisible();
    await expect(page.locator('text=limited functionality')).toBeVisible();
  });
});
