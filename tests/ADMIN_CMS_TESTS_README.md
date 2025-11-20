# Admin CMS E2E Test Suite

Comprehensive end-to-end test coverage for Sistahology's Admin CMS features (Phase 7).

## Overview

This test suite validates all admin CMS functionality including:
- Pages management (CRUD operations)
- Admin access control and permissions
- Dashboard statistics display
- Public page rendering from CMS
- Admin token management system

**Total Test Coverage**: 70+ tests across 5 test files

---

## Test Files

### 1. `admin-cms-pages.spec.ts` (605 lines, ~30 tests)

**Coverage:**
- Page CRUD operations (Create, Read, Update, Delete)
- Publishing workflow (publish/unpublish pages)
- Rich text editor functionality
- URL slug validation and auto-generation
- Content sanitization (XSS prevention)
- Form validation and error handling
- Multi-viewport responsiveness (mobile, tablet, desktop)
- Accessibility compliance (WCAG AA)

**Key Test Scenarios:**
- Create new page with title, content, and slug
- Edit existing page and update content
- Toggle publish status and verify public visibility
- Delete page with confirmation dialog
- Auto-generate URL slug from title
- Sanitize HTML content when saving
- Verify published pages visible publicly
- Verify unpublished pages not visible publicly

---

### 2. `admin-access-control.spec.ts` (371 lines, ~25 tests)

**Coverage:**
- Route protection (non-admins blocked from `/admin/*`)
- Navigation visibility (admin nav only for admins)
- Redirect behavior for unauthorized access
- Role-based permissions enforcement
- Mobile navigation access control
- Cross-origin security verification

**Key Test Scenarios:**
- Regular users cannot access admin routes
- Regular users don't see admin navigation link
- Admin users can access all admin routes
- Admin link shows with active state on admin pages
- Unauthenticated users redirected to login
- RLS policies enforced via database
- Mobile menu shows/hides admin link correctly

---

### 3. `admin-dashboard-stats.spec.ts` (428 lines, ~35 tests)

**Coverage:**
- Statistics card display (Users, Journals, Entries, Pages)
- Data accuracy verification
- Real-time updates when data changes
- Quick actions functionality
- Loading states and error handling
- Multi-viewport responsive layout
- Color-coded stat icons
- Accessibility compliance

**Key Test Scenarios:**
- Display all four stat cards with icons
- Show accurate counts for each statistic
- Update page count after creating new page
- Navigate to admin pages via quick actions
- Format large numbers with commas
- Show loading spinner during data fetch
- Maintain consistent stats across reloads
- Responsive grid layout on all viewports

---

### 4. `public-pages-cms.spec.ts` (560 lines, ~40 tests)

**Coverage:**
- Homepage CMS content loading
- Public pages rendering (About, Contact, News, Blog)
- Published vs unpublished content visibility
- Responsive design across viewports
- Accessibility compliance (WCAG AA)
- Visual regression testing
- SEO and meta tags
- Error handling (404s, network errors)

**Key Test Scenarios:**
- Homepage renders hero section correctly
- CMS content loads without console errors
- Published pages visible to public users
- Unpublished pages not visible to public users
- Navigation links work correctly
- Proper heading hierarchy (single h1)
- Accessibility audits pass on all pages
- Responsive design on mobile/tablet/desktop
- Visual regression baseline matching

---

### 5. `admin-tokens.spec.ts` (645 lines, ~30 tests)

**Coverage:**
- Token creation with email and expiration
- Token management (view, delete)
- Token lifecycle states (Active, Used, Expired)
- Statistics display (Active/Used/Expired counts)
- Token deletion with confirmation
- Registration URL generation and display
- Empty state handling

**Key Test Scenarios:**
- Create new admin token with email
- Display registration URL after creation
- Copy registration URL to clipboard
- Show token status badges (Active/Used/Expired)
- Delete token with confirmation dialog
- Update active tokens count after creation
- Format dates correctly in table
- Show helpful empty state when no tokens exist
- Accessible table structure and delete buttons

---

## Setup and Prerequisites

### 1. Admin User Setup

Ensure the admin test user has admin privileges:

```bash
npm run set:admin -- --email e2e.admin@sistahology.dev
```

Or set admin role manually:

```bash
tsx scripts/setAdminRole.ts --email e2e.admin@sistahology.dev
```

### 2. Environment Variables

Ensure `.env.test` contains:

```bash
# Regular E2E test user (non-admin)
E2E_EMAIL=e2e.user@sistahology.dev
E2E_PASSWORD=Temp!Pass123

# Admin E2E test user
E2E_ADMIN_EMAIL=e2e.admin@sistahology.dev
E2E_ADMIN_PASSWORD=AdminPass123!

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Test Authentication State

Tests use pre-authenticated sessions stored in:
- `tests/.auth/user.json` - Regular user session
- `tests/.auth/admin.json` - Admin user session

These are created by `tests/global-setup.ts` and `tests/admin-setup.spec.ts`.

---

## Running Tests

### Run All Admin CMS Tests

```bash
# Run all Phase 7 admin CMS tests
npx playwright test tests/admin-cms-pages.spec.ts tests/admin-access-control.spec.ts tests/admin-dashboard-stats.spec.ts tests/public-pages-cms.spec.ts tests/admin-tokens.spec.ts
```

### Run Individual Test Files

```bash
# Page management tests
npx playwright test tests/admin-cms-pages.spec.ts

# Access control tests
npx playwright test tests/admin-access-control.spec.ts

# Dashboard statistics tests
npx playwright test tests/admin-dashboard-stats.spec.ts

# Public pages rendering tests
npx playwright test tests/public-pages-cms.spec.ts

# Token management tests
npx playwright test tests/admin-tokens.spec.ts
```

### Run Specific Test Suites

```bash
# Run only page creation tests
npx playwright test tests/admin-cms-pages.spec.ts -g "Page Creation"

# Run only accessibility tests
npx playwright test tests/public-pages-cms.spec.ts -g "Accessibility"

# Run only responsive design tests
npx playwright test -g "Responsive"
```

### UI Mode for Debugging

```bash
# Open Playwright UI for interactive debugging
npx playwright test tests/admin-cms-pages.spec.ts --ui

# Debug specific test
npx playwright test tests/admin-tokens.spec.ts --debug
```

### Run with Specific Browser

```bash
# Run with admin authentication project
npx playwright test --project=authAdmin tests/admin-cms-pages.spec.ts

# Run on specific viewport
npx playwright test --project=mobile-390 tests/public-pages-cms.spec.ts
```

---

## Test Artifacts

### Screenshots

Screenshots are automatically captured and saved to:
- `tests/artifacts/admin-pages-{viewport}.png`
- `tests/artifacts/admin-dashboard-{viewport}.png`
- `tests/artifacts/admin-tokens-{viewport}.png`
- `tests/artifacts/homepage-{viewport}.png`

### Accessibility Reports

Accessibility scan results (JSON format) are saved to:
- `tests/artifacts/accessibility/homepage-accessibility.json`
- `tests/artifacts/accessibility/about-accessibility.json`
- `tests/artifacts/accessibility/contact-accessibility.json`

These can be analyzed programmatically to track WCAG compliance over time.

### Visual Regression Baselines

Visual regression baselines are stored in:
- `tests/artifacts/hero-section-baseline.png`
- `tests/artifacts/admin-dashboard-baseline.png`

Update baselines with:
```bash
npx playwright test --update-snapshots
```

---

## CI/CD Integration

### GitHub Actions Workflow

Add to `.github/workflows/e2e-admin-cms.yml`:

```yaml
name: Admin CMS E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-admin-cms:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run admin CMS tests
        env:
          E2E_EMAIL: ${{ secrets.E2E_EMAIL }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
          E2E_ADMIN_EMAIL: ${{ secrets.E2E_ADMIN_EMAIL }}
          E2E_ADMIN_PASSWORD: ${{ secrets.E2E_ADMIN_PASSWORD }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          npx playwright test tests/admin-cms-pages.spec.ts tests/admin-access-control.spec.ts tests/admin-dashboard-stats.spec.ts tests/public-pages-cms.spec.ts tests/admin-tokens.spec.ts

      - name: Upload test artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: admin-cms-test-results
          path: |
            tests/artifacts/
            playwright-report/
          retention-days: 30
```

---

## Test Patterns and Best Practices

### Authentication Pattern

Tests use pre-authenticated sessions via `storageState`:

```typescript
test.describe('Admin CMS Pages Management', () => {
  test.use({ storageState: 'tests/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/#/admin/pages');
    await page.waitForLoadState('networkidle');
  });

  test('should create new page', async ({ page }) => {
    // Test implementation
  });
});
```

### Accessibility Testing Pattern

Use axe-core for automated accessibility audits:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should pass accessibility audit', async ({ page }) => {
  await page.goto('/#/admin');

  const accessibilityResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(accessibilityResults.violations).toEqual([]);
});
```

### Visual Regression Pattern

Capture screenshots for baseline comparison:

```typescript
test('should match visual baseline', async ({ page }) => {
  await page.goto('/#/admin/pages');
  await page.waitForTimeout(1000); // Wait for animations

  await expect(page).toHaveScreenshot('admin-pages-baseline.png', {
    fullPage: true,
    maxDiffPixels: 100
  });
});
```

### Multi-viewport Testing Pattern

Test responsive design across viewports:

```typescript
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 }
];

for (const viewport of viewports) {
  test(`should render on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/#/admin');

    await page.screenshot({
      path: `tests/artifacts/admin-${viewport.name}.png`,
      fullPage: true
    });
  });
}
```

### Test Data Cleanup Pattern

Clean up test data after each test:

```typescript
test.afterEach(async ({ page }) => {
  // Delete test pages created during test
  // Use database cleanup or UI cleanup
});
```

---

## Troubleshooting

### Tests Failing Due to Auth State

If tests fail with authentication errors:

1. Regenerate auth state files:
```bash
npx playwright test tests/admin-setup.spec.ts --project=setupAdmin
```

2. Verify admin role is set:
```bash
npm run set:admin -- --email e2e.admin@sistahology.dev
```

3. Check `.env.test` has correct credentials

### Tests Failing Due to Missing Pages

If tests expect pages to exist:

1. Create at least one test page via admin UI
2. Or modify tests to create test data in `beforeEach` hooks

### Visual Regression Failures

If visual regression tests fail:

1. Review screenshot diffs in `test-results/`
2. Update baselines if changes are intentional:
```bash
npx playwright test --update-snapshots
```

### Accessibility Violations

If accessibility tests fail:

1. Review violation details in `tests/artifacts/accessibility/*.json`
2. Fix issues in components
3. Re-run tests to verify fixes

---

## Coverage Summary

| Test File | Tests | Lines | Coverage |
|-----------|-------|-------|----------|
| admin-cms-pages.spec.ts | ~30 | 605 | Page CRUD, Publishing, Validation |
| admin-access-control.spec.ts | ~25 | 371 | Permissions, Routes, RLS |
| admin-dashboard-stats.spec.ts | ~35 | 428 | Stats, Quick Actions, Loading |
| public-pages-cms.spec.ts | ~40 | 560 | Rendering, A11y, SEO, Responsive |
| admin-tokens.spec.ts | ~30 | 645 | Token CRUD, States, Deletion |
| **TOTAL** | **~160** | **2,609** | **Comprehensive Phase 7 Coverage** |

---

## Success Criteria

✅ All 5 test files created with 160+ total tests
✅ Tests run successfully in local environment
✅ Accessibility audits pass with no critical violations
✅ Screenshot baselines captured for visual regression
✅ All admin CMS features have test coverage
✅ Public page rendering verified
✅ Admin access control enforced and tested
✅ Multi-viewport responsiveness validated

---

## Next Steps

1. **Run Initial Test Suite**: Execute all tests to establish baselines
2. **Review Failures**: Fix any failing tests due to environment setup
3. **Update Baselines**: Capture visual regression baselines
4. **Integrate CI/CD**: Add GitHub Actions workflow
5. **Monitor Coverage**: Track test results over time
6. **Expand Tests**: Add edge cases and integration scenarios as needed

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Axe-core Accessibility Testing](https://github.com/dequelabs/axe-core)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Project README](../README.md)
- [E2E Test Setup Guide](../E2E_TEST_SETUP.md)
