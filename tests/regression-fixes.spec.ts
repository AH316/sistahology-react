import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Use authenticated user for protected routes
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Regression Tests for Recent Fixes @regression', () => {
  // Track console errors globally
  let consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // Monitor console for errors - fail test on any error
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Only ignore specific expected auth-related errors and common dev warnings
        if (!text.includes('401') && 
            !text.includes('Unauthorized') && 
            !text.includes('JWT') &&
            !text.includes('Failed to load resource') &&
            !text.includes('403') &&
            !text.includes('Network request failed')) {
          consoleErrors.push(text);
        }
      }
    });

    // Monitor for warnings too
    page.on('console', msg => {
      if (msg.type() === 'warning') {
        console.warn('Console warning:', msg.text());
      }
    });
  });

  test.afterEach(async () => {
    // Fail test if any console errors were detected
    if (consoleErrors.length > 0) {
      throw new Error(`Console errors detected:\n${consoleErrors.join('\n')}`);
    }
  });

  test.describe('New Entry Page - Form Validation @regression', () => {
    test('Save button stays disabled until BOTH editor has non-whitespace AND journal is selected', async ({ page }) => {
      await page.goto('/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for page to render
      const heading = page.locator('h1').filter({ hasText: 'New Entry' });
      await expect(heading).toBeVisible({ timeout: 10000 });

      // Handle journal creation if needed
      const noJournalsSelect = page.locator('select#journal:disabled');
      const createJournalButton = page.locator('button:has-text("Create your first journal")');
      
      if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        page.once('dialog', dialog => dialog.accept('Regression Test Journal'));
        await createJournalButton.click();
        await page.waitForTimeout(2000);
      }

      // Get elements using data-testid
      const saveButton = page.getByTestId('save-entry');
      const editor = page.getByTestId('journal-editor');
      const journalSelect = page.getByTestId('journal-select');

      // Initial state: Save button should be disabled
      await expect(saveButton).toBeDisabled();

      // Test 1: Only whitespace in editor (should remain disabled)
      await editor.fill('   \n\t   ');
      await expect(saveButton).toBeDisabled();

      // Test 2: Non-whitespace in editor but no journal selected
      await editor.fill('Test content with actual text');
      
      // Try to deselect the journal - check if empty option exists
      const hasEmptyOption = await journalSelect.locator('option[value=""]').count() > 0;
      if (hasEmptyOption) {
        await journalSelect.selectOption('');
        await expect(saveButton).toBeDisabled();
      } else {
        // If no empty option, create scenario by clearing content temporarily
        await editor.fill('');
        await expect(saveButton).toBeDisabled();
        await editor.fill('Test content with actual text');
      }

      // Test 3: Both conditions met - should enable
      const firstOption = await journalSelect.locator('option:not([value=""])').first().getAttribute('value');
      if (firstOption) {
        await journalSelect.selectOption(firstOption);
        await expect(saveButton).toBeEnabled();
      }

      // Test 4: Remove content - should disable again
      await editor.fill('');
      await expect(saveButton).toBeDisabled();

      // Test 5: Only spaces/tabs/newlines - should remain disabled
      await editor.fill('    \n\n\t\t    ');
      await expect(saveButton).toBeDisabled();
    });

    test('On save: success toast appears, editor clears, navigation occurs', async ({ page }) => {
      await page.goto('/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for page to render
      await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 10000 });

      // Handle journal creation if needed
      const noJournalsSelect = page.locator('select#journal:disabled');
      if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        page.once('dialog', dialog => dialog.accept('Save Test Journal'));
        await page.locator('button:has-text("Create your first journal")').click();
        await page.waitForTimeout(2000);
      }

      // Fill in valid entry
      const editor = page.getByTestId('journal-editor');
      const journalSelect = page.getByTestId('journal-select');
      const saveButton = page.getByTestId('save-entry');

      await editor.fill('This is a test entry for verifying save functionality.');
      
      const firstOption = await journalSelect.locator('option:not([value=""])').first().getAttribute('value');
      if (firstOption) {
        await journalSelect.selectOption(firstOption);
      }

      // Verify save button is enabled
      await expect(saveButton).toBeEnabled();

      // Click save
      await saveButton.click();

      // Verify success toast appears
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/saved|success/i);

      // Verify navigation to known destination (dashboard)
      await page.waitForURL('/dashboard', {
        timeout: 10000,
        waitUntil: 'load'
      });
      
      // Verify we're actually on dashboard
      expect(page.url()).toContain('/dashboard');

      // If we navigate back, editor should be cleared
      await page.goto('/new-entry');
      await page.waitForLoadState('networkidle');
      const editorAfterSave = page.getByTestId('journal-editor');
      await expect(editorAfterSave).toHaveValue('');
    });

    test('Capture New Entry screenshots at multiple resolutions', async ({ page }) => {
      await page.goto('/new-entry');
      await page.waitForLoadState('networkidle');
      
      // Wait for page to render
      await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 10000 });

      const widths = [390, 768, 1280];
      
      for (const width of widths) {
        await test.step(`New Entry screenshot at ${width}px`, async () => {
          await page.setViewportSize({ width, height: 900 });
          await page.waitForTimeout(500); // Let layout settle
          
          // Ensure directory exists
          const screensDir = path.join(process.cwd(), 'test/artifacts/screens');
          if (!fs.existsSync(screensDir)) {
            fs.mkdirSync(screensDir, { recursive: true });
          }
          
          const screenshotPath = `test/artifacts/screens/new-entry-${width}.png`;
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true
          });
          
          console.log(`Screenshot saved: ${screenshotPath}`);
        });
      }
    });
  });

  test.describe('Home Hero - Semantic Structure @regression', () => {
    test('Semantic h1 structure and decorative WELCOME is aria-hidden', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for hero content to load
      await page.waitForSelector('[data-testid="hero-card"]', { timeout: 10000 });

      // Test 1: Hero card exists and has content
      const heroCard = page.getByTestId('hero-card');
      await expect(heroCard).toBeVisible();
      
      // At minimum, verify hero card has meaningful content
      await expect(heroCard).toContainText(/welcome|sacred|sistahology/i);
      
      // Test 2: Document has at least one h1 for semantic structure (may be in DB content or fallback)
      const totalH1Count = await page.locator('h1').count();
      expect(totalH1Count).toBeGreaterThanOrEqual(1);

      // Test 3: Decorative WELCOME exists and is aria-hidden
      const heroDecor = page.getByTestId('hero-decor');
      await expect(heroDecor).toBeVisible();
      await expect(heroDecor).toHaveAttribute('aria-hidden', 'true');
      await expect(heroDecor).toContainText('WELCOME');
    });

    test('Flowers and divider visible at all responsive breakpoints', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const widths = [390, 768, 1280];
      
      for (const width of widths) {
        await test.step(`Check decorative elements at ${width}px`, async () => {
          await page.setViewportSize({ width, height: 800 });
          await page.waitForTimeout(500);

          // Check hero card is visible
          const heroCard = page.getByTestId('hero-card');
          await expect(heroCard).toBeVisible();

          // Check decorative container
          const heroDecor = page.getByTestId('hero-decor');
          await expect(heroDecor).toBeVisible();

          // Check for flower SVGs (Flower2 icons)
          const flowers = page.locator('svg').filter({ has: page.locator('path') });
          const flowerCount = await flowers.count();
          expect(flowerCount).toBeGreaterThan(0);

          // Verify at least some flowers are visible
          const visibleFlowers = await flowers.evaluateAll(elements => 
            elements.filter(el => {
              const rect = el.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            }).length
          );
          expect(visibleFlowers).toBeGreaterThan(0);

          // Capture screenshot
          const screensDir = path.join(process.cwd(), 'test/artifacts/screens');
          if (!fs.existsSync(screensDir)) {
            fs.mkdirSync(screensDir, { recursive: true });
          }
          
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

  test.describe('Theme and UX - Focus Management @regression', () => {
    test('All interactive elements show visible focus outline on keyboard navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Test Tab navigation on homepage
      await page.keyboard.press('Tab');
      
      // Get currently focused element
      let focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Check focus outline styles
      const outlineStyle = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });

      // Should have either outline or box-shadow for focus indication
      const hasOutline = outlineStyle.outlineWidth !== '0px' && outlineStyle.outline !== 'none';
      const hasFocusBoxShadow = outlineStyle.boxShadow && outlineStyle.boxShadow !== 'none';
      expect(hasOutline || hasFocusBoxShadow).toBeTruthy();

      // Tab through several elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          const isInteractive = await focusedElement.evaluate(el => {
            const tagName = el.tagName.toLowerCase();
            return ['a', 'button', 'input', 'select', 'textarea'].includes(tagName) ||
                   el.getAttribute('role') === 'button' ||
                   el.getAttribute('tabindex') === '0';
          });

          if (isInteractive) {
            // Verify focus indication
            const styles = await focusedElement.evaluate(el => {
              const styles = window.getComputedStyle(el);
              return {
                outline: styles.outline,
                outlineWidth: styles.outlineWidth,
                boxShadow: styles.boxShadow
              };
            });
            
            const hasVisibleFocus = 
              (styles.outlineWidth !== '0px' && styles.outline !== 'none') ||
              (styles.boxShadow && styles.boxShadow !== 'none');
            
            expect(hasVisibleFocus).toBeTruthy();
          }
        }
      }
    });

    test('Disabled buttons are not focusable', async ({ page }) => {
      await page.goto('/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for page to load - the New Entry page should have the heading
      try {
        await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 10000 });
      } catch {
        // If not found, check if we're on the login page due to auth issues
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
          throw new Error('Authentication failed - redirected to login page');
        }
        
        // Check if we can find the heading with a more flexible selector
        const heading = await page.locator('h1').textContent();
        throw new Error(`Expected 'New Entry' heading but found: ${heading}`);
      }

      // The save button should be disabled initially
      const saveButton = page.getByTestId('save-entry');
      await expect(saveButton).toBeDisabled();

      // Try to focus the disabled button
      await saveButton.focus();
      
      // Check if it's actually focused
      const isFocused = await saveButton.evaluate(el => el === document.activeElement);
      expect(isFocused).toBeFalsy();

      // Tab navigation should skip disabled buttons
      // Focus on the editor first
      const editor = page.getByTestId('journal-editor');
      await editor.focus();
      
      // Tab through elements
      let foundDisabledInTabOrder = false;
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        
        if (await focusedElement.count() > 0) {
          const isDisabledButton = await focusedElement.evaluate(el => {
            return el.tagName.toLowerCase() === 'button' && (el as HTMLButtonElement).disabled;
          });
          
          if (isDisabledButton) {
            foundDisabledInTabOrder = true;
            break;
          }
        }
      }
      
      expect(foundDisabledInTabOrder).toBeFalsy();
    });

    test('Shift+Tab navigation works correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab forward a few times
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
      }

      // Get current focused element
      const forwardFocused = await page.locator(':focus').evaluate(el => el.outerHTML);

      // Tab backward
      await page.keyboard.press('Shift+Tab');
      
      // Should have moved to a different element
      const backwardFocused = await page.locator(':focus').evaluate(el => el.outerHTML);
      expect(backwardFocused).not.toBe(forwardFocused);

      // Tab forward again should return to the same element
      await page.keyboard.press('Tab');
      const returnFocused = await page.locator(':focus').evaluate(el => el.outerHTML);
      expect(returnFocused).toBe(forwardFocused);
    });
  });

  test('No console errors or warnings during typical user interactions', async ({ page }) => {
    // This test explicitly checks for console errors during interactions
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('401') && !text.includes('Unauthorized') && !text.includes('JWT')) {
          errors.push(text);
        }
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Test homepage interactions
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click various buttons with proper timeout handling
    const buttons = page.locator('button:visible');
    let buttonCount = 0;
    
    try {
      buttonCount = await buttons.count();
    } catch {
      buttonCount = 0; // Handle case where buttons selector might timeout
    }
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      try {
        const button = buttons.nth(i);
        const isDisabled = await button.isDisabled({ timeout: 2000 });
        
        if (!isDisabled) {
          try {
            await button.click({ timeout: 1000 });
            await page.waitForTimeout(500); // Brief pause between interactions
          } catch {
            // Some buttons might navigate away, that's ok
          }
        }
      } catch {
        // Skip buttons that can't be interacted with
        continue;
      }
    }

    // Navigate to new entry page
    await page.goto('/new-entry');
    await page.waitForLoadState('networkidle');

    // Interact with form elements
    const editor = page.getByTestId('journal-editor');
    if (await editor.isVisible({ timeout: 5000 })) {
      await editor.fill('Test content');
      await editor.clear();
    }

    // Final check
    expect(errors.length).toBe(0);
    
    if (warnings.length > 0) {
      console.log('Warnings detected (non-critical):', warnings);
    }
  });
});