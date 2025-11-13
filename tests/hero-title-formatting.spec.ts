import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Hero Title Formatting Documentation Test
 *
 * Purpose: Capture screenshots and document formatting issues with the hero title
 * "Your Sacred Space for Digital Journaling" across different viewport sizes.
 *
 * This test documents:
 * - Text wrapping behavior at each breakpoint
 * - Font sizing issues
 * - Line break patterns
 * - Computed CSS styles
 */

test.describe('Hero Title Formatting Documentation', () => {
  const viewports = [
    { name: 'desktop-1920', width: 1920, height: 1080, description: 'Large Desktop' },
    { name: 'desktop-1280', width: 1280, height: 800, description: 'Standard Desktop' },
    { name: 'desktop-1024', width: 1024, height: 768, description: 'Small Desktop' },
    { name: 'tablet-768', width: 768, height: 1024, description: 'Tablet Portrait' },
    { name: 'mobile-375', width: 375, height: 667, description: 'iPhone SE/8' },
    { name: 'mobile-320', width: 320, height: 568, description: 'Small Mobile' },
  ];

  for (const viewport of viewports) {
    test(`Capture hero title at ${viewport.description} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      test.info().annotations.push({
        type: 'viewport',
        description: `${viewport.description}: ${viewport.width}x${viewport.height}`,
      });

      // Navigate to homepage
      await page.goto('http://localhost:5173');

      // Wait for hero section to be visible
      const heroCard = page.locator('[data-testid="hero-card"]');
      await heroCard.waitFor({ state: 'visible', timeout: 10000 });

      // Locate the hero title (h1 element)
      const heroTitle = heroCard.locator('h1').first();
      await heroTitle.waitFor({ state: 'visible' });

      // Get the actual text content
      const titleText = await heroTitle.textContent();
      console.log(`\n=== ${viewport.name.toUpperCase()} (${viewport.width}x${viewport.height}) ===`);
      console.log(`Title Text: "${titleText}"`);

      // Get computed styles
      const styles = await heroTitle.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          maxWidth: computed.maxWidth,
          width: computed.width,
          display: computed.display,
          textAlign: computed.textAlign,
          wordBreak: computed.wordBreak,
          whiteSpace: computed.whiteSpace,
          overflowWrap: computed.overflowWrap,
        };
      });

      console.log('Computed Styles:');
      console.log(`  Font Size: ${styles.fontSize}`);
      console.log(`  Line Height: ${styles.lineHeight}`);
      console.log(`  Max Width: ${styles.maxWidth}`);
      console.log(`  Actual Width: ${styles.width}`);
      console.log(`  Text Align: ${styles.textAlign}`);
      console.log(`  Word Break: ${styles.wordBreak}`);
      console.log(`  White Space: ${styles.whiteSpace}`);
      console.log(`  Overflow Wrap: ${styles.overflowWrap}`);

      // Get bounding box to understand layout
      const boundingBox = await heroTitle.boundingBox();
      if (boundingBox) {
        console.log(`Bounding Box:`);
        console.log(`  Width: ${boundingBox.width}px`);
        console.log(`  Height: ${boundingBox.height}px`);
      }

      // Analyze text wrapping by checking line breaks
      const lineBreakInfo = await heroTitle.evaluate((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = range.getClientRects();

        // Count distinct line positions (y-coordinates)
        const yPositions = new Set();
        for (let i = 0; i < rects.length; i++) {
          yPositions.add(Math.round(rects[i].top));
        }

        return {
          numberOfLines: yPositions.size,
          totalRects: rects.length,
        };
      });

      console.log(`Text Wrapping:`);
      console.log(`  Number of Lines: ${lineBreakInfo.numberOfLines}`);
      console.log(`  Text Rects: ${lineBreakInfo.totalRects}`);

      // Document observations as annotations
      test.info().annotations.push({
        type: 'font-size',
        description: styles.fontSize,
      });

      test.info().annotations.push({
        type: 'line-count',
        description: `${lineBreakInfo.numberOfLines} line(s)`,
      });

      if (lineBreakInfo.numberOfLines > 2) {
        test.info().annotations.push({
          type: 'issue',
          description: `Excessive wrapping: ${lineBreakInfo.numberOfLines} lines on ${viewport.description}`,
        });
        console.log(`  ⚠️  ISSUE: Title wraps to ${lineBreakInfo.numberOfLines} lines`);
      }

      // Capture screenshot of the full hero section
      await heroCard.screenshot({
        path: `tests/artifacts/hero-formatting/hero-title-${viewport.name}.png`,
        animations: 'disabled',
      });

      console.log(`Screenshot saved: hero-title-${viewport.name}.png`);

      // Additional check: Is the title text the expected content?
      if (titleText) {
        const expectedTitle = 'Your Sacred Space for Digital Journaling';
        if (titleText.trim() === expectedTitle) {
          console.log('✓ Title content matches expected text');
        } else {
          console.log(`⚠️  Title content differs from expected:`);
          console.log(`   Expected: "${expectedTitle}"`);
          console.log(`   Actual: "${titleText.trim()}"`);
          test.info().annotations.push({
            type: 'content-mismatch',
            description: `Expected "${expectedTitle}" but got "${titleText?.trim()}"`,
          });
        }
      }

      // Verify hero decorations are present
      const heroDecor = page.locator('[data-testid="hero-decor"]');
      const decorCount = await heroDecor.count();
      console.log(`Decorative Elements: ${decorCount} found`);

      console.log('=== End Analysis ===\n');

      // Test assertion (non-failing - just documentation)
      expect(titleText).toBeTruthy();
    });
  }

  test('Summary: Compare all viewport screenshots', async ({ page }) => {
    test.info().annotations.push({
      type: 'summary',
      description: 'All hero title screenshots captured for formatting analysis',
    });

    console.log('\n=== HERO TITLE FORMATTING TEST SUMMARY ===');
    console.log('Screenshots captured at the following viewports:');
    viewports.forEach(vp => {
      console.log(`  - ${vp.description} (${vp.width}x${vp.height}): hero-title-${vp.name}.png`);
    });
    console.log('\nArtifacts location: tests/artifacts/hero-formatting/');
    console.log('\nReview the screenshots to identify:');
    console.log('  1. Awkward text wrapping or line breaks');
    console.log('  2. Font size issues (too large or too small)');
    console.log('  3. Inconsistent spacing or alignment');
    console.log('  4. Responsive behavior at different breakpoints');
    console.log('===========================================\n');

    // This test just provides a summary - no assertions needed
    expect(true).toBe(true);
  });
});
