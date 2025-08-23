import { test, expect } from '@playwright/test';

test.describe('Homepage Hero Header Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Fail test on console errors (except warnings)
    page.on('console', msg => {
      if (msg.type() === 'error') {
        throw new Error(`Console error: ${msg.text()}`);
      }
    });

    // Fail test on network errors (4xx/5xx responses)
    page.on('response', response => {
      if (response.status() >= 400) {
        throw new Error(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
  });

  test('should validate hero header structure and capture responsive screenshots', async ({ page, browserName }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for content to load (either DB content or fallback)
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Assert exactly one semantic <h1> in the document
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
    
    // Verify the decorative header exists with "WELCOME" text
    const decorativeHeader = page.locator('[aria-hidden="true"]').filter({ hasText: 'WELCOME' });
    await expect(decorativeHeader).toBeVisible();
    const decorativeText = await decorativeHeader.locator('div').filter({ hasText: 'WELCOME' }).first();
    await expect(decorativeText).toContainText('WELCOME');
    
    // Test at different viewport widths and capture screenshots
    const viewports = [
      { width: 390, height: 844, name: 'mobile' },   // iPhone-like mobile
      { width: 768, height: 1024, name: 'tablet' },  // iPad-like tablet
      { width: 1280, height: 720, name: 'desktop' }  // Desktop
    ];
    
    for (const viewport of viewports) {
      await test.step(`Testing ${viewport.name} viewport (${viewport.width}px)`, async () => {
        // Set viewport size
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Wait for layout to settle
        await page.waitForTimeout(500);
        
        // Ensure both elements are still present after resize
        await expect(page.locator('h1')).toBeVisible();
        await expect(decorativeHeader).toBeVisible();
        
        // Capture screenshot
        const screenshotPath = `test/artifacts/screens/home-${viewport.width}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true
        });
        
        console.log(`Screenshot saved: ${screenshotPath}`);
      });
    }
    
    // Additional validation: ensure semantic h1 has meaningful content
    const h1Content = await page.locator('h1').textContent();
    expect(h1Content).toBeTruthy();
    expect(h1Content!.trim().length).toBeGreaterThan(10);
    
    // Log successful validation
    console.log(`✓ Hero header validation completed for ${browserName}`);
    console.log(`  - Found exactly 1 semantic <h1> element`);
    console.log(`  - Decorative "WELCOME" header is present and visible`);
    console.log(`  - Screenshots captured for all viewport sizes`);
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // The page might show loading state initially, but should resolve to content
    // Wait for either the loading state to disappear or content to appear
    await Promise.race([
      page.waitForSelector('h1', { timeout: 15000 }),
      page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 })
    ]);
    
    // Ensure we ended up with the actual content, not stuck in loading
    await expect(page.locator('h1')).toBeVisible();
    
    // Verify decorative elements loaded
    await expect(page.locator('[aria-hidden="true"]').filter({ hasText: 'WELCOME' })).toBeVisible();
  });

  test('should maintain accessibility with proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('h1');
    
    // Verify heading hierarchy starts with h1
    const firstHeading = await page.locator('h1, h2, h3, h4, h5, h6').first();
    const tagName = await firstHeading.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('h1');
    
    // Verify the main decorative header is properly marked as presentation
    const decorativeHeader = page.locator('[aria-hidden="true"]').filter({ hasText: 'WELCOME' });
    await expect(decorativeHeader).toBeVisible();
    await expect(decorativeHeader).toHaveAttribute('aria-hidden', 'true');
    
    // Verify that there are decorative elements (icons, visual flourishes) marked as aria-hidden
    const decorativeElements = page.locator('[aria-hidden="true"]');
    const count = await decorativeElements.count();
    expect(count).toBeGreaterThan(0); // Should have decorative elements marked as aria-hidden
    
    // Ensure there's exactly one semantic h1 that's not hidden
    const visibleH1 = page.locator('h1:not([aria-hidden="true"])');
    await expect(visibleH1).toHaveCount(1);
  });
});