# Migration 006: Secure is_admin Column from Self-Promotion

## Security Vulnerability Fixed

**Critical privilege escalation vulnerability** where users could promote themselves to admin by running:
```javascript
await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
```

This migration replaces the vulnerable UPDATE policy with a secure one that prevents modification of the `is_admin` column.

## Files

- **Migration**: `db/006_secure_is_admin_column.sql`
- **Verification**: `db/VERIFY_ADMIN_SECURITY.sql`

## Pre-Migration Checklist

- [ ] Backup your database before applying migration
- [ ] Review current UPDATE policy on profiles table
- [ ] Verify you have admin credentials for testing
- [ ] Ensure you have service role key for admin management

## Applying the Migration

### Step 1: Apply Migration SQL

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy contents of `db/006_secure_is_admin_column.sql`
4. Execute the migration
5. Verify success messages in output

**Expected output:**
```
SECURING is_admin COLUMN FROM SELF-PROMOTION
Migration 006
...
PRIVILEGE ESCALATION VULNERABILITY FIXED
```

### Step 2: Verify Security

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy contents of `db/VERIFY_ADMIN_SECURITY.sql`
4. Execute the verification script
5. Confirm all tests pass

**Expected test results:**
```
✓ TEST 1: Users can view their own profile
✓ TEST 2: Users can update profile fields
✓ TEST 3: Users CANNOT update their is_admin flag (CRITICAL)
✓ TEST 4: Service role CAN grant admin access
✓ TEST 5: Row Level Security is enabled
✓ TEST 6: RLS Policy Inventory
```

### Step 3: Test in Application

1. Login as a regular user
2. Open browser console
3. Attempt privilege escalation attack:
   ```javascript
   await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
   ```
4. Verify the update returns 0 rows affected
5. Confirm `is_admin` remains `false` in profile

## Post-Migration Verification

### Check Policy Exists

```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND policyname = 'Users can update own profile (except is_admin)';
```

**Expected result:**
- Policy name: `Users can update own profile (except is_admin)`
- Command: `UPDATE`
- USING clause: `(auth.uid() = id)`
- WITH CHECK clause: `(auth.uid() = id) AND (is_admin = ...)`

### Verify RLS Enabled

```sql
SELECT pc.relname, pc.relrowsecurity
FROM pg_class pc
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public'
  AND pc.relname = 'profiles';
```

**Expected result:**
- `relrowsecurity`: `true` (RLS enabled)

## Admin Management

### Granting Admin Access (Secure Method)

Use the admin scripts with service role key:

```bash
# Set admin role for specific user
npm run set:admin
# or
tsx scripts/setAdminRole.ts --email user@example.com

# Create new admin user
tsx scripts/quickCreateAdmin.ts
```

### Manual Admin Grant (Service Role)

If you need to grant admin access directly in SQL Editor:

```sql
-- Using service role context (bypasses RLS)
UPDATE profiles
SET is_admin = true
WHERE id = 'user-uuid-here';
```

**Important**: This only works with service role key. Regular users cannot execute this update.

## Rollback Procedure

**⚠️ WARNING**: Rollback restores the privilege escalation vulnerability. Only rollback in development environments.

### To Rollback:

1. Open Supabase Dashboard → SQL Editor
2. Execute the following SQL:

```sql
BEGIN;

-- Drop the secure policy
DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;

-- Restore the original vulnerable policy (NOT RECOMMENDED)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

COMMIT;
```

3. Verify rollback success:
```sql
SELECT policyname FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'UPDATE';
```

**Expected after rollback**: Policy name is `Users can update own profile` (no "except is_admin" suffix)

## Troubleshooting

### Migration Fails with "policy already exists"

**Cause**: Migration already applied or policy name conflict

**Solution**:
```sql
-- Check existing policies
SELECT policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- If secure policy exists, migration already applied
-- If old policy exists, manually drop and recreate
```

### Verification Tests Fail

**Test 3 fails (users CAN update is_admin)**:
- Migration not applied correctly
- Re-run migration SQL
- Verify policy WITH CHECK clause includes is_admin validation

**Test 4 fails (service role CANNOT update is_admin)**:
- Check you're using service role key in SQL Editor
- Service role should bypass RLS policies
- Verify RLS is actually enabled on table

### Users Cannot Update Profile Fields

**Symptom**: Regular profile updates (name, avatar) fail after migration

**Cause**: RLS policy too restrictive or query malformed

**Solution**:
```sql
-- Test user update capability
UPDATE profiles
SET full_name = 'Test Name'
WHERE id = auth.uid();
-- Should succeed with 1 row updated
```

## Security Notes

- **Defense in Depth**: This migration adds database-level protection against privilege escalation
- **Service Role Required**: Only service role can grant admin access (as intended)
- **Audit Trail**: Consider adding triggers to log admin role changes
- **Client-Side Checks**: Application should still validate admin status before showing admin UI
- **Key Management**: Never expose service role key to client applications

## Related Files

- `db/005_add_is_admin_to_profiles.sql` - Initial admin column migration
- `db/VERIFY_IS_ADMIN.sql` - Verification for migration 005
- `scripts/setAdminRole.ts` - Admin role management script
- `scripts/quickCreateAdmin.ts` - Create new admin users

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [WITH CHECK Clause Explained](https://www.postgresql.org/docs/current/sql-createpolicy.html#SQL-CREATEPOLICY-WITH-CHECK)
