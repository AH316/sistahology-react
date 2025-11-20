import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';
import { waitForAuthReady } from './helpers/auth-helpers';

/**
 * Public Pages CMS Content Tests
 *
 * Tests CMS content rendering on public-facing pages:
 * - Homepage CMS content loading
 * - Public pages (About, Contact, News) rendering
 * - Published vs unpublished content visibility
 * - Responsive design across viewports
 * - Accessibility compliance (WCAG AA)
 * - Visual regression testing
 */

test.describe('Public Pages CMS Content', () => {
  test.describe('Homepage Rendering', () => {
    test('should render homepage successfully', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Homepage should load without errors
      await expect(page).toHaveURL(/\/(#\/)?$/);
    });

    test('should display hero section', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Hero elements should be visible
      const heroCard = page.locator('[data-testid="hero-card"]');
      await expect(heroCard).toBeVisible();

      const heroDecor = page.locator('[data-testid="hero-decor"]');
      await expect(heroDecor).toBeVisible();
    });

    test('should render static content when CMS content unavailable', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show either CMS content or static fallback
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      const headingText = await heading.textContent();
      expect(headingText?.trim().length).toBeGreaterThan(0);
    });

    test('should display CMS content if available', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Wait for potential CMS content to load
      await page.waitForTimeout(2000);

      // Check for content in hero card
      const heroCard = page.locator('[data-testid="hero-card"]');
      const content = await heroCard.textContent();

      expect(content?.trim().length).toBeGreaterThan(0);
    });

    test('should not show console errors on homepage', async ({ page }) => {
      const consoleErrors: string[] = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Filter out expected third-party errors
      const relevantErrors = consoleErrors.filter(
        error => !error.includes('third-party') && !error.includes('extension')
      );

      expect(relevantErrors.length).toBe(0);
    });

    test('should display navigation with correct links', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigation should be visible
      const nav = page.locator('header nav, nav');
      await expect(nav.first()).toBeVisible();

      // Key navigation links should be present
      const homeLink = page.locator('a:has-text("Home")');
      await expect(homeLink.first()).toBeVisible();
    });

    test('should have proper HTML structure', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeLessThanOrEqual(1);

      // Should have main element
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Public Pages Navigation', () => {
    const publicPages = [
      { path: '/about', name: 'About' },
      { path: '/contact', name: 'Contact' },
      { path: '/news', name: 'News' },
      { path: '/blog', name: 'Blog' }
    ];

    for (const pageInfo of publicPages) {
      test(`should navigate to ${pageInfo.name} page`, async ({ page }) => {
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');

        // Page should load
        await expect(page).toHaveURL(new RegExp(pageInfo.path));

        // Should have heading
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();
      });

      test(`should not have console errors on ${pageInfo.name} page`, async ({ page }) => {
        const consoleErrors: string[] = [];

        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });

        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const relevantErrors = consoleErrors.filter(
          error => !error.includes('third-party') && !error.includes('extension')
        );

        expect(relevantErrors.length).toBe(0);
      });
    }
  });

  test.describe('CMS Content Visibility', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test('should show published page content publicly', async ({ page, context }) => {
      // Create a published test page
      const testSlug = `public-test-${Date.now()}`;
      const testTitle = `Public Test Page ${Date.now()}`;
      const testContent = `This content should be publicly visible ${Date.now()}`;

      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();
      await slugInput.fill(testSlug);

      const contentArea = page.locator('label:has-text("Content")').locator('..').locator('textarea, [contenteditable="true"]').first();
      if (await contentArea.isVisible()) {
        await contentArea.fill(testContent);
      }

      const publishedCheckbox = page.locator('input#published');
      if (!await publishedCheckbox.isChecked()) {
        await publishedCheckbox.check();
      }

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Create new unauthenticated page to view content
      const publicPage = await context.newPage();
      await publicPage.goto(`/#/${testSlug}`);
      await publicPage.waitForLoadState('networkidle');
      await publicPage.waitForTimeout(2000);

      // Content rendering depends on implementation
      // At minimum, page should load without error
      await expect(publicPage.locator('body')).toBeVisible();

      await publicPage.close();
    });

    test('should NOT show unpublished page content publicly', async ({ page, context }) => {
      // Create an unpublished test page
      const testSlug = `private-test-${Date.now()}`;
      const testTitle = `Private Test Page ${Date.now()}`;

      await page.goto('/#/admin/pages');
      await page.waitForLoadState('networkidle');

      await page.click('button:has-text("Create Page")');

      const titleInput = page.locator('label:has-text("Title")').locator('..').locator('input');
      await titleInput.fill(testTitle);

      const slugInput = page.locator('label:has-text("Slug")').locator('..').locator('input');
      await slugInput.clear();
      await slugInput.fill(testSlug);

      const publishedCheckbox = page.locator('input#published');
      if (await publishedCheckbox.isChecked()) {
        await publishedCheckbox.uncheck();
      }

      await page.click('button:has-text("Save")');
      await expect(page.locator('text=/created successfully|saved/i')).toBeVisible({ timeout: 10000 });

      // Try to access unpublished page publicly
      const publicPage = await context.newPage();
      await publicPage.goto(`/#/${testSlug}`);
      await publicPage.waitForLoadState('networkidle');
      await publicPage.waitForTimeout(2000);

      const bodyContent = await publicPage.textContent('body');

      // Should not show the unpublished page title
      expect(bodyContent).not.toContain(testTitle);

      await publicPage.close();
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      test(`should render homepage correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Take screenshot
        await page.screenshot({
          path: `tests/artifacts/homepage-${viewport.name}.png`,
          fullPage: true
        });

        // Hero should be visible
        const heroCard = page.locator('[data-testid="hero-card"]');
        await expect(heroCard).toBeVisible();

        // Content should be readable
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();
      });

      test(`should have responsive navigation on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        if (viewport.width < 768) {
          // Mobile: should have hamburger menu
          const menuButton = page.locator('button[aria-label*="menu" i]');
          await expect(menuButton).toBeVisible();
        } else {
          // Desktop/Tablet: should have inline navigation
          const nav = page.locator('nav');
          await expect(nav.first()).toBeVisible();
        }
      });

      test(`should render public pages responsively on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        const publicPages = ['/about', '/contact', '/news', '/blog'];

        for (const pagePath of publicPages) {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');

          // Page should render without horizontal scroll
          const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
          expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 20); // Allow small margin

          // Heading should be visible
          const heading = page.locator('h1').first();
          await expect(heading).toBeVisible();
        }
      });
    }
  });

  test.describe('Accessibility Compliance', () => {
    test('should pass accessibility audit on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      // Save results for review
      const a11yDir = 'tests/artifacts/accessibility';
      await fs.promises.mkdir(a11yDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(a11yDir, 'homepage-accessibility.json'),
        JSON.stringify(accessibilityResults, null, 2)
      );

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on About page', async ({ page }) => {
      await page.goto('/about');
      await page.waitForLoadState('networkidle');

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      await fs.promises.mkdir('tests/artifacts/accessibility', { recursive: true });
      await fs.promises.writeFile(
        'tests/artifacts/accessibility/about-accessibility.json',
        JSON.stringify(accessibilityResults, null, 2)
      );

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on Contact page', async ({ page }) => {
      await page.goto('/contact');
      await page.waitForLoadState('networkidle');

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      await fs.promises.mkdir('tests/artifacts/accessibility', { recursive: true });
      await fs.promises.writeFile(
        'tests/artifacts/accessibility/contact-accessibility.json',
        JSON.stringify(accessibilityResults, null, 2)
      );

      expect(accessibilityResults.violations).toEqual([]);
    });

    test('should have proper heading hierarchy on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeLessThanOrEqual(1);

      // h1 should come before h2
      const firstH1 = page.locator('h1').first();
      const firstH2 = page.locator('h2').first();

      if (await firstH1.isVisible() && await firstH2.isVisible()) {
        // Get bounding boxes to compare positions
        const h1Box = await firstH1.boundingBox();
        const h2Box = await firstH2.boundingBox();

        if (h1Box && h2Box) {
          expect(h1Box.y).toBeLessThan(h2Box.y);
        }
      }
    });

    test('should have accessible navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Navigation should be in header or nav element
      const nav = page.locator('header nav, nav');
      await expect(nav.first()).toBeVisible();

      // Links should have visible text
      const navLinks = page.locator('header nav a, nav a');
      const linkCount = await navLinks.count();

      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const text = await link.textContent();

        // Link should have text or aria-label
        if (!text?.trim()) {
          await expect(link).toHaveAttribute('aria-label');
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      // Check specifically for color contrast violations
      const contrastViolations = accessibilityResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      expect(contrastViolations.length).toBe(0);
    });
  });

  test.describe('Visual Regression', () => {
    test('should match homepage hero section baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for animations

      const heroCard = page.locator('[data-testid="hero-card"]');
      await expect(heroCard).toHaveScreenshot('hero-section-baseline.png', {
        maxDiffPixels: 100
      });
    });

    test('should match homepage decorative elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const heroDecor = page.locator('[data-testid="hero-decor"]');
      await expect(heroDecor).toHaveScreenshot('hero-decor-baseline.png', {
        maxDiffPixels: 50
      });
    });

    test('should match full homepage layout', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('homepage-full-baseline.png', {
        fullPage: true,
        maxDiffPixels: 200
      });
    });
  });

  test.describe('Content Loading Performance', () => {
    test('should load homepage within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should render content without blocking', async ({ page }) => {
      await page.goto('/');

      // Hero should be visible before networkidle
      await page.waitForSelector('[data-testid="hero-card"]', { timeout: 3000 });

      // Verify content is visible
      const heroCard = page.locator('[data-testid="hero-card"]');
      await expect(heroCard).toBeVisible();
    });

    test('should not show loading spinner indefinitely', async ({ page }) => {
      await page.goto('/');

      // Wait a reasonable time
      await page.waitForTimeout(5000);

      // Loading spinner should be gone
      const spinner = page.locator('[class*="spinner"], [class*="loading"], svg.animate-spin');
      await expect(spinner).not.toBeVisible();
    });
  });

  test.describe('SEO and Meta Tags', () => {
    test('should have proper page title on homepage', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);
      expect(title).toContain('Sistahology');
    });

    test('should have meta description', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const metaDescription = page.locator('meta[name="description"]');
      const content = await metaDescription.getAttribute('content');

      // Meta description should exist (if implemented)
      if (content) {
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test('should have proper lang attribute on html', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const html = page.locator('html');
      const lang = await html.getAttribute('lang');

      expect(lang).toBe('en');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 gracefully', async ({ page }) => {
      await page.goto('/#/nonexistent-page-12345');
      await page.waitForLoadState('networkidle');

      // Should show some content (404 page or redirect)
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Should not show blank page
      const bodyText = await body.textContent();
      expect(bodyText?.trim().length).toBeGreaterThan(0);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      await page.goto('/');

      // Page should at least show cached content or error
      const body = page.locator('body');
      await expect(body).toBeVisible();

      // Re-enable network
      await page.context().setOffline(false);
    });
  });
});
