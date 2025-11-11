# Admin Security - Final Hardened Solution

## Overview

This document explains the 3-layer defense-in-depth security model protecting the `is_admin` column in the `profiles` table.

**Goal:** Prevent users from promoting themselves to admin while keeping the system simple, clear, and verifiable.

---

## The 3 Layers of Security

### Layer 1: Column Defaults ✓
```sql
ALTER TABLE profiles
  ALTER COLUMN is_admin SET DEFAULT false,
  ALTER COLUMN is_admin SET NOT NULL;
```

**What it does:**
- Every new profile automatically gets `is_admin = false`
- Column cannot be NULL (explicit value required)

**Protection:**
- New users can't accidentally or maliciously become admin on creation
- Even if someone bypasses other layers, they can't set it to NULL

---

### Layer 2: RLS Policies ✓
**Exactly 3 policies - simple and non-overlapping:**

1. **profiles_select_own** (SELECT)
   - Users can read their own profile
   - Rule: `auth.uid() = id`

2. **profiles_insert_own** (INSERT)
   - Users can create their own profile
   - Rule: `auth.uid() = id`
   - Note: Column default ensures `is_admin = false`

3. **profiles_update_own** (UPDATE)
   - Users can update their own profile
   - Rules:
     - USING: `auth.uid() = id` (can only target own row)
     - WITH CHECK: `auth.uid() = id` (result must still be own row)

**Protection:**
- Users isolated to their own profile data
- Can't read, create, or update other users' profiles
- Can't bypass identity check on updates

**Why this is simple:**
- No "ALL" policies that cause confusion
- No duplicate UPDATE policies with OR logic
- Clear, single policy per operation

---

### Layer 3: Trigger Protection ✓
```sql
CREATE TRIGGER prevent_is_admin_self_modification
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_is_admin_modification();
```

**Function logic:**
```sql
IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
  -- Get JWT claim (only set for authenticated users)
  current_user_id := current_setting('request.jwt.claim.sub', true);

  -- If JWT exists (authenticated user, not service role)
  IF current_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Permission denied: Users cannot modify their own admin status';
  END IF;
END IF;
```

**What it does:**
- Fires **before** any INSERT or UPDATE on profiles table
- Checks if `is_admin` is being modified
- If modified AND user has JWT claim → **block with error**
- If modified AND no JWT claim (service role) → **allow**

**Protection:**
- Even if RLS policies are bypassed, trigger catches modification
- Returns clear error message (not silent failure)
- Error code: 42501 (insufficient_privilege)

**Why service role bypasses:**
- Service role doesn't set `request.jwt.claim.sub`
- Admin scripts use service role key
- Trigger allows operation when `current_user_id` is NULL

---

## How It Works in Practice

### Regular User Attempting Self-Promotion

**Client code:**
```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('id', user.id);
```

**What happens:**
1. RLS Layer: ✓ PASS (auth.uid() matches id)
2. Trigger Layer: ✗ BLOCK (JWT claim exists, is_admin modified)
3. User sees: `error: { message: "Permission denied: Users cannot modify their own admin status", code: "42501" }`

---

### Admin Script Granting Admin

**Admin script code:**
```javascript
// Uses service role key (not anon key)
const supabase = createClient(URL, SERVICE_ROLE_KEY);

const { error } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('id', target_user_id);
```

**What happens:**
1. RLS Layer: ✓ BYPASSED (service role ignores RLS)
2. Trigger Layer: ✓ PASS (no JWT claim, service role)
3. Result: User granted admin successfully

---

## Migration Files

### Migration 009 (Final Solution)
**File:** `db/009_harden_admin_security_final.sql`

**What it does:**
1. Ensures column defaults are correct
2. Drops ALL existing policies (clean slate)
3. Creates exactly 3 minimal policies
4. Recreates trigger with clear error messages
5. Verifies all layers are configured correctly

**Safe to run multiple times:** Yes (idempotent)

---

## Testing

### Automated Test
**File:** `db/TEST_ADMIN_SECURITY.sql`

Run in Supabase SQL Editor:
- Verifies column configuration
- Counts policies (expects 3)
- Checks trigger exists and enabled
- Checks for overlapping policies
- Returns pass/fail summary

**Expected output:** `✓✓✓ ALL TESTS PASSED ✓✓✓`

---

### Manual Browser Test

1. Log in to your app as non-admin user
2. Open DevTools console (F12)
3. Run:
```javascript
const { supabase } = await import('/src/lib/supabase.ts');
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('id', user.id);
console.log({ data, error });
```

**Expected result:**
```javascript
{
  data: null,
  error: {
    message: "Permission denied: Users cannot modify their own admin status. Contact an administrator.",
    code: "42501",
    hint: "Admin privileges can only be granted by administrators using the service role."
  }
}
```

---

### Admin Script Test

**Test granting admin:**
```bash
tsx scripts/setAdminRole.ts --email testuser@example.com
```

**Expected:** Success message, user is now admin

**Verify:**
```sql
SELECT id, is_admin FROM profiles WHERE email = 'testuser@example.com';
-- Should show is_admin = true
```

---

## Common Scenarios

### ✓ Allowed Operations

| Who | Operation | Protected By | Result |
|-----|-----------|--------------|--------|
| User | Read own profile | RLS | ✓ Success |
| User | Update own name | RLS | ✓ Success |
| User | Update own avatar | RLS | ✓ Success |
| Service Role | Grant admin | Trigger (bypassed) | ✓ Success |
| Service Role | Revoke admin | Trigger (bypassed) | ✓ Success |

### ✗ Blocked Operations

| Who | Operation | Protected By | Result |
|-----|-----------|--------------|--------|
| User | Update is_admin = true | Trigger | ✗ Error |
| User | Insert with is_admin = true | Trigger | ✗ Error |
| User | Read other user's profile | RLS | ✗ Silent (0 rows) |
| User | Update other user's profile | RLS | ✗ Silent (0 rows) |

---

## Why This Is Secure

1. **Defense in Depth:** 3 independent layers
   - If one layer fails, others still protect

2. **Simple = Verifiable:**
   - Only 3 policies (easy to audit)
   - No overlapping logic (no OR confusion)
   - Clear trigger function (100 lines, well-commented)

3. **Fail Secure:**
   - Column default: false (safe)
   - RLS: Deny by default
   - Trigger: Explicit RAISE EXCEPTION

4. **Clear Errors:**
   - Users see helpful error messages
   - Error code 42501 is standard PostgreSQL
   - Hint directs to proper path

5. **Service Role Separation:**
   - Only way to grant admin
   - Requires server-side key (never in client)
   - Audit trail (use admin scripts)

---

## Maintenance

### Adding New Operations

**Don't need to touch admin security for:**
- Adding new profile fields (name, avatar, bio, etc.)
- User updating their own data
- User reading their own data

**Only modify if:**
- Allowing users to delete their profile → add DELETE policy
- Adding admin-only columns → add them to trigger check

### Troubleshooting

**Problem:** User can still modify is_admin

**Check:**
1. Run `TEST_ADMIN_SECURITY.sql` - all tests pass?
2. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'prevent_is_admin_self_modification';
   ```
3. Check for duplicate policies:
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
   -- Should see exactly 3 policies
   ```
4. Test from browser console (not SQL Editor - postgres role bypasses everything)

**Problem:** Service role can't grant admin

**Check:**
1. Using SERVICE_ROLE_KEY (not ANON_KEY)
2. Script has correct permissions
3. Check trigger didn't somehow affect service role:
   ```sql
   -- As postgres role
   UPDATE profiles SET is_admin = true WHERE id = '<user-id>';
   -- Should succeed
   ```

---

## Anonymous User Access Model

### What Are Anonymous Users?

**Anonymous users** are visitors to your website who have **not signed up or logged in**. They access your database via the public API using the **anon key**, not a user JWT token.

**Key characteristic:** `auth.uid()` returns `NULL` for anonymous users (no authentication).

---

### Access Rules for Anonymous Users

#### ✅ Public Data (Anonymous Can Access)

**tables table (pages):**
```sql
CREATE POLICY "Public can view pages" ON public.pages
    FOR SELECT
    USING (true);  -- No TO clause, no auth check = everyone
```

**Why it's public:**
- Marketing content (home, about, blog)
- Want visitors to read content before signing up
- Encourages registrations

**writing_prompts table (active only):**
```sql
CREATE POLICY "Anyone can view active prompts" ON public.writing_prompts
    FOR SELECT
    USING (is_active = TRUE);  -- No TO clause = anonymous can read
```

**Why it's public:**
- Showcase writing prompt feature
- Demonstrate app value
- Encourage sign-ups

#### ❌ Private Data (Anonymous CANNOT Access)

**profiles table:**
```sql
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT
    TO authenticated  -- ❌ Anonymous users explicitly blocked
    USING (auth.uid() = id);
```

**Blocking mechanism:** `TO authenticated` clause prevents anonymous users from executing this policy. Anonymous users see **0 rows** from profiles table.

**journal table:**
```sql
CREATE POLICY "Users can view own journals" ON public.journal
    FOR SELECT
    USING (auth.uid() = user_id);  -- ❌ NULL = user_id is always FALSE
```

**Blocking mechanism:** Implicit blocking via NULL comparison. When `auth.uid()` returns `NULL` for anonymous users, the condition `NULL = user_id` evaluates to `FALSE` for all rows. Anonymous users see **0 journals**.

**entry table:**
```sql
CREATE POLICY "Users can view own entries" ON public.entry
    FOR SELECT
    USING (auth.uid() = user_id);  -- ❌ NULL = user_id is always FALSE
```

**Blocking mechanism:** Same as journals. NULL comparison blocks all rows.

---

### How RLS Blocks Anonymous Users

**Two blocking patterns:**

**Pattern 1: Explicit blocking with TO clause**
```sql
CREATE POLICY "policy_name" ON table_name
    FOR SELECT
    TO authenticated  -- Only logged-in users allowed
    USING (auth.uid() = id);
```

**Pattern 2: Implicit blocking via auth.uid() comparison**
```sql
CREATE POLICY "policy_name" ON table_name
    FOR SELECT
    USING (auth.uid() = user_id);  -- NULL ≠ user_id blocks all rows
```

Both patterns are secure and correct. Pattern 1 is more explicit, Pattern 2 is simpler.

---

### Testing Anonymous Access

**Verification script:** `db/VERIFY_ANONYMOUS_ACCESS.sql`

**What it tests:**
1. ✅ Anonymous CAN read pages
2. ✅ Anonymous CAN read active writing prompts
3. ✗ Anonymous CANNOT read profiles
4. ✗ Anonymous CANNOT read journals
5. ✗ Anonymous CANNOT read entries
6. ✗ Anonymous CANNOT insert/update/delete data

**How to run:**
1. Open Supabase SQL Editor
2. Paste the entire script
3. Click "Run"
4. Check that all tests show ✓ PASS

**Simulates anonymous user by:**
```sql
SELECT set_config('request.jwt.claim.sub', '', true);  -- No user ID
SELECT set_config('request.jwt.claim.role', 'anon', true);  -- Anonymous role
```

After setting these, `auth.uid()` returns `NULL` and RLS policies apply as if the user is not signed in.

---

### Anonymous vs Authenticated vs Postgres Roles

| Role | Who Uses It | auth.uid() Returns | RLS Applied? | Can See Private Data? |
|------|-------------|-------------------|--------------|---------------------|
| **postgres** | SQL Editor, migrations | `NULL` | ❌ No (bypassed) | ✅ Yes (all data) |
| **authenticated** | Logged-in app users | User's UUID | ✅ Yes | ✅ Own data only |
| **anon** | Website visitors | `NULL` | ✅ Yes | ❌ Public data only |

**Key insight:** Both `postgres` and `anon` have `auth.uid() = NULL`, but:
- `postgres` **bypasses RLS** entirely (superuser)
- `anon` **respects RLS** and sees only public data

---

### Why This Design?

**Public data strategy:**
- Attract visitors with valuable content
- Demonstrate app features (writing prompts)
- Build trust before asking for sign-up
- SEO-friendly marketing pages

**Private data strategy:**
- Protect user privacy and trust
- Prevent data leaks between users
- Comply with privacy regulations
- Create safe space for journaling

**Anonymous write prevention:**
- No spam or malicious data
- Ensure all data has accountable owner
- Prevent abuse of database resources
- Force registration for engagement

---

### Common Questions

**Q: Why can't I test RLS from SQL Editor?**

A: SQL Editor uses the `postgres` role which bypasses RLS completely. To test RLS:
- Use your React app (logs in as `authenticated` role)
- Use `VERIFY_ANONYMOUS_ACCESS.sql` (simulates `anon` role)
- Use Supabase API directly with anon key

**Q: If both postgres and anon have auth.uid() = NULL, how does the trigger distinguish them?**

A: The trigger checks `request.jwt.claim.sub`:
- `postgres` role: No JWT claim set → `current_user_id = NULL` → allowed
- `service_role`: No JWT claim set → `current_user_id = NULL` → allowed
- `authenticated`: JWT claim exists → `current_user_id = UUID` → blocked if modifying is_admin
- `anon`: JWT claim set to empty → `current_user_id = ''` → blocked (but can't reach trigger due to RLS)

**Q: Can anonymous users create accounts?**

A: Yes! Account creation happens through Supabase Auth API (`supabase.auth.signUp()`), not through database RLS policies. Once signed up, they become `authenticated` users with access to their own data.

**Q: What if I want to allow anonymous users to read some user profiles (like public profiles)?**

A: You would add a `is_public` column to profiles and create a policy:
```sql
CREATE POLICY "Anyone can view public profiles" ON profiles
    FOR SELECT
    USING (is_public = TRUE);  -- No TO clause, checks column value
```

This allows anonymous users to see profiles where `is_public = TRUE`.

---

## Summary

**Security Model:**
- Simple: 3 policies, 1 trigger, 1 column default
- Clear: Each layer has one job
- Verifiable: Automated test script
- Safe: Multiple independent protections
- Maintainable: Well-documented, easy to audit

**Admin Workflow:**
1. Admin uses service role script
2. Service role bypasses RLS
3. Service role bypasses trigger (no JWT)
4. User granted admin
5. User logs in, `isAdmin` flag works

**User Protection:**
1. User tries to update is_admin
2. RLS allows targeting own row
3. Trigger blocks modification
4. Clear error returned
5. No privilege escalation possible
