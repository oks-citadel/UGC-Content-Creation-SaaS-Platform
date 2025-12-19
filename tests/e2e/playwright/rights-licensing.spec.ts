// =============================================================================
// E2E Tests - Rights and Licensing Management
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Rights and Licensing Management', () => {
  // Test user credentials
  const brandUser = {
    email: process.env.E2E_TEST_BRAND_EMAIL || 'brand@test.creatorbridge.com',
    password: process.env.E2E_TEST_BRAND_PASSWORD || 'TestPass123!',
  };

  const creatorUser = {
    email: process.env.E2E_TEST_CREATOR_EMAIL || 'creator@test.creatorbridge.com',
    password: process.env.E2E_TEST_CREATOR_PASSWORD || 'TestPass123!',
  };

  test.describe('Brand - Rights Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Login as brand user
      await page.goto('/login');
      await page.fill('input[name="email"]', brandUser.email);
      await page.fill('input[name="password"]', brandUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should display rights management section', async ({ page }) => {
      await page.goto('/dashboard/campaigns');

      // Select a campaign
      const campaign = page.locator('[data-testid="campaign-item"]').first();
      await campaign.click();

      // Navigate to rights tab
      await page.click('text=Rights & Licensing');

      await expect(page.locator('h2')).toContainText(/rights|licensing/i);
    });

    test('should show license template options', async ({ page }) => {
      await page.goto('/dashboard/settings/license-templates');

      await expect(page.locator('text=/exclusive|non-exclusive|limited/i')).toBeVisible();
    });

    test('should create custom license template', async ({ page }) => {
      await page.goto('/dashboard/settings/license-templates');

      await page.click('button:has-text("Create Template")');

      // Fill template details
      await page.fill('input[name="templateName"]', 'Custom Social Media License');
      await page.selectOption('select[name="licenseType"]', 'non_exclusive');

      // Set default duration
      await page.fill('input[name="defaultDuration"]', '90');

      // Select platforms
      await page.click('[data-testid="platform-instagram"]');
      await page.click('[data-testid="platform-tiktok"]');

      await page.click('button:has-text("Save Template")');

      await expect(page.locator('text=/template.*created/i')).toBeVisible();
    });

    test('should configure rights for approved content', async ({ page }) => {
      await page.goto('/dashboard/content/approved');

      // Select content item
      const content = page.locator('[data-testid="content-item"]').first();
      await content.click();

      // Click configure rights
      await page.click('button:has-text("Configure Rights")');

      // Select rights type
      await page.selectOption('select[name="rightsType"]', 'exclusive');

      // Set duration
      await page.fill('input[name="startDate"]', '2024-01-01');
      await page.fill('input[name="endDate"]', '2024-12-31');

      // Select territories
      await page.click('[data-testid="territory-US"]');
      await page.click('[data-testid="territory-CA"]');

      // Select platforms
      await page.click('[data-testid="platform-all-social"]');

      await page.click('button:has-text("Save Rights")');

      await expect(page.locator('text=/rights.*configured/i')).toBeVisible();
    });

    test('should display usage restrictions options', async ({ page }) => {
      await page.goto('/dashboard/content/approved');

      const content = page.locator('[data-testid="content-item"]').first();
      await content.click();

      await page.click('button:has-text("Configure Rights")');

      // Check restriction options are available
      await expect(page.locator('text=/no editing/i')).toBeVisible();
      await expect(page.locator('text=/no derivatives/i')).toBeVisible();
      await expect(page.locator('text=/attribution required/i')).toBeVisible();
    });

    test('should set compensation terms', async ({ page }) => {
      await page.goto('/dashboard/content/approved');

      const content = page.locator('[data-testid="content-item"]').first();
      await content.click();

      await page.click('button:has-text("Configure Rights")');

      // Set compensation
      await page.selectOption('select[name="compensationType"]', 'flat_fee');
      await page.fill('input[name="amount"]', '500');
      await page.selectOption('select[name="currency"]', 'USD');

      await page.click('button:has-text("Save Rights")');
    });
  });

  test.describe('License Generation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', brandUser.email);
      await page.fill('input[name="password"]', brandUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should generate license agreement PDF', async ({ page }) => {
      await page.goto('/dashboard/rights');

      // Select a rights record
      const rights = page.locator('[data-testid="rights-item"]').first();
      await rights.click();

      // Generate license
      await page.click('button:has-text("Generate License")');

      // Select format
      await page.click('[data-testid="format-pdf"]');

      await page.click('button:has-text("Generate")');

      // Should show generation progress/success
      await expect(page.locator('text=/generating|generated/i')).toBeVisible();
    });

    test('should preview license agreement', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();
      await rights.click();

      // Preview license
      await page.click('button:has-text("Preview License")');

      // Should display license content
      await expect(page.locator('[data-testid="license-preview"]')).toBeVisible();
      await expect(page.locator('text=/license agreement/i')).toBeVisible();
    });

    test('should add custom clauses to license', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();
      await rights.click();

      await page.click('button:has-text("Generate License")');

      // Add custom clause
      await page.click('button:has-text("Add Custom Clause")');
      await page.fill('textarea[name="customClause"]', 'Content may not be used in political advertising.');
      await page.click('button:has-text("Add")');

      await expect(page.locator('text=Content may not be used in political')).toBeVisible();
    });
  });

  test.describe('Digital Signatures - Creator', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', creatorUser.email);
      await page.fill('input[name="password"]', creatorUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should display pending license agreements', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      await expect(page.locator('h1')).toContainText(/agreement|contract/i);

      // Should show pending agreements
      const pendingSection = page.locator('[data-testid="pending-agreements"]');
      await expect(pendingSection).toBeVisible();
    });

    test('should view license agreement details', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      const agreement = page.locator('[data-testid="agreement-item"]').first();

      if (await agreement.count() > 0) {
        await agreement.click();

        // Should show agreement details
        await expect(page.locator('text=/terms|conditions/i')).toBeVisible();
        await expect(page.locator('text=/duration|period/i')).toBeVisible();
        await expect(page.locator('text=/territories|regions/i')).toBeVisible();
      }
    });

    test('should display electronic signature interface', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      const agreement = page.locator('[data-testid="agreement-item"][data-status="pending"]').first();

      if (await agreement.count() > 0) {
        await agreement.click();

        // Click sign
        await page.click('button:has-text("Sign Agreement")');

        // Should show signature interface
        await expect(page.locator('[data-testid="signature-pad"]')).toBeVisible();
        await expect(page.locator('text=/draw.*signature|type.*name/i')).toBeVisible();
      }
    });

    test('should sign agreement with typed signature', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      const agreement = page.locator('[data-testid="agreement-item"][data-status="pending"]').first();

      if (await agreement.count() > 0) {
        await agreement.click();
        await page.click('button:has-text("Sign Agreement")');

        // Select typed signature
        await page.click('[data-testid="signature-type-typed"]');

        // Type name
        await page.fill('input[name="typedSignature"]', 'Test Creator');

        // Accept terms
        await page.check('input[name="acceptTerms"]');

        await page.click('button:has-text("Submit Signature")');

        await expect(page.locator('text=/signed.*successfully/i')).toBeVisible();
      }
    });

    test('should show signed agreement confirmation', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      const signedAgreement = page.locator('[data-testid="agreement-item"][data-status="signed"]').first();

      if (await signedAgreement.count() > 0) {
        await signedAgreement.click();

        // Should show signed status
        await expect(page.locator('[data-testid="signature-status"]')).toContainText(/signed/i);
        await expect(page.locator('[data-testid="signed-date"]')).toBeVisible();
      }
    });

    test('should download signed agreement', async ({ page }) => {
      await page.goto('/dashboard/agreements');

      const signedAgreement = page.locator('[data-testid="agreement-item"][data-status="signed"]').first();

      if (await signedAgreement.count() > 0) {
        await signedAgreement.click();

        // Click download
        await page.click('button:has-text("Download Signed Copy")');

        // Download should be triggered
      }
    });
  });

  test.describe('Rights Transfer', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', brandUser.email);
      await page.fill('input[name="password"]', brandUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should display transfer rights option', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"][data-status="active"]').first();

      if (await rights.count() > 0) {
        await rights.click();

        await expect(page.locator('button:has-text("Transfer Rights")')).toBeVisible();
      }
    });

    test('should initiate rights transfer', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"][data-status="active"]').first();

      if (await rights.count() > 0) {
        await rights.click();
        await page.click('button:has-text("Transfer Rights")');

        // Fill transfer details
        await page.fill('input[name="transferToEmail"]', 'partner@example.com');
        await page.selectOption('select[name="transferType"]', 'sublicense');
        await page.fill('input[name="effectiveDate"]', '2024-06-01');

        await page.click('button:has-text("Initiate Transfer")');

        await expect(page.locator('text=/transfer.*initiated|pending.*approval/i')).toBeVisible();
      }
    });

    test('should show transfer requires creator consent', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();

      if (await rights.count() > 0) {
        await rights.click();
        await page.click('button:has-text("Transfer Rights")');

        // Should show creator consent requirement
        await expect(page.locator('text=/creator.*consent|approval.*required/i')).toBeVisible();
      }
    });
  });

  test.describe('Rights History & Audit', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', brandUser.email);
      await page.fill('input[name="password"]', brandUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should display rights history', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();

      if (await rights.count() > 0) {
        await rights.click();

        // Navigate to history tab
        await page.click('text=History');

        await expect(page.locator('[data-testid="rights-history"]')).toBeVisible();
      }
    });

    test('should show audit trail entries', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();

      if (await rights.count() > 0) {
        await rights.click();
        await page.click('text=History');

        // Should show audit entries
        const historyEntries = page.locator('[data-testid="history-entry"]');

        if (await historyEntries.count() > 0) {
          await expect(historyEntries.first()).toContainText(/created|signed|modified/i);
        }
      }
    });

    test('should display expiring rights warning', async ({ page }) => {
      await page.goto('/dashboard/rights');

      // Check for expiring rights section
      const expiringSection = page.locator('[data-testid="expiring-rights"]');

      if (await expiringSection.count() > 0) {
        await expect(expiringSection).toContainText(/expir/i);
      }
    });
  });

  test.describe('Usage Tracking', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', brandUser.email);
      await page.fill('input[name="password"]', brandUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should display usage statistics', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();

      if (await rights.count() > 0) {
        await rights.click();

        // Navigate to usage tab
        await page.click('text=Usage');

        await expect(page.locator('[data-testid="usage-stats"]')).toBeVisible();
      }
    });

    test('should show platform breakdown', async ({ page }) => {
      await page.goto('/dashboard/rights');

      const rights = page.locator('[data-testid="rights-item"]').first();

      if (await rights.count() > 0) {
        await rights.click();
        await page.click('text=Usage');

        // Should show platform usage
        await expect(page.locator('text=/instagram|tiktok|facebook/i')).toBeVisible();
      }
    });
  });
});
