import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/.auth/user.json' });

test('investigate new-entry routing and rendering issue', async ({ page, context }) => {
  // Enable detailed logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('NewEntry') || text.includes('GUARD') || text.includes('Auth not ready')) {
      console.log('[PAGE LOG]', text);
    }
  });
  
  await page.goto('/#/dashboard');
  console.log('Loaded dashboard');
  await page.waitForTimeout(2000);
  
  // Now navigate to new-entry
  console.log('Navigating to /new-entry');
  await page.goto('/#/new-entry');
  await page.waitForTimeout(3000);
  
  const url = page.url();
  console.log('Current URL:', url);
  
  // Check if page shows loading spinner
  const spinner = page.locator('text=/Checking authentication|Loading/').first();
  const spinnerVisible = await spinner.isVisible().catch(() => false);
  console.log('Loading spinner visible:', spinnerVisible);
  
  // Get all main h1 elements
  const h1Count = await page.locator('main h1').count();
  console.log('H1 elements in main:', h1Count);
  
  // Try to find NewEntry specific content
  const subHeader = page.locator('div.bg-white\\/20 >> text=New Entry').first();
  const subHeaderVisible = await subHeader.isVisible().catch(() => false);
  console.log('Sub-header "New Entry" visible:', subHeaderVisible);
  
  // Check what component is rendering
  const homepage = page.locator('text=Your Sacred Space').first();
  const homepageVisible = await homepage.isVisible().catch(() => false);
  console.log('Homepage content visible:', homepageVisible);
});
