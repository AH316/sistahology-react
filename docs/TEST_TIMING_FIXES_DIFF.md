# Test Timing Fixes - Code Changes

## File: tests/security.spec.ts

### Change 1: Admin Desktop Navigation (Line 204)
```diff
  test('should show admin link in desktop navigation', async ({ page }) => {
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

+   // Wait for dashboard content to confirm auth initialized
+   await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });
+
    // Wait for navigation header to be visible
    await page.waitForSelector('header', { state: 'visible', timeout: 10000 });

    // Admin link should exist and be visible
    const adminLink = page.locator('a[href="/#/admin"]').first();
    await expect(adminLink).toBeVisible({ timeout: 5000 });
```

### Change 2: Admin Mobile Navigation (Line 228)
```diff
  test('should show admin link in mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

+   // Wait for dashboard content to confirm auth initialized
+   await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });
+
    // Open mobile menu
    const mobileMenuButton = page.locator('button[aria-label="Toggle mobile menu"]');
    await expect(mobileMenuButton).toBeVisible({ timeout: 5000 });
    await mobileMenuButton.click();
```

### Change 3: Logout Flow (Line 263)
```diff
  test('should clear session on logout and redirect to home', async ({ page }) => {
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

+   // Wait for dashboard content to confirm auth initialized
+   await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });
+
    // Verify we're actually on dashboard (authenticated)
    await expect(page).toHaveURL(/\/#\/dashboard/, { timeout: 10000 });

-   // Wait for dashboard to load - check for dashboard content
-   const isDashboardLoaded = await page.locator('text=/Dashboard|Recent Entries|Writing Stats/i').first().isVisible().catch(() => false);
+   const isDashboardLoaded = await page.locator('text=/Welcome back|Total Entries/i').first().isVisible().catch(() => false);
```

### Change 4: Post-Logout Redirect (Line 302)
```diff
  test('should redirect to login after logout when accessing protected routes', async ({ page, context }) => {
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

+   // Wait for dashboard content to confirm auth initialized
+   await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });
+
    // Verify we're authenticated
    await expect(page).toHaveURL(/\/#\/dashboard/, { timeout: 10000 });
-   const isDashboardLoaded = await page.locator('text=/Dashboard|Recent Entries|Writing Stats/i').first().isVisible().catch(() => false);
+   const isDashboardLoaded = await page.locator('text=/Welcome back|Total Entries/i').first().isVisible().catch(() => false);
```

## Summary

- **Lines modified**: 4 test functions
- **Pattern added**: `await page.waitForSelector('text=/Welcome back|Total Entries/i', { timeout: 10000 });`
- **Location**: After `waitForLoadState('networkidle')`, before checking navigation elements
- **Rationale**: Ensures dashboard content (auth-dependent) loads before checking navigation state

## Testing the Changes

```bash
# Run security tests
npm run test:security

# Run specific test
npx playwright test tests/security.spec.ts:204 --project=authAdmin
```

## Expected Behavior

**Before**: Tests failed with "element not found" on navigation elements
**After**: Tests wait for content, then:
- ✓ Pass if session valid and content loads
- ✗ Fail with clear reason (session expired, data missing) if issues remain
