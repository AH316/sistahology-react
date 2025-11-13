import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

// Configure this test file to use authenticated sessions
test.use({ storageState: 'tests/.auth/user.json' });

test.describe('Comprehensive UI Contrast Audit - Protected Pages', () => {
  const artifactsBaseDir = path.join(process.cwd(), 'tests/artifacts');
  const contrastDir = path.join(artifactsBaseDir, 'contrast-issues');
  const a11yDir = path.join(artifactsBaseDir, 'accessibility');

  test.beforeAll(async () => {
    // Ensure artifact directories exist
    mkdirSync(contrastDir, { recursive: true });
    mkdirSync(a11yDir, { recursive: true });
  });

  const pages = [
    {
      name: 'Dashboard',
      url: '/#/dashboard',
      waitFor: 'h1'
    },
    {
      name: 'Calendar',
      url: '/#/calendar',
      waitFor: 'h1'
    },
    {
      name: 'Search',
      url: '/#/search',
      waitFor: 'h1'
    },
    {
      name: 'New Entry',
      url: '/#/new-entry',
      waitFor: 'h1',
      setup: async (page) => {
        // Handle first journal creation if needed
        const noJournalsSelect = page.locator('select#journal:disabled');
        const createJournalButton = page.locator('button:has-text("Create your first journal")');

        if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
          page.once('dialog', dialog => dialog.accept('Contrast Audit Journal'));
          await createJournalButton.click();
          await page.waitForTimeout(2000);
        }
      }
    },
    {
      name: 'Profile',
      url: '/#/profile',
      waitFor: 'h1'
    },
    {
      name: 'Journals',
      url: '/#/journals',
      waitFor: 'h1'
    }
  ];

  for (const pageConfig of pages) {
    test(`${pageConfig.name} - Contrast Audit`, async ({ page }) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Auditing: ${pageConfig.name}`);
      console.log(`${'='.repeat(60)}\n`);

      // Navigate to page
      await page.goto(pageConfig.url, { waitUntil: 'networkidle' });

      // Wait for page to load
      await page.waitForSelector(pageConfig.waitFor, { timeout: 10000 });

      // Run custom setup if provided
      if (pageConfig.setup) {
        await pageConfig.setup(page);
      }

      // Give the page time to settle
      await page.waitForTimeout(1000);

      // Run axe accessibility check focused on contrast
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      // Filter for contrast-related violations
      const contrastViolations = accessibilityResults.violations.filter(v =>
        v.id.includes('contrast') ||
        v.id === 'color-contrast' ||
        v.id === 'color-contrast-enhanced'
      );

      // Save full accessibility report
      const reportPath = path.join(a11yDir, `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-contrast-report.json`);
      writeFileSync(reportPath, JSON.stringify({
        url: pageConfig.url,
        timestamp: new Date().toISOString(),
        violations: accessibilityResults.violations,
        contrastViolations: contrastViolations,
        passes: accessibilityResults.passes,
        incomplete: accessibilityResults.incomplete
      }, null, 2));

      console.log(`Full accessibility report: ${reportPath}`);

      // Capture full-page screenshot
      const screenshotPath = path.join(contrastDir, `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-full.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`Screenshot saved: ${screenshotPath}`);

      // Log contrast violations with details
      if (contrastViolations.length > 0) {
        console.log(`\n*** CONTRAST VIOLATIONS FOUND: ${contrastViolations.length} ***\n`);

        for (const violation of contrastViolations) {
          console.log(`\nViolation: ${violation.id}`);
          console.log(`Description: ${violation.description}`);
          console.log(`Impact: ${violation.impact}`);
          console.log(`Help: ${violation.help}`);
          console.log(`WCAG: ${violation.tags.join(', ')}`);
          console.log(`Affected elements: ${violation.nodes.length}`);

          violation.nodes.forEach((node, index) => {
            console.log(`\n  Element ${index + 1}:`);
            console.log(`    HTML: ${node.html}`);
            console.log(`    Target: ${node.target.join(' ')}`);
            console.log(`    Failure: ${node.failureSummary}`);

            if (node.any && node.any.length > 0) {
              node.any.forEach(check => {
                console.log(`    - ${check.message}`);
                if (check.data) {
                  console.log(`      Data: ${JSON.stringify(check.data, null, 8)}`);
                }
              });
            }
          });
        }

        // Take targeted screenshots of contrast violations
        for (let i = 0; i < Math.min(contrastViolations.length, 5); i++) {
          const violation = contrastViolations[i];
          if (violation.nodes.length > 0) {
            const targetSelector = violation.nodes[0].target[0];
            try {
              const element = page.locator(targetSelector).first();
              if (await element.isVisible({ timeout: 2000 })) {
                const elementScreenshotPath = path.join(
                  contrastDir,
                  `${pageConfig.name.toLowerCase().replace(/\s+/g, '-')}-violation-${i + 1}.png`
                );
                await element.screenshot({ path: elementScreenshotPath });
                console.log(`\n  Violation screenshot: ${elementScreenshotPath}`);
              }
            } catch (e) {
              console.log(`\n  Could not capture screenshot for violation ${i + 1}`);
            }
          }
        }
      } else {
        console.log('\nNo contrast violations found!');
      }

      // Log all violations (not just contrast)
      if (accessibilityResults.violations.length > 0) {
        console.log(`\n\nAll Violations Summary (${accessibilityResults.violations.length} total):`);
        accessibilityResults.violations.forEach(v => {
          console.log(`  - ${v.id} (${v.impact}): ${v.nodes.length} elements`);
        });
      }

      console.log(`\n${'='.repeat(60)}\n`);
    });
  }

  // Special test for Edit Entry page (requires creating an entry first)
  test('Edit Entry - Contrast Audit', async ({ page }) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Auditing: Edit Entry`);
    console.log(`${'='.repeat(60)}\n`);

    // First, go to new entry page and create an entry
    await page.goto('/#/new-entry', { waitUntil: 'networkidle' });
    await page.waitForSelector('h1', { timeout: 10000 });

    // Handle first journal creation if needed
    const noJournalsSelect = page.locator('select#journal:disabled');
    const createJournalButton = page.locator('button:has-text("Create your first journal")');

    if (await noJournalsSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      page.once('dialog', dialog => dialog.accept('Edit Entry Audit Journal'));
      await createJournalButton.click();
      await page.waitForTimeout(2000);
    }

    // Create a test entry
    await page.fill('input#title', 'Contrast Audit Test Entry');
    await page.fill('textarea#content', 'This is a test entry for contrast auditing.');

    const saveButton = page.locator('button:has-text("Save Entry")');
    await saveButton.click();

    // Wait for success and redirect
    await page.waitForTimeout(2000);

    // Go to dashboard to find the entry
    await page.goto('/#/dashboard', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click on the first entry to go to edit page
    const firstEntry = page.locator('a[href^="#/entries/"]').first();
    if (await firstEntry.isVisible({ timeout: 5000 })) {
      await firstEntry.click();
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Run axe accessibility check
      const accessibilityResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = accessibilityResults.violations.filter(v =>
        v.id.includes('contrast') ||
        v.id === 'color-contrast' ||
        v.id === 'color-contrast-enhanced'
      );

      // Save report
      const reportPath = path.join(a11yDir, 'edit-entry-contrast-report.json');
      writeFileSync(reportPath, JSON.stringify({
        url: '/entries/:id/edit',
        timestamp: new Date().toISOString(),
        violations: accessibilityResults.violations,
        contrastViolations: contrastViolations,
        passes: accessibilityResults.passes,
        incomplete: accessibilityResults.incomplete
      }, null, 2));

      console.log(`Full accessibility report: ${reportPath}`);

      // Screenshot
      const screenshotPath = path.join(contrastDir, 'edit-entry-full.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Screenshot saved: ${screenshotPath}`);

      // Log violations
      if (contrastViolations.length > 0) {
        console.log(`\n*** CONTRAST VIOLATIONS FOUND: ${contrastViolations.length} ***\n`);

        for (const violation of contrastViolations) {
          console.log(`\nViolation: ${violation.id}`);
          console.log(`Description: ${violation.description}`);
          console.log(`Impact: ${violation.impact}`);
          console.log(`Affected elements: ${violation.nodes.length}`);

          violation.nodes.forEach((node, index) => {
            console.log(`\n  Element ${index + 1}:`);
            console.log(`    HTML: ${node.html}`);
            console.log(`    Failure: ${node.failureSummary}`);
          });
        }
      } else {
        console.log('\nNo contrast violations found!');
      }

      if (accessibilityResults.violations.length > 0) {
        console.log(`\n\nAll Violations Summary (${accessibilityResults.violations.length} total):`);
        accessibilityResults.violations.forEach(v => {
          console.log(`  - ${v.id} (${v.impact}): ${v.nodes.length} elements`);
        });
      }
    } else {
      console.log('Could not find entry to edit. Skipping edit page audit.');
    }

    console.log(`\n${'='.repeat(60)}\n`);
  });

  // Generate summary report after all tests
  test.afterAll(async () => {
    const summaryPath = path.join(contrastDir, 'CONTRAST_AUDIT_SUMMARY.md');

    const summary = `# UI Contrast Audit Summary

**Date:** ${new Date().toISOString()}
**Project:** Sistahology React

## Audit Scope

Comprehensive accessibility audit focusing on color contrast issues across all authenticated pages:

1. Dashboard (\`/dashboard\`)
2. Calendar (\`/calendar\`)
3. Search (\`/search\`)
4. New Entry (\`/new-entry\`)
5. Edit Entry (\`/entries/:id/edit\`)
6. Profile (\`/profile\`)

## Testing Methodology

- **Tool:** axe-core via @axe-core/playwright
- **Standards:** WCAG 2.1 Level AA
- **Focus:** Color contrast violations
- **Browser:** Chromium (Desktop Chrome)
- **Viewport:** 1280x800

## Artifacts Generated

### Accessibility Reports
All detailed JSON reports with contrast violations are in:
\`tests/artifacts/accessibility/\`

Files:
- \`dashboard-contrast-report.json\`
- \`calendar-contrast-report.json\`
- \`search-contrast-report.json\`
- \`new-entry-contrast-report.json\`
- \`edit-entry-contrast-report.json\`
- \`profile-contrast-report.json\`

### Screenshots
Full-page screenshots and violation-specific captures in:
\`tests/artifacts/contrast-issues/\`

## Known Contrast Issues

### Breadcrumbs Component (\`src/components/Breadcrumbs.tsx\`)

**Issue:** Text on translucent background
- Background: \`bg-white/50 backdrop-blur-sm\`
- Text colors: \`text-gray-600\`, \`text-gray-400\`
- Problem: 50% opacity white background may not provide sufficient contrast

**Expected violations:**
- Links with \`text-gray-600\` on semi-transparent white
- Chevron separators with \`text-gray-400\`

**Recommendation:**
- Increase background opacity: \`bg-white/80\` or \`bg-white/90\`
- Use darker text: \`text-gray-800\` or \`text-gray-900\`
- Consider solid background for WCAG AA compliance

## WCAG AA Requirements

**Normal text (< 18pt):** Contrast ratio of at least **4.5:1**
**Large text (>= 18pt):** Contrast ratio of at least **3:1**
**Enhanced (AAA):** 7:1 for normal text, 4.5:1 for large text

## Next Steps

1. Review detailed JSON reports for specific elements and contrast ratios
2. Examine screenshots to visually identify problem areas
3. Apply fixes to components with insufficient contrast
4. Re-run audit to verify fixes
5. Consider implementing automated contrast checks in CI/CD

## Contact

For questions about this audit, consult the accessibility reports or re-run tests with:

\`\`\`bash
npx playwright test tests/contrast-audit.spec.ts
\`\`\`
`;

    writeFileSync(summaryPath, summary);
    console.log(`\n\nSummary report generated: ${summaryPath}\n`);
  });
});
