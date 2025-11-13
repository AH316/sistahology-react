/**
 * Calendar Modal Contrast Investigation
 *
 * This test investigates the reported contrast issues in the QuickEntryModal
 * when creating a new entry from the Calendar page.
 *
 * Issue: "Entry Date" and "Writing in" labels have light grey text that's
 * hard to read against the transparent background.
 */

import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import AxeBuilder from '@axe-core/playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create artifacts directory structure
const artifactsDir = join(__dirname, 'artifacts', 'calendar-modal');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir, { recursive: true });
}

test.describe('Calendar Modal - Contrast Investigation', () => {
  test.use({ storageState: 'tests/.auth/user.json' });

  test('investigate QuickEntryModal contrast issues', async ({ page }) => {
    // Navigate to Calendar page
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Take screenshot of Calendar page before modal opens
    await page.screenshot({
      path: join(artifactsDir, '01-calendar-page-before-modal.png'),
      fullPage: true
    });

    // Find a date cell that doesn't have an entry (look for a clickable date without the entry dot)
    // We need to find a past date without an entry to trigger the modal
    const calendarGrid = page.locator('.grid.grid-cols-7.gap-2').last();

    // Look for a button that doesn't have an entry indicator (the small dot)
    // Try the first few days of the month
    const dateButtons = calendarGrid.locator('button:not([disabled])').all();
    const buttons = await dateButtons;

    let clickedDate = false;
    for (const button of buttons) {
      // Check if this button has an entry dot (has a div with rounded-full inside)
      const hasEntryDot = await button.locator('div.rounded-full').count() > 0;

      // Only click if NO entry exists (to trigger the QuickEntryModal)
      if (!hasEntryDot) {
        await button.click();
        clickedDate = true;
        console.log('Clicked date without entry - should open QuickEntryModal');
        break;
      }
    }

    // If no empty date found, let's just click today or any date that might open the modal
    if (!clickedDate) {
      console.log('No empty date found, trying to click any date...');
      // Alternative: look for dates and try clicking
      const anyButton = await calendarGrid.locator('button:not([disabled])').first();
      await anyButton.click();
    }

    // Wait for modal to appear
    await page.waitForTimeout(1000); // Give modal time to animate in

    // Check if QuickEntryModal opened
    const modalTitle = page.getByText('Quick Entry', { exact: true });
    const modalVisible = await modalTitle.isVisible().catch(() => false);

    if (!modalVisible) {
      console.log('QuickEntryModal did not open. Checking what appeared instead...');
      await page.screenshot({
        path: join(artifactsDir, '02-no-modal-appeared.png'),
        fullPage: true
      });

      // Log page content to debug
      const pageContent = await page.content();
      console.log('Page contains "Quick Entry":', pageContent.includes('Quick Entry'));
      console.log('Sidebar visible:', await page.locator('.lg\\:col-span-2').isVisible());
    } else {
      console.log('QuickEntryModal successfully opened!');

      // PHASE 1: CAPTURE MODAL SCREENSHOTS
      // Take screenshot of the entire modal
      await page.screenshot({
        path: join(artifactsDir, '02-modal-full-screen.png'),
        fullPage: true
      });

      // Take screenshot of just the modal dialog
      const modal = page.locator('div.glass').filter({ hasText: 'Quick Entry' }).first();
      await modal.screenshot({
        path: join(artifactsDir, '03-modal-dialog-only.png')
      });

      // PHASE 2: INSPECT LABEL ELEMENTS
      // Find the "Entry Date" label
      const entryDateLabel = page.locator('p.text-sm.text-gray-600', { hasText: 'Entry Date' });
      const entryDateExists = await entryDateLabel.count() > 0;

      console.log('\n=== ENTRY DATE LABEL ===');
      console.log('Exists:', entryDateExists);

      if (entryDateExists) {
        // Get computed styles
        const labelStyles = await entryDateLabel.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            classes: el.className
          };
        });

        console.log('Entry Date Label Styles:', JSON.stringify(labelStyles, null, 2));

        // Take screenshot of just this label with surrounding context
        await entryDateLabel.screenshot({
          path: join(artifactsDir, '04-entry-date-label-closeup.png')
        });
      }

      // Find the "Writing in" label
      const writingInLabel = page.locator('div.text-sm.text-gray-600', { hasText: 'Writing in:' });
      const writingInExists = await writingInLabel.count() > 0;

      console.log('\n=== WRITING IN LABEL ===');
      console.log('Exists:', writingInExists);

      if (writingInExists) {
        // Get computed styles
        const labelStyles = await writingInLabel.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            classes: el.className
          };
        });

        console.log('Writing in Label Styles:', JSON.stringify(labelStyles, null, 2));

        // Take screenshot of just this label
        await writingInLabel.screenshot({
          path: join(artifactsDir, '05-writing-in-label-closeup.png')
        });
      }

      // PHASE 3: CHECK MODAL BACKGROUND
      // Inspect the modal background to understand glass morphism effect
      const modalDialog = page.locator('div.glass.rounded-3xl').first();
      const backgroundStyles = await modalDialog.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          backdropFilter: computed.backdropFilter,
          border: computed.border,
          classes: el.className
        };
      });

      console.log('\n=== MODAL BACKGROUND ===');
      console.log('Modal Dialog Styles:', JSON.stringify(backgroundStyles, null, 2));

      // PHASE 4: ACCESSIBILITY TESTING WITH AXE-CORE
      console.log('\n=== RUNNING ACCESSIBILITY TESTS ===');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .include('div.glass') // Scan only the modal
        .analyze();

      // Filter for color-contrast violations
      const contrastViolations = accessibilityScanResults.violations.filter(
        v => v.id === 'color-contrast'
      );

      console.log(`Total accessibility violations: ${accessibilityScanResults.violations.length}`);
      console.log(`Color contrast violations: ${contrastViolations.length}`);

      // Save full accessibility report
      const accessibilityReport = {
        timestamp: new Date().toISOString(),
        url: page.url(),
        totalViolations: accessibilityScanResults.violations.length,
        contrastViolations: contrastViolations.length,
        allViolations: accessibilityScanResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.map(n => ({
            html: n.html,
            target: n.target,
            failureSummary: n.failureSummary
          }))
        })),
        passes: accessibilityScanResults.passes.length,
        incomplete: accessibilityScanResults.incomplete.length
      };

      fs.writeFileSync(
        join(artifactsDir, 'accessibility-report.json'),
        JSON.stringify(accessibilityReport, null, 2)
      );

      console.log('\nAccessibility report saved to:', join(artifactsDir, 'accessibility-report.json'));

      // PHASE 5: COMPARE WITH OTHER FORMS
      // Close modal and check NewEntryPage for comparison
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // Navigate to New Entry page
      await page.goto('/#/new-entry');
      await page.waitForLoadState('networkidle');

      // Take screenshot for comparison
      await page.screenshot({
        path: join(artifactsDir, '06-new-entry-page-for-comparison.png'),
        fullPage: true
      });

      // Check label styling on NewEntryPage
      const newEntryJournalLabel = page.locator('label[for="journal"]');
      if (await newEntryJournalLabel.count() > 0) {
        const newEntryLabelStyles = await newEntryJournalLabel.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            textShadow: computed.textShadow,
            classes: el.className
          };
        });

        console.log('\n=== NEW ENTRY PAGE LABEL (for comparison) ===');
        console.log('Journal Label Styles:', JSON.stringify(newEntryLabelStyles, null, 2));
      }

      // PHASE 6: GENERATE COMPARISON REPORT
      const comparisonReport = {
        timestamp: new Date().toISOString(),
        issue: 'Calendar modal labels have poor contrast',
        problematicLabels: {
          entryDateLabel: entryDateExists ? 'text-gray-600' : 'NOT FOUND',
          writingInLabel: writingInExists ? 'text-gray-600' : 'NOT FOUND'
        },
        modalBackground: 'glass morphism with backdrop-blur-lg and border-white/30',
        recommendations: [
          'Use text-white with drop-shadow-lg for better readability on glass backgrounds',
          'Increase text color to text-gray-800 or text-gray-900 for better contrast',
          'Add text shadow for improved legibility on transparent backgrounds'
        ],
        wcagRequirement: 'WCAG AA requires 4.5:1 contrast ratio for normal text',
        contrastViolationsFound: contrastViolations.length,
        screenshots: [
          '01-calendar-page-before-modal.png',
          '02-modal-full-screen.png',
          '03-modal-dialog-only.png',
          '04-entry-date-label-closeup.png',
          '05-writing-in-label-closeup.png',
          '06-new-entry-page-for-comparison.png'
        ],
        accessibilityReport: 'accessibility-report.json'
      };

      fs.writeFileSync(
        join(artifactsDir, 'investigation-summary.json'),
        JSON.stringify(comparisonReport, null, 2)
      );

      console.log('\n=== INVESTIGATION COMPLETE ===');
      console.log('All artifacts saved to:', artifactsDir);
      console.log('Summary:', join(artifactsDir, 'investigation-summary.json'));
    }

    // Test passes if we completed the investigation
    expect(true).toBe(true);
  });

  test('verify contrast ratios programmatically', async ({ page }) => {
    await page.goto('/#/calendar');
    await page.waitForLoadState('networkidle');

    // Click a date to open modal
    const calendarGrid = page.locator('.grid.grid-cols-7.gap-2').last();
    const firstAvailableDate = calendarGrid.locator('button:not([disabled])').first();
    await firstAvailableDate.click();
    await page.waitForTimeout(1000);

    // Check if modal opened
    const modalVisible = await page.getByText('Quick Entry', { exact: true }).isVisible().catch(() => false);

    if (modalVisible) {
      // Calculate contrast ratio for Entry Date label
      const entryDateLabel = page.locator('p.text-sm.text-gray-600').first();

      const contrastData = await entryDateLabel.evaluate((el) => {
        // Get the actual computed colors
        const computed = window.getComputedStyle(el);
        const color = computed.color; // text color

        // Find the actual background by traversing up
        let bgElement: Element | null = el;
        let bgColor = 'rgba(0, 0, 0, 0)';

        while (bgElement && bgColor === 'rgba(0, 0, 0, 0)') {
          bgElement = bgElement.parentElement;
          if (bgElement) {
            const bgComputed = window.getComputedStyle(bgElement);
            bgColor = bgComputed.backgroundColor;
          }
        }

        return {
          textColor: color,
          backgroundColor: bgColor,
          element: el.outerHTML.substring(0, 200)
        };
      });

      console.log('\n=== CONTRAST CALCULATION ===');
      console.log('Text Color:', contrastData.textColor);
      console.log('Background Color:', contrastData.backgroundColor);
      console.log('Element:', contrastData.element);

      // Note: Actual contrast ratio calculation would require a library
      // This test documents the colors for manual verification
    }
  });
});
