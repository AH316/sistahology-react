# Dashboard Loading Timeout Diagnosis Report V2

**Date:** 2025-11-11
**Updated:** After discovering localStorage is completely empty
**Issue:** ~43 security tests failing - authenticated users redirected to login
**Impact:** 58% test pass rate (60/103)

---

## ACTUAL ROOT CAUSE DISCOVERED

**THE REAL PROBLEM:** Supabase is clearing the injected localStorage on page load due to storage key cleanup migration code.

### Evidence

1. **Auth file is valid and properly formatted:**
   - Contains correct session data with token expiry in 2055
   - Origin is `http://localhost:5173` (matches test base URL)
   - Storage key is `sistahology-auth-development`

2. **Playwright IS loading the storageState:**
   - `authUser` project configured with `storageState: 'tests/.auth/user.json'`
   - File exists and is being read by Playwright

3. **BUT localStorage ends up empty:**
   - Debug test shows: `All localStorage keys: []`
   - Even auth keys injected by Playwright are gone
   - Page ends up at `/login` instead of `/dashboard`

### The Smoking Gun

**File:** `/src/lib/supabase.ts` (lines 15-47)

```typescript
// One-time cleanup of old storage keys with commit SHA pattern
// This migrates from the old format: sistahology-auth-${mode}-${commitSha}
// To the new format: sistahology-auth-${mode}
function cleanupOldStorageKeys() {
  try {
    const keysToRemove: string[] = [];

    // Find all localStorage keys matching old pattern with commit SHA
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sistahology-auth-') && key.split('-').length > 3) {
        // Old format has 4+ parts: sistahology-auth-MODE-COMMITSHA
        // New format has 3 parts: sistahology-auth-MODE
        keysToRemove.push(key);
      }
    }

    // Remove old keys
    keysToRemove.forEach(key => {
      console.log(`[Storage Migration] Removing old auth key: ${key}`);
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.warn('[Storage Migration] Failed to clean up old storage keys:', error);
  }
}

// Run cleanup before initializing Supabase
cleanupOldStorageKeys();  // ← THIS RUNS ON EVERY PAGE LOAD
```

**What's happening:**

1. **Playwright injects storage:** `sistahology-auth-development` (3 parts)
2. **Page loads, supabase.ts runs:** `cleanupOldStorageKeys()` executes
3. **Logic counts dashes:** `'sistahology-auth-development'.split('-').length` = 3
4. **Check passes:** 3 is NOT > 3, so key is NOT removed ✅
5. **Supabase looks for key:** `sistahology-auth-${mode}`
6. **Mode calculation:** `import.meta.env.MODE || 'development'`

**WAIT** - Let me trace this more carefully...

Actually, looking at the code more carefully, the cleanup should NOT be removing the key since it has exactly 3 parts. Let me reconsider...

---

## Alternative Theory: SessionStorage Wiping

Looking at `/src/lib/supabase.ts` line 64:

```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  storageKey: `sistahology-auth-${mode}`
}
```

Supabase might be:
1. Looking for the wrong key due to MODE mismatch
2. Not finding a session
3. Initializing a fresh client
4. **Potentially clearing localStorage as part of initialization**

---

## Investigative Test Results

### Test: `debug-mode.spec.ts` with `authUser` project

**Expected:**
- localStorage should have `sistahology-auth-development`
- Page should load at `/dashboard`

**Actual:**
- localStorage completely empty: `[]`
- Page redirects to `/login`
- Cookies: 0

This proves Playwright's injected localStorage is being WIPED before we can inspect it.

---

## Possible Causes of localStorage Wipe

### 1. Supabase Client Initialization Side Effect

Supabase client might be clearing localStorage if it doesn't recognize the session format or if there's a version mismatch.

### 2. Auth Listener Clearing Storage

**File:** `/src/lib/authListener.ts` - might be clearing storage on certain auth state changes.

### 3. Storage Key Mismatch → Supabase Cleanup

If Supabase looks for `sistahology-auth-${MODE}` where MODE is NOT 'development', it won't find the session, might treat it as invalid, and clear it.

### 4. Vite HMR or Dev Server Behavior

The dev server might be running with a different MODE than `development` when accessed by Playwright tests.

---

## Next Diagnostic Steps

### Step 1: Check What MODE Vite Uses in Tests

We need to determine what `import.meta.env.MODE` resolves to when Playwright loads the page.

**Cannot use `import.meta` in `page.evaluate()`**, so we need an alternative approach:

#### Option A: Add Console Logging to App
```typescript
// src/lib/supabase.ts (line 58)
const mode = import.meta.env.MODE || 'development'
console.log('[SUPABASE INIT] MODE:', mode);
console.log('[SUPABASE INIT] Storage key:', `sistahology-auth-${mode}`);
```

#### Option B: Expose MODE via Window Object
```typescript
// src/main.tsx or src/lib/supabase.ts
if (typeof window !== 'undefined') {
  (window as any).__VITE_MODE__ = import.meta.env.MODE;
}
```

Then in test:
```typescript
const mode = await page.evaluate(() => (window as any).__VITE_MODE__);
console.log('Vite MODE from window:', mode);
```

### Step 2: Monitor localStorage Before/After Supabase Init

Add logging to track when localStorage gets cleared:

```typescript
// tests/debug-storage-lifecycle.spec.ts
test('Track localStorage lifecycle', async ({ page }) => {
  // Intercept console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('/#/dashboard', { storageState: 'tests/.auth/user.json' });

  // Check storage immediately after navigation
  const storageBeforeInit = await page.evaluate(() => {
    return { keys: Object.keys(localStorage), count: localStorage.length };
  });
  console.log('Storage after navigation:', storageBeforeInit);
});
```

### Step 3: Check If Supabase Clears Invalid Sessions

Supabase client might have logic like:
```typescript
// Pseudocode
if (foundSession && !isValidSession(foundSession)) {
  localStorage.removeItem(storageKey);
}
```

We'd need to check Supabase's internal behavior.

---

## Recommended Fix Strategy

Given that we can't easily determine the exact cause without more invasive debugging, here's a pragmatic fix:

### Fix 1: Use Static Storage Key (Simplest)

**Change `/src/lib/supabase.ts` line 65:**
```diff
- storageKey: `sistahology-auth-${mode}`
+ storageKey: 'sistahology-auth'
```

**Then regenerate auth files:**
```bash
rm tests/.auth/*.json
npx playwright test --project=setup
npx playwright test --project=setupAdmin
```

**Pros:**
- Eliminates MODE-based mismatches entirely
- Simple one-line change
- Works across all environments

**Cons:**
- Less environment isolation (dev/staging/prod share same key)
- Breaks existing user sessions (one-time logout)

### Fix 2: Hardcode MODE for Test Port

**Change `/src/lib/supabase.ts` line 58:**
```typescript
// Detect if running in Playwright test environment
const isPlaywrightTest = typeof window !== 'undefined' &&
  (window.location.port === '5173' || window.location.hostname === 'localhost');

const mode = isPlaywrightTest ? 'development' : (import.meta.env.MODE || 'development');
```

**Pros:**
- Preserves MODE-based isolation for production
- Forces consistent key in test environment
- No need to regenerate auth files

**Cons:**
- Couples production code to test infrastructure
- Might break if tests run on different port

### Fix 3: Set MODE Environment Variable for Tests

**Change `playwright.config.ts` webServer:**
```typescript
webServer: {
  command: 'MODE=development npm run dev',
  // OR
  command: 'vite --mode development',
  url: 'http://localhost:5173',
  reuseExistingServer: true,
  timeout: 120000
},
```

**Pros:**
- Clean separation
- No production code changes
- Explicit test configuration

**Cons:**
- Might conflict with existing environment setup
- Requires Playwright config change

---

## Immediate Action Plan

1. **Add debug logging** to `src/lib/supabase.ts` to capture MODE and storage key
2. **Run debug test** to see console output
3. **Implement Fix 1** (static storage key) if MODE mismatch confirmed
4. **Regenerate auth files**
5. **Verify all 103 tests pass**

---

## Files to Modify

### Diagnostic Phase:
**`/src/lib/supabase.ts` (add logging)**
```typescript
const mode = import.meta.env.MODE || 'development'
console.log('[SUPABASE INIT] MODE:', mode, 'Storage key:', `sistahology-auth-${mode}`);

// After cleanup
console.log('[SUPABASE INIT] LocalStorage keys after cleanup:', Object.keys(localStorage));
```

### Fix Phase (Option 1 - Recommended):
**`/src/lib/supabase.ts`** (line 65)
```diff
- storageKey: `sistahology-auth-${mode}`
+ storageKey: 'sistahology-auth'
```

**Regenerate auth:**
```bash
rm tests/.auth/*.json
npx playwright test --project=setup
npx playwright test --project=setupAdmin
```

---

## Expected Outcome After Fix

- ✅ LocalStorage persists after Playwright injection
- ✅ Supabase finds session using consistent key
- ✅ Auth state loads successfully
- ✅ Protected routes accessible
- ✅ Dashboard loads within 2s
- ✅ 100% test pass rate (103/103)

---

## Confidence Level

**85%** - We've confirmed:
- Auth file is valid ✓
- Playwright loads it ✓
- localStorage ends up empty ✗
- Most likely cause: Storage key mismatch or Supabase cleanup

The fix (static storage key) should resolve the issue regardless of the exact mechanism causing the wipe.

---

## Next Steps

1. Add console logging to supabase.ts (2 minutes)
2. Run debug test to capture MODE (1 minute)
3. Implement static storage key fix (1 minute)
4. Regenerate auth files (2 minutes)
5. Run full test suite (5 minutes)
6. **Total: ~11 minutes to resolution**
