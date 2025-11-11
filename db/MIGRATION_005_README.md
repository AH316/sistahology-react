# Migration 005: Add Admin Flag to Profiles Table

## Overview
This migration adds the `is_admin` boolean column to the `profiles` table, enabling admin access control for CMS and admin panel features.

## Files
- **`005_add_is_admin_to_profiles.sql`** - Main migration file (idempotent)
- **`VERIFY_IS_ADMIN.sql`** - Read-only verification script
- **`GRANT_ADMIN.sql`** - Helper script to grant admin access to users

## Pre-Migration Checklist
- [ ] Backup your database (recommended for all migrations)
- [ ] Verify you have database admin or service role access
- [ ] Review current profile table structure: `\d profiles` (in psql)
- [ ] Note the number of existing profiles: `SELECT COUNT(*) FROM profiles;`
- [ ] Ensure no application deployments are in progress

## Migration Application

### Step 1: Apply the Migration
Run the migration in the Supabase SQL Editor:

```bash
# Copy the contents of db/005_add_is_admin_to_profiles.sql
# Paste into Supabase Dashboard > SQL Editor > New query
# Click "Run" to execute
```

**Expected Output:**
```
NOTICE: ==========================================
NOTICE: ADDING ADMIN FLAG TO PROFILES TABLE
NOTICE: ==========================================
NOTICE: Added is_admin column to profiles table
NOTICE: Created/verified partial index for admin users
NOTICE: RLS is ENABLED on profiles table - security verified
NOTICE: MIGRATION COMPLETE - Ready for admin access control
```

### Step 2: Verify the Migration
Run the verification script to ensure everything is correct:

```bash
# Copy the contents of db/VERIFY_IS_ADMIN.sql
# Paste into Supabase SQL Editor
# Click "Run" to execute
```

**Verification Tests:**
1. ✓ Column exists with correct type (BOOLEAN NOT NULL DEFAULT false)
2. ✓ Column documentation/comment is present
3. ✓ Partial index `idx_profiles_is_admin` exists
4. ✓ Profile statistics show all users have is_admin = false initially
5. ✓ RLS policies are still enabled and functional

### Step 3: Grant Admin Access to User(s)
Use the grant script to promote specific users to admin:

```bash
# Method 1: Using Supabase SQL Editor
1. Copy db/GRANT_ADMIN.sql
2. Replace 'user@example.com' with the target user's email
3. Run in SQL Editor
4. Review output to confirm grant

# Method 2: Using service role key (programmatic)
UPDATE profiles
SET is_admin = true, updated_at = NOW()
WHERE email = 'admin@example.com';
```

### Step 4: Verify Admin Access
After granting admin access:

```sql
-- Check specific user
SELECT id, email, is_admin
FROM profiles
WHERE email = 'admin@example.com';

-- List all admin users
SELECT id, email, is_admin, created_at
FROM profiles
WHERE is_admin = true;
```

### Step 5: Application Testing
1. Have the admin user sign out completely
2. Sign back in
3. Verify the "Admin" link appears in navigation
4. Test CMS editing functionality
5. Verify regular users still cannot access admin features

## Post-Migration Verification

### Database Checks
```sql
-- 1. Verify column structure
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';

-- 2. Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles' AND indexname = 'idx_profiles_is_admin';

-- 3. Check admin user count
SELECT COUNT(*) AS admin_count
FROM profiles
WHERE is_admin = true;
```

### Application Checks
- [ ] Admin user can see "Admin" link in navigation
- [ ] Admin user can access `/admin` route
- [ ] Admin user can edit CMS pages
- [ ] Regular users do NOT see "Admin" link
- [ ] Regular users are redirected away from `/admin` route
- [ ] AuthStore correctly loads `isAdmin` flag during login

## Rollback Procedure

### Option 1: Remove Column (Complete Rollback)
```sql
BEGIN;

-- Drop the index first
DROP INDEX IF EXISTS idx_profiles_is_admin;

-- Remove the column
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;

-- Verify removal
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';
-- Should return 0 rows

COMMIT;
```

### Option 2: Reset All Users to Non-Admin (Data Rollback)
```sql
BEGIN;

-- Reset all users to regular status
UPDATE profiles
SET is_admin = false
WHERE is_admin = true;

-- Verify all users are now regular
SELECT COUNT(*) AS admin_count
FROM profiles
WHERE is_admin = true;
-- Should return 0

COMMIT;
```

## Security Considerations

### RLS Policy Review
**IMPORTANT:** Verify that users cannot self-grant admin access:

```sql
-- Check UPDATE policy on profiles table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'UPDATE';
```

If users can update their own profiles, ensure they cannot modify `is_admin`:
1. Use application-level validation to exclude `is_admin` from update operations
2. Or add a database-level check constraint
3. Or modify RLS policy to block `is_admin` changes via normal user context

### Recommended RLS Policy Enhancement
Consider adding this policy to prevent self-promotion:

```sql
-- Drop existing UPDATE policy if needed
DROP POLICY IF EXISTS profiles_update_own ON profiles;

-- Create enhanced UPDATE policy that excludes is_admin
CREATE POLICY profiles_update_own ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
);
-- This ensures is_admin cannot change during user updates
```

## Admin User Management Best Practices

### Granting Admin Access
1. Use service role key or database superuser access
2. Document reason for admin grant (internal audit trail)
3. Notify the user of their new admin status
4. Provide admin user training/documentation

### Revoking Admin Access
```sql
-- Revoke admin access
UPDATE profiles
SET is_admin = false, updated_at = NOW()
WHERE email = 'former-admin@example.com';

-- Force user to re-login
-- (application-level: invalidate user session)
```

### Regular Auditing
```sql
-- List all admin users with account age
SELECT
    email,
    is_admin,
    created_at,
    AGE(NOW(), created_at) AS account_age
FROM profiles
WHERE is_admin = true
ORDER BY created_at DESC;

-- Check for stale admin accounts (example: > 1 year inactive)
-- Requires adding last_login_at column or querying auth.users
```

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** Migration is idempotent - this is safe. Verify with:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'is_admin';
```

### Issue: Admin user doesn't see "Admin" link after grant
**Solutions:**
1. User must sign out and sign back in (session refresh)
2. Clear browser localStorage/sessionStorage
3. Verify is_admin is true in database: `SELECT is_admin FROM profiles WHERE email = 'user@example.com'`
4. Check browser console for auth errors
5. Verify authStore.ts properly loads is_admin flag (lines 64-68)

### Issue: Regular user can see admin features
**Solutions:**
1. Check RLS policies are enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles'`
2. Verify application uses `authStore.isAdmin` correctly
3. Review protected route guards in application code
4. Check for hardcoded admin bypasses in frontend

### Issue: Index creation fails
**Solution:** Index might already exist. Verify with:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'profiles' AND indexname = 'idx_profiles_is_admin';
```

## Migration Metadata

| Property | Value |
|----------|-------|
| Migration Version | 005 |
| Created | 2025-10-16 |
| Author | DB/RLS Guardian |
| Breaking Changes | No |
| Requires Application Changes | No (column already referenced in code) |
| Rollback Safe | Yes |
| Idempotent | Yes |
| Estimated Execution Time | < 5 seconds |

## Related Files
- `src/stores/authStore.ts` - Auth store that checks is_admin flag
- `src/components/Navigation.tsx` - Shows/hides Admin link based on isAdmin
- `scripts/setAdminRole.ts` - Legacy admin script (DO NOT USE - sets wrong field)
- `db/VERIFY_READONLY.sql` - General RLS verification script

## Next Steps After Migration
1. Update admin scripts to use `profiles.is_admin` instead of `auth.users.app_metadata.role`
2. Consider adding admin activity logging
3. Implement admin user invitation flow
4. Create admin dashboard with user management
5. Add admin audit trail (who did what, when)
