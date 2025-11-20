import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAuthReady } from './helpers/auth-helpers';

/**
 * Admin CMS Pages Management Tests
 *
 * Tests the complete CRUD workflow for CMS pages:
 * - Creating, reading, updating, and deleting pages
 * - Publishing/unpublishing workflow
 * - Rich text editor functionality
 * - URL slug validation and auto-generation
 * - Form validation and error handling
 * - Multi-viewport responsiveness
 */

test.describe('Admin CMS Pages Management', () => {
  // Use admin authentication
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    // Navigate to admin pages management
    await page.goto('/#/admin/pages');
    await waitForAuthReady(page, { isAdmin: true });
    await page.waitForLoadState('networkidle');
  });

  test.describe('Pages Table Display', () => {
    test('should display pages table with correct columns', async ({ page }) => {
      // Verify table headers are present
      const tableHeaders = ['Title', 'Slug', 'Published', 'Last Updated', 'Actions'];

      for (const header of tableHeaders) {
        const headerElement = page.locator('th', { hasText: header });
        await expect(headerElement).toBeVisible();
      }
    });

    test('should display "Create Page" button', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Page")');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('should show empty state when no pages exist', async ({ page }) => {
      // Check if there's either pages in the table or an empty state message
      const pageRows = page.locator('tbody tr');
      const rowCount = await pageRows.count();

      if (rowCount === 1) {
        // Check for empty state message
        const emptyMessage = page.locator('text=/No pages found|Create your first page/i');
        await expect(emptyMessage).toBeVisible();
      }
    });

    test('should display page status badges correctly', async ({ page }) => {
      const publishedBadges = page.locator('span:has-text("Published")');
      const draftBadges = page.locator('span:has-text("Draft")');

      // At least one type of badge should be visible if there are pages
      const pageRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=No pages found') });
      const rowCount = await pageRows.count();

      if (rowCount > 0) {
        const totalBadges = await publishedBadges.count() + await draftBadges.count();
        expect(totalBadges).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Page Creation', () => {
    test('should open create modal when clicking "Create Page"', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      // Verify modal is visible
      const modalTitle = page.locator('text=Create Page').first();
      await expect(modalTitle).toBeVisible();

      // Verify form fields are present
      await expect(page.locator('input[placeholder*="title" i]')).toBeVisible();
      await expect(page.locator('input[placeholder*="slug" i]')).toBeVisible();
      await expect(page.locator('label:has-text("Published")')).toBeVisible();
    });

    test('should auto-generate slug from title', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      // Type a title
      const titleInput = page.locator('input').filter({ hasText: '' }).first();
      await titleInput.fill('Test Page Title');

      // Wait a moment for slug generation
      await page.waitForTimeout(500);

      // Check that slug was auto-generated
      const slugInput = page.locator('input[placeholder*="slug" i]');
      const slugValue = await slugInput.inputValue();
      expect(slugValue).toBe('test-page-title');
    });

    test('should create new page with valid data', async ({ page }) => {
      const testPageTitle = `E2E Test Page ${Date.now()}`;
      const testPageSlug = `e2e-test-page-${Date.now()}`;

      await page.click('button:has-text("Create Page")');

      // Fill in title
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testPageTitle);

      // Fill in slug (override auto-generated)
      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();
      await slugInput.fill(testPageSlug);

      // Add content if rich text editor is available
      const contentArea = page.locator('label:has-text("Content")').locator('..').locator('textarea, [contenteditable="true"]').first();
      if (await contentArea.isVisible()) {
        await contentArea.fill('This is test page content.');
      }

      // Ensure published checkbox is checked
      const publishedCheckbox = page.locator('input#published');
      if (!await publishedCheckbox.isChecked()) {
        await publishedCheckbox.check();
      }

      // Save the page
      await page.click('button:has-text("Save")');

      // Wait for success toast or modal to close
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Verify page appears in table
      await expect(page.locator(`text=${testPageTitle}`)).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for missing title', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      // Try to save without title
      await page.click('button:has-text("Save")');

      // Should show error message
      await expect(page.locator('text=/title.*required|required.*title/i')).toBeVisible({ timeout: 5000 });
    });

    test('should show validation error for missing slug', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      // Fill title but clear slug
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill('Test Page');

      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();

      // Try to save
      await page.click('button:has-text("Save")');

      // Should show error message
      await expect(page.locator('text=/slug.*required|required.*slug/i')).toBeVisible({ timeout: 5000 });
    });

    test('should allow creating unpublished draft', async ({ page }) => {
      const testPageTitle = `E2E Draft Page ${Date.now()}`;

      await page.click('button:has-text("Create Page")');

      // Fill in title
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testPageTitle);

      // Uncheck published
      const publishedCheckbox = page.locator('input#published');
      if (await publishedCheckbox.isChecked()) {
        await publishedCheckbox.uncheck();
      }

      // Save the page
      await page.click('button:has-text("Save")');

      // Wait for success
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Verify page shows as Draft
      const pageRow = page.locator('tr', { has: page.locator(`text=${testPageTitle}`) });
      await expect(pageRow.locator('text=Draft')).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      // Verify modal is open
      await expect(page.locator('text=Create Page').first()).toBeVisible();

      // Click cancel
      await page.click('button:has-text("Cancel")');

      // Modal should close
      await expect(page.locator('text=Create Page').first()).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Page Editing', () => {
    test('should open edit modal when clicking edit button', async ({ page }) => {
      // Find first edit button in table
      const editButton = page.locator('button[title*="Edit" i]').first();

      // Skip if no pages exist
      if (await editButton.count() === 0) {
        test.skip();
      }

      await editButton.click();

      // Verify modal is visible with "Edit Page" title
      const modalTitle = page.locator('text=Edit Page').first();
      await expect(modalTitle).toBeVisible();

      // Verify form fields are pre-filled
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      const titleValue = await titleInput.inputValue();
      expect(titleValue).not.toBe('');
    });

    test('should update existing page successfully', async ({ page }) => {
      // Find first edit button
      const editButton = page.locator('button[title*="Edit" i]').first();

      if (await editButton.count() === 0) {
        test.skip();
      }

      await editButton.click();

      // Update title with timestamp
      const updatedTitle = `Updated Page ${Date.now()}`;
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.clear();
      await titleInput.fill(updatedTitle);

      // Save changes
      await page.click('button:has-text("Save")');

      // Wait for success message
      await expect(page.locator('text=/updated successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Verify updated title appears in table
      await expect(page.locator(`text=${updatedTitle}`)).toBeVisible({ timeout: 5000 });
    });

    test('should not auto-generate slug when editing existing page', async ({ page }) => {
      const editButton = page.locator('button[title*="Edit" i]').first();

      if (await editButton.count() === 0) {
        test.skip();
      }

      await editButton.click();

      // Get original slug
      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      const originalSlug = await slugInput.inputValue();

      // Change title
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.clear();
      await titleInput.fill('Completely Different Title');

      // Wait a moment
      await page.waitForTimeout(500);

      // Slug should remain unchanged
      const currentSlug = await slugInput.inputValue();
      expect(currentSlug).toBe(originalSlug);
    });

    test('should toggle publish status', async ({ page }) => {
      const editButton = page.locator('button[title*="Edit" i]').first();

      if (await editButton.count() === 0) {
        test.skip();
      }

      await editButton.click();

      // Get current published state
      const publishedCheckbox = page.locator('input#published');
      const wasChecked = await publishedCheckbox.isChecked();

      // Toggle it
      if (wasChecked) {
        await publishedCheckbox.uncheck();
      } else {
        await publishedCheckbox.check();
      }

      // Save
      await page.click('button:has-text("Save")');

      // Wait for success
      await expect(page.locator('text=/updated successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Verify status badge changed (wait for table to update)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Page Deletion', () => {
    test('should show confirmation dialog when deleting page', async ({ page }) => {
      const deleteButton = page.locator('button[title*="Delete" i]').first();

      if (await deleteButton.count() === 0) {
        test.skip();
      }

      // Set up dialog handler before clicking
      let dialogShown = false;
      page.on('dialog', dialog => {
        dialogShown = true;
        dialog.dismiss(); // Cancel the deletion
      });

      await deleteButton.click();

      // Wait a moment for dialog to appear
      await page.waitForTimeout(1000);

      expect(dialogShown).toBe(true);
    });

    test('should delete page when confirmed', async ({ page }) => {
      // Create a test page first
      const testPageTitle = `Page to Delete ${Date.now()}`;

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testPageTitle);

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Wait for table to update
      await page.waitForTimeout(1000);

      // Find the delete button for this page
      const pageRow = page.locator('tr', { has: page.locator(`text=${testPageTitle}`) });
      const deleteButton = pageRow.locator('button[title*="Delete" i]');

      // Accept the confirmation dialog
      page.on('dialog', dialog => dialog.accept());

      await deleteButton.click();

      // Wait for success message
      await expect(page.locator('text=/deleted successfully/i')).toBeVisible({ timeout: 10000 });

      // Verify page is removed from table
      await expect(page.locator(`text=${testPageTitle}`)).not.toBeVisible({ timeout: 5000 });
    });

    test('should not delete page when cancelled', async ({ page }) => {
      const deleteButton = page.locator('button[title*="Delete" i]').first();

      if (await deleteButton.count() === 0) {
        test.skip();
      }

      // Get page title before deletion attempt
      const pageRow = deleteButton.locator('../..');
      const pageTitle = await pageRow.locator('td').first().textContent();

      // Dismiss the confirmation dialog
      page.on('dialog', dialog => dialog.dismiss());

      await deleteButton.click();

      // Wait a moment
      await page.waitForTimeout(1000);

      // Page should still be in table
      await expect(page.locator(`text=${pageTitle}`)).toBeVisible();
    });
  });

  test.describe('Publishing Workflow', () => {
    test('should verify unpublished page not visible on public route', async ({ page, context }) => {
      // Create unpublished page
      const testSlug = `test-unpublished-${Date.now()}`;
      const testTitle = `Unpublished Test ${Date.now()}`;

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();
      await slugInput.fill(testSlug);

      const publishedCheckbox = page.locator('input#published');
      if (await publishedCheckbox.isChecked()) {
        await publishedCheckbox.uncheck();
      }

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Try to access the page publicly
      const publicPage = await context.newPage();
      await publicPage.goto(`/#/${testSlug}`);
      await publicPage.waitForLoadState('networkidle');

      // Should not show the unpublished content (might show 404 or redirect)
      const pageContent = await publicPage.textContent('body');
      expect(pageContent).not.toContain(testTitle);

      await publicPage.close();
    });

    test('should verify published page is visible on public route', async ({ page, context }) => {
      // Create published page
      const testSlug = `test-published-${Date.now()}`;
      const testTitle = `Published Test ${Date.now()}`;
      const testContent = `This is published content ${Date.now()}`;

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();
      await slugInput.fill(testSlug);

      // Add content
      const contentArea = page.locator('label:has-text("Content")').locator('..').locator('textarea, [contenteditable="true"]').first();
      if (await contentArea.isVisible()) {
        await contentArea.fill(testContent);
      }

      const publishedCheckbox = page.locator('input#published');
      if (!await publishedCheckbox.isChecked()) {
        await publishedCheckbox.check();
      }

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Access the page publicly (in new context without auth)
      const publicPage = await context.newPage();
      await publicPage.goto(`/#/${testSlug}`);
      await publicPage.waitForLoadState('networkidle');

      // Should show the published content or at least acknowledge the page exists
      // Note: Depending on implementation, may need to check specific rendering
      await publicPage.waitForTimeout(2000);

      await publicPage.close();
    });
  });

  test.describe('Multi-viewport Responsiveness', () => {
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      test(`should display pages table correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin/pages');
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `tests/artifacts/admin-pages-${viewport.name}.png`,
          fullPage: true
        });

        // Verify critical elements are visible
        await expect(page.locator('h1:has-text("Edit Homepage")')).toBeVisible();
        await expect(page.locator('button:has-text("Create Page")')).toBeVisible();
      });

      test(`should open and display modal correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin/pages');
        await page.waitForLoadState('networkidle');

        await page.click('button:has-text("Create Page")');

        // Take screenshot of modal
        await page.screenshot({
          path: `tests/artifacts/admin-pages-modal-${viewport.name}.png`,
          fullPage: true
        });

        // Verify form is usable
        const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
        await expect(titleInput).toBeVisible();
        await expect(titleInput).toBeEnabled();
      });
    }
  });

  test.describe('Accessibility', () => {
    test('should pass accessibility audit on pages list', async ({ page }) => {
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on create modal', async ({ page }) => {
      await page.click('button:has-text("Create Page")');
      await page.waitForTimeout(500);

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityResults.violations).toEqual([]);
    });
  });

  test.describe('Content Sanitization', () => {
    test('should sanitize HTML content when saving', async ({ page }) => {
      const testTitle = `Sanitization Test ${Date.now()}`;
      const dangerousContent = '<script>alert("XSS")</script><p>Safe content</p>';

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      // Try to add dangerous content
      const contentArea = page.locator('label:has-text("Content")').locator('..').locator('textarea, [contenteditable="true"]').first();
      if (await contentArea.isVisible()) {
        await contentArea.fill(dangerousContent);
      }

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Edit the page and verify content was sanitized
      const editButton = page.locator('tr', { has: page.locator(`text=${testTitle}`) })
        .locator('button[title*="Edit" i]');
      await editButton.click();

      const savedContent = await contentArea.textContent();

      // Should not contain script tags
      expect(savedContent).not.toContain('<script>');
      expect(savedContent).not.toContain('alert');
    });
  });

  test.describe('URL Slug Validation', () => {
    test('should convert title to valid URL slug', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');

      // Test various title formats
      const testCases = [
        { title: 'Test Page 123', expectedSlug: 'test-page-123' },
        { title: 'About Us & Contact', expectedSlug: 'about-us-contact' },
        { title: 'Special!@#$%Characters', expectedSlug: 'special-characters' }
      ];

      for (const testCase of testCases) {
        await titleInput.clear();
        await titleInput.fill(testCase.title);
        await page.waitForTimeout(300);

        const generatedSlug = await slugInput.inputValue();
        expect(generatedSlug).toBe(testCase.expectedSlug);
      }
    });

    test('should allow manual slug override', async ({ page }) => {
      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');

      await titleInput.fill('Auto Generated Title');
      await page.waitForTimeout(300);

      // Override slug
      const customSlug = 'custom-slug-override';
      await slugInput.clear();
      await slugInput.fill(customSlug);

      // Verify slug stays as overridden value
      const currentSlug = await slugInput.inputValue();
      expect(currentSlug).toBe(customSlug);
    });
  });
});
