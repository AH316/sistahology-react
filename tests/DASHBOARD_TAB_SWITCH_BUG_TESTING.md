# Dashboard Tab-Switch Infinite Loading Bug - Testing Guide

## Bug Description

**Critical UX Bug**: Dashboard page gets stuck showing "Loading your dashboard..." spinner infinitely after switching browser tabs.

### Reproduction Steps

1. User logs in successfully
2. User navigates to dashboard (works fine initially)
3. User switches to another browser tab
4. User waits 5-10 seconds
5. User returns to the app tab
6. User navigates to dashboard → **STUCK showing "Loading your dashboard..." spinner forever**

### Affected Environments

- **Development server** (localhost:5173) - ✅ Bug reproduces
- **Preview server** (localhost:4173) - ✅ Bug reproduces
- **Production** - Likely affected (needs verification)

### Affected Users

- Authenticated users only
- Does NOT affect unauthenticated pages

---

## Test Suite Overview

The test suite in `/tests/dashboard-tab-switch-hang.spec.ts` contains comprehensive E2E tests to:

1. **Reproduce the bug reliably** - Tests should FAIL initially, demonstrating the bug exists
2. **Capture debug artifacts** - Screenshots, console logs, page state snapshots
3. **Verify the fix** - Tests should PASS after bug is fixed
4. **Prevent regression** - Ongoing validation that the bug doesn't return

---

## Running the Tests

### Quick Start

```bash
# Run the full test suite
npm run test:tab-switch

# Run with Playwright UI (interactive debugging)
npm run test:tab-switch:ui

# Run in debug mode (step through test execution)
npm run test:tab-switch:debug
```

### Individual Test Execution

```bash
# Run specific test
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --grep "basic tab-switch"

# Run with trace enabled
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --trace on

# Run with headed browser (see browser window)
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --headed
```

---

## Test Cases

### Core Bug Reproduction

#### 1. Basic Tab-Switch Bug (`BUG REPRODUCTION - Basic tab-switch causes infinite loading`)

**Purpose**: Primary bug reproduction case

**Steps**:
- Navigate to dashboard (initial load succeeds)
- Switch to another tab (blur + visibilitychange events)
- Wait 5 seconds in background
- Return to tab (focus + visibilitychange events)
- Navigate to dashboard again
- **EXPECT**: Dashboard loads within 5 seconds (currently FAILS)

**Expected Result**:
- ❌ **FAILS** when bug exists (dashboard hangs on "Loading your dashboard...")
- ✅ **PASSES** when bug is fixed (dashboard loads successfully)

#### 2. Multiple Tab Switches (`BUG CONTEXT - Multiple consecutive tab switches`)

**Purpose**: Test resilience with repeated tab switches

**Steps**:
- Load dashboard
- Perform 3 consecutive tab switch cycles
- Navigate to dashboard
- **EXPECT**: Dashboard still loads after multiple switches

#### 3. Long Idle Period (`BUG CONTEXT - Long idle period (30 seconds)`)

**Purpose**: Simulate token expiry scenario with extended idle time

**Steps**:
- Load dashboard
- Switch to background for 30 seconds
- Return to tab
- Navigate to dashboard
- **EXPECT**: Dashboard recovers and loads

#### 4. Tab Switch During Navigation (`BUG CONTEXT - Tab switch during navigation`)

**Purpose**: Test race condition when tab switch happens during page navigation

**Steps**:
- Start navigation to dashboard
- Switch tabs mid-navigation
- Wait in background
- Return to tab
- **EXPECT**: Dashboard completes loading despite mid-navigation tab switch

#### 5. Auth State Manipulation (`BUG CONTEXT - Tab switch with auth state manipulation`)

**Purpose**: Test edge case where auth state changes while tab is hidden

**Steps**:
- Load dashboard
- Switch to background
- Toggle `isReady` flag in localStorage while hidden
- Return to tab
- Navigate to dashboard
- **EXPECT**: Dashboard handles auth state changes gracefully

### Control Tests

#### 6. No Tab Switch Control (`CONTROL TEST - Dashboard loads normally without tab switch`)

**Purpose**: Prove the bug is tab-switch specific

**Steps**:
- Navigate directly to dashboard without any tab switching
- **EXPECT**: Dashboard loads normally (should PASS even with bug)

#### 7. Quick Tab Switch (`RAPID RECOVERY - Quick tab switch (< 1 second)`)

**Purpose**: Test rapid tab switch behavior

**Steps**:
- Load dashboard
- Quick tab switch (500ms in background)
- Navigate to dashboard
- **EXPECT**: Dashboard loads after brief tab switch

### Comparison Tests

#### 8. Calendar Page Tab-Switch (`COMPARISON - Calendar page tab-switch behavior`)

**Purpose**: Determine if other pages have the same issue

**Steps**:
- Load calendar page
- Tab switch for 5 seconds
- Navigate to calendar
- **EXPECT**: Calendar loads (helps isolate if bug is dashboard-specific)

#### 9. Search Page Tab-Switch (`COMPARISON - Search page tab-switch behavior`)

**Purpose**: Determine if other pages have the same issue

**Steps**:
- Load search page
- Tab switch for 5 seconds
- Navigate to search
- **EXPECT**: Search loads (helps isolate if bug is dashboard-specific)

### Debug Capture

#### 10. Console Log Trace (`DEBUG CAPTURE - Full console log trace of bug reproduction`)

**Purpose**: Capture complete console log activity for analysis

**Steps**:
- Reproduce bug with full console capture
- Save all logs with timestamps
- Filter `[TAB-SWITCH-DEBUG]` logs
- **Output**: `full-debug-trace.json` with complete log history

---

## Test Artifacts

All test artifacts are saved in `/tests/artifacts/tab-switch/`

### Artifact Types

#### 1. Screenshots (`*.png`)

Full-page screenshots at key test points:
- `basic-tab-switch-initial-load.png` - Dashboard before tab switch
- `basic-tab-switch-tab-away.png` - Page state while tab is hidden
- `basic-tab-switch-tab-returned.png` - Page state after tab return
- `basic-tab-switch-final-state.png` - Final dashboard state (stuck loading)

#### 2. Page State Snapshots (`*-state.json`)

JSON snapshots of page state:

```json
{
  "url": "http://localhost:5173/#/dashboard",
  "hasLoadingText": true,
  "hasWelcomeText": false,
  "hasAuthLoading": false,
  "loadingSpinnerCount": 1,
  "documentHidden": false,
  "visibilityState": "visible",
  "timestamp": "2025-11-27T12:34:56.789Z",
  "authState": {
    "isReady": true,
    "isAuthenticated": true,
    "hasUser": true
  }
}
```

#### 3. Console Logs (`*-console.log`)

Filtered console logs with `[TAB-SWITCH-DEBUG]` prefix:

```
[LOG] [TAB-SWITCH-DEBUG] Dashboard useEffect triggered { isReady: true, hasUser: true, userId: '...' }
[LOG] [TAB-SWITCH-DEBUG] visibilitychange event { hidden: true, visibilityState: 'hidden' }
[LOG] [TAB-SWITCH-DEBUG] window blur event
[LOG] [TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch { isReady: true, hasUser: true, reason: 'auth not ready' }
```

#### 4. Full Debug Trace (`full-debug-trace.json`)

Complete chronological log of all console activity:

```json
{
  "totalLogs": 156,
  "debugLogs": 24,
  "logs": [
    {
      "timestamp": "2025-11-27T12:34:56.789Z",
      "type": "log",
      "message": "[TAB-SWITCH-DEBUG] Dashboard useEffect triggered..."
    }
  ],
  "allLogs": [ /* full log history */ ]
}
```

---

## Debug Logging in Dashboard

The Dashboard component (`/src/pages/DashboardPage.tsx`) includes comprehensive debug logging:

### Tab Event Logging

```javascript
// Logs visibilitychange events
console.log('[TAB-SWITCH-DEBUG] visibilitychange event', {
  hidden: document.hidden,
  visibilityState: document.visibilityState,
  timestamp: new Date().toISOString()
});
```

### Auth State Logging

```javascript
// Logs when useEffect triggers
console.log('[TAB-SWITCH-DEBUG] Dashboard useEffect triggered', {
  isReady,
  hasUser: !!user,
  userId: user?.id,
  timestamp: new Date().toISOString()
});
```

### Data Loading Logging

```javascript
// Logs when journal loading starts/completes
console.log('[TAB-SWITCH-DEBUG] Dashboard: Starting journal load for user', user.id);
console.log('[TAB-SWITCH-DEBUG] Dashboard: Journal load completed', { success, userId });
```

### Loading State Logging

```javascript
// Logs when showing loading spinner
console.log('[TAB-SWITCH-DEBUG] Dashboard render: isLoading=true, showing "Loading your dashboard..."');
```

---

## Analyzing Test Results

### When Tests FAIL (Bug Exists)

Expected failures when bug is present:

```
✓ CONTROL TEST - Dashboard loads normally without tab switch
✗ BUG REPRODUCTION - Basic tab-switch causes infinite loading
✗ BUG CONTEXT - Multiple consecutive tab switches
✗ BUG CONTEXT - Long idle period (30 seconds)
✗ BUG CONTEXT - Tab switch during navigation
✗ BUG CONTEXT - Tab switch with auth state manipulation
```

**What to check**:
1. Screenshots show "Loading your dashboard..." spinner stuck
2. Page state shows `hasLoadingText: true`, `hasWelcomeText: false`
3. Console logs show data fetching being skipped or hanging
4. `isReady` and `isLoading` states in console logs

### When Tests PASS (Bug Fixed)

Expected results after fix:

```
✓ CONTROL TEST - Dashboard loads normally without tab switch
✓ BUG REPRODUCTION - Basic tab-switch causes infinite loading
✓ BUG CONTEXT - Multiple consecutive tab switches
✓ BUG CONTEXT - Long idle period (30 seconds)
✓ BUG CONTEXT - Tab switch during navigation
✓ BUG CONTEXT - Tab switch with auth state manipulation
```

**What to verify**:
1. Screenshots show "Welcome back" content
2. Page state shows `hasLoadingText: false`, `hasWelcomeText: true`
3. Console logs show successful data loading progression
4. No infinite loading states

---

## Common Investigation Patterns

### Pattern 1: Auth State Race Condition

**Symptom**: `isReady` becomes `false` when tab returns

**Check in logs**:
```
[TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch { isReady: false }
```

**Likely cause**: Tab visibility events are incorrectly resetting auth state

### Pattern 2: Data Loading Guard Blocking

**Symptom**: Dashboard renders but data never loads

**Check in logs**:
```
[TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch { reason: 'auth not ready' }
```

**Likely cause**: Guard conditions (`isReady && user?.id`) evaluating incorrectly after tab switch

### Pattern 3: Loading State Not Clearing

**Symptom**: `isLoading` stays `true` forever

**Check in logs**:
```
[TAB-SWITCH-DEBUG] Dashboard render: isLoading=true
```

**No subsequent log showing loading completed**

**Likely cause**: `loadJournals()` never resolves or sets loading state back to `false`

### Pattern 4: useEffect Re-execution Issue

**Symptom**: useEffect doesn't re-run when it should

**Check in logs**:
```
[TAB-SWITCH-DEBUG] Dashboard useEffect triggered
```

**Should appear after tab return, but doesn't**

**Likely cause**: useEffect dependencies not triggering re-execution after tab visibility change

---

## Debugging Tips

### 1. Enable Playwright Trace

```bash
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --trace on
```

View trace:
```bash
npx playwright show-trace tests/artifacts/tab-switch/trace.zip
```

### 2. Run in Headed Mode

```bash
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --headed
```

Allows visual observation of:
- Loading spinner appearing/disappearing
- Tab switch simulation
- Page state transitions

### 3. Run with Debug Mode

```bash
npm run test:tab-switch:debug
```

Pauses execution at each step, allows:
- Inspecting page state in browser console
- Stepping through test actions
- Examining network requests

### 4. Check Console Logs in Real-Time

```bash
# Run with verbose console output
DEBUG=pw:api npx playwright test tests/dashboard-tab-switch-hang.spec.ts
```

### 5. Isolate Specific Test

```bash
# Run only the basic reproduction test
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --grep "basic tab-switch"
```

---

## Expected Fix Verification

Once a fix is implemented, verify with these steps:

### Step 1: Run Full Test Suite

```bash
npm run test:tab-switch
```

**Expected**: All tests pass

### Step 2: Check Artifacts

```bash
open tests/artifacts/tab-switch/basic-tab-switch-final-state.png
```

**Expected**: Screenshot shows "Welcome back" content, not loading spinner

### Step 3: Review Console Logs

```bash
cat tests/artifacts/tab-switch/basic-tab-switch-final-console.log
```

**Expected**: Logs show successful data loading progression:
```
[TAB-SWITCH-DEBUG] Dashboard useEffect triggered
[TAB-SWITCH-DEBUG] Dashboard: Starting journal load
[TAB-SWITCH-DEBUG] Dashboard: Journal load completed { success: true }
```

### Step 4: Manual Verification

1. Start dev server: `npm run dev`
2. Login to dashboard
3. Switch to another browser tab for 10 seconds
4. Return to app tab
5. Navigate to dashboard
6. **Verify**: Dashboard loads within 2-3 seconds, shows "Welcome back" content

### Step 5: Regression Testing

Add the test to regression suite by adding `@regression` tag:

```typescript
test('BUG REPRODUCTION - Basic tab-switch causes infinite loading @regression', async ({ page }) => {
  // test implementation
});
```

Run regression suite:
```bash
npm run test:regression
```

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Dashboard Tab-Switch Bug Tests

on:
  pull_request:
    paths:
      - 'src/pages/DashboardPage.tsx'
      - 'src/stores/authStore.ts'
      - 'src/stores/journalStore.ts'

jobs:
  test-tab-switch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:tab-switch
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: tab-switch-test-artifacts
          path: tests/artifacts/tab-switch/
```

---

## Related Files

### Test Files
- `/tests/dashboard-tab-switch-hang.spec.ts` - Main test suite

### Source Files
- `/src/pages/DashboardPage.tsx` - Dashboard component with debug logging
- `/src/stores/authStore.ts` - Auth state management
- `/src/stores/journalStore.ts` - Journal data loading

### Related Tests
- `/tests/auth-idle-recovery.spec.ts` - Auth recovery mechanisms
- `/tests/data-guard.spec.ts` - Data loading guard tests
- `/tests/protected-gate.spec.ts` - Protected route tests

### Configuration
- `/playwright.config.ts` - Test configuration
- `/package.json` - Test scripts
- `/.env.test` - Test credentials (not in git)

---

## Troubleshooting

### Issue: Tests fail with "Cannot find auth state"

**Cause**: Missing authenticated session

**Fix**:
```bash
# Regenerate auth state
npm run test:e2e -- tests/global-setup.ts
```

### Issue: Dashboard loads in test but hangs manually

**Cause**: Test environment differs from manual testing

**Debug**:
1. Compare `BASE_URL` in test vs manual (check `.env.test`)
2. Check if test uses different Supabase project
3. Verify test user credentials are correct

### Issue: Artifacts not being generated

**Cause**: Artifact directory not created

**Fix**:
```bash
mkdir -p tests/artifacts/tab-switch
```

### Issue: Console logs not captured

**Cause**: Page console listener not attached

**Debug**: Check `beforeEach` hook runs before navigation:
```typescript
test.beforeEach(async ({ page }) => {
  page.on('console', msg => { /* capture */ });
});
```

---

## Success Criteria

The bug is considered FIXED when:

1. ✅ All 10 test cases pass consistently
2. ✅ Screenshots show "Welcome back" content (no loading spinner)
3. ✅ Console logs show successful data loading progression
4. ✅ Manual verification confirms dashboard loads after tab switch
5. ✅ No regression in other dashboard functionality
6. ✅ Tests pass in both dev and preview environments
7. ✅ Tests pass across multiple runs (not flaky)

---

## Next Steps After Fix

1. **Add to regression suite** - Tag with `@regression` to run on every PR
2. **Update documentation** - Mark bug as resolved in `TODO.md`
3. **Remove debug logging** - Clean up `[TAB-SWITCH-DEBUG]` logs from production code
4. **Monitor production** - Verify fix works in production environment
5. **Update FEATURES.md** - Document improved reliability

---

## Contact

For questions about this test suite, contact the test author or refer to:
- `CLAUDE.md` - Project testing standards
- `TESTING.md` - Overall test coverage status
- `E2E_TEST_SETUP.md` - E2E test infrastructure
