import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAuthReady } from './helpers/auth-helpers';

/**
 * Admin Token Management Tests
 *
 * Tests the admin token registration system:
 * - Token creation with email and expiration
 * - Token management (view, delete)
 * - Token lifecycle states (Active, Used, Expired)
 * - Statistics display (Active/Used/Expired counts)
 * - Token deletion with confirmation
 * - Registration URL generation and display
 */

test.describe('Admin Token Management', () => {
  // Use admin authentication
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/admin/tokens');
    await waitForAuthReady(page, { isAdmin: true });
    await page.waitForLoadState('networkidle');
  });

  test.describe('Tokens Dashboard Display', () => {
    test('should display tokens page heading', async ({ page }) => {
      await expect(page.locator('h1:has-text("Admin Registration Tokens")')).toBeVisible();
    });

    test('should display description text', async ({ page }) => {
      const description = page.locator('text=/Manage secure tokens/i');
      await expect(description).toBeVisible();
    });

    test('should display "Create Token" button', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create Token")');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
    });

    test('should display all three statistics cards', async ({ page }) => {
      const statLabels = ['Active Tokens', 'Used Tokens', 'Expired Tokens'];

      for (const label of statLabels) {
        await expect(page.locator(`text=${label}`)).toBeVisible();
      }
    });

    test('should display stat cards with icons', async ({ page }) => {
      // Active tokens (green CheckCircle)
      const activeIcon = page.locator('.bg-green-500\\/20').locator('svg');
      await expect(activeIcon.first()).toBeVisible();

      // Used tokens (blue Shield)
      const usedIcon = page.locator('.bg-blue-500\\/20').locator('svg');
      await expect(usedIcon.first()).toBeVisible();

      // Expired tokens (gray Clock)
      const expiredIcon = page.locator('.bg-gray-500\\/20').locator('svg');
      await expect(expiredIcon.first()).toBeVisible();
    });

    test('should display stat values as numbers', async ({ page }) => {
      const statCards = page.locator('.glass.p-6.rounded-lg');
      const cardCount = await statCards.count();

      expect(cardCount).toBeGreaterThanOrEqual(3);

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const valueElement = statCards.nth(i).locator('.text-2xl.font-bold.text-white');
        await expect(valueElement).toBeVisible();

        const value = await valueElement.textContent();
        expect(value?.trim()).toMatch(/^\d+$/);
      }
    });

    test('should display tokens table header', async ({ page }) => {
      const tableHeader = page.locator('h2:has-text("All Tokens")');
      await expect(tableHeader).toBeVisible();
    });

    test('should display table with correct columns', async ({ page }) => {
      const tableHeaders = ['Email', 'Status', 'Created', 'Expires', 'Used', 'Actions'];

      for (const header of tableHeaders) {
        const headerElement = page.locator('th', { hasText: header });
        await expect(headerElement).toBeVisible();
      }
    });

    test('should show empty state when no tokens exist', async ({ page }) => {
      const tokenRows = page.locator('tbody tr');
      const rowCount = await tokenRows.count();

      if (rowCount === 1) {
        // Check for empty state message
        const emptyMessage = page.locator('text=/No Tokens Yet/i');
        if (await emptyMessage.isVisible()) {
          await expect(page.locator('text=/Create your first admin registration token/i')).toBeVisible();
        }
      }
    });
  });

  test.describe('Token Creation', () => {
    test('should open create modal when clicking "Create Token"', async ({ page }) => {
      await page.click('button:has-text("Create Token")');

      // Wait for modal to appear
      await page.waitForTimeout(500);

      // Verify modal elements are visible
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]');
      await expect(emailInput.first()).toBeVisible();
    });

    test('should create new token with valid data', async ({ page }) => {
      const testEmail = `test-admin-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      // Fill in email
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      // Select expiration (default or specific)
      const expirationSelect = page.locator('select');
      if (await expirationSelect.count() > 0) {
        await expirationSelect.first().selectOption({ index: 0 }); // Select first option
      }

      // Submit form
      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      // Wait for success toast
      await expect(page.locator('text=/created successfully|token created/i')).toBeVisible({ timeout: 10000 });

      // Modal should show generated token
      const tokenDisplay = page.locator('input[readonly], textarea[readonly], code, pre');
      if (await tokenDisplay.count() > 0) {
        await expect(tokenDisplay.first()).toBeVisible();
      }
    });

    test('should display registration URL after token creation', async ({ page }) => {
      const testEmail = `test-url-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await page.waitForTimeout(2000);

      // Should show registration URL
      const urlDisplay = page.locator('text=/register\\?token=/i, input[value*="register"]');
      if (await urlDisplay.count() > 0) {
        await expect(urlDisplay.first()).toBeVisible();
      }
    });

    test('should show copy button for registration URL', async ({ page }) => {
      const testEmail = `test-copy-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await page.waitForTimeout(2000);

      // Look for copy button
      const copyButton = page.locator('button:has-text("Copy"), button[title*="copy" i]');
      if (await copyButton.count() > 0) {
        await expect(copyButton.first()).toBeVisible();
      }
    });

    test('should show validation error for empty email', async ({ page }) => {
      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      // Try to submit without email
      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await page.waitForTimeout(1000);

      // Should show validation error or prevent submission
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);

      // Either HTML5 validation or custom error should prevent submission
      expect(validationMessage?.length || 0).toBeGreaterThan(0);
    });

    test('should show validation error for invalid email format', async ({ page }) => {
      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill('invalid-email-format');

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await page.waitForTimeout(1000);

      // HTML5 validation should catch invalid email
      const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
      expect(validationMessage?.length || 0).toBeGreaterThan(0);
    });

    test('should allow selecting token expiration period', async ({ page }) => {
      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      // Check if expiration selector exists
      const expirationSelect = page.locator('select, [role="combobox"]');

      if (await expirationSelect.count() > 0) {
        await expect(expirationSelect.first()).toBeVisible();

        // Should have multiple options
        const options = expirationSelect.first().locator('option');
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);
      }
    });

    test('should add new token to table after creation', async ({ page }) => {
      const testEmail = `table-test-${Date.now()}@example.com`;

      // Get initial token count
      const initialRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') });
      const initialCount = await initialRows.count();

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await expect(page.locator('text=/created successfully|token created/i')).toBeVisible({ timeout: 10000 });

      // Close modal
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Done")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Wait for table to update
      await page.waitForTimeout(2000);

      // Verify email appears in table
      await expect(page.locator(`text=${testEmail}`)).toBeVisible();
    });
  });

  test.describe('Token Status Badges', () => {
    test('should display Active badge for unused tokens', async ({ page }) => {
      // Check if any active tokens exist
      const activeBadges = page.locator('span:has-text("Active")').filter({ has: page.locator('.text-green-800') });

      if (await activeBadges.count() > 0) {
        await expect(activeBadges.first()).toBeVisible();

        // Should have green styling
        const badge = activeBadges.first();
        const classes = await badge.getAttribute('class');
        expect(classes).toContain('green');
      }
    });

    test('should display Used badge for consumed tokens', async ({ page }) => {
      const usedBadges = page.locator('span:has-text("Used")').filter({ has: page.locator('.text-blue-800') });

      if (await usedBadges.count() > 0) {
        await expect(usedBadges.first()).toBeVisible();

        // Should have blue styling
        const badge = usedBadges.first();
        const classes = await badge.getAttribute('class');
        expect(classes).toContain('blue');
      }
    });

    test('should display Expired badge for expired tokens', async ({ page }) => {
      const expiredBadges = page.locator('span:has-text("Expired")').filter({ has: page.locator('.text-gray-800') });

      if (await expiredBadges.count() > 0) {
        await expect(expiredBadges.first()).toBeVisible();

        // Should have gray styling
        const badge = expiredBadges.first();
        const classes = await badge.getAttribute('class');
        expect(classes).toContain('gray');
      }
    });

    test('should display badge icons', async ({ page }) => {
      // Badges should have icons
      const badges = page.locator('span:has-text("Active"), span:has-text("Used"), span:has-text("Expired")');

      if (await badges.count() > 0) {
        const firstBadge = badges.first();
        const icon = firstBadge.locator('svg');
        await expect(icon).toBeVisible();
      }
    });
  });

  test.describe('Token Deletion', () => {
    test('should show delete button for each token', async ({ page }) => {
      const deleteButtons = page.locator('button:has-text("Delete")').filter({ has: page.locator('svg') });

      // Should have delete buttons if tokens exist
      const tokenRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') });
      const rowCount = await tokenRows.count();

      if (rowCount > 0) {
        expect(await deleteButtons.count()).toBeGreaterThan(0);
      }
    });

    test('should show confirmation dialog when deleting token', async ({ page }) => {
      // Create a token to delete
      const testEmail = `delete-test-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await expect(page.locator('text=/created successfully|token created/i')).toBeVisible({ timeout: 10000 });

      // Close creation modal
      const closeButton = page.locator('button:has-text("Close"), button:has-text("Done")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await page.waitForTimeout(1000);

      // Find the token row
      const tokenRow = page.locator('tr', { has: page.locator(`text=${testEmail}`) });
      const deleteButton = tokenRow.locator('button:has-text("Delete")');

      // Click delete
      await deleteButton.click();

      // Confirmation dialog should appear
      await page.waitForTimeout(500);
      const confirmDialog = page.locator('[role="dialog"], .modal, text=/Are you sure/i');
      await expect(confirmDialog.first()).toBeVisible();
    });

    test('should delete token when confirmed', async ({ page }) => {
      // Create a token to delete
      const testEmail = `confirm-delete-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await expect(page.locator('text=/created successfully|token created/i')).toBeVisible({ timeout: 10000 });

      const closeButton = page.locator('button:has-text("Close"), button:has-text("Done")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      await page.waitForTimeout(1000);

      // Find and delete the token
      const tokenRow = page.locator('tr', { has: page.locator(`text=${testEmail}`) });
      const deleteButton = tokenRow.locator('button:has-text("Delete")');

      await deleteButton.click();
      await page.waitForTimeout(500);

      // Confirm deletion
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm")').last();
      await confirmButton.click();

      // Wait for success message
      await expect(page.locator('text=/deleted successfully/i')).toBeVisible({ timeout: 10000 });

      // Token should be removed from table
      await expect(page.locator(`text=${testEmail}`)).not.toBeVisible({ timeout: 5000 });
    });

    test('should not delete token when cancelled', async ({ page }) => {
      // Find first token with delete button
      const deleteButtons = page.locator('button:has-text("Delete")').filter({ has: page.locator('svg') });

      if (await deleteButtons.count() === 0) {
        test.skip();
      }

      // Get the email of the first token
      const firstRow = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') }).first();
      const email = await firstRow.locator('td').first().textContent();

      // Click delete
      const deleteButton = firstRow.locator('button:has-text("Delete")');
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Cancel deletion
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').last();
      await cancelButton.click();

      // Token should still be in table
      await expect(page.locator(`text=${email}`)).toBeVisible();
    });
  });

  test.describe('Statistics Updates', () => {
    test('should update active tokens count after creation', async ({ page }) => {
      // Get initial active count
      const activeStatCard = page.locator('text=Active Tokens').locator('..');
      const initialCount = parseInt(
        (await activeStatCard.locator('.text-2xl.font-bold.text-white').textContent()) || '0'
      );

      // Create a new token
      const testEmail = `stats-test-${Date.now()}@example.com`;

      await page.click('button:has-text("Create Token")');
      await page.waitForTimeout(500);

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await emailInput.fill(testEmail);

      const createButton = page.locator('button:has-text("Create"), button:has-text("Generate")').last();
      await createButton.click();

      await expect(page.locator('text=/created successfully|token created/i')).toBeVisible({ timeout: 10000 });

      const closeButton = page.locator('button:has-text("Close"), button:has-text("Done")').last();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }

      // Wait for stats to update
      await page.waitForTimeout(2000);

      // Verify active count increased
      const newCount = parseInt(
        (await activeStatCard.locator('.text-2xl.font-bold.text-white').textContent()) || '0'
      );
      expect(newCount).toBe(initialCount + 1);
    });

    test('should show correct total of all token statuses', async ({ page }) => {
      // Get all stat counts
      const activeCount = parseInt(
        (await page.locator('text=Active Tokens').locator('..').locator('.text-2xl.font-bold.text-white').textContent()) || '0'
      );
      const usedCount = parseInt(
        (await page.locator('text=Used Tokens').locator('..').locator('.text-2xl.font-bold.text-white').textContent()) || '0'
      );
      const expiredCount = parseInt(
        (await page.locator('text=Expired Tokens').locator('..').locator('.text-2xl.font-bold.text-white').textContent()) || '0'
      );

      const totalStatCount = activeCount + usedCount + expiredCount;

      // Count actual rows in table
      const tokenRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') });
      const actualRowCount = await tokenRows.count();

      // Total should match (or table might be paginated)
      if (actualRowCount > 0) {
        expect(totalStatCount).toBeGreaterThanOrEqual(actualRowCount);
      }
    });
  });

  test.describe('Date Formatting', () => {
    test('should display formatted dates in table', async ({ page }) => {
      const tokenRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') });

      if (await tokenRows.count() === 0) {
        test.skip();
      }

      const firstRow = tokenRows.first();

      // Get date cells (Created, Expires, Used columns)
      const dateCells = firstRow.locator('td').filter({ hasText: /\d{4}|\w{3}/ });

      if (await dateCells.count() > 0) {
        const dateText = await dateCells.first().textContent();

        // Should be formatted (not ISO timestamp)
        expect(dateText).not.toContain('T');
        expect(dateText).not.toMatch(/^\d{4}-\d{2}-\d{2}/);
      }
    });

    test('should show dash for unused token used_at date', async ({ page }) => {
      const activeBadges = page.locator('span:has-text("Active")');

      if (await activeBadges.count() === 0) {
        test.skip();
      }

      // Find row with Active badge
      const activeRow = page.locator('tr', { has: activeBadges.first() });

      // Get the "Used" column (5th column)
      const usedCell = activeRow.locator('td').nth(4);
      const usedText = await usedCell.textContent();

      // Should show dash for unused tokens
      expect(usedText?.trim()).toBe('-');
    });
  });

  test.describe('Accessibility', () => {
    test('should pass accessibility audit on tokens page', async ({ page }) => {
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should have accessible delete buttons', async ({ page }) => {
      const deleteButtons = page.locator('button:has-text("Delete")');

      if (await deleteButtons.count() === 0) {
        test.skip();
      }

      // Each delete button should have aria-label or visible text
      for (let i = 0; i < await deleteButtons.count(); i++) {
        const button = deleteButtons.nth(i);
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');

        expect(text?.trim() || ariaLabel).toBeTruthy();
      }
    });

    test('should have accessible table structure', async ({ page }) => {
      const table = page.locator('table');
      await expect(table).toBeVisible();

      // Should have thead and tbody
      await expect(table.locator('thead')).toBeVisible();
      await expect(table.locator('tbody')).toBeVisible();

      // Headers should be in th elements
      const headers = table.locator('th');
      expect(await headers.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      test(`should display tokens page correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin/tokens');
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `tests/artifacts/admin-tokens-${viewport.name}.png`,
          fullPage: true
        });

        // Key elements should be visible
        await expect(page.locator('h1:has-text("Admin Registration Tokens")')).toBeVisible();
        await expect(page.locator('button:has-text("Create Token")')).toBeVisible();
      });

      test(`should display stat cards grid on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin/tokens');
        await page.waitForLoadState('networkidle');

        // All three stat cards should be visible
        await expect(page.locator('text=Active Tokens')).toBeVisible();
        await expect(page.locator('text=Used Tokens')).toBeVisible();
        await expect(page.locator('text=Expired Tokens')).toBeVisible();
      });
    }
  });

  test.describe('Empty State', () => {
    test('should show helpful empty state with no tokens', async ({ page }) => {
      const tokenRows = page.locator('tbody tr').filter({ hasNot: page.locator('text=/No Tokens Yet/i') });

      if (await tokenRows.count() > 0) {
        test.skip(); // Skip if tokens exist
      }

      // Empty state should be visible
      await expect(page.locator('text=/No Tokens Yet/i')).toBeVisible();
      await expect(page.locator('text=/Create your first admin registration token/i')).toBeVisible();

      // Should have icon
      const emptyIcon = page.locator('svg').filter({ has: page.locator('[class*="w-12 h-12"]') });
      if (await emptyIcon.count() > 0) {
        await expect(emptyIcon.first()).toBeVisible();
      }

      // Should have create button in empty state
      const emptyCreateButton = page.locator('button:has-text("Create Token")');
      expect(await emptyCreateButton.count()).toBeGreaterThan(0);
    });
  });
});
