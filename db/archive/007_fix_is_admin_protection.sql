-- =====================================================
-- MIGRATION: Fix is_admin Protection with Trigger
-- Version: 007
-- Created: 2025-10-16
-- Purpose: Replace flawed RLS WITH CHECK with trigger-based protection
-- =====================================================
--
-- ISSUE WITH MIGRATION 006:
-- The WITH CHECK clause using a subquery doesn't work because:
--   WITH CHECK (is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()))
-- The subquery sees the NEW value within the same transaction, so
-- when a user updates is_admin from false to true, the subquery
-- returns true, and the check becomes: true = true (PASS).
--
-- SOLUTION:
-- Use a BEFORE UPDATE trigger that compares OLD.is_admin vs NEW.is_admin
-- and blocks the change if attempted by a non-service-role user.
--
-- The trigger checks:
-- 1. If is_admin column is being modified (OLD.is_admin != NEW.is_admin)
-- 2. If the current user is NOT a service role (current_setting returns user ID)
-- 3. If both true, block the update with an exception
--
-- Service role bypasses this because it doesn't set request.jwt.claim.sub
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: DROP OLD FLAWED POLICY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'REPLACING FLAWED RLS POLICY WITH TRIGGER';
    RAISE NOTICE 'Migration 007';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Drop the flawed policy from migration 006
DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;

DO $$
BEGIN
    RAISE NOTICE 'Dropped flawed policy: "Users can update own profile (except is_admin)"';
    RAISE NOTICE '  - This policy used WITH CHECK subquery that did not work';
    RAISE NOTICE '  - Replacing with simpler policy + trigger';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 2: CREATE SIMPLE RLS POLICY
-- =====================================================

-- Simple policy: users can update their own profile (RLS check only)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DO $$
BEGIN
    RAISE NOTICE 'Created simple policy: "Users can update own profile"';
    RAISE NOTICE '  - USING: auth.uid() = id';
    RAISE NOTICE '  - WITH CHECK: auth.uid() = id';
    RAISE NOTICE '  - is_admin protection now handled by trigger';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 3: CREATE TRIGGER FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING TRIGGER FUNCTION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Drop existing trigger function if it exists
DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;

-- Create trigger function to prevent is_admin modification
CREATE OR REPLACE FUNCTION public.prevent_is_admin_modification()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id text;
BEGIN
    -- Check if is_admin column is being modified
    IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
        -- Get current user ID from JWT claim
        -- Service role won't have this set, so it can still modify is_admin
        BEGIN
            current_user_id := current_setting('request.jwt.claim.sub', true);
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;

        -- If there's a user ID (not service role), block the change
        IF current_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Users cannot modify their own is_admin flag. Contact an administrator.'
                USING ERRCODE = 'P0001';
        END IF;
    END IF;

    -- Allow the update (either is_admin not modified, or service role is updating)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE 'Created function: prevent_is_admin_modification()';
    RAISE NOTICE '  - Checks if is_admin is being modified';
    RAISE NOTICE '  - Blocks modification by authenticated users';
    RAISE NOTICE '  - Allows service role to modify (no JWT claim)';
    RAISE NOTICE '';
END $$;

-- Add comment to function
COMMENT ON FUNCTION public.prevent_is_admin_modification() IS
    'Trigger function to prevent users from modifying their own is_admin flag. Service role can still modify is_admin since it does not set request.jwt.claim.sub.';

-- =====================================================
-- SECTION 4: CREATE TRIGGER
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING TRIGGER';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_is_admin_self_modification ON public.profiles;

-- Create trigger on profiles table
CREATE TRIGGER prevent_is_admin_self_modification
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_is_admin_modification();

DO $$
BEGIN
    RAISE NOTICE 'Created trigger: prevent_is_admin_self_modification';
    RAISE NOTICE '  - Fires BEFORE UPDATE on profiles table';
    RAISE NOTICE '  - Executes prevent_is_admin_modification() function';
    RAISE NOTICE '  - Blocks is_admin changes by authenticated users';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 5: VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFYING TRIGGER CONFIGURATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Verify trigger exists
DO $$
DECLARE
    trigger_count integer;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification'
      AND tgrelid = 'public.profiles'::regclass;

    IF trigger_count = 1 THEN
        RAISE NOTICE 'Trigger verified: EXISTS';
    ELSE
        RAISE EXCEPTION 'Trigger not found! Migration failed.';
    END IF;
    RAISE NOTICE '';
END $$;

-- Verify function exists
DO $$
DECLARE
    function_count integer;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    IF function_count = 1 THEN
        RAISE NOTICE 'Function verified: EXISTS';
    ELSE
        RAISE EXCEPTION 'Function not found! Migration failed.';
    END IF;
    RAISE NOTICE '';
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

    RAISE NOTICE 'Security changes applied:';
    RAISE NOTICE '  - Dropped flawed WITH CHECK policy from migration 006';
    RAISE NOTICE '  - Created simple RLS policy for profile updates';
    RAISE NOTICE '  - Created trigger function to prevent is_admin modification';
    RAISE NOTICE '  - Created BEFORE UPDATE trigger on profiles table';
    RAISE NOTICE '';

    RAISE NOTICE 'HOW IT WORKS:';
    RAISE NOTICE '  1. User attempts: UPDATE profiles SET is_admin = true';
    RAISE NOTICE '  2. RLS policy checks: auth.uid() = id (PASS)';
    RAISE NOTICE '  3. Trigger fires BEFORE UPDATE';
    RAISE NOTICE '  4. Trigger compares OLD.is_admin vs NEW.is_admin';
    RAISE NOTICE '  5. If different AND user is authenticated: RAISE EXCEPTION';
    RAISE NOTICE '  6. If service role (no JWT): Allow the update';
    RAISE NOTICE '';

    RAISE NOTICE 'ADMIN MANAGEMENT:';
    RAISE NOTICE '  - Use service role key for granting admin access';
    RAISE NOTICE '  - Service role does not set request.jwt.claim.sub';
    RAISE NOTICE '  - Trigger allows service role to bypass protection';
    RAISE NOTICE '  - Use scripts/setAdminRole.ts for safe admin grants';
    RAISE NOTICE '';

    RAISE NOTICE 'TESTING:';
    RAISE NOTICE '  - Run db/VERIFY_ADMIN_SECURITY.sql to test';
    RAISE NOTICE '  - Test 2 should now show: ✓ PASS';
    RAISE NOTICE '';

    RAISE NOTICE 'MIGRATION COMPLETE - is_admin now protected by trigger';
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
    RAISE NOTICE 'TRIGGER-BASED PROTECTION SUCCESSFULLY APPLIED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Users can no longer promote themselves to admin.';
    RAISE NOTICE 'Run VERIFY_ADMIN_SECURITY.sql to validate.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
--
-- If you need to rollback this migration, run:
--
-- BEGIN;
--
-- -- Drop trigger
-- DROP TRIGGER IF EXISTS prevent_is_admin_self_modification ON public.profiles;
--
-- -- Drop function
-- DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;
--
-- -- Drop simple policy
-- DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
--
-- -- Restore original policy (NOT RECOMMENDED - vulnerable!)
-- CREATE POLICY "Users can update own profile" ON public.profiles
--     FOR UPDATE
--     USING (auth.uid() = id)
--     WITH CHECK (auth.uid() = id);
--
-- COMMIT;
--
-- WARNING: Rolling back restores the privilege escalation vulnerability!
-- =====================================================
