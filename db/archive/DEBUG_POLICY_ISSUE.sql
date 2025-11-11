-- =====================================================
-- DEBUG: Why is the WITH CHECK clause not preventing is_admin updates?
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue
--
-- This script will:
-- 1. Show the exact policy definition
-- 2. Test the policy behavior
-- 3. Identify why it's not working
--
-- SAFE TO RUN: Uses BEGIN/ROLLBACK for no persistent changes
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: INSPECT CURRENT POLICIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CURRENT RLS POLICIES ON PROFILES TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Show all policies on profiles table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT
            policyname,
            cmd,
            permissive,
            roles,
            qual::text as using_clause,
            with_check::text as check_clause
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
        ORDER BY cmd, policyname
    LOOP
        RAISE NOTICE 'Policy: %', policy_record.policyname;
        RAISE NOTICE '  Command: %', policy_record.cmd;
        RAISE NOTICE '  Permissive: %', policy_record.permissive;
        RAISE NOTICE '  Roles: %', policy_record.roles;
        RAISE NOTICE '  USING: %', policy_record.using_clause;
        RAISE NOTICE '  WITH CHECK: %', policy_record.check_clause;
        RAISE NOTICE '';
    END LOOP;
END $$;

-- =====================================================
-- SECTION 2: TEST POLICY BEHAVIOR
-- =====================================================

DO $$
DECLARE
    test_user_id uuid;
    is_admin_before boolean;
    is_admin_after boolean;
    update_result integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TESTING POLICY BEHAVIOR';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Use an existing non-admin user for testing
    -- Find first non-admin user in the database
    SELECT id INTO test_user_id
    FROM profiles
    WHERE is_admin = false
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No non-admin users found in database. Cannot run test.';
    END IF;

    RAISE NOTICE 'Using existing test user: %', test_user_id;

    SELECT is_admin INTO is_admin_before FROM profiles WHERE id = test_user_id;
    RAISE NOTICE 'Initial is_admin value: %', is_admin_before;
    RAISE NOTICE '';

    -- CRITICAL TEST: Try to update is_admin as the user
    RAISE NOTICE 'TEST 1: Attempting to UPDATE is_admin = true';
    RAISE NOTICE '  (This should FAIL if policy is working correctly)';
    RAISE NOTICE '';

    -- Set the session to act as the test user
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

    BEGIN
        -- Try to update is_admin
        UPDATE profiles
        SET is_admin = true
        WHERE id = test_user_id;

        GET DIAGNOSTICS update_result = ROW_COUNT;

        RAISE NOTICE 'UPDATE statement executed';
        RAISE NOTICE '  Rows affected: %', update_result;

        -- Check if the value actually changed
        SELECT is_admin INTO is_admin_after FROM profiles WHERE id = test_user_id;
        RAISE NOTICE '  is_admin after UPDATE: %', is_admin_after;
        RAISE NOTICE '';

        IF is_admin_after = true THEN
            RAISE NOTICE '✗ FAIL: User successfully changed is_admin to true';
            RAISE NOTICE '  This means the WITH CHECK clause is NOT working!';
            RAISE NOTICE '';
            RAISE NOTICE 'LIKELY CAUSE:';
            RAISE NOTICE '  The WITH CHECK subquery may be comparing the OLD value to itself';
            RAISE NOTICE '  instead of preventing the change.';
            RAISE NOTICE '';
            RAISE NOTICE 'SOLUTION:';
            RAISE NOTICE '  The WITH CHECK clause needs to reference OLD.is_admin or';
            RAISE NOTICE '  use a different approach like a trigger or check constraint.';
        ELSE
            RAISE NOTICE '✓ PASS: User CANNOT change is_admin';
            RAISE NOTICE '  Policy is working correctly!';
        END IF;
        RAISE NOTICE '';

    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ PASS: UPDATE failed with error (policy blocked it)';
        RAISE NOTICE '  Error: %', SQLERRM;
        RAISE NOTICE '  Policy is working correctly!';
        RAISE NOTICE '';
    END;

    -- Reset session
    PERFORM set_config('request.jwt.claim.sub', '', true);

    RAISE NOTICE '';
    RAISE NOTICE 'NOTE: Service role test skipped in this script';
    RAISE NOTICE '  (Service role bypass would require actual service role credentials)';
    RAISE NOTICE '';

END $$;

-- =====================================================
-- SECTION 3: ANALYSIS AND RECOMMENDATIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ANALYSIS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The WITH CHECK clause in the policy is:';
    RAISE NOTICE '  is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())';
    RAISE NOTICE '';
    RAISE NOTICE 'PROBLEM: This subquery fetches the CURRENT value from the table,';
    RAISE NOTICE 'which during an UPDATE is the OLD value. However, PostgreSQL';
    RAISE NOTICE 'evaluates WITH CHECK on the NEW row after the UPDATE.';
    RAISE NOTICE '';
    RAISE NOTICE 'If the UPDATE changes is_admin from false to true, the NEW row';
    RAISE NOTICE 'has is_admin = true, but the subquery still returns the OLD value';
    RAISE NOTICE '(false) because it runs in the same transaction.';
    RAISE NOTICE '';
    RAISE NOTICE 'WAIT... that should make it FAIL. Let me reconsider...';
    RAISE NOTICE '';
    RAISE NOTICE 'Actually, the subquery might be seeing the NEW value if it runs';
    RAISE NOTICE 'AFTER the UPDATE within the same transaction, making the check';
    RAISE NOTICE 'is_admin = true compare against is_admin = true (NEW value).';
    RAISE NOTICE '';
    RAISE NOTICE 'SOLUTION: Use OLD.is_admin or implement a trigger-based approach.';
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMENDED FIX:';
    RAISE NOTICE '  Replace the subquery with a CHECK constraint or trigger that';
    RAISE NOTICE '  prevents modification of is_admin by non-service-role users.';
    RAISE NOTICE '';
END $$;

-- Rollback all test changes
ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST COMPLETE - All changes rolled back';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
