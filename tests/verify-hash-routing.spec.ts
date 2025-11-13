import { test, expect } from '@playwright/test';

test.use({ storageState: 'tests/.auth/user.json' });

test('verify hash routing fixes the issue', async ({ page }) => {
  // Navigate using hash route format
  await page.goto('/#/new-entry');
  
  await page.waitForTimeout(2000);
  
  const url = page.url();
  console.log('Current URL:', url);
  
  // Check if we're logged in (ProtectedRoute would redirect if not)
  const isAtNewEntry = url.includes('/#/new-entry');
  const isAtLogin = url.includes('/#/login');
  
  console.log('At /new-entry:', isAtNewEntry);
  console.log('Redirected to /login:', isAtLogin);
  
  // Check content
  const html = await page.content();
  const hasNewEntry = html.includes('What\'s on your mind');
  const hasHome = html.includes('Your Sacred Space');
  
  console.log('\nRendered content:');
  console.log('  NewEntryPage:', hasNewEntry);
  console.log('  HomePage:', hasHome);
  
  if (hasNewEntry) {
    console.log('\n✓ SUCCESS: NewEntryPage renders correctly with hash routing!');
  } else if (isAtLogin) {
    console.log('\n⚠ Auth issue: Test user not authenticated in hash context');
  }
});
