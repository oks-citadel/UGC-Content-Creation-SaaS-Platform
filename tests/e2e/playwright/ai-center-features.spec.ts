// =============================================================================
// E2E Tests - AI Center Features
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('AI Center Features', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('AI Center Dashboard', () => {
    test('should display AI Center dashboard', async ({ page }) => {
      await page.goto('/dashboard/ai-center');

      await expect(page.locator('h1')).toContainText('AI Center');
      await expect(page.locator('[data-testid="ai-stats"]')).toBeVisible();
    });

    test('should show all AI agents status', async ({ page }) => {
      await page.goto('/dashboard/ai-center');

      // Check for agent cards
      await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(6);

      // Verify agent types are displayed
      await expect(page.locator('text=Marketing Agent')).toBeVisible();
      await expect(page.locator('text=Customer Agent')).toBeVisible();
      await expect(page.locator('text=Content AI')).toBeVisible();
    });

    test('should display AI usage metrics', async ({ page }) => {
      await page.goto('/dashboard/ai-center');

      await expect(page.locator('[data-testid="total-requests"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-rate"]')).toBeVisible();
      await expect(page.locator('[data-testid="avg-response-time"]')).toBeVisible();
    });

    test('should show recent AI activity', async ({ page }) => {
      await page.goto('/dashboard/ai-center');

      await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
    });
  });

  test.describe('Marketing Agent', () => {
    test('should navigate to Marketing Agent page', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Marketing Agent');

      await expect(page).toHaveURL(/\/ai-center\/marketing-agent/);
      await expect(page.locator('h1')).toContainText('Marketing Agent');
    });

    test('should display chat interface', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');

      await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
      await expect(page.locator('textarea[placeholder*="message"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should send message to Marketing Agent', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');

      const messageInput = page.locator('textarea[placeholder*="message"]');
      await messageInput.fill('Create a campaign for summer sale');
      await page.click('button[type="submit"]');

      // Wait for response
      await expect(page.locator('[data-testid="ai-response"]')).toBeVisible({ timeout: 30000 });
    });

    test('should show campaign builder tab', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');

      await page.click('text=Campaign Builder');
      await expect(page.locator('[data-testid="campaign-builder"]')).toBeVisible();
    });

    test('should show flow builder tab', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');

      await page.click('text=Flow Builder');
      await expect(page.locator('[data-testid="flow-builder"]')).toBeVisible();
    });

    test('should show segment builder tab', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');

      await page.click('text=Segment Builder');
      await expect(page.locator('[data-testid="segment-builder"]')).toBeVisible();
    });

    test('should generate campaign from natural language', async ({ page }) => {
      await page.goto('/dashboard/ai-center/marketing-agent');
      await page.click('text=Campaign Builder');

      const goalInput = page.locator('textarea[placeholder*="goal"]');
      await goalInput.fill('Increase summer product sales by 20% targeting millennials');
      await page.click('button:has-text("Generate Campaign")');

      // Wait for campaign generation
      await expect(page.locator('[data-testid="generated-campaign"]')).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('Customer Agent', () => {
    test('should navigate to Customer Agent page', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Customer Agent');

      await expect(page).toHaveURL(/\/ai-center\/customer-agent/);
    });

    test('should display support chat interface', async ({ page }) => {
      await page.goto('/dashboard/ai-center/customer-agent');

      await expect(page.locator('[data-testid="support-chat"]')).toBeVisible();
    });

    test('should show handoff queue', async ({ page }) => {
      await page.goto('/dashboard/ai-center/customer-agent');

      await page.click('text=Handoff Queue');
      await expect(page.locator('[data-testid="handoff-queue"]')).toBeVisible();
    });

    test('should display lead qualification panel', async ({ page }) => {
      await page.goto('/dashboard/ai-center/customer-agent');

      await page.click('text=Lead Qualification');
      await expect(page.locator('[data-testid="lead-qualification"]')).toBeVisible();
    });
  });

  test.describe('Content AI', () => {
    test('should navigate to Content AI page', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Content AI');

      await expect(page).toHaveURL(/\/ai-center\/content-ai/);
    });

    test('should display content generation interface', async ({ page }) => {
      await page.goto('/dashboard/ai-center/content-ai');

      await expect(page.locator('[data-testid="content-generator"]')).toBeVisible();
    });

    test('should show moderation queue', async ({ page }) => {
      await page.goto('/dashboard/ai-center/content-ai');

      await page.click('text=Moderation');
      await expect(page.locator('[data-testid="moderation-queue"]')).toBeVisible();
    });
  });

  test.describe('AI Settings', () => {
    test('should navigate to AI settings', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('button[aria-label="AI Settings"]');

      await expect(page.locator('[data-testid="ai-settings-modal"]')).toBeVisible();
    });

    test('should configure AI model preferences', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('button[aria-label="AI Settings"]');

      // Toggle model settings
      await expect(page.locator('text=Model Configuration')).toBeVisible();
      await expect(page.locator('select[name="defaultModel"]')).toBeVisible();
    });

    test('should set response tone preferences', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('button[aria-label="AI Settings"]');

      await expect(page.locator('text=Response Tone')).toBeVisible();
      await expect(page.locator('select[name="tone"]')).toBeVisible();
    });
  });

  test.describe('AI Usage Analytics', () => {
    test('should display usage charts', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Analytics');

      await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
    });

    test('should show cost breakdown', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Analytics');

      await expect(page.locator('[data-testid="cost-breakdown"]')).toBeVisible();
    });

    test('should filter by date range', async ({ page }) => {
      await page.goto('/dashboard/ai-center');
      await page.click('text=Analytics');

      await page.click('[data-testid="date-range-picker"]');
      await page.click('text=Last 7 days');

      await expect(page.locator('[data-testid="usage-chart"]')).toBeVisible();
    });
  });
});
