# Dashboard Tab-Switch Bug Testing - Quick Reference

## TL;DR

**Bug**: Dashboard gets stuck on "Loading your dashboard..." after switching browser tabs.

**Test File**: `/tests/dashboard-tab-switch-hang.spec.ts`

**Run Tests**: `npm run test:tab-switch`

**Expected**: Tests FAIL now (bug exists), PASS after fix

---

## Quick Commands

```bash
# Run all tab-switch tests
npm run test:tab-switch

# Run with UI (interactive)
npm run test:tab-switch:ui

# Run in debug mode
npm run test:tab-switch:debug

# Run specific test
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --grep "basic tab-switch"

# Run with trace
npx playwright test tests/dashboard-tab-switch-hang.spec.ts --trace on

# View artifacts
open tests/artifacts/tab-switch/
```

---

## Test Cases (10 Total)

### Core Bug Tests (5)

1. **Basic Tab-Switch** - Main bug reproduction
2. **Multiple Tab Switches** - Resilience test
3. **Long Idle (30s)** - Token expiry scenario
4. **Mid-Navigation Tab Switch** - Race condition test
5. **Auth State Manipulation** - Edge case test

### Control Tests (2)

6. **No Tab Switch** - Proves bug is tab-switch specific
7. **Quick Tab Switch** - Rapid recovery test

### Comparison Tests (2)

8. **Calendar Tab-Switch** - Compare with other pages
9. **Search Tab-Switch** - Compare with other pages

### Debug Capture (1)

10. **Console Log Trace** - Full debug capture

---

## Artifacts Location

`/tests/artifacts/tab-switch/`

- `*.png` - Screenshots at key test points
- `*-state.json` - Page state snapshots
- `*-console.log` - Filtered console logs
- `full-debug-trace.json` - Complete log history

---

## Expected Test Results

### Before Fix (Bug Exists)

```
✓ CONTROL TEST - Dashboard loads normally without tab switch
✗ BUG REPRODUCTION - Basic tab-switch causes infinite loading
✗ BUG CONTEXT - Multiple consecutive tab switches
✗ BUG CONTEXT - Long idle period (30 seconds)
✗ BUG CONTEXT - Tab switch during navigation
```

### After Fix (Bug Resolved)

```
✓ All 10 tests pass
✓ Screenshots show "Welcome back" content
✓ Console logs show successful data loading
✓ No infinite loading states
```

---

## Debug Checklist

When investigating test failures:

1. **Check Screenshots** - Look for stuck loading spinner
2. **Check Page State** - `hasLoadingText: true` indicates stuck
3. **Check Console Logs** - Look for `[TAB-SWITCH-DEBUG]` messages
4. **Check Auth State** - Verify `isReady` and `isAuthenticated`
5. **Check Data Loading** - Look for "Skipping data fetch" messages

---

## Common Failure Patterns

### Pattern 1: Auth State Race
```
[TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch { isReady: false }
```
**Cause**: Tab events resetting auth state incorrectly

### Pattern 2: Loading Guard Blocking
```
[TAB-SWITCH-DEBUG] Dashboard: Skipping data fetch { reason: 'auth not ready' }
```
**Cause**: Guard conditions evaluating incorrectly after tab switch

### Pattern 3: Loading State Stuck
```
[TAB-SWITCH-DEBUG] Dashboard render: isLoading=true
```
**No follow-up log showing completion**
**Cause**: `loadJournals()` never resolves

---

## Manual Reproduction

1. Login to dashboard
2. Switch to another browser tab
3. Wait 10 seconds
4. Return to app tab
5. Navigate to dashboard
6. **BUG**: Stuck on "Loading your dashboard..."

---

## Fix Verification

After implementing fix:

1. Run tests: `npm run test:tab-switch`
2. All tests should PASS
3. Manual verification:
   - Dashboard loads within 2-3 seconds after tab switch
   - Shows "Welcome back" content
   - No infinite loading spinner
4. Check artifacts show success state
5. Add to regression suite

---

## Related Files

- `/src/pages/DashboardPage.tsx` - Dashboard with debug logging
- `/src/stores/authStore.ts` - Auth state management
- `/src/stores/journalStore.ts` - Data loading logic
- `/tests/auth-idle-recovery.spec.ts` - Related auth tests
- `/tests/data-guard.spec.ts` - Related data guard tests

---

## Success Criteria

✅ All tests pass
✅ Screenshots show content (not loading)
✅ Console logs show successful loading
✅ Manual verification confirms fix
✅ No regression in other functionality

---

## Getting Help

See full documentation: `/tests/DASHBOARD_TAB_SWITCH_BUG_TESTING.md`
