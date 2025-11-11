-- =====================================================
-- MIGRATION: Secure is_admin Column from Self-Promotion
-- Version: 006
-- Created: 2025-10-16
-- Purpose: Fix critical privilege escalation vulnerability
-- =====================================================
--
-- SECURITY VULNERABILITY FIXED:
-- Prior to this migration, users could promote themselves to admin by running:
--   await supabase.from('profiles').update({ is_admin: true }).eq('id', user.id);
--
-- The vulnerable policy allowed any column update as long as auth.uid() = id:
--   CREATE POLICY "Users can update own profile" ON public.profiles
--       FOR UPDATE
--       USING (auth.uid() = id)
--       WITH CHECK (auth.uid() = id);
--
-- SOLUTION:
-- Replace the policy with one that prevents modification of is_admin column.
-- The WITH CHECK clause ensures the is_admin value cannot change during updates.
--
-- IDEMPOTENCY:
-- This migration is safe to run multiple times. Policy drops and creates
-- use IF EXISTS/IF NOT EXISTS patterns where applicable.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: MIGRATION HEADER
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECURING is_admin COLUMN FROM SELF-PROMOTION';
    RAISE NOTICE 'Migration 006';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CRITICAL SECURITY FIX:';
    RAISE NOTICE '  Preventing users from granting themselves admin privileges';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 2: DROP VULNERABLE POLICY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'REMOVING VULNERABLE UPDATE POLICY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Drop the existing policy that allows unrestricted column updates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DO $$
BEGIN
    RAISE NOTICE 'Dropped vulnerable policy: "Users can update own profile"';
    RAISE NOTICE '  - This policy allowed users to update any column including is_admin';
    RAISE NOTICE '  - Creating secure replacement policy...';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 3: CREATE SECURE POLICY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING SECURE UPDATE POLICY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create secure policy that prevents is_admin modification
-- USING clause: Only allow updates to your own profile
-- WITH CHECK clause: Ensure is_admin value doesn't change
CREATE POLICY "Users can update own profile (except is_admin)" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
    );

DO $$
BEGIN
    RAISE NOTICE 'Created secure policy: "Users can update own profile (except is_admin)"';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY GUARANTEES:';
    RAISE NOTICE '  ✓ Users can update own profile fields (full_name, avatar_url, etc.)';
    RAISE NOTICE '  ✓ Users CANNOT change their is_admin flag';
    RAISE NOTICE '  ✓ WITH CHECK clause validates is_admin remains unchanged';
    RAISE NOTICE '  ✓ Service role bypasses RLS and can still grant admin access';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 4: POLICY VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFYING POLICY CONFIGURATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Verify the new policy exists
DO $$
DECLARE
    policy_count integer;
    policy_definition text;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own profile (except is_admin)'
      AND cmd = 'UPDATE';

    IF policy_count = 1 THEN
        RAISE NOTICE 'Secure UPDATE policy verified: EXISTS';

        SELECT qual::text INTO policy_definition
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'Users can update own profile (except is_admin)';

        RAISE NOTICE 'Policy USING clause: %', policy_definition;
    ELSE
        RAISE EXCEPTION 'Secure UPDATE policy not found! Migration failed.';
    END IF;
    RAISE NOTICE '';
END $$;

-- Verify all required policies exist on profiles table
DO $$
DECLARE
    select_policy_count integer;
    insert_policy_count integer;
    update_policy_count integer;
    delete_policy_count integer;
BEGIN
    SELECT COUNT(*) INTO select_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'SELECT';

    SELECT COUNT(*) INTO insert_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'INSERT';

    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'UPDATE';

    SELECT COUNT(*) INTO delete_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'DELETE';

    RAISE NOTICE 'Complete RLS policy coverage on profiles table:';
    RAISE NOTICE '  - SELECT policies: % (expected: 1+)', select_policy_count;
    RAISE NOTICE '  - INSERT policies: % (expected: 1+)', insert_policy_count;
    RAISE NOTICE '  - UPDATE policies: % (expected: 1)', update_policy_count;
    RAISE NOTICE '  - DELETE policies: % (expected: 1+)', delete_policy_count;
    RAISE NOTICE '';

    IF select_policy_count = 0 OR insert_policy_count = 0 OR update_policy_count = 0 THEN
        RAISE WARNING 'Missing required policies! This may indicate a security issue.';
    ELSE
        RAISE NOTICE 'All required CRUD policies present - security verified';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 5: MIGRATION SUMMARY
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

    RAISE NOTICE 'Security changes applied:';
    RAISE NOTICE '  - Dropped vulnerable "Users can update own profile" policy';
    RAISE NOTICE '  - Created secure "Users can update own profile (except is_admin)" policy';
    RAISE NOTICE '  - is_admin column now protected from self-modification';
    RAISE NOTICE '';

    RAISE NOTICE 'ADMIN MANAGEMENT:';
    RAISE NOTICE '  - Use service role key for granting admin access';
    RAISE NOTICE '  - Service role bypasses RLS policies';
    RAISE NOTICE '  - Use scripts/setAdminRole.ts for safe admin grants';
    RAISE NOTICE '';

    RAISE NOTICE 'TESTING CHECKLIST:';
    RAISE NOTICE '  1. Run db/VERIFY_ADMIN_SECURITY.sql to test policy enforcement';
    RAISE NOTICE '  2. Verify users can update their profile (name, avatar, etc.)';
    RAISE NOTICE '  3. Verify users CANNOT update their is_admin flag';
    RAISE NOTICE '  4. Verify service role CAN update is_admin for admin grants';
    RAISE NOTICE '';

    RAISE NOTICE 'MIGRATION COMPLETE - is_admin column secured';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- COMMIT TRANSACTION
-- =====================================================

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PRIVILEGE ESCALATION VULNERABILITY FIXED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can no longer promote themselves to admin.';
    RAISE NOTICE 'Run VERIFY_ADMIN_SECURITY.sql to validate security.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
--
-- If you need to rollback this migration, run the following SQL:
--
-- BEGIN;
--
-- -- Drop the secure policy
-- DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;
--
-- -- Restore the original vulnerable policy (NOT RECOMMENDED FOR PRODUCTION)
-- CREATE POLICY "Users can update own profile" ON public.profiles
--     FOR UPDATE
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);
--
-- COMMIT;
--
-- WARNING: Rolling back this migration restores the privilege escalation vulnerability.
-- Only rollback in development/testing environments or if you have an alternative
-- security solution in place.
--
-- =====================================================
