import { test, expect } from '@playwright/test';

test.describe('Authentication Guard Tests', () => {
  test.describe('Unauthenticated User Tests', () => {
    // These tests run without authentication state
    test.beforeEach(async ({ page }) => {
      // Clear any existing auth state
      await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    test('should block unauthenticated user from protected routes', async ({ page }) => {
      // Test multiple protected routes
      const protectedRoutes = [
        '/dashboard',
        '/new-entry',
        '/calendar',
        '/search'
      ];

      for (const route of protectedRoutes) {
        await test.step(`Testing route: ${route}`, async () => {
          // Try to navigate to protected route
          await page.goto(route);
          
          // Should be redirected to login page
          await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
          
          // Verify login page is displayed
          const loginHeading = page.locator('h1:has-text("Welcome Back")');
          await expect(loginHeading).toBeVisible();
        });
      }
    });

    test('should handle session expiry gracefully', async ({ page }) => {
      // Try to access protected route with no session
      await page.goto('/dashboard');
      
      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    });
  });

  test.describe('Authenticated User Tests', () => {
    // Use authenticated state for these tests
    test.use({ storageState: 'tests/.auth/user.json' });

    test('should allow authenticated user to access protected routes', async ({ page }) => {
      // Navigate to dashboard (protected route)
      await page.goto('/dashboard');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Should stay on dashboard, not redirect to login
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Verify dashboard content is visible
      const dashboardContent = page.locator('h1').filter({ hasText: /Dashboard|Welcome|Your Journal/ });
      await expect(dashboardContent.first()).toBeVisible({ timeout: 10000 });
    });

    test('should redirect authenticated users away from auth pages', async ({ page }) => {
      // Try to access login page while authenticated
      await page.goto('/login');
      
      // Wait for redirect
      await page.waitForLoadState('networkidle');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Try to access register page while authenticated
      await page.goto('/register');
      
      // Wait for redirect
      await page.waitForLoadState('networkidle');
      
      // Should be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });

    test('should maintain authentication across navigation', async ({ page }) => {
      // Start at dashboard
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Navigate to new entry
      await page.goto('/new-entry');
      await expect(page).toHaveURL(/\/new-entry/, { timeout: 10000 });
      
      // Navigate to calendar
      await page.goto('/calendar');
      await expect(page).toHaveURL(/\/calendar/, { timeout: 10000 });
      
      // Navigate to search
      await page.goto('/search');
      await expect(page).toHaveURL(/\/search/, { timeout: 10000 });
      
      // Should not be redirected to login at any point
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    });
  });
});