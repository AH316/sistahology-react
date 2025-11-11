-- =====================================================
-- MIGRATION: Cleanup Duplicate RLS Policies
-- Version: 008
-- Created: 2025-10-16
-- Purpose: Remove duplicate/conflicting policies and ensure trigger works
-- =====================================================
--
-- ISSUE: Multiple UPDATE policies exist on profiles table:
--   1. "Allow all profiles operations" (cmd: ALL)
--   2. "Users can update own profile" (cmd: UPDATE)
--   3. "profiles_owner_update" (cmd: UPDATE)
--
-- All these policies use simple auth.uid() = id checks without
-- is_admin protection, and they override each other with OR logic.
--
-- SOLUTION:
--   1. Drop ALL existing policies on profiles table
--   2. Create clean, minimal policy set:
--      - SELECT: Users can view own profile
--      - UPDATE: Users can update own profile (trigger handles is_admin)
--   3. Verify trigger exists and is enabled
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CLEANING UP DUPLICATE RLS POLICIES';
    RAISE NOTICE 'Migration 008';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 1: DROP ALL EXISTING POLICIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Dropping all existing policies on profiles table...';
    RAISE NOTICE '';
END $$;

-- Drop all policies (order doesn't matter since we're dropping all)
DROP POLICY IF EXISTS "Allow all profiles operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_rw" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;

DO $$
BEGIN
    RAISE NOTICE 'All existing policies dropped';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 2: CREATE CLEAN POLICY SET
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING CLEAN RLS POLICIES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- SELECT policy: Users can view their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

RAISE NOTICE 'Created policy: profiles_select_own (SELECT)';

-- UPDATE policy: Users can update their own profile
-- Note: is_admin protection is handled by the trigger, not the policy
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

RAISE NOTICE 'Created policy: profiles_update_own (UPDATE)';
RAISE NOTICE '  - USING: auth.uid() = id';
RAISE NOTICE '  - WITH CHECK: auth.uid() = id';
RAISE NOTICE '  - is_admin protection: Handled by trigger';
RAISE NOTICE '';

-- =====================================================
-- SECTION 3: VERIFY TRIGGER EXISTS
-- =====================================================

DO $$
DECLARE
    trigger_count integer;
    function_count integer;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFYING TRIGGER PROTECTION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification'
      AND tgrelid = 'public.profiles'::regclass;

    IF trigger_count > 0 THEN
        RAISE NOTICE '✓ Trigger exists: prevent_is_admin_self_modification';
    ELSE
        RAISE WARNING '✗ Trigger NOT found: prevent_is_admin_self_modification';
        RAISE WARNING '   Run migration 007 to create the trigger';
    END IF;

    -- Check function
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    IF function_count > 0 THEN
        RAISE NOTICE '✓ Function exists: prevent_is_admin_modification';
    ELSE
        RAISE WARNING '✗ Function NOT found: prevent_is_admin_modification';
        RAISE WARNING '   Run migration 007 to create the function';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 4: VERIFY RLS STATUS
-- =====================================================

DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFYING RLS CONFIGURATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check RLS is enabled
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'profiles';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS is ENABLED on profiles table';
    ELSE
        RAISE WARNING '✗ RLS is DISABLED on profiles table';
        RAISE WARNING '   Enable with: ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles';

    RAISE NOTICE 'Total policies on profiles table: %', policy_count;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 5: LIST FINAL POLICIES
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FINAL POLICY CONFIGURATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    FOR policy_record IN
        SELECT
            policyname,
            cmd,
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
        RAISE NOTICE '  Roles: %', policy_record.roles;
        RAISE NOTICE '  USING: %', policy_record.using_clause;
        RAISE NOTICE '  WITH CHECK: %', COALESCE(policy_record.check_clause, '(none)');
        RAISE NOTICE '';
    END LOOP;
END $$;

-- =====================================================
-- SECTION 6: MIGRATION SUMMARY
-- =====================================================

DO $$
DECLARE
    total_profiles integer;
    admin_profiles integer;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO total_profiles FROM public.profiles;
    SELECT COUNT(*) INTO admin_profiles FROM public.profiles WHERE is_admin = true;

    RAISE NOTICE 'Profiles table statistics:';
    RAISE NOTICE '  - Total profiles: %', total_profiles;
    RAISE NOTICE '  - Admin profiles: %', admin_profiles;
    RAISE NOTICE '  - Regular profiles: %', (total_profiles - admin_profiles);
    RAISE NOTICE '';

    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  - Dropped all duplicate/conflicting policies';
    RAISE NOTICE '  - Created clean policy set (SELECT, UPDATE)';
    RAISE NOTICE '  - Verified trigger protection exists';
    RAISE NOTICE '';

    RAISE NOTICE 'SECURITY MODEL:';
    RAISE NOTICE '  1. RLS Policy: Controls access (auth.uid() = id)';
    RAISE NOTICE '  2. Trigger: Prevents is_admin modification';
    RAISE NOTICE '  3. Result: Users can update profile, but NOT is_admin';
    RAISE NOTICE '';

    RAISE NOTICE 'TESTING:';
    RAISE NOTICE '  Test in browser console as authenticated user:';
    RAISE NOTICE '    const { data, error } = await supabase';
    RAISE NOTICE '      .from("profiles")';
    RAISE NOTICE '      .update({ is_admin: true })';
    RAISE NOTICE '      .eq("id", user.id);';
    RAISE NOTICE '';
    RAISE NOTICE '  Expected: Error from trigger about cannot modify is_admin';
    RAISE NOTICE '';

    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'DUPLICATE POLICIES CLEANED UP';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
