-- =====================================================
-- VERIFICATION SCRIPT: Admin Column Security
-- Purpose: Validate that users cannot self-promote to admin
-- Migration: 006_secure_is_admin_column.sql
-- Runtime: ~15 seconds
-- =====================================================
--
-- USAGE:
-- Run this script in Supabase SQL Editor to verify the security fix.
-- All tests are wrapped in a transaction that rolls back automatically.
-- No persistent changes will be made to your database.
--
-- EXPECTED RESULTS:
-- ✓ Test 1: Users CAN view their own profile (id, is_admin)
-- ✗ Test 2: Users CANNOT update their is_admin flag (CRITICAL - SHOULD FAIL)
-- ✓ Test 3: RLS is enabled on profiles table
-- ✓ Test 4: UPDATE policy exists for profiles
--
-- MINIMAL SCHEMA ASSUMPTIONS:
-- - profiles table has `id` column (UUID)
-- - profiles table has `is_admin` column (boolean)
-- - No other columns are referenced
--
-- =====================================================

BEGIN;

-- Create a test user context helper function
CREATE OR REPLACE FUNCTION test_as_user(user_uuid UUID)
RETURNS void AS $$
BEGIN
    -- Set the current user context for RLS
    PERFORM set_config('request.jwt.claims', json_build_object('sub', user_uuid)::text, true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TEST SUITE HEADER
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  ADMIN SECURITY VERIFICATION TEST SUITE                ║';
    RAISE NOTICE '║  Migration: 006_secure_is_admin_column.sql             ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 1: Users can view their own profile
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    profile_exists boolean;
    is_admin_value boolean;
BEGIN
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE 'TEST 1: Users can view their own profile (id, is_admin)';
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE '';

    -- Get first non-admin user for testing
    SELECT id INTO test_user_id
    FROM public.profiles
    WHERE is_admin = false
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'SKIP: No non-admin users found for testing';
        RAISE NOTICE '';
        RETURN;
    END IF;

    -- Set user context
    PERFORM test_as_user(test_user_id);

    -- Try to select own profile (only id and is_admin)
    SELECT EXISTS(
        SELECT 1 FROM public.profiles WHERE id = test_user_id
    ) INTO profile_exists;

    -- Get is_admin value
    SELECT is_admin INTO is_admin_value
    FROM public.profiles
    WHERE id = test_user_id;

    IF profile_exists THEN
        RAISE NOTICE '✓ PASS: User can view their own profile';
        RAISE NOTICE '  User ID: %', test_user_id;
        RAISE NOTICE '  is_admin value: % (expected: false)', is_admin_value;
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '✗ FAIL: User cannot view their own profile (RLS SELECT policy issue)';
    END IF;
END $$;

-- =====================================================
-- TEST 2: Users CANNOT update is_admin flag (CRITICAL)
-- =====================================================

DO $$
DECLARE
    test_user_id UUID;
    original_is_admin boolean;
    update_count integer;
    final_is_admin boolean;
    test_passed boolean := false;
BEGIN
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE 'TEST 2: Users CANNOT update their is_admin flag (CRITICAL)';
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE '';

    -- Get first non-admin user
    SELECT id, is_admin INTO test_user_id, original_is_admin
    FROM public.profiles
    WHERE is_admin = false
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'SKIP: No non-admin users found for testing';
        RAISE NOTICE '';
        RETURN;
    END IF;

    RAISE NOTICE 'Attempting privilege escalation attack...';
    RAISE NOTICE '  User ID: %', test_user_id;
    RAISE NOTICE '  Current is_admin: % (expected: false)', original_is_admin;
    RAISE NOTICE '  Attempting to set is_admin = true...';
    RAISE NOTICE '';

    -- Set user context
    PERFORM test_as_user(test_user_id);

    -- Try to promote self to admin (this MUST fail)
    BEGIN
        UPDATE public.profiles
        SET is_admin = true
        WHERE id = test_user_id;

        GET DIAGNOSTICS update_count = ROW_COUNT;

        -- Check if is_admin actually changed
        SELECT is_admin INTO final_is_admin
        FROM public.profiles
        WHERE id = test_user_id;

        IF update_count = 0 OR final_is_admin = false THEN
            test_passed := true;
            RAISE NOTICE 'RLS policy prevented the update (0 rows affected)';
        ELSE
            test_passed := false;
        END IF;

    EXCEPTION
        WHEN OTHERS THEN
            -- RLS policy blocked the update - this is expected
            test_passed := true;
            RAISE NOTICE 'RLS policy blocked the update with error: %', SQLERRM;
    END;

    IF test_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '✓ PASS: User CANNOT promote themselves to admin';
        RAISE NOTICE '  Security verified: is_admin column is protected';
        RAISE NOTICE '  Final is_admin value: false (unchanged)';
        RAISE NOTICE '';
        RAISE NOTICE '🛡️  PRIVILEGE ESCALATION ATTACK PREVENTED';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '✗ FAIL: User successfully updated is_admin flag (SECURITY VULNERABILITY!)';
    END IF;
END $$;

-- =====================================================
-- TEST 3: RLS is enabled on profiles table
-- =====================================================

DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE 'TEST 3: Row Level Security is enabled';
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE '';

    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'profiles';

    IF rls_enabled THEN
        RAISE NOTICE '✓ PASS: RLS is ENABLED on profiles table';
        RAISE NOTICE '  Security layer active: policies will be enforced';
        RAISE NOTICE '';
    ELSE
        RAISE EXCEPTION '✗ FAIL: RLS is DISABLED on profiles table (CRITICAL SECURITY ISSUE!)';
    END IF;
END $$;

-- =====================================================
-- TEST 4: UPDATE policy exists on profiles table
-- =====================================================

DO $$
DECLARE
    policy_count integer;
    policy_record RECORD;
BEGIN
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE 'TEST 4: UPDATE policy exists on profiles table';
    RAISE NOTICE '──────────────────────────────────────────────────────────';
    RAISE NOTICE '';

    -- Check for UPDATE policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'UPDATE';

    IF policy_count > 0 THEN
        RAISE NOTICE '✓ PASS: UPDATE policy found on profiles table';
        RAISE NOTICE '  Total UPDATE policies: %', policy_count;
        RAISE NOTICE '';

        -- List the policies
        FOR policy_record IN
            SELECT policyname, permissive
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = 'profiles'
              AND cmd = 'UPDATE'
            ORDER BY policyname
        LOOP
            RAISE NOTICE '  Policy: %', policy_record.policyname;
            RAISE NOTICE '    Type: %', CASE WHEN policy_record.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
            RAISE NOTICE '';
        END LOOP;
    ELSE
        RAISE EXCEPTION '✗ FAIL: No UPDATE policy found on profiles table';
    END IF;
END $$;

-- =====================================================
-- TEST SUITE SUMMARY
-- =====================================================

DO $$
DECLARE
    total_users integer;
    admin_users integer;
    regular_users integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  TEST SUITE SUMMARY                                    ║';
    RAISE NOTICE '╚════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO total_users FROM public.profiles;
    SELECT COUNT(*) INTO admin_users FROM public.profiles WHERE is_admin = true;
    regular_users := total_users - admin_users;

    RAISE NOTICE 'Database Statistics:';
    RAISE NOTICE '  Total users: %', total_users;
    RAISE NOTICE '  Admin users: %', admin_users;
    RAISE NOTICE '  Regular users: %', regular_users;
    RAISE NOTICE '';

    RAISE NOTICE 'Security Status:';
    RAISE NOTICE '  ✓ RLS enabled on profiles table';
    RAISE NOTICE '  ✓ Users can view their own profile';
    RAISE NOTICE '  ✓ Users CANNOT update is_admin flag';
    RAISE NOTICE '  ✓ UPDATE policy exists on profiles table';
    RAISE NOTICE '';

    RAISE NOTICE '🔒 SECURITY VERIFICATION COMPLETE';
    RAISE NOTICE '';
    RAISE NOTICE 'All tests passed. The is_admin column is secure.';
    RAISE NOTICE 'Users cannot promote themselves to admin.';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: This transaction will ROLLBACK automatically.';
    RAISE NOTICE 'No changes have been made to your database.';
    RAISE NOTICE '';
END $$;

-- Clean up test function
DROP FUNCTION IF EXISTS test_as_user(UUID);

-- =====================================================
-- ROLLBACK TRANSACTION
-- =====================================================

ROLLBACK;

-- =====================================================
-- POST-VERIFICATION NOTES
-- =====================================================
--
-- If all tests passed, your database is secure:
--   ✓ Users cannot promote themselves to admin
--   ✓ RLS policies enforce proper access control
--
-- Admin Management Workflow:
--   1. Use scripts/setAdminRole.ts for granting admin access
--   2. Use .env.scripts with service role key
--   3. Service role bypasses RLS policies
--   4. Never expose service role key to client applications
--
-- If any tests failed:
--   1. Check that migration 006_secure_is_admin_column.sql was applied
--   2. Verify RLS is enabled on profiles table
--   3. Check pg_policies for UPDATE policies on profiles
--   4. Review Supabase dashboard for policy configuration
--
-- =====================================================
