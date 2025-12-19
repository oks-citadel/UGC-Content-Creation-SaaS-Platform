// =============================================================================
// E2E Tests - Authentication Flows
// =============================================================================

import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  const testUser = {
    email: `e2e-test-${Date.now()}@example.com`,
    password: 'E2ETestPass123',
    firstName: 'E2E',
    lastName: 'Tester',
  };

  test.describe('User Registration', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('h1')).toContainText('Create Account');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should successfully register a new user', async ({ page }) => {
      await page.goto('/register');

      // Fill in registration form
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="firstName"]', testUser.firstName);
      await page.fill('input[name="lastName"]', testUser.lastName);

      // Submit form
      await page.click('button[type="submit"]');

      // Should redirect to dashboard or verification page
      await expect(page).toHaveURL(/\/(dashboard|verify-email)/);
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email')).toBeVisible();
    });

    test('should show validation errors for weak password', async ({ page }) => {
      await page.goto('/register');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'weak');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/password.*least 8 characters/i')).toBeVisible();
    });

    test('should show password strength indicator', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      await passwordInput.fill('weak');

      // Check for weak indicator
      await expect(page.locator('[data-testid="password-strength"]')).toContainText(/weak/i);

      // Type stronger password
      await passwordInput.fill('StrongPass123!');

      // Check for strong indicator
      await expect(page.locator('[data-testid="password-strength"]')).toContainText(/strong/i);
    });

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/register');

      const passwordInput = page.locator('input[name="password"]');
      const toggleButton = page.locator('button[aria-label="Toggle password visibility"]');

      // Initially password type
      await expect(passwordInput).toHaveAttribute('type', 'password');

      // Click toggle
      await toggleButton.click();

      // Now text type
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });
  });

  test.describe('User Login', () => {
    test.beforeEach(async ({ page }) => {
      // Register user before login tests
      await page.goto('/register');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.fill('input[name="firstName"]', testUser.firstName);
      await page.fill('input[name="lastName"]', testUser.lastName);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(dashboard|verify-email)/);

      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Logout');
    });

    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('h1')).toContainText('Sign In');
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should successfully login with correct credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should show error for incorrect password', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', 'WrongPassword123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible();
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/Invalid.*credentials/i')).toBeVisible();
    });

    test('should remember me functionality', async ({ page, context }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.check('input[name="rememberMe"]');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/\/dashboard/);

      // Check cookies
      const cookies = await context.cookies();
      const rememberMeCookie = cookies.find((c) => c.name.includes('remember'));
      expect(rememberMeCookie).toBeDefined();
    });

    test('should navigate to forgot password', async ({ page }) => {
      await page.goto('/login');

      await page.click('text=Forgot password?');

      await expect(page).toHaveURL(/\/forgot-password/);
    });
  });

  test.describe('Password Reset', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');

      await expect(page.locator('h1')).toContainText(/Reset.*Password/i);
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should submit password reset request', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"]', testUser.email);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/check your email/i')).toBeVisible();
    });

    test('should not reveal if email exists', async ({ page }) => {
      await page.goto('/forgot-password');

      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.click('button[type="submit"]');

      // Should show same message to prevent email enumeration
      await expect(page.locator('text=/check your email/i')).toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);
    });

    test('should successfully logout', async ({ page }) => {
      // Click user menu
      await page.click('button[aria-label="User menu"]');

      // Click logout
      await page.click('text=Logout');

      // Should redirect to login
      await expect(page).toHaveURL(/\/(login|$)/);
    });

    test('should clear session after logout', async ({ page }) => {
      // Logout
      await page.click('button[aria-label="User menu"]');
      await page.click('text=Logout');

      // Try to access protected page
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/login/);
    });

    test('should preserve redirect URL after login', async ({ page }) => {
      // Try to access protected page
      await page.goto('/dashboard/campaigns');

      // Should redirect to login with return URL
      await expect(page).toHaveURL(/\/login.*redirect/);

      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Should redirect back to original page
      await expect(page).toHaveURL(/\/dashboard\/campaigns/);
    });
  });

  test.describe('Session Management', () => {
    test('should handle expired session', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/);

      // Simulate session expiration by clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Navigate to protected page
      await page.goto('/dashboard/settings');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
