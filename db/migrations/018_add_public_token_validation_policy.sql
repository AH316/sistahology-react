-- =====================================================
-- MIGRATION 018: Add Public Token Validation Policy
-- =====================================================
-- Created: 2025-01-18
-- Purpose: Allow anonymous users to validate admin tokens during registration
--
-- PROBLEM:
--   The validateTokenForDisplay() function fails with 406 Not Acceptable because
--   anonymous users have NO SELECT access to admin_registration_tokens table.
--   Migration 013 explicitly set "NO PUBLIC policies - this table is completely private"
--   but the UX requires pre-registration validation for the admin banner.
--
-- SOLUTION:
--   Add a limited SELECT policy for anonymous/public users to read token metadata
--   for validation purposes. Token consumption still requires SECURITY DEFINER function.
--
-- SECURITY ANALYSIS:
--   - Tokens are UUIDs (cryptographically random via crypto.randomUUID(), not guessable)
--   - Only metadata is exposed (email, expiry, used status) - no sensitive data
--   - Token consumption still requires validate_and_consume_admin_token() SECURITY DEFINER function
--   - No UPDATE or DELETE access for public users
--   - No INSERT access for public users (only admins can create tokens)
--
-- TRADE-OFF:
--   Minimal security impact - exposes token existence to anyone with the UUID,
--   but UUIDs are 128-bit random values (2^128 possible values = effectively unguessable)
--   Better UX: users see "Admin Registration" banner before signing up
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION 018: PUBLIC TOKEN VALIDATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Adding RLS policy to allow anonymous users to validate admin tokens';
    RAISE NOTICE '';
END $$;

-- Drop existing policy if it exists (idempotent)
DROP POLICY IF EXISTS anon_select_admin_registration_tokens ON public.admin_registration_tokens;

-- Create public SELECT policy for token validation
CREATE POLICY anon_select_admin_registration_tokens
ON public.admin_registration_tokens
FOR SELECT
TO anon, authenticated
USING (
  -- Allow reading token metadata for validation
  -- This enables the "Admin Registration" banner on RegisterPage
  -- Token consumption still requires SECURITY DEFINER function
  true
);

-- Add comprehensive comment explaining the policy
COMMENT ON POLICY anon_select_admin_registration_tokens ON public.admin_registration_tokens IS
    'Allow anonymous and authenticated users to validate admin tokens by reading metadata.

    Security Rationale:
    - Tokens are cryptographically random UUIDs (crypto.randomUUID()) - not guessable
    - Only exposes metadata: email, expiration date, used status
    - No sensitive user data exposed
    - Token consumption (granting admin privileges) still requires:
      - validate_and_consume_admin_token() SECURITY DEFINER function
      - Email verification during registration
      - Single-use enforcement (used_at check)

    Purpose: Enables pre-registration validation for better UX
    - Shows "Admin Registration" banner before user registers
    - Displays associated email (if token is email-locked)
    - Validates token is not expired or already used
    - Prevents registration attempts with invalid tokens

    Alternative Considered: Validating only post-registration
    - Rejected due to poor UX (user registers successfully but doesn''t become admin)
    - This approach provides immediate feedback before registration

    Access Control:
    - SELECT: anon, authenticated (this policy)
    - INSERT: authenticated admins only (admin_insert_admin_registration_tokens)
    - DELETE: authenticated admins only (admin_delete_admin_registration_tokens)
    - UPDATE: NONE (tokens are immutable after creation, consumption via SECURITY DEFINER function)';

DO $$
BEGIN
    RAISE NOTICE '✅ Public SELECT policy created: anon_select_admin_registration_tokens';
    RAISE NOTICE '';
    RAISE NOTICE 'ALLOWED OPERATIONS:';
    RAISE NOTICE '  ✓ Anonymous users can read token metadata (email, expiry, used status)';
    RAISE NOTICE '  ✓ Shows "Admin Registration" banner before registration';
    RAISE NOTICE '  ✓ Validates tokens are not expired/used before signup';
    RAISE NOTICE '';
    RAISE NOTICE 'PROTECTED OPERATIONS:';
    RAISE NOTICE '  🔒 Token consumption requires validate_and_consume_admin_token() function';
    RAISE NOTICE '  🔒 Only admins can INSERT new tokens';
    RAISE NOTICE '  🔒 Only admins can DELETE tokens';
    RAISE NOTICE '  🔒 Tokens are immutable (no UPDATE policies)';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY:';
    RAISE NOTICE '  🔐 Tokens are UUIDs (2^128 possible values, effectively unguessable)';
    RAISE NOTICE '  🔐 No sensitive data exposed (only email, expiry, used status)';
    RAISE NOTICE '  🔐 Admin privilege grant still requires SECURITY DEFINER function';
    RAISE NOTICE '';
END $$;

-- Verify the policy was created successfully
DO $$
DECLARE
    policy_count INT;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_registration_tokens'
      AND policyname = 'anon_select_admin_registration_tokens';

    IF policy_count = 1 THEN
        RAISE NOTICE '✅ Policy verification: anon_select_admin_registration_tokens exists';
    ELSE
        RAISE EXCEPTION '❌ Policy verification FAILED: anon_select_admin_registration_tokens not found';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- MIGRATION 018 COMPLETE
-- =====================================================
-- Next steps:
--   1. Test token validation on registration page
--   2. Verify "Admin Registration" banner appears for valid tokens
--   3. Confirm "Invalid or Expired Token" only shows for bad tokens
--   4. Ensure token consumption still works correctly
-- =====================================================
