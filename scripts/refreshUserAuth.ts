import { chromium } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function refreshUserAuth() {
  // Load environment variables from .env.test
  dotenv.config({ path: '.env.test' });

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  if (!email || !password) {
    console.error('Error: E2E_EMAIL and E2E_PASSWORD not found in .env.test');
    process.exit(1);
  }

  console.log('Refreshing user authentication state...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseUrl}/#/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Fill in login credentials
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for successful authentication (may redirect to dashboard or home)
    // Check for Sign Out button which indicates we're logged in
    await page.waitForSelector('button:has-text("Sign Out")', {
      timeout: 30000,
      state: 'visible'
    });

    console.log('User authenticated successfully');

    // Give time for auth state to stabilize
    await page.waitForTimeout(2000);

    // Save storage state to file
    const storageStatePath = path.join(__dirname, '..', 'tests', '.auth', 'user.json');
    await context.storageState({ path: storageStatePath });

    console.log('User authentication state saved to:', storageStatePath);

  } catch (error) {
    console.error('Failed to refresh user authentication:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

refreshUserAuth().catch(error => {
  console.error(error);
  process.exit(1);
});
