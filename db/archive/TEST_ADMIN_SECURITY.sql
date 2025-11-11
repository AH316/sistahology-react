-- =====================================================
-- TEST PLAN: Admin Security Verification
-- =====================================================
-- Run this AFTER migration 009 to verify all security layers
-- This script is READ-ONLY (uses BEGIN/ROLLBACK)
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADMIN SECURITY TEST SUITE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 1: Verify Column Configuration
-- =====================================================

DO $$
DECLARE
    col_default text;
    col_nullable text;
BEGIN
    RAISE NOTICE 'TEST 1: Column Configuration';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    SELECT column_default, is_nullable
    INTO col_default, col_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'is_admin';

    IF col_default = 'false' AND col_nullable = 'NO' THEN
        RAISE NOTICE '✓ PASS: is_admin has DEFAULT false NOT NULL';
    ELSE
        RAISE NOTICE '✗ FAIL: is_admin configuration incorrect';
        RAISE NOTICE '  Expected: DEFAULT false NOT NULL';
        RAISE NOTICE '  Found: DEFAULT % %', col_default,
            CASE WHEN col_nullable = 'NO' THEN 'NOT NULL' ELSE 'NULL' END;
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 2: Verify RLS Status
-- =====================================================

DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    RAISE NOTICE 'TEST 2: RLS Enabled';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'profiles';

    IF rls_enabled THEN
        RAISE NOTICE '✓ PASS: RLS is ENABLED on profiles table';
    ELSE
        RAISE NOTICE '✗ FAIL: RLS is DISABLED on profiles table';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 3: Verify Policy Count and Names
-- =====================================================

DO $$
DECLARE
    policy_count integer;
    select_count integer;
    insert_count integer;
    update_count integer;
    rec RECORD;
BEGIN
    RAISE NOTICE 'TEST 3: Policy Configuration';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';

    -- Count by operation
    SELECT COUNT(*) INTO select_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT';

    SELECT COUNT(*) INTO insert_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'INSERT';

    SELECT COUNT(*) INTO update_count FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE';

    IF policy_count = 3 AND select_count = 1 AND insert_count = 1 AND update_count = 1 THEN
        RAISE NOTICE '✓ PASS: Exactly 3 policies (1 SELECT, 1 INSERT, 1 UPDATE)';
    ELSE
        RAISE NOTICE '✗ FAIL: Incorrect policy count';
        RAISE NOTICE '  Expected: 3 total (1 SELECT, 1 INSERT, 1 UPDATE)';
        RAISE NOTICE '  Found: % total (% SELECT, % INSERT, % UPDATE)',
            policy_count, select_count, insert_count, update_count;
    END IF;

    -- List policy names
    RAISE NOTICE '';
    RAISE NOTICE 'Policy Details:';
    FOR rec IN
        SELECT policyname, cmd
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
        ORDER BY
            CASE cmd
                WHEN 'SELECT' THEN 1
                WHEN 'INSERT' THEN 2
                WHEN 'UPDATE' THEN 3
            END
    LOOP
        RAISE NOTICE '  • % (%)', rec.policyname, rec.cmd;
    END LOOP;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 4: Verify Trigger Exists and is Enabled
-- =====================================================

DO $$
DECLARE
    trigger_count integer;
    trigger_enabled char(1);
BEGIN
    RAISE NOTICE 'TEST 4: Trigger Configuration';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    SELECT COUNT(*), MAX(tgenabled)
    INTO trigger_count, trigger_enabled
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification'
      AND tgrelid = 'public.profiles'::regclass;

    IF trigger_count = 1 AND trigger_enabled = 'O' THEN
        RAISE NOTICE '✓ PASS: Trigger exists and is enabled';
    ELSIF trigger_count = 0 THEN
        RAISE NOTICE '✗ FAIL: Trigger not found';
    ELSIF trigger_enabled != 'O' THEN
        RAISE NOTICE '✗ FAIL: Trigger exists but is disabled';
    ELSE
        RAISE NOTICE '✗ FAIL: Multiple triggers found';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 5: Verify Function Exists
-- =====================================================

DO $$
DECLARE
    function_count integer;
BEGIN
    RAISE NOTICE 'TEST 5: Function Configuration';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    IF function_count = 1 THEN
        RAISE NOTICE '✓ PASS: Function exists';
    ELSIF function_count = 0 THEN
        RAISE NOTICE '✗ FAIL: Function not found';
    ELSE
        RAISE NOTICE '✗ FAIL: Multiple functions found';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 6: Verify No Overlapping Policies
-- =====================================================

DO $$
DECLARE
    all_policy_count integer;
    update_policy_count integer;
BEGIN
    RAISE NOTICE 'TEST 6: No Overlapping Policies';
    RAISE NOTICE '─────────────────────────────────────────';
    RAISE NOTICE '';

    -- Check for "ALL" policies
    SELECT COUNT(*) INTO all_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'ALL';

    -- Check for multiple UPDATE policies
    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'UPDATE';

    IF all_policy_count = 0 AND update_policy_count = 1 THEN
        RAISE NOTICE '✓ PASS: No overlapping policies (no ALL, single UPDATE)';
    ELSE
        RAISE NOTICE '✗ FAIL: Overlapping policies detected';
        RAISE NOTICE '  "ALL" policies: % (expected: 0)', all_policy_count;
        RAISE NOTICE '  UPDATE policies: % (expected: 1)', update_policy_count;
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST SUMMARY
-- =====================================================

DO $$
DECLARE
    test_results text := '';
    total_tests integer := 6;
    passed_tests integer := 0;

    -- Test results
    col_ok boolean;
    rls_ok boolean;
    policy_ok boolean;
    trigger_ok boolean;
    function_ok boolean;
    overlap_ok boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check test 1
    SELECT (column_default = 'false' AND is_nullable = 'NO') INTO col_ok
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin';
    IF col_ok THEN passed_tests := passed_tests + 1; END IF;

    -- Check test 2
    SELECT pc.relrowsecurity INTO rls_ok
    FROM pg_class pc JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'profiles';
    IF rls_ok THEN passed_tests := passed_tests + 1; END IF;

    -- Check test 3
    SELECT (COUNT(*) = 3) INTO policy_ok FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';
    IF policy_ok THEN passed_tests := passed_tests + 1; END IF;

    -- Check test 4
    SELECT (COUNT(*) = 1 AND MAX(tgenabled) = 'O') INTO trigger_ok
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification' AND tgrelid = 'public.profiles'::regclass;
    IF trigger_ok THEN passed_tests := passed_tests + 1; END IF;

    -- Check test 5
    SELECT (COUNT(*) = 1) INTO function_ok FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification' AND pronamespace = 'public'::regnamespace;
    IF function_ok THEN passed_tests := passed_tests + 1; END IF;

    -- Check test 6
    SELECT (
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'ALL') = 0
        AND
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'UPDATE') = 1
    ) INTO overlap_ok;
    IF overlap_ok THEN passed_tests := passed_tests + 1; END IF;

    RAISE NOTICE 'Test Results: % / % passed', passed_tests, total_tests;
    RAISE NOTICE '';

    IF passed_tests = total_tests THEN
        RAISE NOTICE '✓✓✓ ALL TESTS PASSED ✓✓✓';
        RAISE NOTICE '';
        RAISE NOTICE 'Admin security is properly configured!';
        RAISE NOTICE '';
        RAISE NOTICE 'Next Steps:';
        RAISE NOTICE '  1. Test from browser console (see below)';
        RAISE NOTICE '  2. Verify error message appears';
        RAISE NOTICE '  3. Test admin script works';
    ELSE
        RAISE NOTICE '✗✗✗ SOME TESTS FAILED ✗✗✗';
        RAISE NOTICE '';
        RAISE NOTICE 'Please review the failures above and:';
        RAISE NOTICE '  1. Re-run migration 009';
        RAISE NOTICE '  2. Check for errors in migration output';
        RAISE NOTICE '  3. Run this test again';
    END IF;
    RAISE NOTICE '';
END $$;

ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CLIENT-SIDE TEST INSTRUCTIONS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To test from the browser:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Log in to your app as a non-admin user';
    RAISE NOTICE '2. Open browser DevTools console (F12)';
    RAISE NOTICE '3. Run this code:';
    RAISE NOTICE '';
    RAISE NOTICE '   const { supabase } = await import(''/src/lib/supabase.ts'');';
    RAISE NOTICE '   const { data: { user } } = await supabase.auth.getUser();';
    RAISE NOTICE '   const { data, error } = await supabase';
    RAISE NOTICE '     .from(''profiles'')';
    RAISE NOTICE '     .update({ is_admin: true })';
    RAISE NOTICE '     .eq(''id'', user.id);';
    RAISE NOTICE '   console.log({ data, error });';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Result:';
    RAISE NOTICE '  error: {';
    RAISE NOTICE '    message: "Permission denied: Users cannot modify..."';
    RAISE NOTICE '    code: "42501"';
    RAISE NOTICE '  }';
    RAISE NOTICE '';
    RAISE NOTICE 'If you see {data: null, error: null} instead, the';
    RAISE NOTICE 'trigger may not be firing. Check the trigger configuration.';
    RAISE NOTICE '';
END $$;
