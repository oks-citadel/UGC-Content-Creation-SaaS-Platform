// =============================================================================
// E2E Tests: Content Moderation Flow
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Content Upload and Moderation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/creator\/dashboard/);
  });

  test('upload content for campaign submission', async ({ page }) => {
    // Navigate to active campaign
    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/campaign-content.jpg');

    // Wait for upload and processing
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });

    // Add caption and hashtags
    await page.fill('[name="caption"]', 'Loving this summer collection! Perfect for beach days. ☀️');
    await page.fill('[name="hashtags"]', '#SummerVibes #BeachDay #Sponsored');

    // Submit for review
    await page.click('text=Submit for Review');

    await expect(page.locator('text=Content submitted')).toBeVisible();
    await expect(page.locator('text=Pending moderation')).toBeVisible();
  });

  test('upload video content with thumbnail', async ({ page }) => {
    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    // Upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/campaign-video.mp4');

    // Wait for video processing
    await expect(page.locator('text=Processing video')).toBeVisible();
    await expect(page.locator('[data-testid="video-preview"]')).toBeVisible({ timeout: 60000 });

    // Select custom thumbnail
    await page.click('text=Choose Thumbnail');
    const thumbnailInput = page.locator('[data-testid="thumbnail-input"]');
    await thumbnailInput.setInputFiles('tests/fixtures/video-thumbnail.jpg');

    await expect(page.locator('[data-testid="thumbnail-preview"]')).toBeVisible();

    // Add metadata
    await page.fill('[name="caption"]', 'Check out my unboxing video! 📦');
    await page.click('text=Submit for Review');

    await expect(page.locator('text=Content submitted')).toBeVisible();
  });

  test('content flagged by moderation', async ({ page }) => {
    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    // Upload potentially problematic content
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/flagged-content.jpg');

    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });

    await page.fill('[name="caption"]', 'Test content with issues');
    await page.click('text=Submit for Review');

    // Wait for moderation result
    await expect(page.locator('text=Content flagged for review')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Our team will review this content')).toBeVisible();
  });

  test('view moderation status', async ({ page }) => {
    await page.goto('/creator/content');

    // Check different statuses
    await expect(page.locator('[data-status="pending"]')).toBeVisible();
    await expect(page.locator('[data-status="approved"]')).toBeVisible();
    await expect(page.locator('[data-status="rejected"]')).toBeVisible();

    // View details of rejected content
    await page.click('[data-status="rejected"]:first-child');
    await expect(page.locator('text=Rejection Reason')).toBeVisible();
    await expect(page.locator('[data-testid="rejection-details"]')).toBeVisible();
  });

  test('resubmit rejected content', async ({ page }) => {
    await page.goto('/creator/content');
    await page.click('[data-status="rejected"]:first-child');

    // Edit and resubmit
    await page.click('text=Edit & Resubmit');
    await page.fill('[name="caption"]', 'Updated caption that meets guidelines');

    // Replace image if needed
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/updated-content.jpg');

    await page.click('text=Resubmit');
    await expect(page.locator('text=Content resubmitted')).toBeVisible();
  });
});

test.describe('Admin Moderation Queue', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@creatorbridge.com');
    await page.fill('[name="password"]', 'AdminPassword123!');
    await page.click('text=Sign In');
    await page.waitForURL(/\/admin\/dashboard/);
  });

  test('view moderation queue', async ({ page }) => {
    await page.goto('/admin/moderation');

    await expect(page.locator('text=Moderation Queue')).toBeVisible();
    await expect(page.locator('[data-testid="queue-count"]')).toBeVisible();

    // Check queue items
    await expect(page.locator('[data-testid="moderation-item"]')).toHaveCount.greaterThan(0);
  });

  test('approve content in queue', async ({ page }) => {
    await page.goto('/admin/moderation');

    // Open first item
    await page.click('[data-testid="moderation-item"]:first-child');

    // View content details
    await expect(page.locator('[data-testid="content-preview"]')).toBeVisible();
    await expect(page.locator('text=Creator:')).toBeVisible();
    await expect(page.locator('text=Campaign:')).toBeVisible();

    // View AI moderation results
    await expect(page.locator('text=AI Analysis')).toBeVisible();
    await expect(page.locator('[data-testid="safety-score"]')).toBeVisible();

    // Approve
    await page.click('text=Approve');
    await expect(page.locator('text=Content approved')).toBeVisible();
  });

  test('reject content with reason', async ({ page }) => {
    await page.goto('/admin/moderation');
    await page.click('[data-testid="moderation-item"]:first-child');

    // Reject with reason
    await page.click('text=Reject');
    await page.selectOption('[name="rejectionCategory"]', 'inappropriate-content');
    await page.fill('[name="rejectionDetails"]', 'Content contains elements not suitable for the campaign brand guidelines.');
    await page.check('[name="notifyCreator"]');
    await page.click('text=Confirm Rejection');

    await expect(page.locator('text=Content rejected')).toBeVisible();
  });

  test('escalate content for review', async ({ page }) => {
    await page.goto('/admin/moderation');
    await page.click('[data-testid="moderation-item"]:first-child');

    // Escalate
    await page.click('text=Escalate');
    await page.selectOption('[name="escalateTo"]', 'senior-moderator');
    await page.fill('[name="escalationReason"]', 'Need senior review - borderline case');
    await page.click('text=Submit Escalation');

    await expect(page.locator('text=Content escalated')).toBeVisible();
  });

  test('bulk approve content', async ({ page }) => {
    await page.goto('/admin/moderation');

    // Select multiple items
    await page.check('[data-testid="moderation-item"]:nth-child(1) input[type="checkbox"]');
    await page.check('[data-testid="moderation-item"]:nth-child(2) input[type="checkbox"]');
    await page.check('[data-testid="moderation-item"]:nth-child(3) input[type="checkbox"]');

    // Bulk approve
    await page.click('text=Bulk Actions');
    await page.click('text=Approve Selected');
    await page.click('text=Confirm');

    await expect(page.locator('text=3 items approved')).toBeVisible();
  });

  test('filter moderation queue', async ({ page }) => {
    await page.goto('/admin/moderation');

    // Filter by campaign
    await page.selectOption('[name="filterCampaign"]', 'summer-campaign-2024');
    await expect(page.locator('[data-testid="moderation-item"]')).toHaveCount.greaterThan(0);

    // Filter by AI flag
    await page.selectOption('[name="filterAiFlag"]', 'high-risk');
    await expect(page.locator('[data-testid="high-risk-badge"]')).toBeVisible();

    // Filter by content type
    await page.selectOption('[name="filterType"]', 'video');
    await expect(page.locator('[data-testid="video-icon"]')).toBeVisible();
  });

  test('view moderation history', async ({ page }) => {
    await page.goto('/admin/moderation/history');

    await expect(page.locator('text=Moderation History')).toBeVisible();
    await expect(page.locator('[data-testid="history-item"]')).toHaveCount.greaterThan(0);

    // View specific action
    await page.click('[data-testid="history-item"]:first-child');
    await expect(page.locator('text=Moderated by:')).toBeVisible();
    await expect(page.locator('text=Action:')).toBeVisible();
    await expect(page.locator('text=Timestamp:')).toBeVisible();
  });

  test('appeal rejected content', async ({ page }) => {
    // Switch to creator view
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/content');
    await page.click('[data-status="rejected"]:first-child');

    // Submit appeal
    await page.click('text=Appeal Decision');
    await page.fill('[name="appealReason"]', 'I believe this content follows all guidelines. The flagged element is part of the brand\'s official campaign materials.');
    await page.click('text=Submit Appeal');

    await expect(page.locator('text=Appeal submitted')).toBeVisible();
    await expect(page.locator('text=Under review')).toBeVisible();
  });
});

test.describe('Automated Moderation', () => {
  test('verify NSFW detection', async ({ page }) => {
    // Login as creator
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    // Upload content that should be auto-rejected
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/nsfw-test.jpg');

    await expect(page.locator('text=Content automatically rejected')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=violates community guidelines')).toBeVisible();
  });

  test('verify brand safety check', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/brand-safe-content.jpg');

    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });

    // Check brand safety score
    await expect(page.locator('[data-testid="brand-safety-score"]')).toBeVisible();
    await expect(page.locator('[data-testid="brand-safety-score"]')).toContainText(/[89][0-9]|100/);
  });

  test('verify text content moderation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'creator@test.com');
    await page.fill('[name="password"]', 'TestPassword123!');
    await page.click('text=Sign In');

    await page.goto('/creator/campaigns/active-campaign-id');
    await page.click('text=Submit Content');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/clean-content.jpg');

    await expect(page.locator('[data-testid="upload-complete"]')).toBeVisible({ timeout: 30000 });

    // Add caption with problematic language
    await page.fill('[name="caption"]', 'Test caption with inappropriate words');
    await page.click('text=Submit for Review');

    // Should flag for text review
    await expect(page.locator('text=Caption flagged for review')).toBeVisible();
  });
});
