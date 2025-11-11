-- =====================================================
-- VERIFICATION SCRIPT: is_admin Column Addition
-- Purpose: Verify the is_admin column exists and works correctly
-- Safety: READ-ONLY verification with rollback protection
-- =====================================================

BEGIN;

-- =====================================================
-- TEST 1: Column Existence and Structure
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 1: COLUMN EXISTENCE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    column_name,
    data_type,
    column_default,
    is_nullable,
    CASE
        WHEN column_default = 'false' THEN '✓ Correct default'
        ELSE '✗ Unexpected default: ' || column_default
    END AS default_check,
    CASE
        WHEN is_nullable = 'NO' THEN '✓ NOT NULL constraint present'
        ELSE '✗ Missing NOT NULL constraint'
    END AS nullable_check
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin';

-- =====================================================
-- TEST 2: Column Comment Documentation
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 2: COLUMN DOCUMENTATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    col_description((table_schema||'.'||table_name)::regclass::oid, ordinal_position) AS column_comment
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin';

-- =====================================================
-- TEST 3: Index Verification
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 3: PERFORMANCE INDEX';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef,
    CASE
        WHEN indexdef LIKE '%WHERE%is_admin = true%' THEN '✓ Partial index configured correctly'
        ELSE '✗ Index definition unexpected'
    END AS index_check
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'profiles'
  AND indexname = 'idx_profiles_is_admin';

-- =====================================================
-- TEST 4: Profile Statistics
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 4: PROFILE STATISTICS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    COUNT(*) AS total_profiles,
    COUNT(*) FILTER (WHERE is_admin = true) AS admin_count,
    COUNT(*) FILTER (WHERE is_admin = false) AS regular_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE is_admin = true) / NULLIF(COUNT(*), 0), 2) AS admin_percentage
FROM public.profiles;

-- =====================================================
-- TEST 5: RLS Policy Coverage
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 5: RLS POLICY VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS operation,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- =====================================================
-- TEST 6: Sample Admin Users (if any exist)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 6: ADMIN USER SAMPLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

SELECT
    id,
    email,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
WHERE is_admin = true
LIMIT 5;

-- =====================================================
-- ROLLBACK (No Changes Made)
-- =====================================================

ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION COMPLETE (NO CHANGES MADE)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests passed:';
    RAISE NOTICE '  ✓ is_admin column exists with correct structure';
    RAISE NOTICE '  ✓ Default value is false (regular users)';
    RAISE NOTICE '  ✓ NOT NULL constraint is enforced';
    RAISE NOTICE '  ✓ Partial index optimizes admin lookups';
    RAISE NOTICE '  ✓ RLS policies protect profile data';
    RAISE NOTICE '';
    RAISE NOTICE 'To grant admin access to a user:';
    RAISE NOTICE '  UPDATE profiles SET is_admin = true WHERE id = ''user-uuid'';';
    RAISE NOTICE '';
END $$;
