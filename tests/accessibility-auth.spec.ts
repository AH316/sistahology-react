import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// Configure this test file to use the authUser project
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Accessibility Tests - Protected Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure artifacts directory exists
    const artifactsDir = path.join(process.cwd(), 'test/artifacts/accessibility');
    mkdirSync(artifactsDir, { recursive: true });
  });

  test('New Entry page accessibility audit', async ({ page }) => {
    await page.goto('/new-entry', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Handle journal creation if needed
    const noJournalsSelect = page.locator('select#journal:disabled');
    const createJournalButton = page.locator('button:has-text("Create your first journal")');
    
    if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Set up dialog handler for journal name prompt
      page.once('dialog', dialog => {
        dialog.accept('A11y Test Journal');
      });
      
      // Click create journal button
      await createJournalButton.click();
      
      // Wait for journal to be created
      await page.waitForTimeout(2000);
    }
    
    // Run accessibility tests at different viewport sizes
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];
    
    for (const viewport of viewports) {
      await test.step(`Accessibility check at ${viewport.name} (${viewport.width}px)`, async () => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(500); // Wait for layout to settle
        
        // Run axe accessibility check
        const accessibilityResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        
        // Save results to JSON file
        const reportPath = path.join(
          process.cwd(),
          `test/artifacts/accessibility/new-entry-${viewport.name}-a11y.json`
        );
        
        writeFileSync(reportPath, JSON.stringify(accessibilityResults, null, 2));
        console.log(`Accessibility report saved: ${reportPath}`);
        
        // Capture updated screenshot
        const screenshotPath = `test/artifacts/screens/new-entry-${viewport.width}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true
        });
        console.log(`Screenshot saved: ${screenshotPath}`);
        
        // Log violations summary
        if (accessibilityResults.violations.length > 0) {
          console.log(`Found ${accessibilityResults.violations.length} accessibility violations at ${viewport.name}:`);
          accessibilityResults.violations.forEach(violation => {
            console.log(`  - ${violation.id}: ${violation.description} (${violation.impact})`);
          });
        } else {
          console.log(`No accessibility violations found at ${viewport.name}`);
        }
      });
    }
  });
});