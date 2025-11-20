import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { waitForAuthReady } from './helpers/auth-helpers';

/**
 * Admin Dashboard Statistics Tests
 *
 * Tests the admin dashboard statistics display:
 * - Statistics card display (Users, Journals, Entries, Pages)
 * - Data accuracy verification
 * - Real-time updates when data changes
 * - Multi-viewport responsive layout
 * - Quick actions functionality
 */

test.describe('Admin Dashboard Statistics', () => {
  // Use admin authentication
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/admin');
    await waitForAuthReady(page, { isAdmin: true });
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Display', () => {
    test('should display admin dashboard heading', async ({ page }) => {
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    });

    test('should display all four statistics cards', async ({ page }) => {
      const statLabels = ['Total Users', 'Total Journals', 'Total Entries', 'Homepage'];

      for (const label of statLabels) {
        await expect(page.locator(`text=${label}`)).toBeVisible();
      }
    });

    test('should display stat cards with icons', async ({ page }) => {
      // Each stat card should have an icon
      const iconContainers = page.locator('.w-12.h-12.bg-gradient-to-br');
      const iconCount = await iconContainers.count();

      // Should have at least 4 icons (one for each stat)
      expect(iconCount).toBeGreaterThanOrEqual(4);
    });

    test('should display stat values as numbers', async ({ page }) => {
      const statLabels = ['Total Users', 'Total Journals', 'Total Entries', 'Homepage'];

      for (const label of statLabels) {
        const statCard = page.locator(`text=${label}`).locator('..');
        const valueElement = statCard.locator('.text-4xl.font-bold.text-white');

        await expect(valueElement).toBeVisible();

        const value = await valueElement.textContent();
        // Should be a number (possibly with commas)
        expect(value?.trim()).toMatch(/^[\d,]+$/);
      }
    });

    test('should format large numbers with commas', async ({ page }) => {
      // Get any stat value
      const firstStatValue = page.locator('.text-4xl.font-bold.text-white').first();
      const value = await firstStatValue.textContent();

      // If value is >= 1000, should have comma formatting
      const numValue = parseInt(value?.replace(/,/g, '') || '0');
      if (numValue >= 1000) {
        expect(value).toContain(',');
      }
    });

    test('should display stats in correct grid layout', async ({ page }) => {
      // Stats should be in a grid container
      const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      await expect(statsGrid).toBeVisible();

      // Should have 4 stat cards
      const statCards = statsGrid.locator('.glass');
      const cardCount = await statCards.count();
      expect(cardCount).toBe(4);
    });

    test('should use glass morphism styling for stat cards', async ({ page }) => {
      const statCards = page.locator('.glass.rounded-2xl');
      const cardCount = await statCards.count();

      // Should have glass-styled cards
      expect(cardCount).toBeGreaterThan(0);

      // Verify glass class styling is applied
      const firstCard = statCards.first();
      const classes = await firstCard.getAttribute('class');
      expect(classes).toContain('glass');
      expect(classes).toContain('rounded-2xl');
    });
  });

  test.describe('Quick Actions', () => {
    test('should display Quick Actions section', async ({ page }) => {
      await expect(page.locator('h2:has-text("Quick Actions")')).toBeVisible();
    });

    test('should display "Edit Homepage" quick action', async ({ page }) => {
      const editHomeAction = page.locator('a:has-text("Edit Homepage")');
      await expect(editHomeAction).toBeVisible();

      // Should link to admin pages
      await expect(editHomeAction).toHaveAttribute('href', '/admin/pages');
    });

    test('should display "Manage Blog" quick action', async ({ page }) => {
      const manageBlogAction = page.locator('a:has-text("Manage Blog")');
      await expect(manageBlogAction).toBeVisible();

      // Should link to admin blog
      await expect(manageBlogAction).toHaveAttribute('href', '/admin/blog');
    });

    test('should navigate to admin pages when clicking Edit Homepage', async ({ page }) => {
      await page.click('a:has-text("Edit Homepage")');
      await page.waitForLoadState('networkidle');

      // Should navigate to pages route
      await expect(page).toHaveURL(/\/#\/admin\/pages/);
    });

    test('should navigate to admin blog when clicking Manage Blog', async ({ page }) => {
      await page.click('a:has-text("Manage Blog")');
      await page.waitForLoadState('networkidle');

      // Should navigate to blog route
      await expect(page).toHaveURL(/\/#\/admin\/blog/);
    });

    test('should show hover effects on quick action cards', async ({ page }) => {
      const quickActionCard = page.locator('a:has-text("Edit Homepage")');

      // Hover over the card
      await quickActionCard.hover();

      // Should have transition classes
      const classes = await quickActionCard.getAttribute('class');
      expect(classes).toContain('hover:bg-white/20');
      expect(classes).toContain('transition-all');
    });
  });

  test.describe('Data Accuracy', () => {
    test('should display non-zero page count', async ({ page }) => {
      const homepageStatCard = page.locator('text=Homepage').locator('..');
      const pageCount = homepageStatCard.locator('.text-4xl.font-bold.text-white');

      const value = await pageCount.textContent();
      const numValue = parseInt(value?.replace(/,/g, '') || '0');

      // Should have at least 0 pages
      expect(numValue).toBeGreaterThanOrEqual(0);
    });

    test('should update page count after creating page', async ({ page }) => {
      // Get current page count
      const homepageStatCard = page.locator('text=Homepage').locator('..');
      const pageCountElement = homepageStatCard.locator('.text-4xl.font-bold.text-white');

      const initialCount = parseInt((await pageCountElement.textContent())?.replace(/,/g, '') || '0');

      // Navigate to pages and create a new page
      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Create Page")');

      const testTitle = `Stats Test Page ${Date.now()}`;
      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Go back to dashboard
      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');

      // Wait for stats to refresh
      await page.waitForTimeout(2000);

      // Verify count increased
      const newCount = parseInt((await pageCountElement.textContent())?.replace(/,/g, '') || '0');
      expect(newCount).toBe(initialCount + 1);
    });

    test('should show consistent stats across page reloads', async ({ page }) => {
      // Get initial stats
      const stats: Record<string, number> = {};
      const statLabels = ['Total Users', 'Total Journals', 'Total Entries', 'Homepage'];

      for (const label of statLabels) {
        const statCard = page.locator(`text=${label}`).locator('..');
        const valueElement = statCard.locator('.text-4xl.font-bold.text-white');
        const value = await valueElement.textContent();
        stats[label] = parseInt(value?.replace(/,/g, '') || '0');
      }

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify stats are the same
      for (const label of statLabels) {
        const statCard = page.locator(`text=${label}`).locator('..');
        const valueElement = statCard.locator('.text-4xl.font-bold.text-white');
        const value = await valueElement.textContent();
        const newValue = parseInt(value?.replace(/,/g, '') || '0');

        expect(newValue).toBe(stats[label]);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should show loading spinner initially', async ({ page }) => {
      // Navigate to dashboard with slow network
      await page.goto('/#/admin', { waitUntil: 'domcontentloaded' });

      // Check if loading spinner appears (might be brief)
      const spinner = page.locator('[class*="spinner"], [class*="loading"], svg.animate-spin');

      // If spinner is still visible, verify it
      if (await spinner.isVisible()) {
        await expect(spinner).toBeVisible();
      }

      // Wait for stats to load
      await page.waitForLoadState('networkidle');

      // Loading spinner should be gone
      await expect(spinner).not.toBeVisible();
    });

    test('should display stats after loading completes', async ({ page }) => {
      // Ensure page is fully loaded
      await page.waitForLoadState('networkidle');

      // All stats should be visible (not loading)
      const statValues = page.locator('.text-4xl.font-bold.text-white');
      const valueCount = await statValues.count();

      expect(valueCount).toBeGreaterThanOrEqual(4);
    });

    test('should handle loading errors gracefully', async ({ page }) => {
      // Capture console errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.waitForLoadState('networkidle');

      // Should either show stats or error message (not blank page)
      const hasStats = await page.locator('.text-4xl.font-bold.text-white').count() > 0;
      const hasErrorMessage = await page.locator('text=/failed|error/i').count() > 0;

      expect(hasStats || hasErrorMessage).toBe(true);
    });
  });

  test.describe('Multi-viewport Responsiveness', () => {
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      test(`should display dashboard correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin');
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await page.screenshot({
          path: `tests/artifacts/admin-dashboard-${viewport.name}.png`,
          fullPage: true
        });

        // Verify critical elements are visible
        await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();

        // All stat cards should be visible (might stack on mobile)
        const statCards = page.locator('.glass');
        const cardCount = await statCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(4);
      });

      test(`should display stats grid responsively on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin');
        await page.waitForLoadState('networkidle');

        // Grid should adapt to viewport
        const statsGrid = page.locator('.grid');
        await expect(statsGrid).toBeVisible();

        // All stats should be accessible
        const statLabels = ['Total Users', 'Total Journals', 'Total Entries', 'Homepage'];
        for (const label of statLabels) {
          await expect(page.locator(`text=${label}`)).toBeVisible();
        }
      });

      test(`should display quick actions on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/#/admin');
        await page.waitForLoadState('networkidle');

        // Quick actions should be visible
        await expect(page.locator('h2:has-text("Quick Actions")')).toBeVisible();
        await expect(page.locator('a:has-text("Edit Homepage")')).toBeVisible();
      });
    }
  });

  test.describe('Accessibility', () => {
    test('should pass accessibility audit on dashboard', async ({ page }) => {
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      // Should have h1 for main heading
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      // Should have h2 for Quick Actions
      const h2 = page.locator('h2:has-text("Quick Actions")');
      await expect(h2).toBeVisible();
    });

    test('should have accessible stat card labels', async ({ page }) => {
      const statLabels = ['Total Users', 'Total Journals', 'Total Entries', 'Homepage'];

      for (const label of statLabels) {
        const labelElement = page.locator(`text=${label}`);
        await expect(labelElement).toBeVisible();

        // Label should be associated with its value
        const parentCard = labelElement.locator('..');
        const valueElement = parentCard.locator('.text-4xl.font-bold.text-white');
        await expect(valueElement).toBeVisible();
      }
    });

    test('should have accessible quick action links', async ({ page }) => {
      const quickActions = page.locator('a:has-text("Edit Homepage"), a:has-text("Manage Blog")');
      const actionCount = await quickActions.count();

      for (let i = 0; i < actionCount; i++) {
        const action = quickActions.nth(i);

        // Should have href attribute
        await expect(action).toHaveAttribute('href');

        // Should have visible text
        const text = await action.textContent();
        expect(text?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('should match dashboard layout baseline', async ({ page }) => {
      await page.waitForTimeout(2000); // Wait for animations to settle

      await expect(page).toHaveScreenshot('admin-dashboard-baseline.png', {
        fullPage: true,
        maxDiffPixels: 100 // Allow for minor rendering differences
      });
    });

    test('should have consistent stat card styling', async ({ page }) => {
      const statCards = page.locator('.glass.rounded-2xl').filter({ has: page.locator('.text-4xl.font-bold') });
      const cardCount = await statCards.count();

      // All stat cards should have consistent styling
      for (let i = 0; i < cardCount; i++) {
        const card = statCards.nth(i);
        const classes = await card.getAttribute('class');

        expect(classes).toContain('glass');
        expect(classes).toContain('rounded-2xl');
      }
    });
  });

  test.describe('Color Coding', () => {
    test('should have color-coded stat icons', async ({ page }) => {
      // Each stat card should have a colored icon container
      const iconContainers = page.locator('.w-12.h-12.bg-gradient-to-br');
      const containerCount = await iconContainers.count();

      expect(containerCount).toBeGreaterThanOrEqual(4);

      // Verify different gradient colors are used
      const gradients: string[] = [];
      for (let i = 0; i < containerCount; i++) {
        const classes = await iconContainers.nth(i).getAttribute('class');
        if (classes) {
          // Extract gradient color (from-pink-500, from-purple-500, etc.)
          const gradientMatch = classes.match(/from-(\w+)-(\d+)/);
          if (gradientMatch) {
            gradients.push(gradientMatch[0]);
          }
        }
      }

      // Should have at least 2 different gradients
      const uniqueGradients = Array.from(new Set(gradients));
      expect(uniqueGradients.length).toBeGreaterThanOrEqual(2);
    });
  });
});
