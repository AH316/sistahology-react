-- =====================================================
-- VERIFICATION: Contact Form Submissions Table
-- =====================================================
-- Purpose: Verify RLS policies and table structure
-- Run this after: 019_create_contact_submissions.sql
-- Safe to run: Read-only queries, no changes
-- =====================================================

BEGIN;

-- Show table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'contact_submissions'
ORDER BY ordinal_position;

-- Verify RLS is enabled
SELECT
  'RLS Status' AS check_name,
  CASE
    WHEN relrowsecurity THEN '✓ ENABLED'
    ELSE '✗ DISABLED'
  END AS result
FROM pg_class
WHERE oid = 'public.contact_submissions'::regclass;

-- List all RLS policies
SELECT
  policyname AS policy_name,
  cmd AS command,
  roles AS for_roles,
  CASE
    WHEN policyname LIKE '%public%' THEN 'Allow public form submissions'
    WHEN policyname LIKE '%admin%select%' THEN 'Allow admins to view submissions'
    WHEN policyname LIKE '%admin%update%' THEN 'Allow admins to update status'
    ELSE 'Other policy'
  END AS description
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'contact_submissions'
ORDER BY policyname;

-- Verify indexes
SELECT
  indexname AS index_name,
  indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'contact_submissions'
ORDER BY indexname;

-- Check constraints
SELECT
  con.conname AS constraint_name,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
  END AS constraint_type,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'contact_submissions'
ORDER BY con.contype, con.conname;

-- Verify trigger exists
SELECT
  trigger_name,
  event_manipulation AS event,
  action_statement AS action
FROM information_schema.triggers
WHERE event_object_table = 'contact_submissions'
  AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Summary of expected configuration
SELECT '✓ Expected Configuration:' AS summary
UNION ALL SELECT '  - Table: contact_submissions'
UNION ALL SELECT '  - RLS: ENABLED'
UNION ALL SELECT '  - Policies: 3 total'
UNION ALL SELECT '    1. public_insert (INSERT for anon/authenticated)'
UNION ALL SELECT '    2. admin_select (SELECT for admins only)'
UNION ALL SELECT '    3. admin_update (UPDATE for admins only)'
UNION ALL SELECT '  - Indexes: 3 total (status_date, email, date)'
UNION ALL SELECT '  - Constraints: CHECK for email format, message length, status values'
UNION ALL SELECT '  - Trigger: updated_at auto-update on changes';

ROLLBACK; -- Read-only, no changes
