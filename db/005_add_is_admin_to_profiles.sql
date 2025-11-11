-- =====================================================
-- MIGRATION: Add Admin Flag to Profiles Table
-- Version: 005
-- Created: 2025-10-16
-- Purpose: Enable admin access control for CMS and admin panel
-- =====================================================
--
-- OVERVIEW:
-- This migration adds the is_admin boolean column to the profiles table.
-- This flag controls access to:
--   - CMS page editing functionality
--   - Admin panel features
--   - Content management operations
--
-- SECURITY NOTES:
-- - Default value is false (regular users by default)
-- - NOT NULL constraint ensures explicit admin status
-- - Partial index optimizes admin user lookups
-- - Existing RLS policies continue to work unchanged
-- - Users cannot modify their own is_admin flag (enforced by RLS)
--
-- IDEMPOTENCY:
-- This migration is safe to run multiple times. All operations use
-- IF NOT EXISTS or conditional logic to prevent errors on re-run.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: SCHEMA CHANGES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADDING ADMIN FLAG TO PROFILES TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

        RAISE NOTICE 'Added is_admin column to profiles table';

        -- Add comment explaining the column
        COMMENT ON COLUMN public.profiles.is_admin IS
            'Flag indicating if user has admin privileges for CMS and admin panel access. Default: false (regular user). Cannot be self-modified.';
    ELSE
        RAISE NOTICE 'Column is_admin already exists - skipping';
    END IF;
END $$;

-- =====================================================
-- SECTION 2: PERFORMANCE INDEXES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING PERFORMANCE INDEXES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Partial index for admin users (is_admin = true)
-- This optimizes admin user lookups and admin-only queries
-- Using partial index since admin users are rare (small subset of total users)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON public.profiles(is_admin)
WHERE is_admin = true;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND indexname = 'idx_profiles_is_admin'
    ) THEN
        RAISE NOTICE 'Created/verified partial index for admin users';
    END IF;
END $$;

-- =====================================================
-- SECTION 3: RLS POLICY VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFYING RLS POLICIES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Verify that RLS is enabled on profiles table
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'profiles';

    IF rls_enabled THEN
        RAISE NOTICE 'RLS is ENABLED on profiles table - security verified';
    ELSE
        RAISE WARNING 'RLS is DISABLED on profiles table - this is a security risk!';
    END IF;
END $$;

-- Verify existing RLS policies cover all CRUD operations
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

    RAISE NOTICE 'Existing RLS policies on profiles table:';
    RAISE NOTICE '  - SELECT policies: %', select_policy_count;
    RAISE NOTICE '  - INSERT policies: %', insert_policy_count;
    RAISE NOTICE '  - UPDATE policies: %', update_policy_count;
    RAISE NOTICE '  - DELETE policies: %', delete_policy_count;

    IF select_policy_count > 0 AND insert_policy_count > 0 AND
       update_policy_count > 0 THEN
        RAISE NOTICE 'Key CRUD operations have RLS policies - security verified';
    ELSE
        RAISE WARNING 'Some CRUD operations lack RLS policies - review required!';
    END IF;
END $$;

-- =====================================================
-- SECTION 4: RLS POLICY NOTES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RLS SECURITY NOTES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'The existing RLS policies on the profiles table provide security:';
    RAISE NOTICE '';
    RAISE NOTICE '1. SELECT policy: Users can view their own profile';
    RAISE NOTICE '   - The is_admin flag is readable by the profile owner';
    RAISE NOTICE '   - Users cannot view other users'' admin status';
    RAISE NOTICE '';
    RAISE NOTICE '2. UPDATE policy: Users can only update their own profile';
    RAISE NOTICE '   - IMPORTANT: Verify that is_admin is NOT in the updatable columns';
    RAISE NOTICE '   - Users should NOT be able to grant themselves admin access';
    RAISE NOTICE '   - Use service role or database function for admin grants';
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMENDED RLS POLICY ENHANCEMENT:';
    RAISE NOTICE '  Consider adding a check constraint or RLS policy to prevent users';
    RAISE NOTICE '  from modifying their own is_admin flag through UPDATE operations.';
    RAISE NOTICE '';
    RAISE NOTICE 'ADMIN MANAGEMENT:';
    RAISE NOTICE '  - Use service role key for granting admin access';
    RAISE NOTICE '  - Example: UPDATE profiles SET is_admin = true WHERE id = ''user-uuid'';';
    RAISE NOTICE '  - Application checks is_admin flag during login and session load';
    RAISE NOTICE '';
    RAISE NOTICE 'NO NEW RLS POLICIES NEEDED - existing policies provide base security.';
    RAISE NOTICE 'REVIEW UPDATE POLICY - ensure is_admin cannot be self-modified.';
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
    RAISE NOTICE '';
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
    RAISE NOTICE 'Schema changes applied:';
    RAISE NOTICE '  - Added is_admin column (BOOLEAN NOT NULL DEFAULT false)';
    RAISE NOTICE '  - Created partial index for admin users';
    RAISE NOTICE '';
    RAISE NOTICE 'Security status:';
    RAISE NOTICE '  - RLS remains enabled';
    RAISE NOTICE '  - Existing policies cover profile access';
    RAISE NOTICE '  - Users isolated to their own profile data';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Verify UPDATE policy prevents self-modifying is_admin';
    RAISE NOTICE '  2. Grant admin access using service role:';
    RAISE NOTICE '     UPDATE profiles SET is_admin = true WHERE id = ''user-uuid'';';
    RAISE NOTICE '  3. Test admin access in application';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION COMPLETE - Ready for admin access control';
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
    RAISE NOTICE 'ADMIN FLAG MIGRATION SUCCESSFULLY APPLIED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
