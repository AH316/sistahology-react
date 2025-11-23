-- =====================================================
-- MIGRATION 020: Fix Contact Submissions Table Grants
-- =====================================================
-- Created: 2025-01-23
-- Purpose: Add missing GRANT statements for contact_submissions table
--
-- PROBLEM FIXED:
--   Migration 019 created RLS policies but forgot table-level GRANTs
--   This caused PostgreSQL error 42501: "new row violates row-level security policy"
--   Even with correct RLS policies, PostgreSQL requires explicit GRANT permissions
--
-- ROOT CAUSE:
--   PostgreSQL security model has TWO layers:
--   1. Table-level permissions (GRANT/REVOKE) - missing in migration 019
--   2. Row-level security (RLS policies) - correctly set in migration 019
--
--   Both layers must allow the operation for it to succeed.
--   RLS policies alone are NOT sufficient - you must also GRANT table access.
--
-- WHAT THIS FIXES:
--   - Anonymous users can now INSERT contact form submissions (anon role)
--   - Authenticated users can now INSERT contact forms (authenticated role)
--   - Authenticated users can SELECT/UPDATE for admin dashboard (authenticated role)
--   - RLS policies will still enforce admin-only reads (via is_admin check)
--
-- SECURITY MODEL AFTER THIS MIGRATION:
--   Table Grants:          anon/authenticated → INSERT
--                          authenticated → SELECT, UPDATE
--   RLS Policies:          Anyone → INSERT (no restrictions)
--                          Admin only → SELECT, UPDATE (profiles.is_admin = true)
--
--   Result: GRANTs allow access, RLS policies enforce business logic
--
-- =====================================================

BEGIN;

-- =====================================================
-- ADD MISSING TABLE-LEVEL GRANTS
-- =====================================================

-- Grant 1: Allow INSERT for anonymous and authenticated users
-- This fixes the 401 error when submitting contact forms
-- RLS policy "public_insert_contact_submissions" allows all INSERTs
-- This GRANT gives the roles permission to attempt the INSERT
GRANT INSERT ON public.contact_submissions TO anon, authenticated;

-- Grant 2: Allow SELECT for authenticated users
-- Admin dashboard needs to read submissions
-- RLS policy "admin_select_contact_submissions" will restrict to admins only
-- This GRANT gives authenticated users permission to attempt the SELECT
GRANT SELECT ON public.contact_submissions TO authenticated;

-- Grant 3: Allow UPDATE for authenticated users
-- Admins need to update submission status (pending → read → replied → archived)
-- RLS policy "admin_update_contact_submissions" will restrict to admins only
-- This GRANT gives authenticated users permission to attempt the UPDATE
GRANT UPDATE ON public.contact_submissions TO authenticated;

-- =====================================================
-- GRANT SEQUENCE PERMISSIONS (for UUID generation)
-- =====================================================
-- Note: contact_submissions uses gen_random_uuid() for primary key
-- This doesn't require sequence permissions, but documenting for completeness
-- No additional grants needed for UUID generation

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify grants were applied
SELECT
  'Table grants verified' AS verification,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'contact_submissions'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee
ORDER BY grantee;

-- Expected output:
--   anon          → INSERT
--   authenticated → INSERT, SELECT, UPDATE

COMMIT;

-- =====================================================
-- MIGRATION 020 COMPLETE
-- =====================================================
-- Testing checklist:
--   1. Test anonymous contact form submission (should succeed)
--   2. Test authenticated contact form submission (should succeed)
--   3. Test non-admin user reading submissions (should fail - RLS blocks)
--   4. Test admin user reading submissions (should succeed)
--   5. Test admin user updating status (should succeed)
--   6. Verify no 401/42501 errors in browser console
-- =====================================================
