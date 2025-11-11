# Playwright Test Suite - Baseline Report
**Generated:** November 10, 2025
**Database:** Supabase Project `klaspuhgafdjrrbdzlwg` (Recovered Jan 4, 2025)
**Test Environment:** localhost:5173 (dev server)

---

## Executive Summary

**Total Tests Discovered:** 1,417 tests across 36 spec files
**Overall Status:** 🟡 Partially Passing (Multiple Critical Failures)

### High-Level Metrics

| Test Category | Pass | Fail | Skip | Pass Rate | Status |
|--------------|------|------|------|-----------|---------|
| **Regression (@regression)** | 0 | 9 | 0 | 0% | 🔴 Critical |
| **Journals (@journals)** | 3 | 9 | 3 | 25% | 🔴 Critical |
| **Security (103 tests)** | 61 | 42 | 0 | 59% | 🟡 Medium |
| **UI Tests (Guest)** | 27 | 18 | 0 | 60% | 🟡 Medium |
| **UI Tests (User)** | Skipped | Skipped | 222 | N/A | ⚪ Skipped |
| **UI Tests (Admin)** | Skipped | Skipped | ~40 | N/A | ⚪ Skipped |
| **Accessibility** | 37 | 12 | 0 | 76% | 🟡 Medium |
| **Auth/Session Guards** | 20+ | 20+ | 0 | ~50% | 🟡 Medium |
| **Entry Deletion UX** | 8 | 5 | 0 | 62% | 🟡 Medium |

**Critical Finding:** New Entry page and protected routes are not loading properly, causing cascading failures across multiple test suites.

---

## Detailed Test Results by Category

### 1. Regression Tests (@regression) - 🔴 CRITICAL FAILURE

**File:** `tests/regression-fixes.spec.ts`
**Status:** 0/9 passing (0%)
**Impact:** HIGH - Core user journeys broken

#### All Failing Tests:
1. ❌ Save button stays disabled until BOTH editor has non-whitespace AND journal is selected
2. ❌ On save: success toast appears, editor clears, navigation occurs
3. ❌ Capture New Entry screenshots at multiple resolutions
4. ❌ Semantic h1 structure and decorative WELCOME is aria-hidden
5. ❌ Flowers and divider visible at all responsive breakpoints
6. ❌ All interactive elements show visible focus outline on keyboard navigation
7. ❌ Disabled buttons are not focusable
8. ❌ Shift+Tab navigation works correctly
9. ❌ No console errors or warnings during typical user interactions

#### Root Cause Analysis:
**Primary Issue:** Navigation to `/#/new-entry` redirects to `/#/login` for authenticated users

**Error Pattern:**
```
Error: expect(locator).toBeVisible() failed
Locator: locator('h1').filter({ hasText: 'New Entry' })
Expected: visible
Received: <element(s) not found>
Timeout: 10000ms
```

**Screenshot Evidence:** All regression test screenshots show login page instead of expected pages.

**Secondary Issue:** Console error - `AuthApiError: Request rate limit reached`
- Caused by rapid test execution hitting Supabase rate limits
- Detected in console error check test

#### Recommendations:
1. **Immediate:** Fix protected route authentication logic
2. **Short-term:** Add rate limit handling/backoff to auth calls
3. **Testing:** Implement test isolation to prevent auth state pollution

---

### 2. Journal Tests (@journals) - 🔴 CRITICAL FAILURE

**Files:**
- `tests/journals-first-create.spec.ts`
- `tests/journals-recreate-after-delete.spec.ts`
- `tests/toast-dedupe.spec.ts`

**Status:** 3/15 passing (20%)
**Impact:** HIGH - Journal creation workflow broken

#### Passing Tests (3):
✅ should maintain clean state during navigation
✅ should not create duplicate toasts during rapid navigation
✅ should handle multiple error scenarios without crashing

#### Failing Tests (9):
1. ❌ should show empty-state UI and allow first journal creation
2. ❌ should handle journal creation across different viewports
3. ❌ should show exactly zero toasts in successful empty state
4. ❌ should create journal and verify post-creation state
5. ❌ should show empty state after deleting all journals and allow recreation
6. ❌ should handle basic page navigation without errors
7. ❌ should handle empty state consistently across multiple loads
8. ❌ should handle navigation to failing page consistently
9. ❌ should handle empty state without showing any toasts

#### Skipped Tests (3):
- should show error toast when journal loading fails (2 instances)
- should clear error toast when recovery succeeds

#### Root Cause:
Same as regression tests - New Entry page not rendering due to auth redirect issues.

**Error Pattern:**
```
await expect(page.locator('h1').filter({ hasText: 'New Entry' })).toBeVisible();
```
Fails because page shows login form instead of New Entry form.

---

### 3. Security Tests - 🟡 PARTIAL FAILURE

**File:** `tests/security.spec.ts`
**Status:** 61/103 passing (59%)
**Impact:** CRITICAL - Security vulnerabilities may exist

#### Passing Tests (61):
✅ Authentication Security - Unauthenticated Users (8 tests passing)
- Block access to protected routes
- Block access to admin routes
- Invalid login shows errors
- No auth freeze issues

✅ Authorization Security - Partial (12 tests passing)
- Non-admin users blocked from admin routes (partial success)
- Admin access to admin routes (partial success)
- Admin link visibility (partial success)

✅ Content Security (18 tests passing across browsers)
- Accessibility checks on login/new entry forms
- DOMPurify sanitization verified

#### Failing Tests (42):

**Pattern 1: Admin Navigation Visibility (12 tests)**
- Admin link not visible in desktop navigation (6 browsers × 2 user types)
- Admin link not visible in mobile navigation (6 browsers × 2 user types)

**Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('link', { name: 'Admin' })
Expected: visible
Received: <element(s) not found>
```

**Pattern 2: Session/Logout Issues (30 tests)**
- Logout not clearing session properly (6 browsers × 1 test = 6 fails)
- Redirect after logout failing (6 browsers × 1 test = 6 fails)
- XSS sanitization in entries (6 browsers × 2 tests = 12 fails)
- Non-admin admin route blocking (6 browsers × 1 test = 6 fails)

**Common Logout Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('button', { name: 'Sign Out' })
Expected: visible
Received: <element(s) not found>
Timeout: 5000ms
```

#### Security Risk Assessment:
| Risk | Severity | Status |
|------|----------|--------|
| Unauthenticated access to protected routes | HIGH | ✅ PROTECTED |
| Admin route unauthorized access | HIGH | 🟡 PARTIAL |
| Session persistence after logout | MEDIUM | ❌ FAILING |
| XSS in journal entries | MEDIUM | 🟡 UNCLEAR |
| Admin UI exposure | LOW | ❌ FAILING |

#### Recommendations:
1. **URGENT:** Fix logout flow - sign out button not found suggests Navigation component issues
2. **HIGH:** Verify admin link visibility logic in Navigation.tsx
3. **MEDIUM:** Re-test XSS sanitization after New Entry page is fixed
4. **LOW:** Add session regeneration on logout

---

### 4. Guest UI Tests - 🟡 PARTIAL FAILURE

**File:** `tests/guest.ui.spec.ts`
**Status:** 27/45 passing (60%)
**Impact:** MEDIUM - Public pages have issues

#### Passing Tests (27):
✅ All authentication pages (login, register, forgot-password) across all viewports (9 tests)
✅ Protected route redirects working (3 tests)
✅ Blog post slug pages (3 tests)
✅ Miscellaneous successful navigations (12 tests)

#### Failing Tests (18):
❌ **Home page** - 3 failures (390px, 768px, 1280px)
❌ **About page** - 3 failures (390px, 768px, 1280px)
❌ **Contact page** - 3 failures (390px, 768px, 1280px)
❌ **News page** - 3 failures (390px, 768px, 1280px)
❌ **Blog page** - 3 failures (390px, 768px, 1280px)
❌ **Guest navigation flow video** - 1 failure (1280px)

#### Root Cause:
Content pages (home, about, contact, news, blog) are timing out waiting for content to load.

**Error Pattern:**
```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/#/home"
```

**Possible Causes:**
1. CMS content not loading from database
2. Static content files missing
3. Network/API timeout issues
4. React component rendering infinite loops

---

### 5. User UI Tests - ⚪ SKIPPED

**File:** `tests/user.ui.spec.ts`
**Status:** 222 skipped
**Impact:** UNKNOWN - Need to investigate why all tests skipped

**Tests Included:**
- User authentication flow across 3 viewports (390px, 768px, 1280px)
- All protected pages (home, dashboard, calendar, search, new-entry, profile)
- All public pages (about, contact, news, blog)
- Profile navigation consistency
- User login and interaction flow video

**Recommendation:** Determine skip reason - likely related to auth setup or test configuration.

---

### 6. Admin UI Tests - ⚪ SKIPPED

**File:** `tests/admin.ui.spec.ts`
**Status:** ~40 skipped
**Impact:** UNKNOWN - Admin functionality untested

**Tests Included:**
- Admin layout verification across all pages
- Admin CMS functionality (page editing)
- Admin profile consistency
- Admin navigation flow video

**Recommendation:** Investigate skip reason - may be auth setup or admin role assignment issue.

---

### 7. Accessibility Tests - 🟡 PARTIAL FAILURE

**Files:**
- `tests/accessibility.spec.ts`
- `tests/accessibility-auth.spec.ts`
- `tests/contrast-audit.spec.ts`

**Status:** 37/49 passing (76%)
**Impact:** MEDIUM - WCAG compliance at risk

#### Passing Tests (37):
✅ New Entry page accessibility (mobile, tablet, desktop) - 3 tests
✅ Contrast audits for protected pages (6 pages × multiple browsers) - ~30 tests
- Dashboard, Search, Profile, Calendar, Journals, New Entry all pass contrast checks
✅ No contrast violations found on successfully tested pages

#### Failing Tests (12):
❌ **Home page accessibility audit** - 6 failures (all browsers)
❌ **Edit Entry contrast audit** - 6 failures (all browsers)

**Home Page Error:**
```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('h1') to be visible
  - 25 × locator resolved to 2 elements. Proceeding with the first one:
    <h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl tracking-tight"></h1>
```

**Issue:** H1 element exists but has no text content (empty).

**Edit Entry Error:**
```
Test timeout of 30000ms exceeded.
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input#title')
```

**Issue:** Entry edit form not loading - likely related to protected route auth issues.

#### Accessibility Artifacts Generated:
- `/tests/artifacts/accessibility/new-entry-mobile-a11y.json`
- `/tests/artifacts/accessibility/new-entry-tablet-a11y.json`
- `/tests/artifacts/accessibility/new-entry-desktop-a11y.json`
- `/tests/artifacts/accessibility/*-contrast-report.json` (multiple pages)
- `/tests/artifacts/contrast-issues/CONTRAST_AUDIT_SUMMARY.md`

**Key Finding:** Pages that load successfully have NO accessibility violations. Failures are all due to pages not rendering.

---

### 8. Authentication & Session Tests - 🟡 MIXED RESULTS

**Files:**
- `tests/admin-guard.spec.ts`
- `tests/protected-gate.spec.ts`
- `tests/auth-idle-recovery.spec.ts`
- `tests/data-guard.spec.ts`

**Status:** ~20/40 passing (50%)
**Impact:** MEDIUM - Session management issues

#### Passing Tests:
✅ Admin authentication setup completes (2 instances)
✅ Unauthenticated user blocked from protected routes (multiple tests)
✅ Authentication check doesn't freeze (verified)
✅ Protected route redirects work for unauthenticated users (~10 tests)
✅ Dashboard loading state is stable (no infinite spinners)

#### Failing Tests:
❌ Auth idle recovery mechanisms (6 tests)
- Calendar page visibility recovery
- Search page auth watchdog
- Dashboard offline/online handling
- New Entry rapid navigation
- Profile tab focus recovery
- Cross-session recovery

❌ Data guard tests (10 tests)
- Session invalidation during page access
- API session invalidation
- Storage event handling
- Auth readiness gating
- Network timeout handling
- API rate limiting
- Cascading failures
- System recovery

❌ Authenticated user access to protected routes (3 tests)
- Should allow authenticated user to access protected routes
- Should redirect authenticated users away from auth pages
- Should maintain authentication across navigation

**Common Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: locator('h1').filter({ hasText: 'New Entry' })
```

**Root Cause:** Protected routes redirecting authenticated users to login page.

---

### 9. Entry Deletion UX Tests - 🟡 PARTIAL PASSING

**Files:**
- `tests/entry-delete-from-detail.spec.ts`
- `tests/entry-missing-redirect.spec.ts`
- `tests/delete-ux-summary.spec.ts`

**Status:** 8/13 passing (62%)
**Impact:** LOW-MEDIUM - Entry deletion works but has edge case issues

#### Passing Tests (8):
✅ Missing entry redirect works - no crashes or infinite loops
✅ Dashboard loading state is stable
✅ URL security - no directory traversal or code injection
✅ Navigation remains clean
✅ Generate comprehensive screenshots across viewports
✅ Multiple rapid attempts to access missing entry - no loops
✅ Browser back/forward with missing entry - clean navigation
✅ URL manipulation during entry loading - no security issues
✅ Entry ID with special characters - safe handling

#### Failing Tests (5):
❌ Delete entry from detail page - confirm - redirect within 1s - single success toast
❌ Back button navigation stays within app after deletion
❌ No infinite spinners or stuck states during deletion flow
❌ Single toast notification - no spam toasts
❌ Focus management and accessibility during delete flow
❌ Direct access to non-existent entry ID - immediate redirect
❌ Invalid entry ID formats - graceful handling

**Common Error:**
```
Error: expect(locator).toBeVisible() failed
Locator: locator('h1').filter({ hasText: 'Edit Entry' })
Expected: visible
Received: <element(s) not found>
Timeout: 10000ms
```

**Root Cause:** Edit Entry page not loading (same auth redirect issue).

---

### 10. Other Test Suites

#### Calendar Modal Contrast
**File:** `tests/calendar-modal-contrast.spec.ts`
**Status:** 0/2 failing (timeouts)
**Impact:** LOW - Modal contrast verification blocked by other issues

#### Homepage Hero
**File:** `tests/homepage-hero.spec.ts`
**Status:** 0/1 failing
**Error:** Hero structure validation fails (empty h1 element)

#### Journal New Entry
**File:** `tests/journal-new.spec.ts`
**Status:** 0/2 failing
**Error:** Cannot access New Entry page

#### Theme Comparison
**File:** `tests/theme-comparison.spec.ts`
**Status:** Unknown (not run individually)

---

## Failure Pattern Analysis

### Pattern 1: Protected Route Authentication Failures (CRITICAL)
**Affected Tests:** 100+ tests
**Symptom:** Authenticated users redirected to `/login` when accessing protected routes
**Pages Affected:** `/new-entry`, `/dashboard`, `/calendar`, `/search`, `/profile`, `/entries/:id/edit`

**Evidence:**
```
Current URL after navigation: http://localhost:5173/#/login
Expected URL: http://localhost:5173/#/new-entry
```

**Likely Causes:**
1. `ProtectedRoute.tsx` auth check logic broken
2. Auth store `isReady` flag not set correctly
3. Playwright auth state file (`tests/.auth/user.json`) invalid or expired
4. Session token not being read from storage

**Impact:** Cascading failures across 6+ test suites

---

### Pattern 2: Content Loading Timeouts (HIGH)
**Affected Tests:** 20+ tests
**Symptom:** Public pages (home, about, contact, news, blog) timeout waiting for content
**Timeout:** 30000ms (30 seconds)

**Evidence:**
```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:5173/#/home"
```

**Likely Causes:**
1. CMS content fetch from Supabase failing
2. Database RLS policies blocking anonymous read access
3. Static content files missing
4. React component infinite render loop

**Impact:** Guest UI tests failing, homepage accessibility tests failing

---

### Pattern 3: Navigation Component Issues (MEDIUM)
**Affected Tests:** 40+ tests
**Symptom:** Sign Out button and Admin link not found in Navigation

**Evidence:**
```
Error: expect(locator).toBeVisible() failed
Locator: getByRole('button', { name: 'Sign Out' })
Expected: visible
Received: <element(s) not found>
```

**Likely Causes:**
1. Navigation component not rendering for authenticated users
2. Mobile/desktop navigation toggle logic broken
3. Admin role check failing in Navigation
4. Component conditional rendering logic error

**Impact:** Security tests (logout flow), Admin UI visibility tests

---

### Pattern 4: Empty Content Elements (LOW)
**Affected Tests:** 5+ tests
**Symptom:** H1 elements exist but contain no text content

**Evidence:**
```
locator resolved to 2 elements. Proceeding with the first one:
<h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl tracking-tight"></h1>
```

**Likely Causes:**
1. CMS content not loading into React state
2. Static content props not passed to components
3. Content sanitization removing all text
4. Database query returning empty results

**Impact:** Homepage accessibility tests, semantic structure tests

---

### Pattern 5: Rate Limiting (LOW)
**Affected Tests:** 1 test (but may affect others)
**Symptom:** Supabase auth API rate limit reached during test execution

**Evidence:**
```
Console errors detected:
AuthApiError: Request rate limit reached
```

**Likely Causes:**
1. Tests running too fast in parallel
2. No backoff/retry logic for auth calls
3. Each test making redundant auth calls
4. Supabase project on free tier with low limits

**Impact:** Console error detection tests, potential auth failures

---

## Critical Path to Fix

### Phase 1: Authentication & Protected Routes (URGENT)
**Priority:** P0 - Blocking 100+ tests

**Tasks:**
1. Investigate `ProtectedRoute.tsx` auth check logic
   - File: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/components/ProtectedRoute.tsx`
   - Check: `isReady`, `user`, session token validation

2. Verify Playwright auth state files
   - Files:
     - `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/.auth/user.json`
     - `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/.auth/admin.json`
   - Action: Regenerate if expired or invalid

3. Test auth store manually
   - File: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/stores/authStore.ts`
   - Check: `isReady` flag, session persistence, `getSession()` calls

4. Fix and re-run:
   - `npm run test:regression` (should go from 0/9 to 9/9)
   - `npm run test:journals` (should go from 3/15 to 12/15+)

**Expected Outcome:** 100+ tests start passing

---

### Phase 2: Content Loading & CMS (HIGH)
**Priority:** P1 - Blocking 20+ tests

**Tasks:**
1. Debug homepage content loading
   - File: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/pages/HomePage.tsx`
   - Check: CMS fetch logic, static fallback, empty state handling

2. Verify database RLS policies for public content
   - Check: `pages` table allows anonymous SELECT
   - SQL: Run verification in Supabase SQL Editor

3. Test public pages manually in browser
   - Pages: `/`, `/about`, `/contact`, `/news`, `/blog`
   - Check: Content loads within 2 seconds

4. Fix and re-run:
   - `npx playwright test tests/guest.ui.spec.ts`
   - `npx playwright test tests/homepage-hero.spec.ts`
   - `npx playwright test tests/accessibility.spec.ts`

**Expected Outcome:** 20+ tests start passing

---

### Phase 3: Navigation Component (MEDIUM)
**Priority:** P2 - Blocking 40+ tests

**Tasks:**
1. Debug Sign Out button rendering
   - File: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/components/Navigation.tsx`
   - Check: Conditional rendering logic, auth state usage

2. Debug Admin link visibility
   - File: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/components/Navigation.tsx`
   - Check: Admin role check, mobile vs desktop rendering

3. Test navigation manually
   - Test: Login, verify Sign Out button appears
   - Test: Login as admin, verify Admin link appears

4. Fix and re-run:
   - `npm run test:security` (should go from 61/103 to 90+/103)

**Expected Outcome:** 40+ tests start passing

---

### Phase 4: Rate Limiting & Polish (LOW)
**Priority:** P3 - Nice to have

**Tasks:**
1. Add backoff/retry to auth calls
2. Reduce parallel test workers if needed
3. Add test isolation improvements
4. Review Supabase rate limits

**Expected Outcome:** Cleaner test runs, no rate limit errors

---

## Test Infrastructure Status

### Test Setup Files
✅ `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/global-setup.ts` - Exists
✅ `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/admin-setup.ts` - Exists
✅ `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/playwright.config.ts` - Configured

### Auth State Files
⚠️ `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/.auth/user.json` - May be stale
⚠️ `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/.auth/admin.json` - May be stale

**Recommendation:** Regenerate auth files:
```bash
npx playwright test --project=setup
npx playwright test --project=setupAdmin
```

### Test Artifacts
✅ Screenshots: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/artifacts/screens/`
✅ Accessibility Reports: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/artifacts/accessibility/`
✅ Contrast Reports: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/artifacts/contrast-issues/`
✅ Test Results: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/artifacts/test-results/`

---

## Known Issues Summary

| Issue ID | Severity | Category | Description | Tests Affected |
|----------|----------|----------|-------------|----------------|
| AUTH-001 | CRITICAL | Auth | Protected routes redirect authenticated users to login | 100+ |
| CONTENT-001 | HIGH | CMS | Public pages timeout waiting for content | 20+ |
| NAV-001 | MEDIUM | UI | Sign Out button not found in Navigation | 30+ |
| NAV-002 | MEDIUM | UI | Admin link not visible for admin users | 12+ |
| A11Y-001 | LOW | Accessibility | Homepage H1 element empty | 5+ |
| RATE-001 | LOW | Infrastructure | Supabase auth rate limit hit | 1 |

---

## Regression Risks

### High Risk Areas:
1. **User Authentication Flow** - Cannot access any protected pages
2. **Journal Creation** - Critical user journey completely broken
3. **Entry Management** - Cannot create or edit entries
4. **Admin Features** - Admin UI not visible or accessible

### Medium Risk Areas:
1. **Public Content Pages** - Visitors cannot view about/contact/news/blog
2. **Session Management** - Logout flow not working correctly
3. **Navigation UX** - Sign out and admin navigation broken

### Low Risk Areas:
1. **Entry Deletion** - Most delete operations work, edge cases failing
2. **Accessibility** - Pages that load are accessible, just need loading fixes
3. **Contrast** - All tested pages pass contrast requirements

---

## Next Steps

### Immediate Actions (Today):
1. ✅ Baseline report generated (this document)
2. ⬜ Regenerate auth state files for Playwright
3. ⬜ Debug `ProtectedRoute.tsx` authentication logic
4. ⬜ Verify auth store `isReady` flag behavior
5. ⬜ Test protected route access manually in browser

### Short-term Actions (This Week):
1. ⬜ Fix protected route authentication (AUTH-001)
2. ⬜ Fix public content loading (CONTENT-001)
3. ⬜ Fix Navigation component rendering (NAV-001, NAV-002)
4. ⬜ Re-run full test suite to measure progress
5. ⬜ Update this baseline report with new metrics

### Long-term Actions (Next Sprint):
1. ⬜ Implement rate limiting backoff logic
2. ⬜ Add test isolation improvements
3. ⬜ Increase test coverage for admin features
4. ⬜ Implement CI/CD integration for test suite
5. ⬜ Set up test result tracking dashboard

---

## Test Execution Commands

```bash
# Full test suite (1417 tests - expect ~4 hours)
npm run test:e2e

# Regression tests (9 tests - expect 30s)
npm run test:regression

# Journal tests (15 tests - expect 1m)
npm run test:journals

# Security tests (103 tests - expect 2m)
npm run test:security

# UI tests - Guest (45 tests)
npx playwright test tests/guest.ui.spec.ts

# UI tests - User (30 tests - currently skipped)
npx playwright test tests/user.ui.spec.ts

# UI tests - Admin (40 tests - currently skipped)
npx playwright test tests/admin.ui.spec.ts

# Accessibility tests (10 tests)
npx playwright test tests/accessibility.spec.ts

# Contrast audits (7 tests)
npx playwright test tests/contrast-audit.spec.ts

# Regenerate auth files
npx playwright test --project=setup
npx playwright test --project=setupAdmin

# Debug specific test
npx playwright test --debug tests/regression-fixes.spec.ts
```

---

## Appendix: Test File Inventory

**Total Test Files:** 36

| # | File | Purpose | Status |
|---|------|---------|--------|
| 1 | `accessibility.spec.ts` | WCAG compliance | 🟡 Partial |
| 2 | `accessibility-auth.spec.ts` | Protected page a11y | ✅ Passing |
| 3 | `admin-guard.spec.ts` | Admin auth guards | 🟡 Partial |
| 4 | `admin-setup.spec.ts` | Admin auth setup | ✅ Passing |
| 5 | `admin.ui.spec.ts` | Admin UI tests | ⚪ Skipped |
| 6 | `auth-idle-recovery.spec.ts` | Session recovery | ❌ Failing |
| 7 | `calendar-modal-contrast.spec.ts` | Modal contrast | ❌ Failing |
| 8 | `contrast-audit.spec.ts` | Color contrast | 🟡 Partial |
| 9 | `data-guard.spec.ts` | Data access guards | ❌ Failing |
| 10 | `debug-auth-state.spec.ts` | Auth debugging | ✅ Passing |
| 11 | `debug-dom-structure.spec.ts` | DOM debugging | ✅ Passing |
| 12 | `debug-hash-routing.spec.ts` | Routing debugging | ✅ Passing |
| 13 | `debug-isready.spec.ts` | Auth ready debugging | ✅ Passing |
| 14 | `debug-new-entry.spec.ts` | New entry debugging | ✅ Passing |
| 15 | `debug-new-entry-2.spec.ts` | New entry debugging | ✅ Passing |
| 16 | `debug-protected-route.spec.ts` | Protected route debug | ✅ Passing |
| 17 | `debug-protected-route-render.spec.ts` | Route render debug | ✅ Passing |
| 18 | `debug-route-render.spec.ts` | Route render debug | ✅ Passing |
| 19 | `delete-ux-summary.spec.ts` | Entry deletion UX | 🟡 Partial |
| 20 | `entry-delete-from-detail.spec.ts` | Delete from detail | ❌ Failing |
| 21 | `entry-missing-redirect.spec.ts` | 404 handling | 🟡 Partial |
| 22 | `guest.ui.spec.ts` | Guest UI tests | 🟡 Partial |
| 23 | `homepage-hero.spec.ts` | Hero section | ❌ Failing |
| 24 | `journal-new.spec.ts` | New journal entry | ❌ Failing |
| 25 | `journals-first-create.spec.ts` | First journal flow | ❌ Failing |
| 26 | `journals-recreate-after-delete.spec.ts` | Journal recreation | ❌ Failing |
| 27 | `new-entry.spec.ts` | New entry tests | ❌ Failing |
| 28 | `protected-gate.spec.ts` | Protected route gates | 🟡 Partial |
| 29 | `regression-fixes.spec.ts` | Core regression tests | ❌ Failing |
| 30 | `security.spec.ts` | Security suite | 🟡 Partial |
| 31 | `test-new-entry-behavior.spec.ts` | Entry behavior | Unknown |
| 32 | `theme-comparison.spec.ts` | Theme tests | Unknown |
| 33 | `toast-dedupe.spec.ts` | Toast deduplication | 🟡 Partial |
| 34 | `ui-regression-sweep.spec.ts` | UI regression sweep | Unknown |
| 35 | `user.ui.spec.ts` | User UI tests | ⚪ Skipped |
| 36 | `verify-hash-routing.spec.ts` | Hash routing verify | Unknown |

---

**Report End**
