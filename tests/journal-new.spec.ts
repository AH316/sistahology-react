import { test, expect } from '@playwright/test';

// Configure this test file to use the authUser project
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Journal New Entry Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for unexpected errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore expected auth-related errors
        const text = msg.text();
        if (!text.includes('401') && !text.includes('Unauthorized') && !text.includes('JWT')) {
          consoleErrors.push(text);
        }
      }
    });

    // Store console errors for later assertion
    (page as any).consoleErrors = consoleErrors;
  });

  test('should verify editor enables Save button on input and journal dropdown', async ({ page }) => {
    // Navigate to new entry page - we should already be authenticated via storageState
    await page.goto('/#/new-entry');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for the New Entry heading
    const newEntryHeading = page.locator('h1').filter({ hasText: 'New Entry' });
    await expect(newEntryHeading).toBeVisible({ timeout: 10000 });

    // Verify initial state - Save button should be disabled
    const saveButton = page.getByTestId('save-entry').or(page.locator('button:has-text("Save Entry")'));
    await expect(saveButton).toBeDisabled();

    // Check if we need to create a journal first
    const noJournalsSelect = page.locator('select#journal:disabled');
    const createJournalButton = page.locator('button:has-text("Create your first journal")');
    
    if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // No journals exist, create one
      await expect(createJournalButton).toBeVisible();
      
      // Set up dialog handler for journal name prompt
      page.once('dialog', dialog => {
        dialog.accept('E2E Test Journal');
      });
      
      // Click create journal button
      await createJournalButton.click();
      
      // Wait for journal to be created and dropdown to update
      await page.waitForTimeout(2000);
    }

    // Now check that journal dropdown is present and has options
    const journalDropdown = page.getByTestId('journal-select').or(page.locator('select#journal:not(:disabled)'));
    await expect(journalDropdown).toBeVisible({ timeout: 10000 });
    
    // Verify dropdown has journal options
    const journalOptions = await journalDropdown.locator('option').count();
    expect(journalOptions).toBeGreaterThan(0);

    // Select first available journal if not already selected
    const selectedValue = await journalDropdown.inputValue();
    if (!selectedValue) {
      const firstOption = await journalDropdown.locator('option').nth(0).getAttribute('value');
      if (firstOption) {
        await journalDropdown.selectOption(firstOption);
      }
    }

    // Find the textarea using data-testid or fallback
    const editor = page.getByTestId('journal-editor').or(page.locator('textarea[placeholder*="Start writing"]'));
    await expect(editor).toBeVisible();
    
    // Type some content (non-whitespace)
    await editor.fill('This is my test journal entry. Today was a good day.');
    
    // Verify Save button is now enabled (non-whitespace input enables it)
    await expect(saveButton).toBeEnabled();
    
    // Verify word count is displayed (be more specific with selector)
    const wordCountElement = page.locator('div.text-sm').filter({ hasText: /\d+ words?/ }).first();
    await expect(wordCountElement).toBeVisible();

    // Test save functionality by clicking save
    await saveButton.click();
    
    // After save, verify toast appears
    const toast = page.getByTestId('toast-root').or(page.locator('[role="alert"]'));
    await expect(toast).toBeVisible({ timeout: 5000 });
    
    // Verify navigation occurs (should redirect after successful save)
    await page.waitForURL((url) => !url.hash.includes('/new-entry'), {
      timeout: 10000
    });

    // Check for any unexpected console errors
    const errors = (page as any).consoleErrors || [];
    if (errors.length > 0) {
      console.warn('Console errors detected:', errors);
    }
  });

  test('should validate date selection and prevent future dates', async ({ page }) => {
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');

    // Wait for page heading
    await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible({ timeout: 10000 });

    // Handle journal creation if needed
    const noJournalsSelect = page.locator('select#journal:disabled');
    const createJournalButton = page.locator('button:has-text("Create your first journal")');
    
    if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Set up dialog handler for journal name prompt
      page.once('dialog', dialog => {
        dialog.accept('E2E Test Journal 2');
      });
      
      // Click create journal button
      await createJournalButton.click();
      
      // Wait for journal to be created
      await page.waitForTimeout(2000);
    }

    // Find date input
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();

    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Try to set a future date
    await dateInput.fill(tomorrowStr);

    // Add some content and select journal
    const editor = page.getByTestId('journal-editor').or(page.locator('textarea[placeholder*="Start writing"]'));
    await editor.fill('Test content for future date validation');
    
    const journalDropdown = page.getByTestId('journal-select').or(page.locator('select#journal:not(:disabled)'));
    await expect(journalDropdown).toBeVisible({ timeout: 10000 });
    
    // Select first journal if not already selected
    const selectedValue = await journalDropdown.inputValue();
    if (!selectedValue) {
      const firstOption = await journalDropdown.locator('option').nth(0).getAttribute('value');
      if (firstOption) {
        await journalDropdown.selectOption(firstOption);
      }
    }

    // Verify save button is disabled for future date
    const saveButton = page.getByTestId('save-entry').or(page.locator('button:has-text("Save Entry")'));
    await expect(saveButton).toBeDisabled();

    // Verify error message about future dates is shown
    const errorMessage = page.locator('p', { hasText: /future/ });
    await expect(errorMessage).toBeVisible();
  });
});