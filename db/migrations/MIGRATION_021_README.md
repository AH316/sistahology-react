# Migration 021: Fix Contact Submissions INSERT Policy

## Problem Summary

Contact form submissions were failing with PostgreSQL error 42501:
```
new row violates row-level security policy
```

## Root Cause

The RLS policy `public_insert_contact_submissions` was corrupted. Testing confirmed:
- INSERT works when RLS is **disabled**
- INSERT fails when RLS is **enabled** (even with policy present)
- Table-level GRANTs are correct
- Policy definition appears correct but is internally non-functional

## The Fix

Migration 021 **drops and recreates** the INSERT policy with identical definition. This forces PostgreSQL to rebuild internal policy structures, fixing the corruption.

## Migration History

| Migration | Purpose | Status |
|-----------|---------|--------|
| 019 | Created contact_submissions table with RLS policies | Applied |
| 020 | Added GRANT statements (incorrect diagnosis) | **DELETED** |
| 021 | Drops and recreates INSERT policy (correct fix) | **Apply this** |

## Why Migration 020 Was Deleted

Migration 020 diagnosed the problem as missing GRANT statements and added:
```sql
GRANT INSERT ON public.contact_submissions TO anon, authenticated;
GRANT SELECT ON public.contact_submissions TO authenticated;
GRANT UPDATE ON public.contact_submissions TO authenticated;
```

However, verification showed that:
1. These GRANTs were already present in the database
2. The actual problem was a corrupted RLS policy, not missing GRANTs

**Note**: If you haven't applied migration 020 to your database yet, ensure the above GRANTs are present before applying migration 021. Most Supabase projects include these by default, but verify with:
```sql
SELECT grantee, string_agg(privilege_type, ', ')
FROM information_schema.table_privileges
WHERE table_name = 'contact_submissions'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee;
```

## How to Apply Migration 021

### Step 1: Verify Current State
Run in Supabase SQL Editor:
```sql
-- Check RLS is enabled
SELECT relrowsecurity FROM pg_class
WHERE oid = 'public.contact_submissions'::regclass;

-- Check policy exists
SELECT COUNT(*) FROM pg_policies
WHERE tablename = 'contact_submissions'
  AND policyname = 'public_insert_contact_submissions';
```

### Step 2: Apply Migration
1. Open Supabase SQL Editor
2. Copy contents of `021_fix_contact_insert_policy.sql`
3. Execute the migration
4. Verify output shows "Policy recreated successfully"

### Step 3: Test Contact Form
1. Navigate to `/contact` page
2. Fill out the form completely
3. Click "Send Message"
4. Verify success message (not 42501 error)
5. Check admin dashboard for submission

## Rollback (if needed)

If migration 021 causes issues, rollback:

```sql
BEGIN;

-- Drop the recreated policy
DROP POLICY IF EXISTS public_insert_contact_submissions
  ON public.contact_submissions;

-- Recreate with original definition from migration 019
CREATE POLICY public_insert_contact_submissions
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

COMMIT;
```

## Technical Notes

### Why Policies Get Corrupted
PostgreSQL RLS policies can become non-functional due to:
- Internal catalog inconsistencies
- Role/permission changes after policy creation
- Schema changes affecting policy evaluation
- Database migration timing issues

### Why Drop and Recreate Works
- Forces PostgreSQL to rebuild internal policy structures
- Clears any cached policy evaluation logic
- Revalidates role assignments and permissions
- No data loss (only policy metadata affected)

### Safety Guarantees
- Migration is idempotent (safe to run multiple times)
- `DROP IF EXISTS` prevents errors if policy is gone
- No impact on existing submissions
- All other policies (SELECT, UPDATE) remain intact
- Wrapped in transaction (rolls back on error)

## Post-Migration Verification

Run these queries to confirm success:

```sql
-- 1. Verify policy was recreated
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'contact_submissions'
  AND policyname = 'public_insert_contact_submissions';

-- 2. Verify all three policies exist
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'contact_submissions'
ORDER BY policyname;

-- 3. Test INSERT (should succeed)
BEGIN;
INSERT INTO public.contact_submissions (name, email, subject, message)
VALUES ('Test User', 'test@example.com', 'Test Subject', 'Test message for verification');
ROLLBACK;  -- Don't actually insert test data
```

## Support

If issues persist after applying migration 021:
1. Check PostgreSQL logs for policy evaluation errors
2. Verify `anon` and `authenticated` roles exist
3. Confirm Supabase project is on latest version
4. Contact Supabase support with migration details
