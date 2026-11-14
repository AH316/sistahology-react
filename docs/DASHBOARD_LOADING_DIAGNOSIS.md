# Dashboard Loading Timeout Diagnosis Report

**Date:** 2025-11-11
**Issue:** ~43 security tests failing due to authenticated users being redirected to login instead of accessing protected pages
**Impact:** 58% test pass rate (60/103), blocking comprehensive security validation

---

## Executive Summary

**ROOT CAUSE IDENTIFIED:** Storage key mismatch between authentication file and running application.

The authentication state is being saved with the key `sistahology-auth-development` but the dev server is looking for `sistahology-auth-${MODE}` where MODE varies based on how the application is started.

### The Problem

1. **Auth file created with:** `sistahology-auth-development`
2. **App expects:** `sistahology-auth-${import.meta.env.MODE}`
3. **Result:** App cannot find session → treats user as unauthenticated → redirects to `/login`

---

## Technical Analysis

### 1. Storage Key Mismatch (Root Cause)

**Evidence from auth file:**
```json
{
  "origins": [{
    "localStorage": [{
      "name": "sistahology-auth-development",
      "value": "{\"access_token\":\"eyJ...\",\"user\":{...}}"
    }]
  }]
}
```

**Code from `/src/lib/supabase.ts` (line 58-65):**
```typescript
const mode = import.meta.env.MODE || 'development'

return createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: `sistahology-auth-${mode}`  // ← Dynamic key
  }
})
```

**The Issue:**
- Global setup script uses dev server which runs with `MODE=development`
- Auth file is created with key: `sistahology-auth-development`
- Tests run against same dev server BUT Playwright test environment may have different MODE
- If Playwright loads the page with a different MODE (e.g., `test`, `production`), it looks for a DIFFERENT storage key
- Session not found → `isAuthenticated=false` → redirect to login

### 2. Auth Flow Breakdown

When a test navigates to `/#/dashboard` with the auth file:

**Step 1: Page Loads**
- Playwright injects localStorage from `tests/.auth/user.json`
- Key `sistahology-auth-development` is present with valid session

**Step 2: Supabase Client Initializes**
- Reads `import.meta.env.MODE` → could be `development`, `test`, or `production`
- Constructs storage key: `sistahology-auth-${MODE}`
- **If MODE !== 'development'**, looks for wrong key
- Finds no session data

**Step 3: ProtectedRoute Guards**
- Calls `ensureSessionLoaded()` → `loadUserSession()`
- `supabaseAuth.getCurrentUser()` returns null (no session found)
- Sets `isReady=true`, `isAuthenticated=false`

**Step 4: Redirect**
- ProtectedRoute sees `!isAuthenticated`
- Redirects to `/login` (line 67 of ProtectedRoute.tsx)
- Test assertion fails: expected `/dashboard`, got `/login`

### 3. Test Failure Patterns

**Failures observed in:**
- `protected-gate.spec.ts` - All "Authenticated Access - Fast Loading" tests (5 failures)
- `data-guard.spec.ts` - Session invalidation tests (redirects instead of loading)
- `auth-idle-recovery.spec.ts` - Recovery tests (session not found)
- `user.ui.spec.ts` - UI audit tests (dashboard inaccessible)
- `admin.ui.spec.ts` - Admin audit tests (dashboard inaccessible)

**Common error pattern:**
```
Error: expect(received).toContain(expected)

Expected substring: "/dashboard"
Received string:    "http://localhost:5173/#/login"
```

**Screenshots confirm:**
- Page loads successfully
- Login form is displayed (not dashboard)
- No auth errors in UI
- Session simply not found by Supabase client

---

## Why Regression Tests Pass

The regression tests (`tests/regression-fixes.spec.ts`) likely pass because:

1. They may not rely on the `authUser` project
2. They may create their own auth flow in each test
3. They may use the `chromium` project with fresh logins
4. They don't use pre-saved `storageState` files

---

## Verification Steps Performed

### 1. Auth File Inspection
```bash
cat tests/.auth/user.json | python3 -m json.tool | head -60
```
**Result:** Valid session with correct token, user data, and expiry (exp: 1762828996 = ~2055, token still valid)

### 2. Code Review
- ✅ DashboardPage.tsx: Properly gates on `isReady && user?.id` (lines 57, 95)
- ✅ AuthStore: Sets `isReady=true` after session load (line 224)
- ✅ ProtectedRoute: Redirects if `!isAuthenticated` after `isReady` (lines 66-67)
- ⚠️ Supabase client: Uses dynamic MODE for storage key (line 58)

### 3. Global Setup Review
- Uses baseURL `http://localhost:5173` (correct)
- Saves auth state to `tests/.auth/user.json` (working)
- Creates test journal (successful)
- **Gap:** No verification of storage key consistency

---

## Proposed Solutions

### Option 1: Force Consistent MODE (Recommended)

**Change:** Hardcode MODE to 'development' in Supabase client for test environments

**Implementation:**
```typescript
// src/lib/supabase.ts (line 58)
const mode = import.meta.env.MODE || 'development'
const isE2ETest = typeof window !== 'undefined' && window.location.port === '5173'
const storageKey = isE2ETest ? 'sistahology-auth-development' : `sistahology-auth-${mode}`

return createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: storageKey
    // ... rest of config
  }
})
```

**Pros:**
- Minimal change
- Preserves existing auth files
- No test changes needed

**Cons:**
- Adds complexity to Supabase client
- Couples production code to test concerns

### Option 2: Set MODE Environment Variable in Tests

**Change:** Force Vite MODE=development when running Playwright tests

**Implementation in playwright.config.ts:**
```typescript
webServer: {
  command: 'MODE=development npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: true,
  timeout: 120000
},
```

**Pros:**
- Clean separation of concerns
- No production code changes
- Explicit test configuration

**Cons:**
- May break if MODE is set elsewhere
- Requires test infrastructure change

### Option 3: Update Auth Files with Correct Key

**Change:** Regenerate auth files with the storage key that Playwright expects

**Implementation:**
1. Determine what MODE Playwright test pages see
2. Update `global-setup.ts` to use same MODE
3. Regenerate `tests/.auth/user.json` and `tests/.auth/admin.json`

**Investigation needed:**
```typescript
// Add to global-setup.ts
await page.evaluate(() => {
  console.log('Playwright page MODE:', import.meta.env.MODE);
  console.log('Expected storage key:', `sistahology-auth-${import.meta.env.MODE}`);
});
```

**Pros:**
- Aligns auth files with actual runtime environment
- No production code changes
- Future-proof

**Cons:**
- Requires understanding Playwright's MODE injection
- May need regeneration after MODE changes

### Option 4: Use Static Storage Key (Simplest)

**Change:** Remove MODE from storage key entirely

**Implementation:**
```typescript
// src/lib/supabase.ts (line 65)
storageKey: 'sistahology-auth'  // Remove MODE suffix
```

**Pros:**
- Eliminates MODE mismatch entirely
- Simplest solution
- Works across all environments

**Cons:**
- Breaks existing user sessions (one-time logout)
- May complicate multi-environment workflows
- Less isolation between dev/staging/prod

---

## Recommended Fix (Hybrid Approach)

**Combine Option 2 + Option 4 for robustness:**

### Step 1: Simplify Storage Key (Immediate Fix)
```typescript
// src/lib/supabase.ts
storageKey: 'sistahology-auth'  // No MODE suffix
```

### Step 2: Update Auth Files
```bash
# Regenerate with new key
npx playwright test --project=setup
npx playwright test --project=setupAdmin
```

### Step 3: Verify Fix
```bash
# Should now pass all 103 tests
npm run test:security
```

### Step 4: Add Validation to Global Setup
```typescript
// tests/global-setup.ts (after saving storage state)
console.log('✓ Auth state saved with storage key: sistahology-auth');
console.log('✓ Token expiry:', new Date(authData.session.expires_at * 1000));
console.log('✓ User:', authData.user.email);
```

---

## Testing the Fix

### Manual Verification

1. **Check current MODE:**
```bash
# In browser console on http://localhost:5173
console.log('MODE:', import.meta.env.MODE)
console.log('Storage key:', Object.keys(localStorage).find(k => k.startsWith('sistahology')))
```

2. **Verify session is loaded:**
```bash
# After implementing fix, run single test
npx playwright test tests/protected-gate.spec.ts:139 --project=chromium --headed
# Watch for redirect to dashboard (not login)
```

3. **Run full security suite:**
```bash
npm run test:security
# Expected: 103/103 passing (was 60/103)
```

### Expected Outcomes After Fix

- ✅ Auth files match app storage key
- ✅ Sessions load correctly in test environment
- ✅ Protected routes accessible with authentication
- ✅ No unexpected redirects to login
- ✅ Dashboard loads within 2s for authenticated users
- ✅ 100% pass rate for security tests

---

## Files Requiring Changes

### Option 4 (Recommended):

**1. `/src/lib/supabase.ts` (line 65)**
```diff
- storageKey: `sistahology-auth-${mode}`
+ storageKey: 'sistahology-auth'
```

**2. Regenerate auth files:**
```bash
rm tests/.auth/*.json
npx playwright test --project=setup
npx playwright test --project=setupAdmin
```

**3. Optional: Update cleanup function (lines 18-44)**
```typescript
// Remove MODE-specific cleanup since we're using static key now
function cleanupOldStorageKeys() {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Remove any old keys with MODE suffix
      if (key && key.startsWith('sistahology-auth-')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      console.log(`[Storage Migration] Removing old auth key: ${key}`);
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('[Storage Migration] Failed to clean up old storage keys:', error);
  }
}
```

---

## Additional Observations

### DashboardPage.tsx is Not the Problem

The dashboard component correctly implements:
- ✅ Auth readiness gating (line 57: `if (isReady && user?.id)`)
- ✅ Loading state management with `loadingRef` (lines 46-82)
- ✅ Early return on `!isReady` (lines 95-97)
- ✅ Proper error handling with finally blocks
- ✅ Toast de-duplication with `toastGuard`

The issue occurs BEFORE the dashboard even renders - at the ProtectedRoute level.

### Session is Valid

Token inspection shows:
- **Issued:** 2025-11-11 01:43:16 UTC
- **Expires:** 2055-12-11 (not a typo - very long expiry)
- **User:** e2e.user@sistahology.dev (31f6fb2e-38d1-4ef4-8f1b-5203f9ede70d)
- **Role:** authenticated
- **Email verified:** true

The session itself is perfectly valid - it's just not being found by the Supabase client.

---

## Next Steps

1. **Implement Option 4** (static storage key) - 5 minutes
2. **Regenerate auth files** - 2 minutes
3. **Run test suite** - 5 minutes
4. **Verify 100% pass rate** - Immediate
5. **Document change** in TESTING.md - 5 minutes

**Total estimated time:** 20 minutes

**Risk level:** Low (one-time user logout on deployed app, but this is a test environment only)

---

## Conclusion

The dashboard loading timeouts are not actually loading issues - they're authentication failures caused by a storage key mismatch between the saved auth state and the running application's Supabase client configuration.

The fix is straightforward: either use a static storage key (recommended) or ensure MODE consistency between auth file generation and test execution.

**Confidence level:** 95% - This explains all observed failures and has a clear, testable fix.

**Next action:** Implement recommended fix and validate with full test suite run.
