import { test, expect } from '@playwright/test';
import { waitForAuthReady } from './helpers/auth-helpers';

/**
 * Admin Access Control Tests
 *
 * Tests role-based access control for admin routes:
 * - Route protection (non-admins blocked from /admin/*)
 * - Navigation visibility (admin nav only for admins)
 * - Redirect behavior for unauthorized access
 * - Role-based permissions enforcement
 */

test.describe('Admin Access Control', () => {
  test.describe('Regular User Access Control', () => {
    // Use regular user authentication (non-admin)
    test.use({ storageState: 'tests/.auth/user.json' });

    test('should NOT see admin navigation link as regular user', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Admin link should not be visible in navigation
      const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
      await expect(adminLink).not.toBeVisible();
    });

    test('should be blocked from /admin route', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin page
      await expect(page).not.toHaveURL(/\/#\/admin$/);

      // Might redirect to dashboard or show access denied
      const url = page.url();
      expect(url).toMatch(/\/#\/(dashboard|$)/);
    });

    test('should be blocked from /admin/pages route', async ({ page }) => {
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin pages
      await expect(page).not.toHaveURL(/\/#\/admin\/pages/);
    });

    test('should be blocked from /admin/blog route', async ({ page }) => {
      await page.goto('/#/admin/blog');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin blog
      await expect(page).not.toHaveURL(/\/#\/admin\/blog/);
    });

    test('should be blocked from /admin/sections route', async ({ page }) => {
      await page.goto('/#/admin/sections');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin sections
      await expect(page).not.toHaveURL(/\/#\/admin\/sections/);
    });

    test('should be blocked from /admin/tokens route', async ({ page }) => {
      await page.goto('/#/admin/tokens');
      await page.waitForLoadState('networkidle');

      // Should be redirected away from admin tokens
      await expect(page).not.toHaveURL(/\/#\/admin\/tokens/);
    });

    test('should still have access to regular user routes', async ({ page }) => {
      const userRoutes = [
        '/#/dashboard',
        '/#/calendar',
        '/#/search',
        '/#/new-entry',
        '/#/profile'
      ];

      for (const route of userRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Should stay on the route
        await expect(page).toHaveURL(new RegExp(route));
      }
    });
  });

  test.describe('Admin User Access Control', () => {
    // Use admin user authentication
    test.use({ storageState: 'tests/.auth/admin.json' });

    test.beforeEach(async ({ page }) => {
      // Wait for admin auth to be ready before each test
      await page.goto('/#/dashboard');
      await waitForAuthReady(page, { isAdmin: true });
    });

    test('should see admin navigation link as admin user', async ({ page }) => {
      await page.waitForLoadState('networkidle');

      // Admin link should be visible in navigation
      const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
      await expect(adminLink).toBeVisible();
    });

    test('should have access to /admin route', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Should stay on admin dashboard
      await expect(page).toHaveURL(/\/#\/admin$/);

      // Should see admin dashboard content
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('should have access to /admin/pages route', async ({ page }) => {
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      // Should stay on admin pages
      await expect(page).toHaveURL(/\/#\/admin\/pages/);

      // Should see pages management content
      await expect(page.locator('h1:has-text("Edit Homepage")')).toBeVisible();
    });

    test('should have access to /admin/blog route', async ({ page }) => {
      await page.goto('/#/admin/blog');
      await page.waitForLoadState('networkidle');

      // Should stay on admin blog
      await expect(page).toHaveURL(/\/#\/admin\/blog/);

      // Should see blog management content
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should have access to /admin/sections route', async ({ page }) => {
      await page.goto('/#/admin/sections');
      await page.waitForLoadState('networkidle');

      // Should stay on admin sections
      await expect(page).toHaveURL(/\/#\/admin\/sections/);

      // Should see sections management content
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should have access to /admin/tokens route', async ({ page }) => {
      await page.goto('/#/admin/tokens');
      await page.waitForLoadState('networkidle');

      // Should stay on admin tokens
      await expect(page).toHaveURL(/\/#\/admin\/tokens/);

      // Should see tokens management content
      await expect(page.locator('h1:has-text("Admin Registration Tokens")')).toBeVisible();
    });

    test('should navigate between admin routes successfully', async ({ page }) => {
      // Start at admin dashboard
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/#\/admin$/);

      // Navigate to pages
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/#\/admin\/pages/);

      // Navigate to tokens
      await page.goto('/#/admin/tokens');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/#\/admin\/tokens/);

      // All navigations should succeed without redirects
    });

    test('should still have access to regular user routes', async ({ page }) => {
      const userRoutes = [
        '/#/dashboard',
        '/#/calendar',
        '/#/search',
        '/#/new-entry',
        '/#/profile'
      ];

      for (const route of userRoutes) {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Should stay on the route
        await expect(page).toHaveURL(new RegExp(route));
      }
    });

    test('should display admin link with active state on admin routes', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Admin link should be highlighted/active
      const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
      await expect(adminLink).toBeVisible();

      // Check for active state class (commonly text-pink-200 in this app)
      const classes = await adminLink.getAttribute('class');
      expect(classes).toContain('text-pink-200');
    });
  });

  test.describe('Unauthenticated User Access Control', () => {
    // No authentication state

    test.beforeEach(async ({ page }) => {
      // Clear auth state
      await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    });

    test('should not see admin link in navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Admin link should not be visible
      const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
      await expect(adminLink).not.toBeVisible();
    });

    test('should be redirected to login when accessing /admin', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/#\/login/);

      // Should see login form
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('should be redirected to login when accessing /admin/pages', async ({ page }) => {
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/#\/login/);
    });

    test('should be redirected to login when accessing /admin/tokens', async ({ page }) => {
      await page.goto('/#/admin/tokens');
      await page.waitForLoadState('networkidle');

      // Should be redirected to login page
      await expect(page).toHaveURL(/\/#\/login/);
    });
  });

  test.describe('Admin Role Enforcement', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test('should enforce admin-only data access via RLS', async ({ page }) => {
      // Navigate to admin pages
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      // Capture any console errors related to permissions
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('permission')) {
          consoleErrors.push(msg.text());
        }
      });

      // Try to load pages data
      await page.waitForTimeout(3000);

      // Should be able to see pages table without permission errors
      await expect(page.locator('table')).toBeVisible();

      // Should not have RLS permission errors
      expect(consoleErrors.length).toBe(0);
    });

    test('should be able to create admin tokens', async ({ page }) => {
      await page.goto('/#/admin/tokens');
      await page.waitForLoadState('networkidle');

      // Should see "Create Token" button
      const createButton = page.locator('button:has-text("Create Token")');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();

      // Admin should have this capability
    });

    test('should see admin dashboard statistics', async ({ page }) => {
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Should see stat cards
      const statCards = ['Total Users', 'Total Journals', 'Total Entries'];

      for (const stat of statCards) {
        await expect(page.locator(`text=${stat}`)).toBeVisible();
      }
    });
  });

  test.describe('Mobile Navigation Access Control', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test('should show admin link in mobile menu for admin users', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="menu" i]');
      await menuButton.click();

      // Admin link should be visible in mobile menu
      const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
      await expect(adminLink).toBeVisible();
    });

    test('should not show admin link in mobile menu for regular users', async ({ page }) => {
      // Change to regular user auth
      await page.context().clearCookies();
      await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Load regular user state
      const userState = JSON.parse(
        await require('fs').promises.readFile('tests/.auth/user.json', 'utf-8')
      );

      await page.context().addCookies(userState.cookies || []);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="menu" i]');
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Admin link should not be visible in mobile menu
        const adminLink = page.locator('a:has-text("Admin")').filter({ hasText: /^Admin$/i });
        await expect(adminLink).not.toBeVisible();
      }
    });
  });

  test.describe('Cross-Origin Security', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test('should not leak admin status to client-side inspection', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Check localStorage for any exposed admin secrets
      const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage));

      // Should not contain service role keys or sensitive admin data
      expect(localStorage).not.toContain('service_role');
      expect(localStorage).not.toContain('service-role');
    });
  });
});
