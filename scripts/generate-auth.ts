import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.test' });

async function generateAuth() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  // IMPORTANT: Must match playwright.config.ts baseURL (dev server for faster iterations)
  const baseUrl = process.env.BASE_URL || 'http://localhost:5173';

  if (!email || !password) {
    console.error('Error: E2E_EMAIL and E2E_PASSWORD required in .env.test');
    process.exit(1);
  }

  console.log(`Generating auth for: ${email}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/#/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect after login (could be / or /dashboard)
    await page.waitForURL(new RegExp(`${baseUrl}/#/(dashboard|)`), { timeout: 30000 });
    await page.waitForTimeout(2000);

    const storageStatePath = path.join(__dirname, '..', 'tests', '.auth', 'user.json');
    await context.storageState({ path: storageStatePath });

    console.log('✓ Authentication state saved to:', storageStatePath);
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

generateAuth();
