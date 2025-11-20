# Admin CMS Tests - Quick Start Guide

**5 minutes to running your first admin CMS tests**

---

## Prerequisites

1. **Admin user exists with correct role**
   ```bash
   npm run set:admin -- --email e2e.admin@sistahology.dev
   ```

2. **Environment variables set** (`.env.test`)
   ```bash
   E2E_ADMIN_EMAIL=e2e.admin@sistahology.dev
   E2E_ADMIN_PASSWORD=AdminPass123!
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Admin auth session generated**
   ```bash
   npx playwright test tests/admin-setup.spec.ts --project=setupAdmin
   ```

---

## Run Tests

### All Phase 7 Admin CMS Tests
```bash
npm run test:admin-cms
```

### Individual Test Suites
```bash
npm run test:admin-pages      # Page management (30 tests)
npm run test:admin-access     # Access control (25 tests)
npm run test:admin-dashboard  # Dashboard stats (35 tests)
npm run test:public-cms       # Public pages (40 tests)
npm run test:admin-tokens     # Token management (30 tests)
```

### UI Mode (Interactive Debugging)
```bash
npm run test:admin-cms:ui
```

---

## Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `admin-cms-pages.spec.ts` | ~30 | Page CRUD, Publishing |
| `admin-access-control.spec.ts` | ~25 | Permissions, Routes |
| `admin-dashboard-stats.spec.ts` | ~35 | Stats, Quick Actions |
| `public-pages-cms.spec.ts` | ~40 | Rendering, A11y |
| `admin-tokens.spec.ts` | ~30 | Token Management |

---

## Common Commands

```bash
# Run all admin tests
npm run test:admin-cms

# Debug with UI mode
npm run test:admin-cms:ui

# Run specific test file
npx playwright test tests/admin-cms-pages.spec.ts

# Run specific test by name
npx playwright test tests/admin-cms-pages.spec.ts -g "should create new page"

# Update visual baselines
npm run test:admin-cms -- --update-snapshots

# Run with headed browser (see what's happening)
npm run test:admin-cms -- --headed

# Run only failed tests
npm run test:admin-cms -- --last-failed
```

---

## Artifacts Locations

- **Screenshots**: `tests/artifacts/*.png`
- **Accessibility**: `tests/artifacts/accessibility/*.json`
- **Test Results**: `tests/test-results/`
- **Playwright Report**: `playwright-report/`

---

## Troubleshooting

### Tests fail with "not authenticated"
```bash
# Regenerate admin session
npx playwright test tests/admin-setup.spec.ts --project=setupAdmin
```

### Tests fail with "not admin"
```bash
# Grant admin role
npm run set:admin -- --email e2e.admin@sistahology.dev
```

### Visual regression failures
```bash
# View diffs in test-results/
# Update baselines if changes are intentional
npm run test:admin-cms -- --update-snapshots
```

---

## Documentation

- **Full Guide**: `tests/ADMIN_CMS_TESTS_README.md`
- **Implementation**: `ADMIN_CMS_TEST_IMPLEMENTATION.md`
- **This File**: Quick start reference

---

## Success Checklist

- [ ] Admin user has `is_admin=true` in profiles table
- [ ] `.env.test` has admin credentials
- [ ] `tests/.auth/admin.json` exists (run admin-setup)
- [ ] Dev server running (`npm run dev` in separate terminal)
- [ ] Tests execute successfully (`npm run test:admin-cms`)

---

**Ready to test? Run:** `npm run test:admin-cms`
