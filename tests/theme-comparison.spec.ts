import { test, expect } from '@playwright/test';

test.describe('Theme Consistency Investigation', () => {
  test.use({ storageState: 'tests/.auth/user.json' });

  test('capture trash bin page screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/#/trash');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for animations

    await page.screenshot({
      path: 'tests/artifacts/theme-comparison/trash-page.png',
      fullPage: true
    });

    console.log('Trash page screenshot saved');
  });

  test('capture dashboard page screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/artifacts/theme-comparison/dashboard-page.png',
      fullPage: true
    });

    console.log('Dashboard page screenshot saved');
  });

  test('capture search page screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/#/search');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/artifacts/theme-comparison/search-page.png',
      fullPage: true
    });

    console.log('Search page screenshot saved');
  });

  test('capture calendar page screenshot', async ({ page }) => {
    await page.goto('http://localhost:5173/#/calendar');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/artifacts/theme-comparison/calendar-page.png',
      fullPage: true
    });

    console.log('Calendar page screenshot saved');
  });
});
