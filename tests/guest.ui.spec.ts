import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const PUBLIC_PAGES = [
  { path: '/', name: 'home' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/forgot-password', name: 'forgot-password' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/news', name: 'news' },
  { path: '/blog', name: 'blog' },
];

const PROTECTED_PAGES = [
  '/dashboard',
  '/calendar', 
  '/search',
  '/new-entry',
  '/profile'
];

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 1024 },
  { name: '1280', width: 1280, height: 720 }
];

// Helper function to save console logs
async function saveConsoleLogs(logs: string[], viewport: string, pageName: string) {
  const consoleDir = path.join('tests/artifacts/guest', viewport, 'console');
  await fs.promises.mkdir(consoleDir, { recursive: true });
  const consoleFile = path.join(consoleDir, `${pageName}-console.json`);
  await fs.promises.writeFile(consoleFile, JSON.stringify(logs, null, 2));
}

// Helper function to save accessibility results
async function saveAccessibilityResults(results: any, viewport: string, pageName: string) {
  const a11yDir = path.join('tests/artifacts/guest', viewport, 'accessibility');
  await fs.promises.mkdir(a11yDir, { recursive: true });
  const a11yFile = path.join(a11yDir, `${pageName}-accessibility.json`);
  await fs.promises.writeFile(a11yFile, JSON.stringify(results, null, 2));
}

test.describe('Guest UI Audit', () => {
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
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`Guest - ${viewport.name}px viewport`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const pageInfo of PUBLIC_PAGES) {
        test(`${pageInfo.name} - layout and functionality`, async ({ page }) => {
          // Navigate to page
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');

          // Take screenshot
          const screenshotDir = path.join('tests/artifacts/guest', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `${pageInfo.name}.png`),
            fullPage: true 
          });

          // Check for single h1 tag
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBeLessThanOrEqual(1);
          
          if (h1Count === 1) {
            const h1Text = await page.locator('h1').textContent();
            expect(h1Text).toBeTruthy();
          }

          // Check that navigation behaves correctly (no profile link for guest)
          const profileLinks = page.locator('a[href="/profile"], button:has-text("Profile")');
          const profileCount = await profileLinks.count();
          expect(profileCount).toBe(0);

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

      test(`protected route redirects - ${viewport.name}px`, async ({ page }) => {
        for (const protectedPath of PROTECTED_PAGES) {
          // Try to access protected route
          await page.goto(protectedPath);
          
          // Should redirect to login
          await expect(page).toHaveURL(/\/login/);
          
          // Take screenshot of redirect
          const screenshotDir = path.join('tests/artifacts/guest', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `redirect-from-${protectedPath.replace('/', '')}.png`),
            fullPage: true 
          });
        }

        // Save console logs for redirects
        await saveConsoleLogs(consoleLogs, viewport.name, 'protected-redirects');
      });

      // Sample blog slug test (if available)
      test(`blog post slug - ${viewport.name}px`, async ({ page }) => {
        // First check if there are any blog posts
        await page.goto('/blog');
        await page.waitForLoadState('networkidle');
        
        const blogLinks = page.locator('a[href^="/blog/"]:not([href="/blog"])');
        const blogLinkCount = await blogLinks.count();
        
        if (blogLinkCount > 0) {
          // Click the first blog post link
          const firstBlogLink = blogLinks.first();
          const href = await firstBlogLink.getAttribute('href');
          
          await page.goto(href!);
          await page.waitForLoadState('networkidle');
          
          // Take screenshot
          const screenshotDir = path.join('tests/artifacts/guest', viewport.name, 'screenshots');
          await fs.promises.mkdir(screenshotDir, { recursive: true });
          await page.screenshot({ 
            path: path.join(screenshotDir, `blog-post-sample.png`),
            fullPage: true 
          });
          
          // Check for single h1
          const h1Count = await page.locator('h1').count();
          expect(h1Count).toBeLessThanOrEqual(1);
          
          // Run accessibility scan
          const accessibilityResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

          await saveAccessibilityResults(accessibilityResults, viewport.name, 'blog-post-sample');
        }
        
        // Save console logs
        await saveConsoleLogs(consoleLogs, viewport.name, 'blog-slug-test');
      });
    });
  }

  test('guest navigation flow video - 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Start video recording
    const context = page.context();
    
    // Home → Login → attempt protected route redirect flow
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Navigate to login
    await page.click('a[href="/login"], button:has-text("Login"), button:has-text("Sign In")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Try to access protected route (should redirect back to login)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify we're back at login
    await expect(page).toHaveURL(/\/login/);
    
    // Video will be saved automatically due to video: 'retain-on-failure' config
    // and we can trigger it by failing a assertion at the end if needed
  });
});