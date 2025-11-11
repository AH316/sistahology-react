import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: '.env.test' });

async function testStorageOrigin() {
  const storageStatePath = path.join(__dirname, '..', 'tests', '.auth', 'user.json');

  console.log('\n=== Testing Storage Origin Mismatch ===\n');

  // Test 1: Using auth state on WRONG origin (dev server)
  console.log('Test 1: Loading auth state on http://localhost:5173 (dev server)');
  const browser1 = await chromium.launch({ headless: false });
  const context1 = await browser1.newContext({
    storageState: storageStatePath
  });
  const page1 = await context1.newPage();

  await page1.goto('http://localhost:5173/#/dashboard');
  await page1.waitForTimeout(3000);

  const localStorage1 = await page1.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) items[key] = localStorage.getItem(key) || '';
    }
    return items;
  });

  const url1 = page1.url();
  console.log(`   Current URL: ${url1}`);
  console.log(`   LocalStorage items: ${Object.keys(localStorage1).length}`);
  Object.keys(localStorage1).forEach(key => {
    console.log(`      - ${key}`);
  });

  if (url1.includes('/login')) {
    console.log('   ❌ REDIRECTED TO LOGIN - Auth state not loaded!');
  } else {
    console.log('   ✓ Stayed on dashboard - Auth state loaded successfully');
  }

  await browser1.close();

  // Test 2: Using auth state on CORRECT origin (preview server)
  console.log('\nTest 2: Loading auth state on http://localhost:4173 (preview server)');
  const browser2 = await chromium.launch({ headless: false });
  const context2 = await browser2.newContext({
    storageState: storageStatePath
  });
  const page2 = await context2.newPage();

  await page2.goto('http://localhost:4173/#/dashboard');
  await page2.waitForTimeout(3000);

  const localStorage2 = await page2.evaluate(() => {
    const items: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) items[key] = localStorage.getItem(key) || '';
    }
    return items;
  });

  const url2 = page2.url();
  console.log(`   Current URL: ${url2}`);
  console.log(`   LocalStorage items: ${Object.keys(localStorage2).length}`);
  Object.keys(localStorage2).forEach(key => {
    console.log(`      - ${key}`);
  });

  if (url2.includes('/login')) {
    console.log('   ❌ REDIRECTED TO LOGIN - Auth state not loaded!');
  } else {
    console.log('   ✓ Stayed on dashboard - Auth state loaded successfully');
  }

  await browser2.close();

  console.log('\n=== ROOT CAUSE ANALYSIS ===\n');
  console.log('The auth state file (tests/.auth/user.json) contains localStorage for:');
  console.log('   http://localhost:4173 (preview server)');
  console.log('\nBut playwright.config.ts runs tests against:');
  console.log('   http://localhost:5173 (dev server)');
  console.log('\nSolution: Either');
  console.log('   1. Generate auth state against http://localhost:5173, OR');
  console.log('   2. Configure playwright to use http://localhost:4173');
  console.log('\nRecommendation: Use dev server (5173) for faster test iterations');
}

testStorageOrigin().catch(console.error);
