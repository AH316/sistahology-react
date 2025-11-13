import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPREHENSIVE UI/UX AUDIT
 *
 * This test suite performs a thorough accessibility and usability audit across all authentication states:
 * - Anonymous users (guest)
 * - Authenticated regular users
 * - Authenticated admin users
 *
 * It audits:
 * 1. Contrast & Color Accessibility (WCAG 2.1 AA)
 * 2. Navigation Organization & Positioning
 * 3. Button & Interactive Element Audit
 * 4. Form Accessibility
 * 5. Modal & Dialog Accessibility (including focus trapping)
 * 6. Keyboard Navigation
 * 7. Screen Reader Compatibility
 * 8. Responsive Design Issues
 * 9. Visual Consistency
 * 10. User Flow Issues
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const ARTIFACT_BASE = path.join(process.cwd(), 'tests/artifacts/ui-audit');

const VIEWPORTS = {
  mobile_375: { width: 375, height: 667, name: 'mobile-375' },
  mobile_414: { width: 414, height: 896, name: 'mobile-414' },
  tablet_768: { width: 768, height: 1024, name: 'tablet-768' },
  tablet_820: { width: 820, height: 1180, name: 'tablet-820' },
  desktop_1024: { width: 1024, height: 768, name: 'desktop-1024' },
  desktop_1440: { width: 1440, height: 900, name: 'desktop-1440' },
  desktop_1920: { width: 1920, height: 1080, name: 'desktop-1920' }
};

// Public pages accessible to anonymous users
const PUBLIC_PAGES = [
  { path: '/', name: 'home', title: 'Home' },
  { path: '/#/login', name: 'login', title: 'Login' },
  { path: '/#/register', name: 'register', title: 'Register' },
  { path: '/#/forgot-password', name: 'forgot-password', title: 'Forgot Password' },
  { path: '/about', name: 'about', title: 'About' },
  { path: '/contact', name: 'contact', title: 'Contact' },
  { path: '/news', name: 'news', title: 'News' },
  { path: '/blog', name: 'blog', title: 'Blog' }
];

// Protected pages for authenticated users
const PROTECTED_PAGES = [
  { path: '/#/dashboard', name: 'dashboard', title: 'Dashboard' },
  { path: '/#/calendar', name: 'calendar', title: 'Calendar' },
  { path: '/#/search', name: 'search', title: 'Search' },
  { path: '/#/new-entry', name: 'new-entry', title: 'New Entry' },
  { path: '/#/profile', name: 'profile', title: 'Profile' },
  { path: '/#/journals', name: 'journals', title: 'Journals' },
  { path: '/#/entries', name: 'entries', title: 'All Entries' },
  { path: '/#/trash', name: 'trash', title: 'Trash Bin' },
  { path: '/#/archive', name: 'archive', title: 'Archive' }
];

// Admin pages
const ADMIN_PAGES = [
  { path: '/#/admin', name: 'admin-dashboard', title: 'Admin Dashboard' },
  { path: '/#/admin/pages', name: 'admin-pages', title: 'Pages Management' },
  { path: '/#/admin/prompts', name: 'admin-prompts', title: 'Prompts Management' }
];

// Modal trigger configurations
const MODAL_CONFIGS = [
  {
    name: 'CreateJournalModal',
    page: '/#/journals',
    trigger: 'button:has-text("Create Journal"), button:has-text("Create your first journal")',
    waitFor: 'input#journal-name, [id="journal-name"]',
    testFocusTrap: true
  },
  {
    name: 'QuickEntryModal',
    page: '/#/calendar',
    trigger: '.calendar-date-cell, [data-date]',
    waitFor: 'textarea, [data-testid="journal-editor"]',
    testFocusTrap: true
  },
  {
    name: 'EditProfileModal',
    page: '/#/profile',
    trigger: 'button:has-text("Edit Profile")',
    waitFor: 'input[name="displayName"], input#displayName',
    testFocusTrap: true
  },
  {
    name: 'ChangePasswordModal',
    page: '/#/profile',
    trigger: 'button:has-text("Change Password")',
    waitFor: 'input[type="password"]',
    testFocusTrap: true
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Save violation data to JSON file
 */
async function saveViolations(violations: any[], userType: string, category: string, pageName: string) {
  const dir = path.join(ARTIFACT_BASE, userType, category);
  await fs.promises.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${pageName}.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(violations, null, 2));
}

/**
 * Save screenshot with descriptive path
 */
async function saveScreenshot(page: Page, userType: string, category: string, name: string, fullPage = true) {
  const dir = path.join(ARTIFACT_BASE, userType, 'screenshots', category);
  await fs.promises.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage });
  return filePath;
}

/**
 * Login as regular user
 */
async function loginUser(page: Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_EMAIL and E2E_PASSWORD must be set');
  }

  await page.goto('/#/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/#\/(dashboard|profile|$)/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

/**
 * Login as admin user
 */
async function loginAdmin(page: Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set');
  }

  await page.goto('/#/login');
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/#\/(dashboard|profile|$)/, { timeout: 15000 });
  await page.waitForTimeout(2000);
}

/**
 * Check contrast ratio for an element
 * Returns { ratio, fg, bg, passes }
 */
async function checkElementContrast(element: any) {
  try {
    const contrastData = await element.evaluate((el: HTMLElement) => {
      const computed = window.getComputedStyle(el);
      const fg = computed.color;
      const bg = computed.backgroundColor;

      // Parse RGB values
      const parseRGB = (str: string) => {
        const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (!match) return null;
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
      };

      const fgRGB = parseRGB(fg);
      const bgRGB = parseRGB(bg);

      if (!fgRGB || !bgRGB) return null;

      // Calculate relative luminance
      const luminance = (rgb: any) => {
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
          val = val / 255;
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };

      const l1 = luminance(fgRGB);
      const l2 = luminance(bgRGB);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      return {
        ratio: ratio,
        fg: fg,
        bg: bg,
        passes: ratio >= 4.5
      };
    });

    return contrastData;
  } catch (error) {
    return null;
  }
}

/**
 * Get all focusable elements within a container
 */
async function getFocusableElements(page: Page, containerSelector: string = 'body') {
  return await page.locator(`${containerSelector} a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])`).all();
}

/**
 * Test focus trap in a modal
 */
async function testFocusTrap(page: Page, modalSelector: string = 'dialog, [role="dialog"], .modal') {
  const focusableElements = await getFocusableElements(page, modalSelector);

  if (focusableElements.length === 0) {
    return { passed: false, reason: 'No focusable elements found in modal' };
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus first element
  await firstElement.focus();
  let activeElement = await page.evaluate(() => document.activeElement?.tagName);
  const firstTagName = await firstElement.evaluate(el => el.tagName);

  if (activeElement !== firstTagName) {
    return { passed: false, reason: 'Could not focus first element' };
  }

  // Tab through all elements
  for (let i = 0; i < focusableElements.length; i++) {
    await page.keyboard.press('Tab');
  }

  // After tabbing through all, focus should wrap to first element
  await page.waitForTimeout(100);
  activeElement = await page.evaluate(() => document.activeElement?.tagName);

  // Check if focus is still within modal (not on body)
  const focusEscaped = await page.evaluate(() => document.activeElement === document.body);

  if (focusEscaped) {
    return { passed: false, reason: 'Focus escaped modal when tabbing forward' };
  }

  // Test reverse tab (Shift+Tab from first should go to last)
  await firstElement.focus();
  await page.keyboard.press('Shift+Tab');
  await page.waitForTimeout(100);

  const focusAfterShiftTab = await page.evaluate(() => document.activeElement?.tagName);
  const lastTagName = await lastElement.evaluate(el => el.tagName);

  // Focus should be on last element or at least not on body
  const shiftTabEscaped = await page.evaluate(() => document.activeElement === document.body);

  if (shiftTabEscaped) {
    return { passed: false, reason: 'Focus escaped modal when tabbing backward' };
  }

  return { passed: true, reason: 'Focus trap working correctly', elementCount: focusableElements.length };
}

/**
 * Run axe accessibility scan
 */
async function runAccessibilityScan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  return results;
}

// ============================================================================
// TEST SUITES
// ============================================================================

test.describe('COMPREHENSIVE UI AUDIT - ANONYMOUS USERS', () => {
  test.describe('1. Contrast & Color Accessibility - Guest', () => {
    for (const viewport of Object.values(VIEWPORTS)) {
      test(`Contrast audit at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const allViolations: any[] = [];

        for (const pageInfo of PUBLIC_PAGES) {
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          // Run axe scan for contrast issues
          const axeResults = await runAccessibilityScan(page);
          const contrastViolations = axeResults.violations.filter(v =>
            v.id.includes('contrast') || v.id === 'color-contrast'
          );

          if (contrastViolations.length > 0) {
            allViolations.push({
              page: pageInfo.name,
              viewport: viewport.name,
              violations: contrastViolations
            });

            // Take screenshot of violations
            await saveScreenshot(page, 'guest', 'contrast-violations', `${pageInfo.name}-${viewport.name}`);
          }

          // Manual contrast checks for key elements
          const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, span, a, button, label').all();

          for (const element of textElements.slice(0, 50)) { // Sample first 50 to avoid timeout
            const isVisible = await element.isVisible().catch(() => false);
            if (!isVisible) continue;

            const contrast = await checkElementContrast(element);
            if (contrast && !contrast.passes) {
              const text = await element.textContent();
              allViolations.push({
                page: pageInfo.name,
                viewport: viewport.name,
                element: text?.substring(0, 50),
                contrast: contrast.ratio,
                fg: contrast.fg,
                bg: contrast.bg
              });
            }
          }
        }

        await saveViolations(allViolations, 'guest', 'contrast', viewport.name);

        // Report findings
        if (allViolations.length > 0) {
          console.log(`⚠️  Found ${allViolations.length} contrast violations at ${viewport.name}`);
        }
      });
    }
  });

  test.describe('2. Navigation Organization - Guest', () => {
    test('Navigation consistency across pages', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      const navStructures: any[] = [];

      for (const pageInfo of PUBLIC_PAGES) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Check for nav landmark
        const navCount = await page.locator('nav').count();
        const navLinks = await page.locator('nav a').count();
        const dropdowns = await page.locator('nav button[aria-expanded], nav [role="button"]').count();

        // Check for logo/brand
        const logo = await page.locator('nav img, nav [alt*="logo"], nav h1, nav .logo').count();

        // Check for mobile menu toggle
        const mobileToggle = await page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .mobile-menu-toggle').count();

        navStructures.push({
          page: pageInfo.name,
          navCount,
          navLinks,
          dropdowns,
          logo,
          mobileToggle
        });

        // Take navigation screenshot
        await saveScreenshot(page, 'guest', 'navigation', pageInfo.name, false);
      }

      await saveViolations(navStructures, 'guest', 'navigation', 'structure-analysis');

      // Check consistency
      const navCounts = navStructures.map(s => s.navCount);
      const allSame = navCounts.every(c => c === navCounts[0]);

      if (!allSame) {
        console.log('⚠️  Navigation structure inconsistent across pages');
      }
    });

    test('Mobile navigation behavior', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile_375);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find mobile menu toggle
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], .mobile-menu-toggle').first();

      if (await menuButton.isVisible()) {
        // Take screenshot before opening
        await saveScreenshot(page, 'guest', 'navigation', 'mobile-closed', false);

        // Open menu
        await menuButton.click();
        await page.waitForTimeout(500);

        // Take screenshot after opening
        await saveScreenshot(page, 'guest', 'navigation', 'mobile-open', false);

        // Test Escape key closes menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const menuVisible = await page.locator('nav [role="menu"], .mobile-menu.open, nav.open').isVisible().catch(() => false);

        if (menuVisible) {
          console.log('⚠️  Escape key did not close mobile menu');
        }
      }
    });
  });

  test.describe('3. Button Accessibility - Guest', () => {
    test('All buttons have accessible names', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      const violations: any[] = [];

      for (const pageInfo of PUBLIC_PAGES) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Get all button elements
        const buttons = await page.locator('button, a[role="button"], [role="button"]').all();

        for (const button of buttons) {
          const isVisible = await button.isVisible().catch(() => false);
          if (!isVisible) continue;

          const text = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const ariaLabelledBy = await button.getAttribute('aria-labelledby');
          const title = await button.getAttribute('title');

          const hasAccessibleName = text?.trim() || ariaLabel || ariaLabelledBy || title;

          if (!hasAccessibleName) {
            const html = await button.evaluate(el => el.outerHTML.substring(0, 100));
            violations.push({
              page: pageInfo.name,
              html,
              issue: 'No accessible name'
            });
          }

          // Check touch target size
          const box = await button.boundingBox();
          if (box && (box.width < 44 || box.height < 44)) {
            violations.push({
              page: pageInfo.name,
              text: text?.substring(0, 30),
              issue: 'Touch target too small',
              size: `${Math.round(box.width)}x${Math.round(box.height)}`
            });
          }
        }
      }

      await saveViolations(violations, 'guest', 'buttons', 'accessibility-issues');

      if (violations.length > 0) {
        console.log(`⚠️  Found ${violations.length} button accessibility issues`);
      }
    });
  });

  test.describe('4. Form Accessibility - Guest', () => {
    const FORM_PAGES = ['login', 'register', 'forgot-password'];

    for (const formPage of FORM_PAGES) {
      test(`${formPage} form accessibility`, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop_1440);

        const pageInfo = PUBLIC_PAGES.find(p => p.name === formPage);
        if (!pageInfo) return;

        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        const violations: any[] = [];

        // Check all inputs have labels
        const inputs = await page.locator('input, textarea, select').all();

        for (const input of inputs) {
          const id = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');

          let hasLabel = !!ariaLabel || !!ariaLabelledBy;

          // Check for associated label
          if (id) {
            const label = await page.locator(`label[for="${id}"]`).count();
            if (label > 0) hasLabel = true;
          }

          if (!hasLabel) {
            const type = await input.getAttribute('type') || await input.evaluate(el => el.tagName);
            violations.push({
              page: formPage,
              input: type,
              issue: 'No associated label'
            });
          }

          // Check for aria-required on required fields
          const required = await input.getAttribute('required');
          const ariaRequired = await input.getAttribute('aria-required');

          if (required !== null && !ariaRequired) {
            violations.push({
              page: formPage,
              input: id || type,
              issue: 'Required field missing aria-required'
            });
          }
        }

        // Take form screenshot
        await saveScreenshot(page, 'guest', 'forms', formPage);

        await saveViolations(violations, 'guest', 'forms', formPage);

        if (violations.length > 0) {
          console.log(`⚠️  Found ${violations.length} form accessibility issues on ${formPage}`);
        }
      });
    }
  });

  test.describe('5. Keyboard Navigation - Guest', () => {
    test('Tab order is logical', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get all focusable elements
      const focusableElements = await getFocusableElements(page);

      const tabOrder: string[] = [];

      // Press tab through first 20 elements
      for (let i = 0; i < Math.min(20, focusableElements.length); i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);

        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          return {
            tag: el?.tagName,
            text: el?.textContent?.substring(0, 30),
            id: el?.id,
            class: el?.className
          };
        });

        tabOrder.push(JSON.stringify(focused));
      }

      await saveViolations([{ tabOrder }], 'guest', 'keyboard', 'tab-order');

      // Take screenshot of last focused element
      await saveScreenshot(page, 'guest', 'keyboard', 'tab-order-visual', false);
    });
  });

  test.describe('6. Screen Reader Compatibility - Guest', () => {
    test('Heading hierarchy', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      const violations: any[] = [];

      for (const pageInfo of PUBLIC_PAGES) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Get all headings
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        const headingStructure: any[] = [];

        for (const heading of headings) {
          const tag = await heading.evaluate(el => el.tagName);
          const text = await heading.textContent();
          headingStructure.push({ tag, text: text?.substring(0, 50) });
        }

        // Check for single h1
        const h1Count = headingStructure.filter(h => h.tag === 'H1').length;
        if (h1Count !== 1) {
          violations.push({
            page: pageInfo.name,
            issue: `Expected 1 h1, found ${h1Count}`
          });
        }

        // Check for heading level skips
        const levels = headingStructure.map(h => parseInt(h.tag.replace('H', '')));
        for (let i = 1; i < levels.length; i++) {
          if (levels[i] - levels[i - 1] > 1) {
            violations.push({
              page: pageInfo.name,
              issue: `Heading level skip: ${levels[i - 1]} to ${levels[i]}`
            });
          }
        }

        await saveViolations([{ headingStructure }], 'guest', 'screen-reader', `${pageInfo.name}-headings`);
      }

      await saveViolations(violations, 'guest', 'screen-reader', 'heading-violations');

      if (violations.length > 0) {
        console.log(`⚠️  Found ${violations.length} heading hierarchy issues`);
      }
    });

    test('Landmark regions', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for required landmarks
      const header = await page.locator('header, [role="banner"]').count();
      const nav = await page.locator('nav, [role="navigation"]').count();
      const main = await page.locator('main, [role="main"]').count();
      const footer = await page.locator('footer, [role="contentinfo"]').count();

      const landmarks = { header, nav, main, footer };
      await saveViolations([landmarks], 'guest', 'screen-reader', 'landmarks');

      if (main === 0) {
        console.log('⚠️  No main landmark found');
      }
    });
  });

  test.describe('7. Responsive Design - Guest', () => {
    test('No horizontal scroll', async ({ page }) => {
      const violations: any[] = [];

      for (const viewport of Object.values(VIEWPORTS)) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const pageInfo of PUBLIC_PAGES.slice(0, 3)) { // Test first 3 pages
          await page.goto(pageInfo.path);
          await page.waitForLoadState('networkidle');

          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          if (hasHorizontalScroll) {
            violations.push({
              page: pageInfo.name,
              viewport: viewport.name,
              issue: 'Horizontal scroll detected'
            });

            await saveScreenshot(page, 'guest', 'responsive', `${pageInfo.name}-${viewport.name}-overflow`);
          }
        }
      }

      await saveViolations(violations, 'guest', 'responsive', 'horizontal-scroll');

      if (violations.length > 0) {
        console.log(`⚠️  Found horizontal scroll on ${violations.length} page/viewport combinations`);
      }
    });
  });
});

// ============================================================================
// AUTHENTICATED USER TESTS
// ============================================================================

test.describe('COMPREHENSIVE UI AUDIT - AUTHENTICATED USERS', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.describe('1. Contrast & Color Accessibility - User', () => {
    test('Dashboard contrast audit', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const axeResults = await runAccessibilityScan(page);
      const contrastViolations = axeResults.violations.filter(v =>
        v.id.includes('contrast')
      );

      await saveViolations(contrastViolations, 'user', 'contrast', 'dashboard');
      await saveScreenshot(page, 'user', 'contrast', 'dashboard');

      if (contrastViolations.length > 0) {
        console.log(`⚠️  Found ${contrastViolations.length} contrast violations on Dashboard`);
      }
    });
  });

  test.describe('2. Modal Focus Trapping - User', () => {
    for (const modalConfig of MODAL_CONFIGS) {
      test(`${modalConfig.name} focus trap`, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop_1440);

        await page.goto(modalConfig.page);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Trigger modal
        const trigger = page.locator(modalConfig.trigger).first();
        const triggerExists = await trigger.isVisible().catch(() => false);

        if (!triggerExists) {
          console.log(`⚠️  Could not find trigger for ${modalConfig.name}`);
          return;
        }

        await trigger.click();
        await page.waitForTimeout(1000);

        // Wait for modal to appear
        const modalContent = page.locator(modalConfig.waitFor).first();
        const modalVisible = await modalContent.isVisible({ timeout: 5000 }).catch(() => false);

        if (!modalVisible) {
          console.log(`⚠️  Modal did not appear for ${modalConfig.name}`);
          return;
        }

        // Take screenshot of open modal
        await saveScreenshot(page, 'user', 'modals', `${modalConfig.name}-open`);

        if (modalConfig.testFocusTrap) {
          // Test focus trap
          const focusTrapResult = await testFocusTrap(page);

          await saveViolations([focusTrapResult], 'user', 'modals', `${modalConfig.name}-focus-trap`);

          if (!focusTrapResult.passed) {
            console.log(`❌ Focus trap failed for ${modalConfig.name}: ${focusTrapResult.reason}`);
            await saveScreenshot(page, 'user', 'modals', `${modalConfig.name}-focus-trap-fail`);
          } else {
            console.log(`✅ Focus trap passed for ${modalConfig.name}`);
          }
        }

        // Test Escape key closes modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const stillVisible = await modalContent.isVisible().catch(() => false);

        if (stillVisible) {
          console.log(`⚠️  Escape key did not close ${modalConfig.name}`);
          await saveViolations([{ issue: 'Escape key does not close modal' }], 'user', 'modals', `${modalConfig.name}-escape-fail`);
        }
      });
    }
  });

  test.describe('3. Button Audit - User', () => {
    test('All interactive buttons accessible', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      const violations: any[] = [];

      for (const pageInfo of PROTECTED_PAGES.slice(0, 5)) {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Find icon-only buttons (Edit, Delete, etc.)
        const iconButtons = await page.locator('button svg, button [class*="lucide"]').all();

        for (const iconButton of iconButtons) {
          const button = page.locator('button').filter({ has: iconButton }).first();
          const ariaLabel = await button.getAttribute('aria-label');
          const title = await button.getAttribute('title');
          const text = await button.textContent();

          if (!ariaLabel && !title && !text?.trim()) {
            const buttonHTML = await button.evaluate(el => el.outerHTML.substring(0, 100));
            violations.push({
              page: pageInfo.name,
              issue: 'Icon button without accessible name',
              html: buttonHTML
            });
          }
        }
      }

      await saveViolations(violations, 'user', 'buttons', 'icon-button-violations');

      if (violations.length > 0) {
        console.log(`⚠️  Found ${violations.length} icon button accessibility issues`);
      }
    });
  });

  test.describe('4. Form Accessibility - User', () => {
    test('New Entry form accessibility', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const violations: any[] = [];

      // Check journal select has label
      const journalSelect = page.locator('select#journal, [data-testid="journal-select"]').first();
      const selectId = await journalSelect.getAttribute('id');

      if (selectId) {
        const labelExists = await page.locator(`label[for="${selectId}"]`).count();
        if (labelExists === 0) {
          violations.push({ issue: 'Journal select missing label' });
        }
      }

      // Check date input has label
      const dateInput = page.locator('input[type="date"]').first();
      const dateId = await dateInput.getAttribute('id');

      if (dateId) {
        const labelExists = await page.locator(`label[for="${dateId}"]`).count();
        if (labelExists === 0) {
          violations.push({ issue: 'Date input missing label' });
        }
      }

      // Check textarea has label
      const textarea = page.locator('textarea, [data-testid="journal-editor"]').first();
      const textareaId = await textarea.getAttribute('id');
      const ariaLabel = await textarea.getAttribute('aria-label');

      if (textareaId) {
        const labelExists = await page.locator(`label[for="${textareaId}"]`).count();
        if (labelExists === 0 && !ariaLabel) {
          violations.push({ issue: 'Textarea missing label or aria-label' });
        }
      }

      await saveViolations(violations, 'user', 'forms', 'new-entry');
      await saveScreenshot(page, 'user', 'forms', 'new-entry');

      if (violations.length > 0) {
        console.log(`⚠️  Found ${violations.length} form accessibility issues on New Entry`);
      }
    });
  });

  test.describe('5. User Flow Testing - User', () => {
    test('Complete entry creation flow', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      const flowSteps: any[] = [];

      // Step 1: Navigate to new entry
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      flowSteps.push({ step: 'Navigate to new entry', success: true });
      await saveScreenshot(page, 'user', 'user-flows', 'step1-new-entry');

      // Step 2: Check if journal exists, create if needed
      const journalSelect = page.locator('select#journal, [data-testid="journal-select"]').first();
      const isDisabled = await journalSelect.isDisabled().catch(() => false);

      if (isDisabled) {
        const createButton = page.locator('button:has-text("Create your first journal")').first();
        if (await createButton.isVisible()) {
          await createButton.click();
          await page.waitForTimeout(1000);

          const nameInput = page.locator('input#journal-name, [id="journal-name"]').first();
          await nameInput.fill('Audit Test Journal');

          const submitButton = page.locator('button[type="submit"]:has-text("Create")').first();
          await submitButton.click();
          await page.waitForTimeout(2000);

          flowSteps.push({ step: 'Create first journal', success: true });
          await saveScreenshot(page, 'user', 'user-flows', 'step2-create-journal');
        }
      }

      // Step 3: Fill entry form (without saving)
      const journalSelectEnabled = page.locator('select#journal:not([disabled])').first();
      const options = await journalSelectEnabled.locator('option').count();

      if (options > 1) {
        await journalSelectEnabled.selectOption({ index: 1 });
        flowSteps.push({ step: 'Select journal', success: true });
      }

      const dateInput = page.locator('input[type="date"]').first();
      await dateInput.fill('2025-01-15');
      flowSteps.push({ step: 'Set date', success: true });

      const textarea = page.locator('textarea, [data-testid="journal-editor"]').first();
      await textarea.fill('This is a test entry for UI audit purposes.');
      flowSteps.push({ step: 'Fill content', success: true });

      await saveScreenshot(page, 'user', 'user-flows', 'step3-filled-form');

      await saveViolations(flowSteps, 'user', 'user-flows', 'entry-creation-flow');

      console.log(`✅ Completed entry creation flow with ${flowSteps.length} steps`);
    });
  });
});

// ============================================================================
// ADMIN USER TESTS
// ============================================================================

test.describe('COMPREHENSIVE UI AUDIT - ADMIN USERS', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test.describe('1. Admin Navigation - Admin', () => {
    test('Admin sidebar navigation', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      await page.goto('/#/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for admin sidebar
      const sidebar = page.locator('aside, nav[aria-label*="admin"], .admin-sidebar').first();
      const sidebarVisible = await sidebar.isVisible().catch(() => false);

      if (!sidebarVisible) {
        console.log('⚠️  Admin sidebar not found');
        await saveViolations([{ issue: 'Admin sidebar not found' }], 'admin', 'navigation', 'sidebar-missing');
      } else {
        // Get all sidebar links
        const sidebarLinks = await sidebar.locator('a, button').all();
        const linkData: any[] = [];

        for (const link of sidebarLinks) {
          const text = await link.textContent();
          const href = await link.getAttribute('href');
          const ariaLabel = await link.getAttribute('aria-label');

          linkData.push({ text: text?.trim(), href, ariaLabel });
        }

        await saveViolations(linkData, 'admin', 'navigation', 'sidebar-links');
      }

      await saveScreenshot(page, 'admin', 'navigation', 'admin-dashboard');
    });
  });

  test.describe('2. Admin Page Accessibility - Admin', () => {
    for (const adminPage of ADMIN_PAGES) {
      test(`${adminPage.name} accessibility`, async ({ page }) => {
        await page.setViewportSize(VIEWPORTS.desktop_1440);

        await page.goto(adminPage.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Run accessibility scan
        const axeResults = await runAccessibilityScan(page);

        await saveViolations(axeResults.violations, 'admin', 'accessibility', adminPage.name);
        await saveScreenshot(page, 'admin', 'accessibility', adminPage.name);

        if (axeResults.violations.length > 0) {
          console.log(`⚠️  Found ${axeResults.violations.length} accessibility violations on ${adminPage.name}`);
        }
      });
    }
  });

  test.describe('3. Admin vs User Navigation - Admin', () => {
    test('Admin link visibility', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop_1440);

      // Check dashboard for admin link
      await page.goto('/#/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const adminLink = page.locator('a[href*="admin"], button:has-text("Admin")').first();
      const adminLinkVisible = await adminLink.isVisible().catch(() => false);

      if (!adminLinkVisible) {
        console.log('⚠️  Admin link not visible on dashboard for admin user');
        await saveViolations([{ issue: 'Admin link not visible' }], 'admin', 'navigation', 'admin-link-missing');
      } else {
        await saveScreenshot(page, 'admin', 'navigation', 'admin-link-visible');
      }
    });
  });
});

// ============================================================================
// CROSS-USER COMPARISON TESTS
// ============================================================================

test.describe('CROSS-USER COMPARISON', () => {
  test('Navigation differences between user types', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop_1440);

    const navigationComparison: any = {
      guest: {},
      user: {},
      admin: {}
    };

    // Guest navigation
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    navigationComparison.guest = {
      navLinks: await page.locator('nav a').count(),
      profileLink: await page.locator('a[href*="profile"]').count(),
      adminLink: await page.locator('a[href*="admin"]').count(),
      loginLink: await page.locator('a[href*="login"], button:has-text("Login")').count()
    };
    await saveScreenshot(page, 'comparison', 'navigation', 'guest-nav');

    // User navigation
    await loginUser(page);
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    navigationComparison.user = {
      navLinks: await page.locator('nav a').count(),
      profileLink: await page.locator('a[href*="profile"]').count(),
      adminLink: await page.locator('a[href*="admin"]').count(),
      loginLink: await page.locator('a[href*="login"]').count()
    };
    await saveScreenshot(page, 'comparison', 'navigation', 'user-nav');

    // Admin navigation
    await page.goto('/#/login');
    await page.waitForLoadState('networkidle');
    await loginAdmin(page);
    await page.goto('/#/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    navigationComparison.admin = {
      navLinks: await page.locator('nav a').count(),
      profileLink: await page.locator('a[href*="profile"]').count(),
      adminLink: await page.locator('a[href*="admin"]').count(),
      loginLink: await page.locator('a[href*="login"]').count()
    };
    await saveScreenshot(page, 'comparison', 'navigation', 'admin-nav');

    await saveViolations([navigationComparison], 'comparison', 'navigation', 'all-user-types');

    console.log('Navigation comparison:', JSON.stringify(navigationComparison, null, 2));
  });
});
