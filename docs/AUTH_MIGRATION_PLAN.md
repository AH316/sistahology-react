# Auth System Migration Plan

**Date Created:** 2025-01-11
**Status:** RESEARCH COMPLETE - READY FOR IMPLEMENTATION
**Estimated Time:** 4-6 hours
**Risk Level:** LOW

---

## Executive Summary

### Problem
Tab-switch bug causes infinite "Loading your dashboard..." spinner after:
1. Login → Dashboard (works)
2. Switch to another tab → Wait 5-10s
3. Return to tab → Navigate to dashboard → **STUCK LOADING**

### Root Cause
**Architectural issue, not implementation bug:**
- Custom auth system duplicates Supabase's built-in functionality
- Dual state: Supabase localStorage + Zustand localStorage (desync)
- Tab visibility listener **intentionally disabled** to prevent infinite loops
- Custom code fights against Supabase's automatic recovery

### Recommendation
**REBUILD with official Supabase + React Context pattern**

**Why rebuild instead of fix:**
- Current system: ~800 lines of custom auth code
- Official pattern: ~150 lines
- Supabase handles tab recovery natively (we're fighting it)
- Community consensus: Context API sufficient for auth state
- Lower long-term maintenance burden

---

## Research Findings

### 1. Official Supabase Guidance (2025)

**Deprecated:**
- ❌ `@supabase/auth-helpers-react` (officially discontinued)

**Recommended:**
- ✅ Use `@supabase/supabase-js` directly with React Context
- ✅ Supabase handles: session persistence, tab recovery, token refresh
- ✅ React handles: UI state derived from Supabase session

**Official Pattern:**
```typescript
useEffect(() => {
  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
  })

  // Subscribe to changes (handles tab visibility automatically)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

### 2. Current System Problems

```
❌ Dual State Synchronization
   - Supabase: localStorage key "sb-{projectId}-auth-token"
   - Zustand: localStorage key "sistahology-auth"
   - These can desync, causing infinite loading

❌ Disabled Recovery Mechanism
   - authListener.ts lines 116-118: Tab visibility listener DISABLED
   - Comment: "causes more problems than it solves"
   - Result: No recovery when tab returns to focus

❌ Complex Concurrency Controls
   - sessionLoadRef: Prevent duplicate calls
   - Singleton pattern: Prevent HMR issues
   - isReady flag: Timeout protection
   - All unnecessary with proper architecture

❌ Fighting Supabase Design
   - Custom persistence (Supabase already persists)
   - Custom recovery (Supabase already recovers)
   - Custom singleton (React Context simpler)
```

### 3. Community Best Practices

**Most Popular Patterns:**
- React Context API (simplest, recommended by Supabase)
- Zustand (good for app state, overkill for auth)
- React Query/TanStack Query (for server state, not auth state)

**Common Pitfalls (found in GitHub issues):**
- Don't include Supabase client in dependency arrays → infinite loops
- Don't call Supabase methods inside `onAuthStateChange` → use setTimeout
- Don't duplicate state → Supabase already persists
- Tab visibility recovery is automatic → don't disable it

**Reference Implementations:**
- [react-supabase-auth-template](https://github.com/mmvergara/react-supabase-auth-template) - 100+ stars
- [TanStack Router Supabase Example](https://tanstack.com/router/v1/docs/framework/react/examples/start-supabase-basic)

---

## Migration Plan

### Files Affected (24 total)

#### DELETE (3 files, ~800 lines)
```
src/lib/authListener.ts     (267 lines) - Custom auth runtime
src/lib/authRuntime.ts       (9 lines)   - Runtime dispatcher
Remove from package.json: zustand (keep for journalStore)
```

#### CREATE (1 file, ~150 lines)
```
src/contexts/AuthContext.tsx - Official Supabase + React pattern
```

#### REPLACE
```
src/stores/authStore.ts (438 lines) → DELETE (replaced by AuthContext)
```

#### SIMPLIFY (1 file)
```
src/components/ProtectedRoute.tsx
  - Remove: Watchdog timer, retry logic, timeout protection
  - Keep: isReady check, isAuthenticated check, redirect logic
  - Result: ~60 lines → ~30 lines
```

#### UPDATE (18 files - imports only)
```
All pages/components using useAuth():
- src/pages/DashboardPage.tsx
- src/pages/LoginPage.tsx
- src/pages/ProfilePage.tsx
- src/pages/NewEntryPage.tsx
- src/pages/EditEntryPage.tsx
- src/pages/SearchPage.tsx
- src/pages/CalendarPage.tsx
- src/pages/JournalsPage.tsx
- src/pages/AllEntriesPage.tsx
- src/pages/TrashBinPage.tsx
- src/pages/RegisterPage.tsx
- src/components/Navigation.tsx
- src/components/QuickEntryModal.tsx
- src/components/AuthRedirect.tsx
- src/components/AdminRoute.tsx
- src/App.tsx
```

**Good News:** All use `useAuth()` hook → change import only, no component changes!

---

## Implementation Steps

### Phase 1: Create AuthContext (1 hour)

**File:** `src/contexts/AuthContext.tsx`

**Key Features:**
- Same `useAuth()` interface (no breaking changes)
- Single source of truth (Supabase session only)
- Tab recovery automatic (Supabase native)
- No localStorage duplication
- No custom singleton needed

**Interface to maintain:**
```typescript
interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  isReady: boolean
  isAdmin: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<ApiResponse<User>>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<ApiResponse<User>>
  clearError: () => void
  retryAuth: () => void
  loadUserSession: () => Promise<void>
}
```

**Pattern:**
```typescript
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Initialize session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Listen to auth changes (handles tab visibility automatically)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile when session changes
  useEffect(() => {
    if (session?.user) {
      fetchProfile(session.user.id)
    } else {
      setProfile(null)
      setIsAdmin(false)
    }
  }, [session])

  // ... login, logout, register methods
}
```

### Phase 2: Update App.tsx (15 minutes)

**Before:**
```typescript
import { initAuth } from './lib/authRuntime'

function App() {
  useEffect(() => {
    initAuth()
  }, [])

  return <RouterProvider router={router} />
}
```

**After:**
```typescript
import { AuthProvider } from './contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
```

### Phase 3: Update Imports (30 minutes)

**Find and replace in 18 files:**
```typescript
// Old
import { useAuth } from '../stores/authStore'

// New
import { useAuth } from '../contexts/AuthContext'
```

**Note:** No component logic changes needed - interface identical

### Phase 4: Simplify ProtectedRoute (15 minutes)

**Remove:**
- `watchdogFailed` state
- `timeoutRef` and watchdog timer
- `retryAuth` call
- Complex timeout logic

**Keep:**
```typescript
if (!isReady) return <LoadingSpinner />
if (!isAuthenticated) return <Navigate to="/login" />
return <>{children}</>
```

### Phase 5: Delete Old Files (5 minutes)

```bash
rm src/lib/authListener.ts
rm src/lib/authRuntime.ts
rm src/stores/authStore.ts
```

### Phase 6: Remove Zustand (5 minutes)

```bash
npm uninstall zustand
```

**Important:** Check that `journalStore.ts` still works (it uses Zustand separately)

### Phase 7: Testing (1-2 hours)

#### Manual Testing Checklist
- [ ] Login with email/password
- [ ] Logout
- [ ] Protected routes redirect to login
- [ ] Admin routes work (admin users only)
- [ ] **Tab switch → return → navigate to dashboard (THE BUG)**
- [ ] Token refresh after 1 hour
- [ ] Session persists on page reload
- [ ] Register new user
- [ ] Password reset flow
- [ ] Admin token invitation flow

#### E2E Testing
- [ ] Run full test suite: `npm run test:e2e`
- [ ] Update `tests/global-setup.ts` if needed
- [ ] Fix any tests that mock authStore directly
- [ ] Verify 300+ tests still pass

### Phase 8: Cleanup (15 minutes)

- [ ] Clear localStorage key: `sistahology-auth` (users logged out once)
- [ ] Update CLAUDE.md documentation
- [ ] Remove `[TAB-SWITCH-DEBUG]` logs (optional - keep for verification)
- [ ] Update package.json scripts if needed
- [ ] Git commit with clear message

---

## Risk Analysis

### Migration Risks

**Risk 1: Users Logged Out Once**
- **Why:** localStorage key changes
- **Impact:** Low - users log in again
- **Mitigation:** None needed (acceptable)

**Risk 2: E2E Tests Break**
- **Why:** Tests might mock authStore
- **Impact:** Medium - need test updates
- **Mitigation:** Update test setup, re-run suite

**Risk 3: Missing Edge Cases**
- **Why:** New implementation untested
- **Impact:** Medium - could introduce bugs
- **Mitigation:** Thorough manual + E2E testing

**Risk 4: Admin Token Flow Breaks**
- **Why:** Complex flow with URL params
- **Impact:** High - blocks admin invitations
- **Mitigation:** Test admin token flow specifically

### Fix Current System Risks (Alternative)

**Risk 1: Infinite Loops Return**
- **Why:** Re-enabling visibility listener
- **Impact:** High - app unusable
- **Mitigation:** Extensive guards (complex)

**Risk 2: Dual State Still Desyncs**
- **Why:** Architectural issue remains
- **Impact:** High - bug persists
- **Mitigation:** Remove Zustand persistence (partial fix)

**Recommendation:** Migration has LOWER risk than fixing current system

---

## Success Criteria

### Functional Requirements
✅ Login/logout works
✅ Protected routes work
✅ **Tab switch bug is FIXED** (dashboard loads after tab return)
✅ Session persists across page reloads
✅ Admin routes work
✅ Token refresh works automatically
✅ Register flow works
✅ Password reset works
✅ Admin token invitation works

### Quality Requirements
✅ 300+ E2E tests pass
✅ No console errors
✅ Code is simpler (~650 fewer lines)
✅ No custom recovery logic needed
✅ No auth-related infinite loops

### Performance Requirements
✅ No duplicate session checks
✅ Tab recovery is instant (Supabase native)
✅ No watchdog timers needed
✅ Faster initial load (less code)

---

## Timeline

**Total: 4-6 hours**

### Day 1 (2-3 hours) - Implementation
- ⏱️ 1 hour: Create `AuthContext.tsx`
- ⏱️ 15 min: Update `App.tsx`
- ⏱️ 30 min: Update imports in 18 files
- ⏱️ 15 min: Simplify `ProtectedRoute.tsx`
- ⏱️ 10 min: Delete old files + remove Zustand

### Day 2 (2-3 hours) - Testing & Verification
- ⏱️ 1 hour: Manual testing all flows
- ⏱️ 1 hour: E2E test suite
- ⏱️ 30 min: Fix any issues
- ⏱️ 15 min: Cleanup & documentation

---

## Debugging Progress (Completed)

### What We've Done So Far

1. ✅ **Comprehensive Logging Added**
   - `[TAB-SWITCH-DEBUG]` logs in authListener.ts
   - `[TAB-SWITCH-DEBUG]` logs in authStore.ts
   - `[TAB-SWITCH-DEBUG]` logs in DashboardPage.tsx
   - `[TAB-SWITCH-DEBUG]` logs in journalStore.ts
   - Browser event listeners for tab visibility tracking

2. ✅ **Playwright Test Suite Created**
   - `tests/dashboard-tab-switch-hang.spec.ts` (10 test cases)
   - `tests/DASHBOARD_TAB_SWITCH_BUG_TESTING.md` (testing guide)
   - `tests/TAB_SWITCH_TEST_QUICK_REF.md` (quick reference)
   - NPM scripts: `npm run test:tab-switch`

3. ✅ **Production Build Successful**
   - Fixed TypeScript error in authListener.ts
   - Build output: `dist/assets/index-8OhJWHqH.js`

### What We Discovered

**Root Cause Identified:**
- authListener.ts lines 116-118: Tab visibility listener DISABLED
- Comment: "causes more problems than it solves"
- This means NO recovery when tab returns → stuck loading
- The fix attempts created infinite loops → visibility listener disabled
- **This proves the custom system is fighting Supabase's design**

---

## Alternative: Quick Fix (NOT RECOMMENDED)

If migration is too risky, here's a minimal fix:

### Option A: Re-enable Visibility with Guards

```typescript
// authListener.ts - Re-enable with debouncing
function setupRecoveryListeners() {
  let lastCheck = 0
  const DEBOUNCE_MS = 2000

  const onVisibilityChange = () => {
    if (!document.hidden) {
      const now = Date.now()
      if (now - lastCheck > DEBOUNCE_MS) {
        lastCheck = now
        setTimeout(() => checkSessionNow(), 100)
      }
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  recoveryListeners.push(() =>
    document.removeEventListener('visibilitychange', onVisibilityChange)
  )
}
```

**Problems:**
- Still maintaining ~800 lines of custom code
- Still has dual state synchronization
- May still cause infinite loops
- No guarantee it won't break again

### Option B: Remove Zustand Persistence

```typescript
// authStore.ts - Remove persistence middleware
export const useAuthStore = create<AuthStore>()((set, get) => ({
  // Remove: persist middleware
  // Result: Supabase becomes single source of truth
}))
```

**Problems:**
- Loses some state on page reload
- Still need to handle recovery manually
- Doesn't solve tab visibility issue

**Why NOT recommended:**
- Fixes symptoms, not root cause
- Technical debt compounds
- Will need migration eventually anyway

---

## References

### Official Documentation
- [Supabase Auth with React](https://supabase.com/docs/guides/auth/quickstarts/react)
- [Auth Helpers Deprecation](https://github.com/supabase/auth-helpers)
- [onAuthStateChange API](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)

### Community Resources
- [react-supabase-auth-template](https://github.com/mmvergara/react-supabase-auth-template)
- [TanStack Router + Supabase](https://tanstack.com/router/v1/docs/framework/react/examples/start-supabase-basic)

### GitHub Issues (Reference)
- [onAuthStateChange infinite loop](https://github.com/supabase/supabase/issues/6523)
- [Tab switching kills Supabase](https://github.com/orgs/supabase/discussions/17612)
- [Too many re-renders](https://github.com/supabase/supabase/issues/7184)

---

## Next Session Checklist

When you resume:

### Before Starting
- [ ] Read this document completely
- [ ] Review current auth system (`authListener.ts`, `authStore.ts`)
- [ ] Check if any new auth issues reported
- [ ] Verify dev environment setup

### Decision Point
- [ ] **Confirm: Rebuild with Context API (recommended)**
- [ ] Alternative: Quick fix with visibility listener

### If Proceeding with Migration
- [ ] Create new branch: `git checkout -b migration/auth-context-api`
- [ ] Start with Phase 1: Create `AuthContext.tsx`
- [ ] Test incrementally (don't skip testing phases)
- [ ] Keep old files until verified working
- [ ] Have rollback plan ready

### Testing Preparation
- [ ] Ensure test user credentials available (`.env.test`)
- [ ] Clear browser localStorage before testing
- [ ] Have multiple browser tabs ready for tab-switch test
- [ ] Document any new findings in this file

---

## Notes

**Key Insight:**
The tab-switch bug is **architectural, not implementational**. The custom auth system duplicates Supabase's built-in functionality, creating synchronization problems. The disabled visibility listener (to prevent infinite loops) removed the recovery mechanism, causing the stuck loading bug.

**The Fix:**
Trust Supabase to manage sessions. Use React to reflect that state in UI. Don't duplicate, don't override, don't fight the design.

**Migration Philosophy:**
- Delete more than you add (net -650 lines)
- Simpler is better than complex
- Official patterns over custom solutions
- Battle-tested libraries over reinventing wheels

---

**Last Updated:** 2025-01-11
**Status:** Ready for implementation
**Recommended Approach:** Context API migration
**Estimated Completion:** 4-6 hours over 2 days
