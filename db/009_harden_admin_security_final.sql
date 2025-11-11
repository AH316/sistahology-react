-- =====================================================
-- MIGRATION: Harden Admin Security - Final Solution
-- Version: 009
-- Created: 2025-10-16
-- Purpose: Simple, clear, bulletproof admin security
-- =====================================================
--
-- SECURITY REQUIREMENTS:
--   1. Regular users can only read and update their own profile
--   2. Users can NEVER make themselves admin (create or update)
--   3. Only service role can grant admin rights
--   4. Simple, clear, verifiable rules
--
-- DEFENSE IN DEPTH (3 LAYERS):
--   Layer 1: Column default (is_admin defaults to false)
--   Layer 2: RLS policies (minimal, non-overlapping)
--   Layer 3: Trigger (blocks is_admin modification with clear error)
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'HARDENING ADMIN SECURITY - FINAL SOLUTION';
    RAISE NOTICE 'Migration 009';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- LAYER 1: COLUMN DEFAULTS AND CONSTRAINTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'LAYER 1: COLUMN DEFAULTS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Ensure is_admin column has proper default and NOT NULL constraint
DO $$
BEGIN
    -- Verify column exists with correct settings
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'is_admin'
          AND column_default = 'false'
          AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '✓ Column is_admin: EXISTS with DEFAULT false NOT NULL';
    ELSE
        RAISE NOTICE 'Fixing is_admin column defaults...';
        -- Fix column if needed
        ALTER TABLE public.profiles
            ALTER COLUMN is_admin SET DEFAULT false,
            ALTER COLUMN is_admin SET NOT NULL;
        RAISE NOTICE '✓ Fixed is_admin column: DEFAULT false NOT NULL';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- LAYER 2: CLEAN UP AND CREATE MINIMAL RLS POLICIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'LAYER 2: RLS POLICIES (CLEAN SLATE)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Dropping all existing policies...';
END $$;

-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Allow all profiles operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_rw" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

DO $$
BEGIN
    RAISE NOTICE '✓ All existing policies dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Creating minimal policy set...';
    RAISE NOTICE '';
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DO $$
BEGIN
    RAISE NOTICE '✓ Created: profiles_select_own';
    RAISE NOTICE '  - Operation: SELECT';
    RAISE NOTICE '  - Roles: authenticated';
    RAISE NOTICE '  - Rule: auth.uid() = id';
    RAISE NOTICE '';
END $$;

-- Policy 2: INSERT - Users can create their own profile
-- Note: is_admin will default to false due to column default
-- Note: Trigger will block any attempt to set is_admin = true during insert
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DO $$
BEGIN
    RAISE NOTICE '✓ Created: profiles_insert_own';
    RAISE NOTICE '  - Operation: INSERT';
    RAISE NOTICE '  - Roles: authenticated';
    RAISE NOTICE '  - Rule: auth.uid() = id';
    RAISE NOTICE '  - Note: Column default ensures is_admin = false';
    RAISE NOTICE '  - Note: Trigger blocks explicit is_admin = true';
    RAISE NOTICE '';
END $$;

-- Policy 3: UPDATE - Users can update their own profile
-- Note: Trigger handles is_admin protection
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DO $$
BEGIN
    RAISE NOTICE '✓ Created: profiles_update_own';
    RAISE NOTICE '  - Operation: UPDATE';
    RAISE NOTICE '  - Roles: authenticated';
    RAISE NOTICE '  - USING: auth.uid() = id';
    RAISE NOTICE '  - WITH CHECK: auth.uid() = id';
    RAISE NOTICE '  - Note: Trigger blocks is_admin modification';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- LAYER 3: TRIGGER PROTECTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'LAYER 3: TRIGGER PROTECTION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS prevent_is_admin_self_modification ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.prevent_is_admin_modification()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id text;
BEGIN
    -- Check if is_admin column is being modified
    IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
        -- Get current user ID from JWT claim
        -- Service role won't have this set, so it bypasses this check
        BEGIN
            current_user_id := current_setting('request.jwt.claim.sub', true);
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;

        -- If there's a user ID (authenticated user, not service role), block the change
        IF current_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Permission denied: Users cannot modify their own admin status. Contact an administrator.'
                USING ERRCODE = '42501',  -- insufficient_privilege error code
                      HINT = 'Admin privileges can only be granted by administrators using the service role.';
        END IF;
    END IF;

    -- Allow the operation (either is_admin not modified, or service role is updating)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✓ Created function: prevent_is_admin_modification()';
    RAISE NOTICE '  - Checks if is_admin is being modified';
    RAISE NOTICE '  - Blocks modification by authenticated users';
    RAISE NOTICE '  - Allows service role (no JWT claim)';
    RAISE NOTICE '  - Returns clear error message';
    RAISE NOTICE '';
END $$;

-- Add comment to function
COMMENT ON FUNCTION public.prevent_is_admin_modification() IS
    'Trigger function preventing users from modifying their own is_admin flag. Service role bypasses this check since it does not set request.jwt.claim.sub. Returns error code 42501 (insufficient_privilege) with clear message.';

-- Create trigger
CREATE TRIGGER prevent_is_admin_self_modification
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_is_admin_modification();

DO $$
BEGIN
    RAISE NOTICE '✓ Created trigger: prevent_is_admin_self_modification';
    RAISE NOTICE '  - Fires: BEFORE INSERT OR UPDATE';
    RAISE NOTICE '  - Scope: FOR EACH ROW';
    RAISE NOTICE '  - Function: prevent_is_admin_modification()';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
    trigger_count integer;
    function_count integer;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check RLS enabled
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'profiles';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS: ENABLED on profiles table';
    ELSE
        RAISE EXCEPTION 'RLS is DISABLED on profiles table!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles';

    RAISE NOTICE '✓ Policies: % total (expected: 3)', policy_count;

    IF policy_count != 3 THEN
        RAISE WARNING 'Expected 3 policies, found %', policy_count;
    END IF;

    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification'
      AND tgrelid = 'public.profiles'::regclass;

    IF trigger_count > 0 THEN
        RAISE NOTICE '✓ Trigger: EXISTS';
    ELSE
        RAISE EXCEPTION 'Trigger not found!';
    END IF;

    -- Check function
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    IF function_count > 0 THEN
        RAISE NOTICE '✓ Function: EXISTS';
    ELSE
        RAISE EXCEPTION 'Function not found!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- LIST FINAL CONFIGURATION
-- =====================================================

DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FINAL SECURITY CONFIGURATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Policies:';
    RAISE NOTICE '';

    FOR policy_record IN
        SELECT
            policyname,
            cmd,
            roles::text,
            qual::text as using_clause,
            with_check::text as check_clause
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'profiles'
        ORDER BY
            CASE cmd
                WHEN 'SELECT' THEN 1
                WHEN 'INSERT' THEN 2
                WHEN 'UPDATE' THEN 3
                WHEN 'DELETE' THEN 4
                ELSE 5
            END,
            policyname
    LOOP
        RAISE NOTICE '  % (%):', policy_record.policyname, policy_record.cmd;
        RAISE NOTICE '    Roles: %', policy_record.roles;
        RAISE NOTICE '    USING: %', COALESCE(policy_record.using_clause, 'N/A');
        IF policy_record.check_clause IS NOT NULL THEN
            RAISE NOTICE '    WITH CHECK: %', policy_record.check_clause;
        END IF;
        RAISE NOTICE '';
    END LOOP;
END $$;

-- =====================================================
-- MIGRATION SUMMARY
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

    RAISE NOTICE 'Database Statistics:';
    RAISE NOTICE '  Total profiles: %', total_profiles;
    RAISE NOTICE '  Admin profiles: %', admin_profiles;
    RAISE NOTICE '  Regular profiles: %', (total_profiles - admin_profiles);
    RAISE NOTICE '';

    RAISE NOTICE '3-LAYER SECURITY MODEL:';
    RAISE NOTICE '';
    RAISE NOTICE '  Layer 1 - Column Default:';
    RAISE NOTICE '    • is_admin DEFAULT false NOT NULL';
    RAISE NOTICE '    • New profiles automatically non-admin';
    RAISE NOTICE '';
    RAISE NOTICE '  Layer 2 - RLS Policies (3 policies):';
    RAISE NOTICE '    • SELECT: Users can read own profile';
    RAISE NOTICE '    • INSERT: Users can create own profile';
    RAISE NOTICE '    • UPDATE: Users can update own profile';
    RAISE NOTICE '    • All policies check: auth.uid() = id';
    RAISE NOTICE '';
    RAISE NOTICE '  Layer 3 - Trigger Protection:';
    RAISE NOTICE '    • Blocks is_admin modification by authenticated users';
    RAISE NOTICE '    • Returns clear error message';
    RAISE NOTICE '    • Allows service role to grant admin';
    RAISE NOTICE '';

    RAISE NOTICE 'HOW IT WORKS:';
    RAISE NOTICE '';
    RAISE NOTICE '  Regular User (Authenticated):';
    RAISE NOTICE '    ✓ Can read their own profile';
    RAISE NOTICE '    ✓ Can update their own profile fields';
    RAISE NOTICE '    ✗ Cannot modify is_admin (trigger blocks)';
    RAISE NOTICE '    ✗ Cannot access other users profiles (RLS blocks)';
    RAISE NOTICE '';
    RAISE NOTICE '  Service Role (Admin Scripts):';
    RAISE NOTICE '    ✓ Bypasses RLS policies';
    RAISE NOTICE '    ✓ Bypasses trigger (no JWT claim)';
    RAISE NOTICE '    ✓ Can grant admin to any user';
    RAISE NOTICE '';

    RAISE NOTICE 'ADMIN MANAGEMENT:';
    RAISE NOTICE '  Use scripts with service role key:';
    RAISE NOTICE '    tsx scripts/setAdminRole.ts --email user@example.com';
    RAISE NOTICE '    tsx scripts/quickCreateAdmin.ts';
    RAISE NOTICE '';

    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADMIN SECURITY HARDENED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Review the security configuration above';
    RAISE NOTICE '  2. Run the test plan (see below)';
    RAISE NOTICE '  3. Verify all tests pass';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST PLAN (Copy to separate file or run manually)
-- =====================================================
--
-- TEST 1: Verify policies exist
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'profiles'
-- ORDER BY cmd;
-- Expected: 3 policies (SELECT, INSERT, UPDATE)
--
-- TEST 2: Verify trigger exists
-- SELECT tgname, tgenabled FROM pg_trigger
-- WHERE tgname = 'prevent_is_admin_self_modification'
--   AND tgrelid = 'public.profiles'::regclass;
-- Expected: 1 row, tgenabled = 'O' (enabled)
--
-- TEST 3: Client-side test (browser console as authenticated user)
-- const { data, error } = await supabase
--   .from('profiles')
--   .update({ is_admin: true })
--   .eq('id', user.id);
-- Expected: error with message about "cannot modify admin status"
--
-- TEST 4: Service role test (admin script)
-- tsx scripts/setAdminRole.ts --email testuser@example.com
-- Expected: Success, user granted admin
--
-- =====================================================
