// =============================================================================
// E2E Tests - Flow Automation
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Flow Automation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test.describe('Workflows List', () => {
    test('should display workflows page', async ({ page }) => {
      await page.goto('/dashboard/workflows');

      await expect(page.locator('h1')).toContainText('Workflows');
      await expect(page.locator('[data-testid="workflows-list"]')).toBeVisible();
    });

    test('should show workflow cards', async ({ page }) => {
      await page.goto('/dashboard/workflows');

      await expect(page.locator('[data-testid="workflow-card"]')).toBeVisible();
    });

    test('should filter workflows by status', async ({ page }) => {
      await page.goto('/dashboard/workflows');

      await page.selectOption('select[name="status"]', 'active');

      const cards = page.locator('[data-testid="workflow-card"]');
      await expect(cards.first().locator('text=Active')).toBeVisible();
    });

    test('should search workflows by name', async ({ page }) => {
      await page.goto('/dashboard/workflows');

      await page.fill('input[placeholder*="Search"]', 'Welcome');

      await expect(page.locator('[data-testid="workflow-card"]')).toHaveCount(1);
    });

    test('should create new workflow', async ({ page }) => {
      await page.goto('/dashboard/workflows');

      await page.click('button:has-text("Create Workflow")');

      await expect(page).toHaveURL(/\/workflows\/new/);
    });
  });

  test.describe('Workflow Builder', () => {
    test('should display workflow builder', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await expect(page.locator('[data-testid="workflow-builder"]')).toBeVisible();
      await expect(page.locator('[data-testid="workflow-canvas"]')).toBeVisible();
    });

    test('should add trigger node', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Event Trigger');

      await expect(page.locator('[data-testid="trigger-node"]')).toBeVisible();
    });

    test('should configure trigger node', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Event Trigger');
      await page.click('[data-testid="trigger-node"]');

      await expect(page.locator('[data-testid="node-config-panel"]')).toBeVisible();
      await expect(page.locator('select[name="eventType"]')).toBeVisible();
    });

    test('should add action node', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      // First add trigger
      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Event Trigger');

      // Then add action
      await page.click('button:has-text("Add Action")');
      await page.click('text=Send Email');

      await expect(page.locator('[data-testid="action-node"]')).toBeVisible();
    });

    test('should connect nodes with edges', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      // Add trigger and action
      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Event Trigger');
      await page.click('button:has-text("Add Action")');
      await page.click('text=Send Email');

      // Verify connection
      await expect(page.locator('[data-testid="edge"]')).toBeVisible();
    });

    test('should add delay node', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Delay');

      await expect(page.locator('[data-testid="delay-node"]')).toBeVisible();
    });

    test('should add condition/branch node', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Condition');

      await expect(page.locator('[data-testid="condition-node"]')).toBeVisible();
    });

    test('should save workflow draft', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.fill('input[name="name"]', 'Test Workflow');
      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Manual Trigger');

      await page.click('button:has-text("Save Draft")');

      await expect(page.locator('text=Workflow saved')).toBeVisible();
    });

    test('should validate workflow before activation', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.fill('input[name="name"]', 'Invalid Workflow');

      // Try to activate without trigger
      await page.click('button:has-text("Activate")');

      await expect(page.locator('text=Workflow must have a trigger')).toBeVisible();
    });
  });

  test.describe('Trigger Types', () => {
    test('should configure event trigger', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Event Trigger');
      await page.click('[data-testid="trigger-node"]');

      await page.selectOption('select[name="eventType"]', 'user.created');

      await expect(page.locator('select[name="eventType"]')).toHaveValue('user.created');
    });

    test('should configure schedule trigger', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Schedule');
      await page.click('[data-testid="trigger-node"]');

      await expect(page.locator('input[name="cronExpression"]')).toBeVisible();
    });

    test('should configure webhook trigger', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Webhook');
      await page.click('[data-testid="trigger-node"]');

      await expect(page.locator('[data-testid="webhook-url"]')).toBeVisible();
    });

    test('should configure segment trigger', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Trigger")');
      await page.click('text=Segment Entry');
      await page.click('[data-testid="trigger-node"]');

      await expect(page.locator('select[name="segmentId"]')).toBeVisible();
    });
  });

  test.describe('Action Types', () => {
    test('should configure email action', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Send Email');
      await page.click('[data-testid="action-node"]');

      await expect(page.locator('input[name="subject"]')).toBeVisible();
      await expect(page.locator('select[name="templateId"]')).toBeVisible();
    });

    test('should configure SMS action', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Send SMS');
      await page.click('[data-testid="action-node"]');

      await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('should configure webhook action', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Call Webhook');
      await page.click('[data-testid="action-node"]');

      await expect(page.locator('input[name="url"]')).toBeVisible();
      await expect(page.locator('select[name="method"]')).toBeVisible();
    });

    test('should configure update profile action', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Update Profile');
      await page.click('[data-testid="action-node"]');

      await expect(page.locator('[data-testid="trait-editor"]')).toBeVisible();
    });

    test('should configure add to segment action', async ({ page }) => {
      await page.goto('/dashboard/workflows/new');

      await page.click('button:has-text("Add Action")');
      await page.click('text=Add to Segment');
      await page.click('[data-testid="action-node"]');

      await expect(page.locator('select[name="segmentId"]')).toBeVisible();
    });
  });

  test.describe('Workflow Simulation', () => {
    test('should open simulation panel', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');

      await page.click('button:has-text("Simulate")');

      await expect(page.locator('[data-testid="simulation-panel"]')).toBeVisible();
    });

    test('should run dry-run simulation', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('button:has-text("Simulate")');

      await page.fill('textarea[name="testData"]', '{"email": "test@example.com"}');
      await page.click('button:has-text("Run Dry-Run")');

      await expect(page.locator('[data-testid="simulation-results"]')).toBeVisible({ timeout: 30000 });
    });

    test('should display step-by-step results', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('button:has-text("Simulate")');
      await page.fill('textarea[name="testData"]', '{"email": "test@example.com"}');
      await page.click('button:has-text("Run Dry-Run")');

      await expect(page.locator('[data-testid="step-result"]')).toBeVisible({ timeout: 30000 });
    });

    test('should show simulation history', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');

      await page.click('text=Simulation History');

      await expect(page.locator('[data-testid="simulation-history"]')).toBeVisible();
    });
  });

  test.describe('Workflow Execution', () => {
    test('should activate workflow', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');

      await page.click('button:has-text("Activate")');

      await expect(page.locator('text=Workflow activated')).toBeVisible();
      await expect(page.locator('[data-testid="status-badge"]')).toContainText('Active');
    });

    test('should deactivate workflow', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');

      await page.click('button:has-text("Deactivate")');

      await expect(page.locator('text=Workflow deactivated')).toBeVisible();
      await expect(page.locator('[data-testid="status-badge"]')).toContainText('Inactive');
    });

    test('should view execution history', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');

      await page.click('text=Executions');

      await expect(page.locator('[data-testid="executions-list"]')).toBeVisible();
    });

    test('should view execution details', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Executions');
      await page.click('[data-testid="execution-row"]:first-child');

      await expect(page.locator('[data-testid="execution-detail"]')).toBeVisible();
      await expect(page.locator('[data-testid="execution-steps"]')).toBeVisible();
    });

    test('should filter executions by status', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Executions');

      await page.selectOption('select[name="status"]', 'failed');

      await expect(page.locator('[data-testid="execution-row"]').first().locator('text=Failed')).toBeVisible();
    });

    test('should retry failed execution', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Executions');
      await page.click('[data-testid="execution-row"]:first-child');

      await page.click('button:has-text("Retry")');

      await expect(page.locator('text=Execution retried')).toBeVisible();
    });
  });

  test.describe('Workflow Analytics', () => {
    test('should display workflow metrics', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Analytics');

      await expect(page.locator('[data-testid="workflow-metrics"]')).toBeVisible();
    });

    test('should show success rate chart', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Analytics');

      await expect(page.locator('[data-testid="success-rate-chart"]')).toBeVisible();
    });

    test('should show execution time trends', async ({ page }) => {
      await page.goto('/dashboard/workflows/123');
      await page.click('text=Analytics');

      await expect(page.locator('[data-testid="execution-time-chart"]')).toBeVisible();
    });
  });
});
