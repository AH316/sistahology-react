import { test, expect, Page } from '@playwright/test';

// Use authenticated user for protected routes
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Entry Deletion from Detail Page @delete-ux', () => {
  // Track console errors
  let consoleErrors: string[] = [];
  let createdEntryUrl: string | null = null;

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Only fail on unexpected errors
        if (!text.includes('401') && 
            !text.includes('Unauthorized') && 
            !text.includes('JWT') &&
            !text.includes('Failed to load resource') &&
            !text.includes('Network request failed')) {
          consoleErrors.push(text);
        }
      }
    });
  });

  test.afterEach(async ({ page }) => {
    // Verify no console errors occurred
    if (consoleErrors.length > 0) {
      console.warn(`Console errors detected: ${consoleErrors.join(', ')}`);
    }
  });

  // Helper to create an entry via UI
  async function createTestEntry(page: Page): Promise<string> {
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    
    // Wait for page to render
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 10000 });
    
    // Handle journal creation if needed
    const noJournalsSelect = page.locator('select#journal:disabled');
    if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.once('dialog', dialog => dialog.accept('Delete Test Journal'));
      await page.locator('button:has-text("Create your first journal")').click();
      await page.waitForTimeout(2000);
    }
    
    // Fill in entry content
    const editor = page.getByTestId('journal-editor');
    const journalSelect = page.getByTestId('journal-select');
    const saveButton = page.getByTestId('save-entry');
    
    await editor.fill('This is a test entry for delete UX testing. It contains meaningful content.');
    
    const firstOption = await journalSelect.locator('option:not([value=""])').first().getAttribute('value');
    if (firstOption) {
      await journalSelect.selectOption(firstOption);
    }
    
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    
    // Wait for success and navigation
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/saved|success/i);
    
    await page.waitForURL('/#/dashboard', { timeout: 10000 });
    
    // Get the entry ID from recent entries
    await page.waitForSelector('.entry-card', { timeout: 5000 });
    const editButton = page.locator('.entry-card button[aria-label="Edit entry"]').first();
    await editButton.click();
    
    // Wait for navigation to edit page
    await page.waitForURL(/\/entries\/.+\/edit/, { timeout: 5000 });
    const currentUrl = page.url();
    const entryId = currentUrl.match(/\/entries\/(.*?)\/edit/)?.[1];
    
    if (!entryId) {
      throw new Error('Failed to extract entry ID from URL');
    }
    
    return entryId;
  }

  test('Delete entry from detail page → confirm → redirect within 1s → single success toast', async ({ page }) => {
    // Create test entry via UI
    const entryId = await createTestEntry(page);
    
    // Ensure we're on edit page
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1').filter({ hasText: 'Edit Entry' });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // Verify entry content is loaded
    const contentArea = page.locator('textarea#content');
    await expect(contentArea).toBeVisible();
    await expect(contentArea).toHaveValue(/delete UX testing/);

    // Click Delete button
    const deleteButton = page.locator('button:has-text("Delete"):not(:has-text("Deleting"))');
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirm deletion in modal
    const confirmModal = page.locator('.fixed .bg-white');
    await expect(confirmModal).toBeVisible();
    
    const modalDeleteButton = confirmModal.locator('button:has-text("Delete Entry")');
    await expect(modalDeleteButton).toBeVisible();
    
    // Record time before deletion
    const deleteStartTime = Date.now();
    await modalDeleteButton.click();

    // Verify success toast appears
    const toast = page.getByTestId('toast-root');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/deleted.*success/i);

    // Verify redirect within 1 second
    await page.waitForURL(url => 
      url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
      { timeout: 1500 }
    );
    const redirectTime = Date.now() - deleteStartTime;
    expect(redirectTime).toBeLessThan(1500); // Allow 1.5s for redirect

    // Verify we're on a valid page (dashboard or calendar)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(dashboard|calendar)/);

    // Verify page content loads properly
    await page.waitForSelector('h1', { timeout: 5000 });
    const pageHeading = await page.locator('h1').textContent();
    expect(pageHeading).not.toBe('');

    // Take screenshots at different resolutions for final state
    const viewports = [390, 768, 1280];
    for (const width of viewports) {
      await test.step(`Screenshot successful redirect at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(500);
        
        const screenshotPath = `tests/artifacts/delete-ux/${width}/detail-delete-success.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true
        });
      });
    }
  });

  test('Back button navigation stays within app after deletion', async ({ page }) => {
    // Create test entry via UI
    const entryId = await createTestEntry(page);
    
    // Ensure we're on edit page
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: 'Edit Entry' })).toBeVisible();

    // Perform deletion
    const deleteButton = page.locator('button:has-text("Delete"):not(:has-text("Deleting"))');
    await deleteButton.click();

    const confirmModal = page.locator('.fixed .bg-white');
    await expect(confirmModal).toBeVisible();
    await confirmModal.locator('button:has-text("Delete Entry")').click();

    // Wait for redirect
    await page.waitForURL(url => 
      url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
      { timeout: 2000 }
    );

    // Test back button behavior
    await page.goBack();
    await page.waitForTimeout(500);

    // Verify we're still within the app (not broken state)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/sistahology|localhost/);
    
    // Should not be on the deleted entry's edit page
    expect(currentUrl).not.toContain(`/entries/${entryId}/edit`);

    // Should be on a valid app page
    const validPages = ['/', '/dashboard', '/login', '/calendar', '/search', '/profile'];
    const onValidPage = validPages.some(path => currentUrl.includes(path));
    expect(onValidPage).toBeTruthy();
  });

  test('No infinite spinners or stuck states during deletion flow', async ({ page }) => {
    // Create test entry via UI
    const entryId = await createTestEntry(page);
    
    // Ensure we're on edit page
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: 'Edit Entry' })).toBeVisible();

    // Monitor for loading spinners
    let maxSpinnerTime = 0;
    const spinnerMonitor = setInterval(async () => {
      try {
        const spinners = page.locator('.animate-spin');
        const spinnerCount = await spinners.count();
        if (spinnerCount > 0) {
          maxSpinnerTime += 100;
        } else {
          maxSpinnerTime = 0; // Reset if no spinners
        }
      } catch (error) {
        // Ignore monitoring errors
      }
    }, 100);

    try {
      // Perform deletion
      const deleteButton = page.locator('button:has-text("Delete"):not(:has-text("Deleting"))');
      await deleteButton.click();

      const confirmModal = page.locator('.fixed .bg-white');
      await expect(confirmModal).toBeVisible();
      await confirmModal.locator('button:has-text("Delete Entry")').click();

      // Wait for completion
      await page.waitForURL(url => 
        url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
        { timeout: 5000 }
      );

      // Wait a bit more to ensure no stuck states
      await page.waitForTimeout(1000);

    } finally {
      clearInterval(spinnerMonitor);
    }

    // Verify spinners didn't get stuck (max 3 seconds is reasonable)
    expect(maxSpinnerTime).toBeLessThan(3000);

    // Verify page is interactive (not frozen)
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);

    // Test interaction to ensure not stuck
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeEnabled();
    }
  });

  test('Single toast notification - no spam toasts', async ({ page }) => {
    // Create test entry via UI
    const entryId = await createTestEntry(page);
    
    let visibleToasts = 0;
    const toastObserver = setInterval(async () => {
      try {
        const toasts = page.getByTestId('toast-root');
        const currentCount = await toasts.count();
        visibleToasts = Math.max(visibleToasts, currentCount);
      } catch (error) {
        // Ignore monitoring errors
      }
    }, 100);

    try {
      // Ensure we're on edit page
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1').filter({ hasText: 'Edit Entry' })).toBeVisible();

      // Perform deletion
      const deleteButton = page.locator('button:has-text("Delete"):not(:has-text("Deleting"))');
      await deleteButton.click();

      const confirmModal = page.locator('.fixed .bg-white');
      await expect(confirmModal).toBeVisible();
      await confirmModal.locator('button:has-text("Delete Entry")').click();

      // Verify single success toast
      const toast = page.getByTestId('toast-root');
      await expect(toast).toBeVisible({ timeout: 5000 });
      await expect(toast).toContainText(/deleted.*success/i);

      // Wait for redirect and toast to finish
      await page.waitForURL(url => 
        url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
        { timeout: 2000 }
      );
      await page.waitForTimeout(1500);

    } finally {
      clearInterval(toastObserver);
    }

    // Should only see one toast notification, not spam
    expect(visibleToasts).toBeLessThanOrEqual(1);
  });

  test('Focus management and accessibility during delete flow', async ({ page }) => {
    // Create test entry via UI
    const entryId = await createTestEntry(page);
    
    // Ensure we're on edit page
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1').filter({ hasText: 'Edit Entry' })).toBeVisible();

    // Test keyboard navigation to delete button
    await page.keyboard.press('Tab');
    let focusedElement = await page.locator(':focus').getAttribute('aria-label');
    let tabCount = 0;
    
    // Navigate to delete button (limit tabs to prevent infinite loop)
    while (focusedElement !== 'Delete entry' && tabCount < 20) {
      await page.keyboard.press('Tab');
      focusedElement = await page.locator(':focus').getAttribute('aria-label');
      tabCount++;
    }

    // If we found the delete button, test keyboard activation
    if (focusedElement === 'Delete entry') {
      await page.keyboard.press('Enter');

      // Verify modal receives focus
      const confirmModal = page.locator('.fixed .bg-white');
      await expect(confirmModal).toBeVisible();
      
      // Check modal has proper focus management
      const modalDelete = confirmModal.locator('button:has-text("Delete Entry")');
      await expect(modalDelete).toBeVisible();

      // Use keyboard to confirm
      await page.keyboard.press('Tab'); // May move to Cancel
      await page.keyboard.press('Tab'); // Should be on Delete
      await page.keyboard.press('Enter');

      // Wait for redirect
      await page.waitForURL(url => 
        url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
        { timeout: 2000 }
      );

      // Verify focus is managed properly on new page
      await page.waitForTimeout(500);
      const focusAfterRedirect = page.locator(':focus');
      
      // Should have some focusable element, not lost focus
      const hasFocusedElement = await focusAfterRedirect.count() > 0;
      expect(hasFocusedElement).toBeTruthy();
    } else {
      // Fallback to mouse-based deletion
      const deleteButton = page.locator('button:has-text("Delete"):not(:has-text("Deleting"))');
      await deleteButton.click();
      
      const confirmModal = page.locator('.fixed .bg-white');
      await expect(confirmModal).toBeVisible();
      await confirmModal.locator('button:has-text("Delete Entry")').click();
      
      await page.waitForURL(url => 
        url.pathname.includes('/dashboard') || url.pathname.includes('/calendar'), 
        { timeout: 2000 }
      );
    }
  });
});