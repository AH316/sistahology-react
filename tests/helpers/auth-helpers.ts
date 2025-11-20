import { Page } from '@playwright/test';

/**
 * Wait for auth state to be ready before running tests
 * Prevents race conditions where tests run before auth initializes
 *
 * This helper waits for the Supabase auth session to be loaded in localStorage.
 * It does NOT wait for UI elements to render - that should be done by individual tests.
 */
export async function waitForAuthReady(
  page: Page,
  options?: { isAdmin?: boolean; timeout?: number }
) {
  const timeout = options?.timeout || 10000;

  // Ensure Supabase session exists in localStorage
  await page.waitForFunction(
    () => {
      const authData = window.localStorage.getItem('sistahology-auth-development');
      if (!authData) return false;

      try {
        const parsed = JSON.parse(authData);
        // Check if we have a valid access token and user
        return !!parsed.access_token && !!parsed.user;
      } catch {
        return false;
      }
    },
    { timeout }
  );

  // Small delay to allow React to process the auth state
  await page.waitForTimeout(500);
}

/**
 * Handle logout for both mobile and desktop viewports
 */
export async function logout(page: Page, viewport: 'mobile' | 'desktop' = 'desktop') {
  if (viewport === 'mobile') {
    // Mobile: Open menu, then click Sign Out
    const menuButton = page.locator('[data-testid="mobile-menu-button"]').or(
      page.locator('button:has-text("☰")')
    );
    await menuButton.click();
    await page.waitForTimeout(300); // Wait for menu animation
  }

  const signOutButton = page.locator('button:has-text("Sign Out")');
  await signOutButton.waitFor({ state: 'visible', timeout: 5000 });
  await signOutButton.click();

  // Wait for redirect to login or home
  await page.waitForURL(/\/#\/(login|$)/, { timeout: 10000 });
}
