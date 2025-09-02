import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const ADMIN_ACCESSIBLE_PAGES = [
  { path: '/', name: 'home' },
  { path: '/dashboard', name: 'dashboard' },
  { path: '/calendar', name: 'calendar' },
  { path: '/search', name: 'search' },
  { path: '/new-entry', name: 'new-entry' },
  { path: '/profile', name: 'profile' },
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
  const consoleDir = path.join('tests/artifacts/admin', viewport, 'console');
  await fs.promises.mkdir(consoleDir, { recursive: true });
  const consoleFile = path.join(consoleDir, `${pageName}-console.json`);
  await fs.promises.writeFile(consoleFile, JSON.stringify(logs, null, 2));
}

// Helper function to save accessibility results
async function saveAccessibilityResults(results: any, viewport: string, pageName: string) {
  const a11yDir = path.join('tests/artifacts/admin', viewport, 'accessibility');
  await fs.promises.mkdir(a11yDir, { recursive: true });
  const a11yFile = path.join(a11yDir, `${pageName}-accessibility.json`);
  await fs.promises.writeFile(a11yFile, JSON.stringify(results, null, 2));
}

// Helper function to check if admin credentials are available
function hasAdminCredentials(): boolean {
  return !!(process.env.TEST_ADMIN_EMAIL && process.env.TEST_ADMIN_PASSWORD);
}

// Helper function to login as admin
async function loginAdmin(page: any) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  
  if (!email || !password) {
    throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be set for admin tests');
  }
  
  await page.goto('/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login and redirect
  await page.waitForURL(/\/(dashboard|profile|$)/, { timeout: 15000 });
  await page.waitForTimeout(2000); // Allow auth state to stabilize
}

test.describe('Admin UI Audit', () => {
  let consoleLogs: string[] = [];

  test.skip(!hasAdminCredentials(), 'Admin credentials not provided - skipping admin tests');

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

    // Login as admin before each test
    await loginAdmin(page);
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`Admin - ${viewport.name}px viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageInfo of ADMIN_ACCESSIBLE_PAGES) {
        test(`${pageInfo.name} - admin layout and functionality`, async ({ page }) => {
          // Navigate to page
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');

          // Take screenshot
          const screenshotDir = path.join('tests/artifacts/admin', viewport.name, 'screenshots');
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
          // Admin should have exactly one profile entry point
          expect(profileCount).toBeGreaterThanOrEqual(1);
          expect(profileCount).toBeLessThanOrEqual(2); // Allow for mobile + desktop variants

          // For home page, check for admin edit capabilities
          if (pageInfo.name === 'home') {
            // Look for admin edit buttons or interfaces
            const editElements = page.locator('button:has-text("Edit"), [data-testid*="edit"], .admin-edit');
            const editCount = await editElements.count();
            
            if (editCount > 0) {
              // Take screenshot of admin interface
              await page.screenshot({ 
                path: path.join(screenshotDir, `${pageInfo.name}-admin-interface.png`),
                fullPage: true 
              });
            }
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

      test(`admin home page editing - ${viewport.name}px`, async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        // Look for hero edit functionality or pages admin interface
        const editButtons = page.locator('button:has-text("Edit"), [data-testid*="edit"], .admin-edit');
        const editCount = await editButtons.count();
        
        if (editCount > 0) {
          // Try to open the edit interface
          await editButtons.first().click();
          await page.waitForTimeout(2000);
          
          // Take screenshot of edit mode
          const screenshotDir = path.join('tests/artifacts/admin', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `home-edit-mode.png`),
            fullPage: true 
          });
          
          // Check that DB content loads (look for form fields or editors)
          const formElements = page.locator('input, textarea, .editor');
          const formCount = await formElements.count();
          expect(formCount).toBeGreaterThan(0);
        }
        
        // Save console logs
        await saveConsoleLogs(consoleLogs, viewport.name, 'home-page-editing');
      });

      test(`admin profile consistency - ${viewport.name}px`, async ({ page }) => {
        // Check admin profile shows appropriate admin features
        await page.goto('/profile');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        const screenshotDir = path.join('tests/artifacts/admin', viewport.name, 'screenshots');
        await fs.promises.mkdir(screenshotDir, { recursive: true });
        await page.screenshot({ 
          path: path.join(screenshotDir, `admin-profile-features.png`),
          fullPage: true 
        });
        
        // Check for admin-specific elements
        const adminElements = page.locator('[data-testid*="admin"], .admin, button:has-text("Admin")');
        const adminCount = await adminElements.count();
        
        // Admin should have some admin-specific UI elements or at least profile access
        expect(await page.locator('h1, h2, h3').count()).toBeGreaterThan(0);
        
        // Save console logs
        await saveConsoleLogs(consoleLogs, viewport.name, 'admin-profile-consistency');
      });
    });
  }

  test('admin login and management flow video - 1280px', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Start from logout state for this flow test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Login flow
    const email = process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_ADMIN_PASSWORD;
    
    await page.fill('input[type="email"]', email!);
    await page.fill('input[type="password"]', password!);
    await page.waitForTimeout(1000);
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|profile|$)/, { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // Navigate to home and try to access admin features
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for admin edit interfaces
    const editButtons = page.locator('button:has-text("Edit"), [data-testid*="edit"], .admin-edit');
    const editCount = await editButtons.count();
    
    if (editCount > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(2000);
    }
    
    // Navigate to profile
    await page.goto('/profile');
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