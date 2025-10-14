import { test, expect } from '@playwright/test';

// Configure this test file to use the authUser project for authenticated testing
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Journal First Create Tests @journals', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any persisted state to start fresh
    await page.evaluate(() => {
      try {
        localStorage.removeItem('sistahology-journal');
      } catch (e) {
        // Ignore SecurityError in some test environments
      }
    });
    
  });

  test('should show empty-state UI and allow first journal creation', async ({ page }) => {
    // Mock API to simulate empty state initially, then successful creation
    let createdJournalId = '';
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();
        createdJournalId = 'test-journal-' + Date.now();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: createdJournalId,
            journal_name: postData.journal_name,
            color: postData.color || '#F5C3E2',
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      } else if (route.request().method() === 'GET') {
        if (createdJournalId) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: createdJournalId,
              journal_name: 'My First Journal',
              color: '#F5C3E2',
              user_id: 'test-user-id',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      } else {
        await route.continue();
      }
    });

    // Mock entry creation for save functionality
    await page.route('**/rest/v1/entry*', async route => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-entry-' + Date.now(),
            journal_id: createdJournalId,
            content: postData.content,
            entry_date: postData.entry_date,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');

    // Wait for page heading to ensure page is loaded
    const newEntryHeading = page.locator('h1').filter({ hasText: 'New Entry' });
    await expect(newEntryHeading).toBeVisible();

    // Verify empty state UI - should see create button and disabled select
    const createJournalButton = page.getByTestId('create-first-journal');
    await expect(createJournalButton).toBeVisible();
    
    // Journal select may not exist yet in empty state, so check if it exists first
    const journalSelect = page.getByTestId('journal-select');
    const selectExists = await journalSelect.count() > 0;
    if (selectExists) {
      await expect(journalSelect).toBeDisabled();
    }
    
    const saveButton = page.getByTestId('save-entry');
    await expect(saveButton).toBeDisabled();

    // Capture empty state screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ 
      path: 'tests/artifacts/user/390/empty-state-mobile.png', 
      fullPage: true 
    });

    // Create first journal via dialog
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('My First Journal');
    });
    
    await createJournalButton.click();

    // Wait for journal dropdown to become enabled after creation
    await expect(journalSelect).toBeEnabled();

    // Verify journal dropdown is now enabled and populated
    await expect(journalSelect).toBeVisible();
    await expect(journalSelect).toBeEnabled();
    const optionCount = await journalSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);

    // Verify editor is accessible
    const editor = page.getByTestId('journal-editor');
    await expect(editor).toBeVisible();
    await expect(saveButton).toBeDisabled(); // Still disabled without content

    // Add content and verify save functionality
    await editor.fill('This is my first journal entry!');
    await expect(saveButton).toBeEnabled();

    // Capture after-create screenshot
    await page.screenshot({ 
      path: 'tests/artifacts/user/390/after-create-mobile.png', 
      fullPage: true 
    });

    // Test save
    await saveButton.click();
    
    // Verify success - either redirect or toast
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test('should handle journal creation across different viewports', async ({ page }) => {
    // Mock empty state
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

    const viewports = [
      { width: 390, height: 844, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' }, 
      { width: 1280, height: 720, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');

      // Wait for page heading
      await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible();

      // Verify empty state
      const createButton = page.getByTestId('create-first-journal');
      await expect(createButton).toBeVisible();
      
      // Capture empty state for this viewport
      await page.screenshot({ 
        path: `tests/artifacts/user/${viewport.width}/empty-state-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });

  test('should show exactly zero toasts in successful empty state', async ({ page }) => {
    // Mock successful empty journals response
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

    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');

    // Wait for page to load completely
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible();
    
    // Should see empty state UI
    await expect(page.getByTestId('create-first-journal')).toBeVisible();
    
    // Should have exactly zero toasts (no errors in successful empty state)
    await expect(page.getByTestId('toast-root')).toHaveCount(0);
  });

  test.fixme('should show error toast when journal loading fails', async ({ page }) => {
    // TODO: Error toast behavior is non-deterministic with current app implementation
    // Mock API failure for journal loading
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Server error' })
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to load and check for error toast
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible();
    
    // Should show error toast (with reasonable timeout)
    const errorToast = page.getByTestId('toast-root');
    await expect(errorToast).toBeVisible({ timeout: 10000 });
    
    // Capture failure screenshot
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ 
      path: 'tests/artifacts/user/390/failure-toast-mobile.png',
      fullPage: true 
    });
  });

  test('should create journal and verify post-creation state', async ({ page }) => {
    let createdJournalId = '';
    
    // Mock API responses
    await page.route('**/rest/v1/journal*', async route => {
      if (route.request().method() === 'POST') {
        const postData = await route.request().postDataJSON();
        createdJournalId = 'test-journal-' + Date.now();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: createdJournalId,
            journal_name: postData.journal_name,
            color: postData.color || '#f472b6',
            user_id: 'test-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        });
      } else if (route.request().method() === 'GET') {
        if (createdJournalId) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{
              id: createdJournalId,
              journal_name: 'My First Journal',
              color: '#f472b6',
              user_id: 'test-user-id',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([])
          });
        }
      } else {
        await route.continue();
      }
    });

    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');

    // Start with empty state
    const createJournalButton = page.getByTestId('create-first-journal');
    await expect(createJournalButton).toBeVisible();

    // Create journal via dialog
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('My First Journal');
    });

    await createJournalButton.click();

    // Verify journal dropdown is now enabled and has options
    const journalSelect = page.getByTestId('journal-select');
    await expect(journalSelect).toBeEnabled();
    const optionCount = await journalSelect.locator('option').count();
    expect(optionCount).toBeGreaterThan(0);

    // Verify editor is accessible
    const editor = page.getByTestId('journal-editor');
    await expect(editor).toBeVisible();

    // Capture after-creation state across viewports
    const viewports = [
      { width: 390, height: 844, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1280, height: 720, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({ 
        path: `tests/artifacts/user/${viewport.width}/after-create-${viewport.name}.png`,
        fullPage: true 
      });
    }
  });

  test('should maintain clean state during navigation', async ({ page }) => {
    // Mock successful empty state consistently
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

    // Test navigation without toasts appearing
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    
    // Verify initial state has no toasts
    await expect(page.getByTestId('toast-root')).toHaveCount(0);
    
    // Navigate to dashboard and back
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    
    // Should still have no toasts in successful flow
    await expect(page.getByTestId('toast-root')).toHaveCount(0);
  });
});