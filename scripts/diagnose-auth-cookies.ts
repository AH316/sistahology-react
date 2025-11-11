import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function diagnoseAuthCookies() {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const baseUrl = process.env.BASE_URL || 'http://localhost:4173';

  if (!email || !password) {
    console.error('Error: E2E_EMAIL and E2E_PASSWORD required in .env.test');
    process.exit(1);
  }

  console.log('\n=== DIAGNOSTIC: Auth Cookie Capture ===\n');
  console.log(`Testing login at: ${baseUrl}`);
  console.log(`User: ${email}\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login
    console.log('1. Navigating to login page...');
    await page.goto(`${baseUrl}/#/login`);
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });

    // Check cookies BEFORE login
    console.log('\n2. Cookies BEFORE login:');
    const cookiesBefore = await context.cookies();
    console.log(`   Count: ${cookiesBefore.length}`);
    if (cookiesBefore.length > 0) {
      cookiesBefore.forEach(cookie => {
        console.log(`   - ${cookie.name} (domain: ${cookie.domain}, path: ${cookie.path})`);
      });
    }

    // Check localStorage BEFORE login
    console.log('\n3. LocalStorage BEFORE login:');
    const localStorageBefore = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) items[key] = localStorage.getItem(key) || '';
      }
      return items;
    });
    console.log(`   Count: ${Object.keys(localStorageBefore).length}`);
    Object.keys(localStorageBefore).forEach(key => {
      console.log(`   - ${key}: ${localStorageBefore[key].substring(0, 50)}...`);
    });

    // Perform login
    console.log('\n4. Performing login...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect
    console.log('5. Waiting for redirect...');
    await page.waitForURL(new RegExp(`${baseUrl}/#/(dashboard|)`), { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check cookies AFTER login
    console.log('\n6. Cookies AFTER login:');
    const cookiesAfter = await context.cookies();
    console.log(`   Count: ${cookiesAfter.length}`);
    if (cookiesAfter.length > 0) {
      cookiesAfter.forEach(cookie => {
        console.log(`   - ${cookie.name} (domain: ${cookie.domain}, path: ${cookie.path}, httpOnly: ${cookie.httpOnly}, secure: ${cookie.secure})`);
      });
    } else {
      console.log('   ⚠️  NO COOKIES FOUND - This is the problem!');
    }

    // Check localStorage AFTER login
    console.log('\n7. LocalStorage AFTER login:');
    const localStorageAfter = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) items[key] = localStorage.getItem(key) || '';
      }
      return items;
    });
    console.log(`   Count: ${Object.keys(localStorageAfter).length}`);
    Object.keys(localStorageAfter).forEach(key => {
      const value = localStorageAfter[key];
      if (key.includes('auth')) {
        console.log(`   - ${key}: (${value.length} chars) ${value.substring(0, 100)}...`);
      } else {
        console.log(`   - ${key}: ${value}`);
      }
    });

    // Test storageState capture
    console.log('\n8. Testing storageState capture...');
    const storageState = await context.storageState();
    console.log(`   Cookies in storageState: ${storageState.cookies.length}`);
    console.log(`   Origins in storageState: ${storageState.origins.length}`);
    storageState.origins.forEach(origin => {
      console.log(`   Origin: ${origin.origin}`);
      console.log(`   LocalStorage items: ${origin.localStorage.length}`);
      origin.localStorage.forEach(item => {
        console.log(`      - ${item.name}: ${item.value.substring(0, 50)}...`);
      });
    });

    // Diagnosis
    console.log('\n=== DIAGNOSIS ===\n');
    if (cookiesAfter.length === 0 && Object.keys(localStorageAfter).length > 0) {
      console.log('✓ CONFIRMED: Supabase is using localStorage-only mode');
      console.log('✓ This is the default behavior for Supabase JS client');
      console.log('✓ No cookies are set, all auth data stored in localStorage');
      console.log('✓ This means your auth capture script is WORKING CORRECTLY');
      console.log('\nThe issue is NOT with cookie capture - Supabase simply doesn\'t use cookies by default.');
      console.log('The test failures must be from a different root cause.');
    } else if (cookiesAfter.length > 0) {
      console.log('⚠️  UNEXPECTED: Cookies were found');
      console.log('This suggests Supabase is configured to use cookies');
      console.log('We need to verify these are being captured correctly');
    }

  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

diagnoseAuthCookies();
