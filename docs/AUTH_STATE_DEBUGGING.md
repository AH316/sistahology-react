# Authentication State Debugging Guide

## Problem Summary

**Issue**: Playwright tests failing with "Authentication failed - redirected to login page" despite auth state appearing to be captured correctly.

**Symptoms**:
- Auth state file (`tests/.auth/user.json`) shows 0 cookies but 1 localStorage item
- Tests consistently redirect to login page
- Manual testing works fine in browser
- Auth state capture script completes successfully

## Root Cause

**The actual problem was NOT missing cookies**. The issue was an **origin mismatch** between where auth state was generated and where tests were executed.

### What Happened

1. **Auth state generated for wrong origin**:
   - `scripts/generate-auth.ts` defaulted to `http://localhost:4173` (preview/production server)
   - Generated auth state file contained localStorage for this origin

2. **Tests run against different origin**:
   - `playwright.config.ts` configured baseURL as `http://localhost:5173` (dev server)
   - Tests attempted to use auth state on this different origin

3. **localStorage is origin-specific**:
   - Playwright's `storageState` only applies localStorage to the exact origin it was captured from
   - When loading auth state for `http://localhost:5173`, it couldn't apply localStorage from `http://localhost:4173`
   - Result: No auth data available → redirect to login

### Why "0 Cookies" Was a Red Herring

The investigation initially focused on the missing cookies, but this turned out to be **correct behavior**:

- **Supabase JS client uses localStorage-only mode by default** (not cookies)
- This is documented Supabase behavior when using the JS client in browsers
- The `persistSession: true` configuration stores the session in localStorage, not cookies
- The diagnostic script confirmed: 0 cookies, 1 localStorage item with full auth token

**Conclusion**: The lack of cookies was normal and expected. The real issue was the origin mismatch preventing localStorage from being applied.

## The Fix

### Changes Made

1. **Updated `scripts/generate-auth.ts`**:
   ```typescript
   // OLD: defaulted to preview server
   const baseUrl = process.env.BASE_URL || 'http://localhost:4173';

   // NEW: defaults to dev server (matches playwright.config.ts)
   const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
   ```

2. **Updated `tests/global-setup.ts`**:
   ```typescript
   // Added explicit comment about origin consistency requirement
   // IMPORTANT: Must match playwright.config.ts baseURL for localStorage origin consistency
   const baseUrl = process.env.BASE_URL || 'http://localhost:5173';
   ```

3. **Regenerated auth state**:
   ```bash
   rm -f tests/.auth/user.json
   npx tsx scripts/generate-auth.ts
   ```

### Verification

After the fix:

```bash
# Check auth state has correct origin
cat tests/.auth/user.json | jq '.origins[0].origin'
# Output: "http://localhost:5173" ✓

# Run regression tests
npx playwright test tests/regression-fixes.spec.ts --project=authUser
# Output: 9 passed (8.6s) ✓
```

## Key Learnings

### 1. Origin Consistency is Critical

When using Playwright's `storageState` feature:
- The origin in the captured state MUST match the baseURL in playwright.config.ts
- localStorage is strictly origin-bound (protocol + host + port)
- Even `http://localhost:5173` vs `http://localhost:4173` are different origins

### 2. Supabase Auth Storage Model

Supabase JS client in browsers:
- **Default storage**: localStorage (not cookies)
- **Storage key**: `sistahology-auth-${mode}` (configurable)
- **What's stored**: Full session object including access_token, refresh_token, user metadata
- **Cookies**: Not used by default (can be configured for SSR environments)

### 3. Debugging Approach

When debugging auth state issues:

1. **Check the basics first**:
   ```bash
   # What origin is in the auth state?
   cat tests/.auth/user.json | jq '.origins[0].origin'

   # What origin are tests using?
   grep baseURL playwright.config.ts
   ```

2. **Verify storage state is being applied**:
   ```typescript
   const localStorage = await page.evaluate(() => {
     const items = {};
     for (let i = 0; i < localStorage.length; i++) {
       const key = localStorage.key(i);
       if (key) items[key] = localStorage.getItem(key);
     }
     return items;
   });
   console.log('LocalStorage items:', Object.keys(localStorage));
   ```

3. **Don't assume cookies are required**:
   - Check the auth library's documentation
   - Verify what storage mechanism it actually uses
   - Cookies are NOT always necessary for web auth

## Prevention

### Development Workflow

To prevent this issue in the future:

1. **Always use consistent origins**:
   - If using dev server for tests → generate auth state on dev server
   - If using preview server for tests → generate auth state on preview server

2. **Document the origin requirement**:
   - Add comments in config files explaining the origin consistency need
   - Include origin in auth generation logs

3. **Add verification step**:
   ```bash
   # Before running tests, verify origins match
   echo "Auth state origin: $(cat tests/.auth/user.json | jq -r '.origins[0].origin')"
   echo "Test baseURL: $(grep 'baseURL:' playwright.config.ts | awk '{print $2}')"
   ```

### Recommended Approach

**Use dev server (http://localhost:5173) for E2E tests**:
- ✓ Faster hot module replacement during test development
- ✓ Matches normal development workflow
- ✓ No build step required before running tests
- ✓ Easier debugging with source maps

**When to use preview server (http://localhost:4173)**:
- Testing production build artifacts
- Verifying build-specific issues
- CI/CD pipelines where builds are pre-built

## Diagnostic Scripts

Two helper scripts are available for debugging auth state issues:

### 1. `scripts/diagnose-auth-cookies.ts`

Comprehensive diagnostic that:
- Logs cookies before/after login
- Logs localStorage before/after login
- Tests storageState capture
- Provides diagnosis of the auth storage model

Usage:
```bash
npx tsx scripts/diagnose-auth-cookies.ts
```

### 2. `scripts/test-storage-origin.ts`

Tests origin mismatch scenarios:
- Loads auth state on dev server (5173)
- Loads auth state on preview server (4173)
- Shows which one works and why

Usage:
```bash
# Ensure both servers are running
npm run dev &
npm run preview &
npx tsx scripts/test-storage-origin.ts
```

## Related Files

- `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/scripts/generate-auth.ts` - Auth state generation script
- `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/global-setup.ts` - Playwright global setup
- `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/playwright.config.ts` - Test configuration
- `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/src/lib/supabase.ts` - Supabase client config
- `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/tests/.auth/user.json` - Captured auth state (origin-specific)

## References

- [Playwright Storage State Documentation](https://playwright.dev/docs/auth#reuse-signed-in-state)
- [Supabase JS Client Auth Configuration](https://supabase.com/docs/reference/javascript/auth-api)
- [Web Storage API - Origin Restrictions](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
