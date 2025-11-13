import { test, expect, Page } from '@playwright/test';

// Use authenticated user for protected routes
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Entry Missing/404 Redirect Handling @delete-ux', () => {
  // Track console errors and performance
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Only track unexpected errors (404 is expected for missing entries)
        if (!text.includes('401') && 
            !text.includes('Unauthorized') && 
            !text.includes('JWT') &&
            !text.includes('404') && 
            !text.includes('Failed to load resource') &&
            !text.includes('Network request failed')) {
          consoleErrors.push(text);
        }
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Check for unexpected console errors
    if (consoleErrors.length > 0) {
      console.warn(`Console errors detected (may be expected): ${consoleErrors.join(', ')}`);
    }
  });

  test('Direct access to non-existent entry ID → immediate redirect', async ({ page }) => {
    const fakeEntryId = 'non-existent-entry-id-12345';
    
    // Track redirect timing
    const redirectStartTime = Date.now();

    // Try to access non-existent entry
    await page.goto(`/#/entries/${fakeEntryId}/edit`);
    await page.waitForLoadState('networkidle');

    // Should redirect quickly
    await page.waitForURL(url => {
      const urlString = url.toString();
      return !urlString.includes(fakeEntryId) &&
        (urlString.includes('/dashboard') || urlString.includes('/calendar') || urlString.includes('/login'));
    }, { timeout: 5000 });

    const redirectTime = Date.now() - redirectStartTime;
    expect(redirectTime).toBeLessThan(3000);

    // Verify error message appears
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/not found|deleted|missing/i);

    // Verify clean navigation state
    const currentUrl = page.url();
    expect(currentUrl).not.toContain(fakeEntryId);

    // Take screenshot of 404 redirect result
    await page.screenshot({ 
      path: `tests/artifacts/delete-ux/1280/missing-entry-redirect.png`,
      fullPage: true
    });
  });

  test('Multiple rapid attempts to access missing entry → no infinite loops', async ({ page }) => {
    const fakeEntryId = 'rapid-access-test-12345';
    const attempts = 3;
    
    for (let i = 0; i < attempts; i++) {
      await test.step(`Attempt ${i + 1} to access missing entry`, async () => {
        const redirectStartTime = Date.now();
        
        // Try to access non-existent entry
        await page.goto(`/#/entries/${fakeEntryId}/edit`);
        await page.waitForTimeout(500); // Brief pause
        
        // Should redirect, not get stuck
        try {
          await page.waitForURL(url => {
            const urlString = url.toString();
            return !urlString.includes(fakeEntryId) && 
              (urlString.includes('/dashboard') || urlString.includes('/calendar') || urlString.includes('/login'));
          }, { timeout: 3000 });
        } catch (error) {
          // If timeout, check we're not in infinite loading state
          const currentUrl = page.url();
          expect(currentUrl).not.toContain(fakeEntryId);
        }
        
        const redirectTime = Date.now() - redirectStartTime;
        expect(redirectTime).toBeLessThan(4000);
      });
    }

    // Verify page is still functional
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Browser back/forward with missing entry → clean navigation', async ({ page }) => {
    // Start on dashboard
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toBeVisible();

    // Try to navigate to missing entry
    const fakeEntryId = 'back-forward-test-12345';
    await page.goto(`/#/entries/${fakeEntryId}/edit`);
    
    // Should redirect
    await page.waitForURL(url => !url.toString().includes(fakeEntryId), { timeout: 5000 });

    // Test back button
    await page.goBack();
    await page.waitForTimeout(500);

    // Should be back on dashboard, not stuck
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(dashboard|$)/); // Dashboard or home

    // Test forward button
    await page.goForward();
    await page.waitForTimeout(500);

    // Should not go back to missing entry
    const forwardUrl = page.url();
    expect(forwardUrl).not.toContain(fakeEntryId);

    // Verify navigation is clean
    expect(forwardUrl).toMatch(/sistahology|localhost/);
  });

  test('Invalid entry ID formats → graceful handling', async ({ page }) => {
    const invalidIds = [
      'null',
      'undefined', 
      '123-invalid-format',
      'very-long-invalid-entry-id-that-should-not-exist-in-database',
      ''  // Empty string
    ];

    for (const invalidId of invalidIds) {
      await test.step(`Test invalid ID: ${invalidId || 'empty'}`, async () => {
        const url = invalidId ? `/#/entries/${invalidId}/edit` : '/#/entries//edit';
        await page.goto(url);
        await page.waitForTimeout(500);

        // Should either redirect or show error, not crash
        try {
          await page.waitForURL(url => 
            !url.includes(invalidId) || 
            url.pathname.includes('/dashboard') || 
            url.pathname.includes('/calendar') || 
            url.pathname.includes('/login'),
            { timeout: 3000 }
          );
        } catch (error) {
          // Check page is not crashed
          const heading = await page.locator('h1').textContent();
          expect(heading).not.toBe('');
        }
      });
    }
  });

  test('Entry ID with special characters → safe handling', async ({ page }) => {
    const specialCharIds = [
      'entry<script>alert(1)</script>',
      'entry%20with%20spaces',
      'entry"with"quotes',
      "entry'with'apostrophes",
      'entry&with&ampersands'
    ];

    for (const specialId of specialCharIds) {
      await test.step(`Test special char ID: ${specialId}`, async () => {
        await page.goto(`/#/entries/${encodeURIComponent(specialId)}/edit`);
        await page.waitForTimeout(1000);

        // Should handle gracefully - no XSS, no crashes
        const currentUrl = page.url();
        expect(currentUrl).toMatch(/sistahology|localhost/);

        // Page should be functional
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();
        expect(buttonCount).toBeGreaterThan(0);

        // No script injection
        const scripts = page.locator('script:not([src])');
        const scriptCount = await scripts.count();
        // Should not have injected scripts (some legitimate scripts are OK)
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('alert(1)');
      });
    }

    // Take screenshots at different viewports for security test results
    const viewports = [390, 768, 1280];
    for (const width of viewports) {
      await test.step(`Screenshot security test results at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(500);
        
        const screenshotPath = `tests/artifacts/delete-ux/${width}/security-test-results.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true
        });
      });
    }
  });

  test('URL manipulation during entry loading → no security issues', async ({ page }) => {
    // Start on a valid page
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');

    // Try various URL manipulations that attackers might attempt
    const maliciousUrls = [
      '/#/entries/../../admin/edit',
      '/#/entries/../../../etc/passwd/edit', 
      '/#/entries/javascript:alert(1)/edit',
      '/#/entries//edit',
      '/#/entries/null/edit',
      '/#/entries/undefined/edit'
    ];

    for (const maliciousUrl of maliciousUrls) {
      await test.step(`Test malicious URL: ${maliciousUrl}`, async () => {
        await page.goto(maliciousUrl);
        await page.waitForTimeout(1000);

        // Should not allow directory traversal or code injection
        const currentUrl = page.url();
        expect(currentUrl).not.toContain('../');
        expect(currentUrl).not.toContain('/etc/passwd');
        expect(currentUrl).not.toContain('javascript:');

        // Page should remain functional
        const isOnValidPage = currentUrl.includes('/dashboard') || 
                             currentUrl.includes('/calendar') ||
                             currentUrl.includes('/login') ||
                             currentUrl.includes('/home') ||
                             currentUrl === 'http://localhost:5173/' ||
                             currentUrl === 'http://localhost:5173/#/';
        
        expect(isOnValidPage).toBeTruthy();
      });
    }
  });
});