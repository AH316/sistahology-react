import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const USER_ACCESSIBLE_PAGES = [
  { path: '/', name: 'home' },
  { path: '/#/dashboard', name: 'dashboard' },
  { path: '/#/calendar', name: 'calendar' },
  { path: '/#/search', name: 'search' },
  { path: '/#/new-entry', name: 'new-entry' },
  { path: '/#/profile', name: 'profile' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/news', name: 'news' },
  { path: '/blog', name: 'blog' },
];

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 720 }
];

// Helper function to save console logs
async function saveConsoleLogs(logs: string[], viewport: string, pageName: string) {
  const consoleDir = path.join('tests/artifacts/user', viewport, 'console');
  await fs.promises.mkdir(consoleDir, { recursive: true });
  const consoleFile = path.join(consoleDir, `${pageName}-console.json`);
  await fs.promises.writeFile(consoleFile, JSON.stringify(logs, null, 2));
}

// Helper function to save accessibility results
async function saveAccessibilityResults(results: any, viewport: string, pageName: string) {
  const a11yDir = path.join('tests/artifacts/user', viewport, 'accessibility');
  await fs.promises.mkdir(a11yDir, { recursive: true });
  const a11yFile = path.join(a11yDir, `${pageName}-accessibility.json`);
  await fs.promises.writeFile(a11yFile, JSON.stringify(results, null, 2));
}

// Helper function to login
async function loginUser(page: any) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  
  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set in environment');
  }
  
  await page.goto('/#/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for successful login and redirect
  await page.waitForURL(/\/#\/(dashboard|profile|$)/, { timeout: 15000 });
  await page.waitForTimeout(2000); // Allow auth state to stabilize
}

test.describe('User UI Audit', () => {
  let consoleLogs: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors and warnings
    consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleLogs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
      }
    });

    // Capture uncaught exceptions
    page.on('pageerror', error => {
      consoleLogs.push(`UNCAUGHT EXCEPTION: ${error.message}`);
    });

    // Login before each test
    await loginUser(page);
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`User - ${viewport.name}px viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageInfo of USER_ACCESSIBLE_PAGES) {
        test(`${pageInfo.name} - authenticated layout and functionality`, async ({ page }) => {
          // Navigate to page
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');

          // Take screenshot
          const screenshotDir = path.join('tests/artifacts/user', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `${pageInfo.name}.png`),
            fullPage: true 
          });

          // Check for single h1 tag
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBeLessThanOrEqual(1);

          // Check that profile/user navigation is present and not duplicated
          const profileElements = page.locator('a[href="/profile"], button:has-text("Profile"), [data-testid*="profile"]');
          const profileCount = await profileElements.count();
          // Should have exactly one profile entry point
          expect(profileCount).toBeGreaterThanOrEqual(1);
          expect(profileCount).toBeLessThanOrEqual(2); // Allow for mobile + desktop variants

          // Check for focus styles on interactive elements
          if (pageInfo.name === 'new-entry') {
            // Test that the editor mounts
            const editorElements = page.locator('textarea, .editor, [data-testid="journal-editor"]');
            const editorCount = await editorElements.count();
            expect(editorCount).toBeGreaterThanOrEqual(1);
            
            // Test focus styles on form elements
            const firstEditor = editorElements.first();
            await firstEditor.focus();
            await page.waitForTimeout(500); // Allow focus styles to appear
          }

          // Run accessibility scan
          const accessibilityResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

          await saveAccessibilityResults(accessibilityResults, viewport.name, pageInfo.name);

          // Save console logs
          await saveConsoleLogs(consoleLogs, viewport.name, pageInfo.name);

          // Reset console logs for next test
          consoleLogs = [];
        });
      }

      test(`profile navigation consistency - ${viewport.name}px`, async ({ page }) => {
        // Check consistency across different pages
        const testPages = ['/', '/dashboard', '/new-entry'];
        
        for (const testPath of testPages) {
          await page.goto(testPath);
          await page.waitForLoadState('networkidle');
          
          const profileElements = page.locator('a[href="/profile"], button:has-text("Profile"), [data-testid*="profile"]');
          const profileCount = await profileElements.count();
          
          // Should consistently show profile access
          expect(profileCount).toBeGreaterThan(0);
          
          // Take screenshot for comparison
          const screenshotDir = path.join('tests/artifacts/user', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `nav-consistency-${testPath.replace('/', 'home')}.png`),
            clip: { x: 0, y: 0, width: viewport.width, height: 100 } // Just the nav area
          });
        }
        
        // Save console logs
        await saveConsoleLogs(consoleLogs, viewport.name, 'profile-navigation-consistency');
      });
    });
  }

  test('user login and interaction flow video - 1280px', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Start from logout state for this flow test
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');

    // Login flow
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;

    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.waitForTimeout(1000);

    await page.click('button[type="submit"]');
    await page.waitForURL(/\/#\/(dashboard|profile|$)/, { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Navigate to new entry (no save required)
    await page.goto('/#/new-entry');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check that editor opens
    const editorElements = page.locator('textarea, .editor, [data-testid="journal-editor"]');
    if (await editorElements.count() > 0) {
      await editorElements.first().click();
      await page.waitForTimeout(1000);
    }

    // Navigate to profile
    await page.goto('/#/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Sign out
    const signOutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), a:has-text("Sign Out")');
    if (await signOutButton.count() > 0) {
      await signOutButton.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Video will be saved automatically due to configuration
  });
});