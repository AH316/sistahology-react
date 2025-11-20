-- =====================================================
-- MIGRATION: Create Admin Registration Tokens Table
-- Version: 013
-- Created: 2025-01-13
-- Purpose: Secure admin account creation via single-use tokens
-- =====================================================
--
-- OVERVIEW:
-- Creates the admin_registration_tokens table for controlled admin
-- account creation. Tokens are cryptographically secure, single-use,
-- and time-limited. Prevents unauthorized admin account creation.
--
-- TOKEN LIFECYCLE:
-- 1. Admin creates token (optionally assigns to specific email)
-- 2. Token is sent securely to recipient
-- 3. Recipient uses token during registration
-- 4. Token is marked as used and cannot be reused
-- 5. Expired tokens are periodically cleaned up
--
-- SECURITY MODEL:
-- - Admins: Can create, view, and delete tokens (but not modify used tokens)
-- - Public: NO ACCESS to this table (completely private)
-- - Service Role: Can mark tokens as used during registration flow
--
-- IDEMPOTENCY:
-- Safe to run multiple times. Uses IF NOT EXISTS and conditional logic.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: TABLE CREATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING ADMIN_REGISTRATION_TOKENS TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create admin_registration_tokens table
CREATE TABLE IF NOT EXISTS public.admin_registration_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.admin_registration_tokens IS
    'Secure single-use tokens for admin account registration. Tokens expire after a set period and can only be used once. Completely private - no public access.';

-- Add column comments
COMMENT ON COLUMN public.admin_registration_tokens.id IS
    'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.admin_registration_tokens.token IS
    'Cryptographically secure random token string. Must be unique and kept secret.';
COMMENT ON COLUMN public.admin_registration_tokens.email IS
    'Optional pre-assigned email address. If set, token can only be used by this email. NULL = any email can use it.';
COMMENT ON COLUMN public.admin_registration_tokens.expires_at IS
    'Token expiration timestamp. Tokens cannot be used after this time. Typically set to 7 days from creation.';
COMMENT ON COLUMN public.admin_registration_tokens.used_at IS
    'Timestamp when token was consumed. NULL = unused, NOT NULL = already used (cannot be reused).';
COMMENT ON COLUMN public.admin_registration_tokens.used_by_user_id IS
    'Foreign key to auth.users - tracks which user account consumed this token.';
COMMENT ON COLUMN public.admin_registration_tokens.created_at IS
    'Timestamp when token was created';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_registration_tokens'
    ) THEN
        RAISE NOTICE 'admin_registration_tokens table created/verified successfully';
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

-- Index on token for fast validation lookups during registration
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_token
ON public.admin_registration_tokens(token);

-- Index on expires_at for cleanup queries and validation
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_expires_at
ON public.admin_registration_tokens(expires_at);

-- Composite index for finding unused, non-expired tokens
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_valid
ON public.admin_registration_tokens(token, expires_at)
WHERE used_at IS NULL;

-- Index on used_by_user_id for tracking token usage
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_used_by
ON public.admin_registration_tokens(used_by_user_id)
WHERE used_by_user_id IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Created indexes:';
    RAISE NOTICE '  - idx_admin_registration_tokens_token (fast validation)';
    RAISE NOTICE '  - idx_admin_registration_tokens_expires_at (cleanup queries)';
    RAISE NOTICE '  - idx_admin_registration_tokens_valid (unused tokens)';
    RAISE NOTICE '  - idx_admin_registration_tokens_used_by (usage tracking)';
END $$;

-- =====================================================
-- SECTION 3: HELPER FUNCTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING HELPER FUNCTIONS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Function to validate and consume a token
CREATE OR REPLACE FUNCTION public.validate_and_consume_admin_token(
    token_value TEXT,
    user_email TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Find the token
    SELECT * INTO token_record
    FROM public.admin_registration_tokens
    WHERE token = token_value;

    -- Token doesn't exist
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Token already used
    IF token_record.used_at IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    -- Token expired
    IF token_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;

    -- If email is pre-assigned, verify it matches
    IF token_record.email IS NOT NULL AND token_record.email != user_email THEN
        RETURN FALSE;
    END IF;

    -- Token is valid - mark as used
    UPDATE public.admin_registration_tokens
    SET used_at = NOW(),
        used_by_user_id = user_id
    WHERE token = token_value;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_and_consume_admin_token(TEXT, TEXT, UUID) IS
    'Validates an admin registration token and marks it as used. Returns true if valid and consumed, false otherwise. Called during registration flow.';

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.admin_registration_tokens
    WHERE expires_at < NOW()
    AND used_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_admin_tokens() IS
    'Deletes expired, unused admin registration tokens. Returns count of deleted tokens. Can be called periodically via cron job.';

DO $$
BEGIN
    RAISE NOTICE 'Created helper functions:';
    RAISE NOTICE '  - validate_and_consume_admin_token()';
    RAISE NOTICE '  - cleanup_expired_admin_tokens()';
END $$;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CONFIGURING ROW LEVEL SECURITY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Enable RLS on admin_registration_tokens table
ALTER TABLE public.admin_registration_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS enabled on admin_registration_tokens table';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY NOTICE: This table is admin-only. No public access policies.';
END $$;

-- =====================================================
-- ADMIN POLICIES: Full Management Access for Admins
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating ADMIN policies (full management access)...';
END $$;

-- Admin SELECT policy: View all tokens
DROP POLICY IF EXISTS admin_select_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_select_admin_registration_tokens
ON public.admin_registration_tokens
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_select_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can view all admin registration tokens';

-- Admin INSERT policy: Create new tokens
DROP POLICY IF EXISTS admin_insert_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_insert_admin_registration_tokens
ON public.admin_registration_tokens
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_insert_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can create new admin registration tokens';

-- Admin DELETE policy: Delete tokens (cleanup)
DROP POLICY IF EXISTS admin_delete_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_delete_admin_registration_tokens
ON public.admin_registration_tokens
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_delete_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can delete admin registration tokens for cleanup';

DO $$
BEGIN
    RAISE NOTICE 'Admin policies created: SELECT, INSERT, DELETE';
    RAISE NOTICE '';
    RAISE NOTICE 'NO UPDATE policy - token consumption is handled by SECURITY DEFINER function';
    RAISE NOTICE 'NO PUBLIC policies - this table is completely private';
END $$;

-- =====================================================
-- SECTION 5: VERIFICATION & SUMMARY
-- =====================================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Verify RLS is enabled
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'admin_registration_tokens';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS is ENABLED on admin_registration_tokens table';
    ELSE
        RAISE WARNING '✗ RLS is DISABLED - security risk!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_registration_tokens';

    RAISE NOTICE '✓ Total RLS policies: %', policy_count;
    RAISE NOTICE '';

    RAISE NOTICE 'Schema created:';
    RAISE NOTICE '  - admin_registration_tokens table with 7 columns';
    RAISE NOTICE '  - UNIQUE constraint on token';
    RAISE NOTICE '  - Foreign key to auth.users(id)';
    RAISE NOTICE '  - 4 performance indexes';
    RAISE NOTICE '  - 2 helper functions (SECURITY DEFINER)';
    RAISE NOTICE '';

    RAISE NOTICE 'Security configured:';
    RAISE NOTICE '  - Admins: Can create, view, and delete tokens (3 policies)';
    RAISE NOTICE '  - Public: NO ACCESS (completely private table)';
    RAISE NOTICE '  - Token consumption: via SECURITY DEFINER function only';
    RAISE NOTICE '';

    RAISE NOTICE 'USAGE EXAMPLE:';
    RAISE NOTICE '  1. Admin creates token:';
    RAISE NOTICE '     INSERT INTO admin_registration_tokens (token, email, expires_at)';
    RAISE NOTICE '     VALUES (''secure-random-string'', ''user@example.com'', NOW() + INTERVAL ''7 days'');';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Registration flow validates token:';
    RAISE NOTICE '     SELECT validate_and_consume_admin_token(''token'', ''user@example.com'', user_id);';
    RAISE NOTICE '';
    RAISE NOTICE '  3. Periodic cleanup (optional):';
    RAISE NOTICE '     SELECT cleanup_expired_admin_tokens();';
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 014 to seed blog posts';
    RAISE NOTICE '  2. Implement token generation in admin UI';
    RAISE NOTICE '  3. Integrate validate_and_consume_admin_token() in registration flow';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 013 COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (commented)
-- =====================================================
--
-- To rollback this migration, run the following in order:
--
-- BEGIN;
--
-- -- Drop policies
-- DROP POLICY IF EXISTS admin_select_admin_registration_tokens ON public.admin_registration_tokens;
-- DROP POLICY IF EXISTS admin_insert_admin_registration_tokens ON public.admin_registration_tokens;
-- DROP POLICY IF EXISTS admin_delete_admin_registration_tokens ON public.admin_registration_tokens;
--
-- -- Drop helper functions
-- DROP FUNCTION IF EXISTS public.validate_and_consume_admin_token(TEXT, TEXT, UUID);
-- DROP FUNCTION IF EXISTS public.cleanup_expired_admin_tokens();
--
-- -- Drop indexes (cascade removes dependent objects)
-- DROP INDEX IF EXISTS public.idx_admin_registration_tokens_token CASCADE;
-- DROP INDEX IF EXISTS public.idx_admin_registration_tokens_expires_at CASCADE;
-- DROP INDEX IF EXISTS public.idx_admin_registration_tokens_valid CASCADE;
-- DROP INDEX IF EXISTS public.idx_admin_registration_tokens_used_by CASCADE;
--
-- -- Drop table (cascade removes dependent objects)
-- DROP TABLE IF EXISTS public.admin_registration_tokens CASCADE;
--
-- COMMIT;
--
-- =====================================================
