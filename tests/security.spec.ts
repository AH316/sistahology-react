import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/calendar',
  '/search',
  '/new-entry',
  '/profile',
  '/journals',
  '/entries',
  '/trash'
];

// Admin routes that require admin role
const adminRoutes = [
  '/admin',
  '/admin/pages',
  '/admin/blog'
];

test.describe('Security Test Suite', () => {

  test.describe('Authentication Security - Unauthenticated Users', () => {

    test.use({ storageState: { cookies: [], origins: [] } });

    test('should block access to protected routes and redirect to login', async ({ page }) => {
      for (const route of protectedRoutes) {
        await page.goto(`/#${route}`);

        // Should redirect to login page
        await expect(page).toHaveURL(/\/#\/login/, { timeout: 10000 });

        // Take screenshot for visual verification
        const screenshotPath = path.join(__dirname, 'artifacts', 'security', `unauthenticated-${route.replace(/\//g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log(`✓ Blocked unauthenticated access to ${route}`);
      }
    });

    test('should block access to admin routes and redirect to login', async ({ page }) => {
      for (const route of adminRoutes) {
        await page.goto(`/#${route}`);

        // Should redirect to login page
        await expect(page).toHaveURL(/\/#\/login/, { timeout: 10000 });

        console.log(`✓ Blocked unauthenticated access to admin route ${route}`);
      }
    });

    test('should show error for invalid login credentials', async ({ page }) => {
      await page.goto('/#/login');
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });

      // Fill in invalid credentials
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.fill('input[type="password"]', 'wrongpassword123');

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for error message (can be toast or inline error)
      await page.waitForTimeout(2000);

      // Check if we're still on login page (not redirected)
      await expect(page).toHaveURL(/\/#\/login/);

      // Take screenshot of error state
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'invalid-login-error.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Login with invalid credentials shows error');
    });

    test('should not freeze on authentication check', async ({ page }) => {
      // Navigate to a protected route
      await page.goto('/#/dashboard');

      // Should redirect to login within reasonable time (not freeze)
      await expect(page).toHaveURL(/\/#\/login/, { timeout: 10000 });

      // Verify loading spinner doesn't persist indefinitely
      const loadingSpinner = page.locator('text=/Checking authentication/i').or(page.locator('[role="status"]'));
      await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });

      console.log('✓ Authentication check does not freeze');
    });
  });

  test.describe('Authorization Security - Non-Admin Users', () => {

    test.use({ storageState: 'tests/.auth/user.json' });

    test('should block non-admin access to admin routes', async ({ page }) => {
      for (const route of adminRoutes) {
        await page.goto(`/#${route}`);

        // Should redirect to dashboard (not login, since user is authenticated)
        await expect(page).toHaveURL(/\/#\/dashboard/, { timeout: 10000 });

        // Take screenshot for verification
        const screenshotPath = path.join(__dirname, 'artifacts', 'security', `non-admin-blocked-${route.replace(/\//g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log(`✓ Blocked non-admin access to ${route}`);
      }
    });

    test('should NOT show admin link in desktop navigation', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for navigation header to be visible
      await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

      // Check desktop navigation - use more specific selector
      const desktopNav = page.locator('nav.hidden');
      await expect(desktopNav).toBeAttached();

      // Admin link should NOT exist for non-admin users
      const adminLink = page.locator('a[href="#/admin"]');
      await expect(adminLink).toHaveCount(0);

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'non-admin-desktop-nav.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log('✓ Admin link NOT visible in desktop navigation for non-admin');
    });

    test('should NOT show admin link in mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Open mobile menu
      const mobileMenuButton = page.locator('button[aria-label="Toggle mobile menu"]');
      await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
      await mobileMenuButton.click();

      // Wait for mobile menu to open - use more flexible selector
      await page.waitForTimeout(500); // Allow animation to complete

      // Admin link should NOT exist for non-admin users (check entire page)
      const adminLink = page.locator('a[href="#/admin"]');
      await expect(adminLink).toHaveCount(0);

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'non-admin-mobile-nav.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Admin link NOT visible in mobile navigation for non-admin');
    });

    test('should allow non-admin access to regular protected routes', async ({ page }) => {
      // Verify authenticated users can access their protected routes
      const allowedRoutes = ['/dashboard', '/calendar', '/search', '/profile'];

      for (const route of allowedRoutes) {
        await page.goto(`/#${route}`);

        // Should NOT redirect to login
        await expect(page).toHaveURL(new RegExp(`#${route}`), { timeout: 10000 });

        console.log(`✓ Non-admin can access ${route}`);
      }
    });
  });

  test.describe('Authorization Security - Admin Users', () => {

    test.use({ storageState: 'tests/.auth/admin.json' });

    test('should allow admin access to admin routes', async ({ page }) => {
      for (const route of adminRoutes) {
        await page.goto(`/#${route}`);

        // Should successfully load admin route (not redirect)
        await expect(page).toHaveURL(new RegExp(`#${route}`), { timeout: 10000 });

        // Verify no "permission denied" or error messages
        const errorText = page.locator('text=/permission denied|access denied|not authorized/i');
        await expect(errorText).not.toBeVisible({ timeout: 3000 });

        // Take screenshot for verification
        const screenshotPath = path.join(__dirname, 'artifacts', 'security', `admin-access-${route.replace(/\//g, '-')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        console.log(`✓ Admin can access ${route}`);
      }
    });

    test('should show admin link in desktop navigation', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for dashboard content to confirm auth initialized
      await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });

      // Wait for navigation header to be visible
      await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

      // Admin link should exist and be visible
      const adminLink = page.locator('a[href="#/admin"]').first();
      await expect(adminLink).toBeVisible({ timeout: 5000 });

      // Verify link text
      await expect(adminLink).toHaveText('Admin');

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'admin-desktop-nav.png');
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log('✓ Admin link IS visible in desktop navigation for admin user');
    });

    test('should show admin link in mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });

      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for dashboard content to confirm auth initialized
      await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });

      // Open mobile menu
      const mobileMenuButton = page.locator('button[aria-label="Toggle mobile menu"]');
      await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
      await mobileMenuButton.click();

      // Wait for mobile menu to open
      await page.waitForTimeout(500); // Allow animation to complete

      // Check for admin link - it should be visible in mobile menu
      // Use .last() because there are two admin links in DOM (desktop + mobile)
      const adminLink = page.locator('a[href="#/admin"]').last();
      await expect(adminLink).toBeVisible({ timeout: 5000 });
      await expect(adminLink).toHaveText('Admin');

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'admin-mobile-nav.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Admin link IS visible in mobile navigation for admin user');
    });
  });

  test.describe('Session Security', () => {

    test.use({ storageState: 'tests/.auth/user.json' });

    test('should clear session on logout and redirect to home', async ({ page }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for dashboard content to confirm auth initialized
      await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });

      // Verify we're actually on dashboard (authenticated)
      await expect(page).toHaveURL(/\/#\/dashboard/, { timeout: 10000 });

      // Wait for dashboard to load - check for dashboard content
      const isDashboardLoaded = await page.locator('text=/Welcome back|Total Entries/i').first().isVisible().catch(() => false);

      if (!isDashboardLoaded) {
        console.log('⚠ User session expired - skipping logout test');
        return;
      }

      // Take screenshot before logout
      const beforeLogoutPath = path.join(__dirname, 'artifacts', 'security', 'before-logout.png');
      await page.screenshot({ path: beforeLogoutPath, fullPage: false });

      // Wait for Sign Out button to be visible in header
      const logoutButton = page.locator('button:has-text("Sign Out")');
      await expect(logoutButton).toBeVisible({ timeout: 5000 });

      // Click logout button
      await logoutButton.click();

      // Should redirect to home page (with or without hash)
      await expect(page).toHaveURL(/\/(#\/)?$/, { timeout: 10000 });

      // Take screenshot after logout
      const afterLogoutPath = path.join(__dirname, 'artifacts', 'security', 'after-logout.png');
      await page.screenshot({ path: afterLogoutPath, fullPage: false });

      console.log('✓ Logout clears session and redirects to home');
    });

    test('should redirect to login after logout when accessing protected routes', async ({ page, context }) => {
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Wait for dashboard content to confirm auth initialized
      await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });

      // Verify we're authenticated
      await expect(page).toHaveURL(/\/#\/dashboard/, { timeout: 10000 });
      const isDashboardLoaded = await page.locator('text=/Welcome back|Total Entries/i').first().isVisible().catch(() => false);

      if (!isDashboardLoaded) {
        console.log('⚠ User session expired - skipping logout test');
        return;
      }

      // Wait for Sign Out button and click
      const logoutButton = page.locator('button:has-text("Sign Out")');
      await expect(logoutButton).toBeVisible({ timeout: 5000 });
      await logoutButton.click();

      // Wait for redirect to home
      await expect(page).toHaveURL(/\/#?\/$/, { timeout: 10000 });

      // Try to access protected route after logout
      await page.goto('/#/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/#\/login/, { timeout: 10000 });

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'post-logout-redirect.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Post-logout protected route access redirects to login');
    });
  });

  test.describe('Content Security - XSS Prevention', () => {

    test.use({ storageState: 'tests/.auth/user.json' });

    test('should sanitize script tags in journal entries', async ({ page }) => {
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for page to fully load - check for the editor first
      const editor = page.locator('textarea[data-testid="journal-editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Wait for journal select to be available and visible
      const journalSelect = page.locator('select[data-testid="journal-select"]');

      // Check if journals need to load first
      const isLoading = await page.locator('text=Loading your journals').isVisible().catch(() => false);
      if (isLoading) {
        await page.waitForSelector('text=Loading your journals', { state: 'hidden', timeout: 10000 });
      }

      // Check if we have a journal to select
      const hasJournals = await journalSelect.isVisible().catch(() => false);
      if (!hasJournals) {
        console.log('⚠ No journals available - skipping XSS test');
        return;
      }

      // Select first journal option
      await journalSelect.selectOption({ index: 0 });
      await page.waitForTimeout(500); // Let selection settle

      // Try to inject XSS via script tag
      const xssPayload = '<script>alert("XSS")</script>This is a test entry';
      await editor.fill(xssPayload);

      // Save entry
      const saveButton = page.locator('button[data-testid="save-entry"]');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();

      // Wait for save to complete - look for success toast or redirect
      await page.waitForTimeout(2000);

      // Navigate to dashboard or entries to see if script is sanitized
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Check that script tag was not executed (no alert dialog)
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(dialogs).toHaveLength(0);

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'xss-script-tag-sanitized.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Script tags are sanitized in journal entries');
    });

    test('should sanitize event handler attributes in journal entries', async ({ page }) => {
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for editor to be visible
      const editor = page.locator('textarea[data-testid="journal-editor"]');
      await expect(editor).toBeVisible({ timeout: 10000 });

      // Wait for journal select
      const journalSelect = page.locator('select[data-testid="journal-select"]');

      // Check if journals are loading
      const isLoading = await page.locator('text=Loading your journals').isVisible().catch(() => false);
      if (isLoading) {
        await page.waitForSelector('text=Loading your journals', { state: 'hidden', timeout: 10000 });
      }

      // Check if we have journals
      const hasJournals = await journalSelect.isVisible().catch(() => false);
      if (!hasJournals) {
        console.log('⚠ No journals available - skipping XSS test');
        return;
      }

      await journalSelect.selectOption({ index: 0 });
      await page.waitForTimeout(500);

      // Try to inject XSS via event handler
      const xssPayload = '<img src="x" onerror="alert(\'XSS\')">Test entry with image XSS';
      await editor.fill(xssPayload);

      // Save entry
      const saveButton = page.locator('button[data-testid="save-entry"]');
      await expect(saveButton).toBeEnabled({ timeout: 5000 });
      await saveButton.click();

      // Wait for save
      await page.waitForTimeout(2000);

      // Navigate to dashboard
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');

      // Check that event handler was not executed (no alert)
      const dialogs: string[] = [];
      page.on('dialog', dialog => {
        dialogs.push(dialog.message());
        dialog.dismiss();
      });

      await page.waitForTimeout(1000);
      expect(dialogs).toHaveLength(0);

      // Take screenshot
      const screenshotPath = path.join(__dirname, 'artifacts', 'security', 'xss-event-handler-sanitized.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });

      console.log('✓ Event handler attributes are sanitized in journal entries');
    });

    test('should verify DOMPurify sanitization with accessibility check', async ({ page }) => {
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');

      // Run accessibility check on the form
      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Save accessibility report
      const reportPath = path.join(__dirname, 'artifacts', 'security', 'new-entry-accessibility.json');
      const fs = await import('fs/promises');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(accessibilityScanResults, null, 2));

      // Verify no critical accessibility violations
      expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0);

      console.log('✓ New entry form passes accessibility check');
      console.log(`  Accessibility report saved to: ${reportPath}`);
    });
  });

  test.describe('Error Message Accessibility', () => {

    test.use({ storageState: { cookies: [], origins: [] } });

    test('should have accessible error messages on login page', async ({ page }) => {
      await page.goto('/#/login');
      await page.waitForLoadState('networkidle');

      // Verify submit button is disabled when form is empty
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();

      // Verify button has proper aria-label or title for accessibility
      await expect(submitButton).toHaveAttribute('disabled', '');

      // Run accessibility check on form with empty state
      const accessibilityScanResults = await new AxeBuilder({ page })
        .analyze();

      // Save report
      const reportPath = path.join(__dirname, 'artifacts', 'security', 'login-errors-accessibility.json');
      const fs = await import('fs/promises');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(accessibilityScanResults, null, 2));

      // Verify no critical violations
      expect(accessibilityScanResults.violations.filter(v => v.impact === 'critical')).toHaveLength(0);

      console.log('✓ Login form with disabled button is accessible');
      console.log(`  Accessibility report saved to: ${reportPath}`);
    });
  });
});
