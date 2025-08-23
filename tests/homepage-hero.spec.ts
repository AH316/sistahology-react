import { test, expect } from '@playwright/test';

test.describe('Homepage Hero Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Fail test on console errors
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

  test('should validate hero structure and capture responsive screenshots', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Wait for content to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Assert exactly one <h1> in the document (semantic heading in glass card)
    const h1Elements = await page.locator('h1').count();
    expect(h1Elements).toBe(1);
    
    // Find the decorative header container with "WELCOME" text
    // Look for aria-hidden="true" or role="none" containers
    const decorativeHeader = page.locator('[aria-hidden="true"], [role="none"]').filter({ hasText: 'WELCOME' });
    await expect(decorativeHeader).toBeVisible();
    
    // Test at different viewport widths and capture screenshots
    const widths = [390, 768, 1280];
    
    for (const width of widths) {
      await test.step(`Capture screenshot at ${width}px width`, async () => {
        // Set viewport size
        await page.setViewportSize({ width, height: 800 });
        
        // Wait for layout to settle
        await page.waitForTimeout(500);
        
        // Ensure elements are still visible after resize
        await expect(page.locator('h1')).toBeVisible();
        await expect(decorativeHeader).toBeVisible();
        
        // Capture screenshot
        const screenshotPath = `test/artifacts/screens/home-${width}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true
        });
        
        console.log(`Screenshot saved: ${screenshotPath}`);
      });
    }
  });
});