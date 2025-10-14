import { test, expect } from '@playwright/test';

// Configure this test file to use the authUser project for authenticated testing
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Journal Recreate After Delete Tests @journals', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any persisted state
    await page.evaluate(() => {
      try {
        localStorage.removeItem('sistahology-journal');
      } catch (e) {
        // Ignore SecurityError in some test environments
      }
    });
  });

  test('should show empty state after deleting all journals and allow recreation', async ({ page }) => {
    // Mock empty journal state to simulate deleted journals
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (route.request().method() === 'POST') {
        // Mock successful journal creation
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'test-journal-' + Date.now(),
            userId: '11d60700-a1fc-429f-8338-3c18e674fda2',
            journalName: 'Recreated Journal',
            color: '#F5C3E2',
            createdAt: new Date().toISOString()
          }])
        });
      } else {
        await route.continue();
      }
    });
    
    // Navigate to new-entry page
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');

    // Wait for page to load
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 15000 });

    // Verify empty state is visible (not spinner)
    const emptyState = page.getByTestId('empty-journal-state');
    const createJournalButton = page.getByTestId('create-first-journal');
    
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    await expect(createJournalButton).toBeVisible();

    // Verify no loading spinner is stuck
    const loadingSpinner = page.locator('[data-testid="loading-spinner"], .animate-spin');
    await expect(loadingSpinner).not.toBeVisible({ timeout: 5000 });

    // Capture empty state after deletion
    await page.screenshot({ 
      path: 'tests/artifacts/user/390/empty-state-after-delete.png', 
      fullPage: true 
    });

    // Verify no repeated error toasts
    const errorToasts = page.locator('[role="alert"]').filter({ hasText: /failed to load/i });
    const toastCount = await errorToasts.count();
    expect(toastCount).toBeLessThanOrEqual(1); // At most one error toast

    // Create a new journal to verify recreation works
    await expect(createJournalButton).toBeVisible();
    
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('Recreated Journal');
    });

    await createJournalButton.click();
    
    // Wait for journal to be created and dropdown to be enabled
    const newJournalDropdown = page.getByTestId('journal-select');
    await expect(newJournalDropdown).toBeEnabled({ timeout: 10000 });

    // Verify journal recreation works correctly
    await expect(newJournalDropdown).toBeVisible();

    // Verify new journal is selected
    const selectedValue = await newJournalDropdown.inputValue();
    expect(selectedValue).toBeTruthy();

    // Verify editor is available for use
    const editor = page.getByTestId('journal-editor');
    await expect(editor).toBeVisible();

    // Basic functionality check - ensure form is functional
    await editor.fill('Test recreation entry');
    expect(await editor.inputValue()).toContain('Test recreation');
  });

  test('should handle basic page navigation without errors', async ({ page }) => {
    // Mock empty state to ensure consistent testing
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.continue();
      }
    });

    // Test basic navigation
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    
    // Verify page loads correctly
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 15000 });
    
    // Should see empty state UI
    const emptyState = page.getByTestId('empty-journal-state');
    await expect(emptyState).toBeVisible({ timeout: 10000 });
    
    const createJournalButton = page.getByTestId('create-first-journal');
    await expect(createJournalButton).toBeVisible();
    await expect(createJournalButton).toBeEnabled();
    
    console.log('Navigation test completed successfully');
  });

  test('should handle empty state consistently across multiple loads', async ({ page }) => {
    // Mock empty state consistently
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to page multiple times
    for (let i = 0; i < 2; i++) {
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');
      
      // Verify page loads correctly each time
      await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('empty-journal-state')).toBeVisible({ timeout: 10000 });
    }

    // Verify empty state UI still works
    const createJournalButton = page.getByTestId('create-first-journal');
    await expect(createJournalButton).toBeVisible();
    await expect(createJournalButton).toBeEnabled();

    console.log('Multiple page loads test passed');
  });
});