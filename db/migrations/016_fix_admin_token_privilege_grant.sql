-- =====================================================
-- MIGRATION: Fix Admin Token Privilege Grant
-- Version: 016
-- Created: 2025-01-18
-- Purpose: Fix critical bug where admin tokens are consumed but privileges are never granted
-- =====================================================
--
-- CRITICAL BUG FIX:
-- The validate_and_consume_admin_token() function was marking tokens as consumed
-- but NEVER setting is_admin = true in the profiles table. This migration fixes
-- that by adding the missing UPDATE statement.
--
-- CHANGES:
-- 1. Drop existing validate_and_consume_admin_token() function
-- 2. Recreate with the CRITICAL missing line that grants admin privileges
-- 3. Ensure atomic transaction (both token consumption AND privilege grant happen together)
--
-- SECURITY:
-- This function runs with SECURITY DEFINER (elevated privileges) to allow
-- updating both admin_registration_tokens and profiles tables even though
-- the calling user might not have direct access to these tables.
--
-- IDEMPOTENCY:
-- Safe to run multiple times. Uses OR REPLACE for clean updates.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: DROP EXISTING FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FIXING ADMIN TOKEN PRIVILEGE GRANT BUG';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'CRITICAL BUG: Token consumption was marking tokens as used';
    RAISE NOTICE 'but NEVER granting admin privileges to the user.';
    RAISE NOTICE '';
END $$;

-- Drop the buggy function
DROP FUNCTION IF EXISTS public.validate_and_consume_admin_token(TEXT, TEXT, UUID);

DO $$
BEGIN
    RAISE NOTICE 'Dropped buggy validate_and_consume_admin_token() function';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 2: CREATE FIXED FUNCTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Creating FIXED validate_and_consume_admin_token() function...';
    RAISE NOTICE 'This version includes the missing admin privilege grant!';
    RAISE NOTICE '';
END $$;

-- Fixed function that ACTUALLY grants admin privileges
CREATE OR REPLACE FUNCTION public.validate_and_consume_admin_token(
    token_value TEXT,
    user_email TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- STEP 1: Find the token
    SELECT * INTO token_record
    FROM public.admin_registration_tokens
    WHERE token = token_value;

    -- Token doesn't exist
    IF NOT FOUND THEN
        RAISE NOTICE 'Token validation failed: token not found';
        RETURN FALSE;
    END IF;

    -- Token already used
    IF token_record.used_at IS NOT NULL THEN
        RAISE NOTICE 'Token validation failed: token already used at %', token_record.used_at;
        RETURN FALSE;
    END IF;

    -- Token expired
    IF token_record.expires_at < NOW() THEN
        RAISE NOTICE 'Token validation failed: token expired at %', token_record.expires_at;
        RETURN FALSE;
    END IF;

    -- If email is pre-assigned, verify it matches
    IF token_record.email IS NOT NULL AND token_record.email != user_email THEN
        RAISE NOTICE 'Token validation failed: email mismatch (expected: %, got: %)', token_record.email, user_email;
        RETURN FALSE;
    END IF;

    -- STEP 2: Token is valid - mark as used
    UPDATE public.admin_registration_tokens
    SET used_at = NOW(),
        used_by_user_id = user_id
    WHERE token = token_value;

    RAISE NOTICE 'Token marked as consumed: %', token_value;

    -- STEP 3: CRITICAL FIX - Grant admin privileges to the user
    -- This was the MISSING line in the original function!
    UPDATE public.profiles
    SET is_admin = true
    WHERE id = user_id;

    RAISE NOTICE 'Admin privileges GRANTED to user: %', user_id;

    -- Success - both token consumption and privilege grant completed
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comprehensive comment explaining the fix
COMMENT ON FUNCTION public.validate_and_consume_admin_token(TEXT, TEXT, UUID) IS
    'Validates an admin registration token and marks it as used. Returns true if valid and consumed, false otherwise.

    FIXED IN MIGRATION 016: Now ACTUALLY grants admin privileges (is_admin = true) in the profiles table.

    Security: Runs with SECURITY DEFINER to allow updating both admin_registration_tokens and profiles tables.

    Atomicity: Both token consumption and privilege grant happen in a single transaction.

    Validation checks:
    - Token exists in database
    - Token has not been used already
    - Token has not expired
    - Email matches if token has pre-assigned email

    Called during registration flow after user account is created.';

DO $$
BEGIN
    RAISE NOTICE 'Function recreated successfully with admin privilege grant!';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 3: VERIFICATION
-- =====================================================

DO $$
DECLARE
    function_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Verify function was created
    SELECT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'validate_and_consume_admin_token'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) INTO function_exists;

    IF function_exists THEN
        RAISE NOTICE '✓ validate_and_consume_admin_token() function recreated';
        RAISE NOTICE '';
        RAISE NOTICE 'FIXED BEHAVIOR:';
        RAISE NOTICE '  1. Validates token (exists, not used, not expired, email matches)';
        RAISE NOTICE '  2. Marks token as used (sets used_at and used_by_user_id)';
        RAISE NOTICE '  3. GRANTS ADMIN PRIVILEGES (sets is_admin = true in profiles) ← NEW!';
        RAISE NOTICE '';
        RAISE NOTICE 'TESTING:';
        RAISE NOTICE '  - New users with tokens → register → become admin immediately';
        RAISE NOTICE '  - Existing users with tokens → login with token → become admin';
        RAISE NOTICE '  - All operations are atomic (succeed together or fail together)';
        RAISE NOTICE '';
    ELSE
        RAISE WARNING '✗ Function creation may have failed - please verify manually';
    END IF;

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Test token flow with new user registration';
    RAISE NOTICE '  2. Test token flow with existing user login';
    RAISE NOTICE '  3. Verify is_admin column is set to true after token consumption';
    RAISE NOTICE '  4. Update frontend to handle existing user token flow (see RegisterPage.tsx)';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 016 COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (commented)
-- =====================================================
--
-- To rollback this migration and restore the original buggy function:
--
-- BEGIN;
--
-- -- Drop the fixed function
-- DROP FUNCTION IF EXISTS public.validate_and_consume_admin_token(TEXT, TEXT, UUID);
--
-- -- Recreate the original buggy version (without admin privilege grant)
-- CREATE OR REPLACE FUNCTION public.validate_and_consume_admin_token(
--     token_value TEXT,
--     user_email TEXT,
--     user_id UUID
-- )
-- RETURNS BOOLEAN AS $$
-- DECLARE
--     token_record RECORD;
-- BEGIN
--     SELECT * INTO token_record
--     FROM public.admin_registration_tokens
--     WHERE token = token_value;
--
--     IF NOT FOUND THEN
--         RETURN FALSE;
--     END IF;
--
--     IF token_record.used_at IS NOT NULL THEN
--         RETURN FALSE;
--     END IF;
--
--     IF token_record.expires_at < NOW() THEN
--         RETURN FALSE;
--     END IF;
--
--     IF token_record.email IS NOT NULL AND token_record.email != user_email THEN
--         RETURN FALSE;
--     END IF;
--
--     UPDATE public.admin_registration_tokens
--     SET used_at = NOW(),
--         used_by_user_id = user_id
--     WHERE token = token_value;
--
--     RETURN TRUE;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- COMMIT;
--
-- =====================================================
