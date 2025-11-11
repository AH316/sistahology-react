-- =====================================================
-- Simple Admin Security Test - Returns Table Results
-- =====================================================
-- This version returns results as a table instead of messages
-- =====================================================

-- Test 1: Column Configuration
SELECT
    'TEST 1: Column Config' as test,
    CASE
        WHEN column_default = 'false' AND is_nullable = 'NO'
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    'is_admin: DEFAULT ' || COALESCE(column_default, 'NULL') ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END as details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin'

UNION ALL

-- Test 2: RLS Enabled
SELECT
    'TEST 2: RLS Status' as test,
    CASE
        WHEN pc.relrowsecurity
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN pc.relrowsecurity
        THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as details
FROM pg_class pc
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'profiles'

UNION ALL

-- Test 3: Policy Count
SELECT
    'TEST 3: Policy Count' as test,
    CASE
        WHEN COUNT(*) = 3
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    'Found ' || COUNT(*) || ' policies (expected: 3)' as details
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

-- Test 4: SELECT Policy
SELECT
    'TEST 4: SELECT Policy' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    COALESCE(MAX(policyname), 'NOT FOUND') as details
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'SELECT'

UNION ALL

-- Test 5: INSERT Policy
SELECT
    'TEST 5: INSERT Policy' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    COALESCE(MAX(policyname), 'NOT FOUND') as details
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'INSERT'

UNION ALL

-- Test 6: UPDATE Policy
SELECT
    'TEST 6: UPDATE Policy' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    COALESCE(MAX(policyname), 'NOT FOUND') as details
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'UPDATE'

UNION ALL

-- Test 7: No ALL Policies
SELECT
    'TEST 7: No ALL Policies' as test,
    CASE
        WHEN COUNT(*) = 0
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    'Found ' || COUNT(*) || ' ALL policies (expected: 0)' as details
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND cmd = 'ALL'

UNION ALL

-- Test 8: Trigger Exists
SELECT
    'TEST 8: Trigger Exists' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN COUNT(*) = 1
        THEN 'Trigger exists and enabled'
        ELSE 'Trigger NOT FOUND'
    END as details
FROM pg_trigger
WHERE tgname = 'prevent_is_admin_self_modification'
  AND tgrelid = 'public.profiles'::regclass
  AND tgenabled = 'O'

UNION ALL

-- Test 9: Function Exists
SELECT
    'TEST 9: Function Exists' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN COUNT(*) = 1
        THEN 'Function exists'
        ELSE 'Function NOT FOUND'
    END as details
FROM pg_proc
WHERE proname = 'prevent_is_admin_modification'
  AND pronamespace = 'public'::regnamespace

ORDER BY test;
