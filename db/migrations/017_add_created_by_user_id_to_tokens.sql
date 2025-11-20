-- =====================================================
-- MIGRATION 017: Add created_by_user_id to admin_registration_tokens
-- =====================================================
-- Created: 2025-01-18
-- Purpose: Fix token creation failure by adding missing audit column
--
-- PROBLEM:
--   The admin_registration_tokens table was missing the created_by_user_id
--   column that the application code expects. This caused token creation
--   to fail with "column does not exist" error.
--
-- SOLUTION:
--   Add the missing column with:
--   - Foreign key reference to auth.users(id)
--   - NULL allowed for existing rows (safe, non-destructive)
--   - Audit trail tracking which admin created each token
--
-- SAFETY:
--   This migration is safe and non-destructive:
--   - Existing tokens remain valid
--   - No data loss
--   - Allows NULL for backward compatibility
-- =====================================================

BEGIN;

-- Add the missing created_by_user_id column
ALTER TABLE public.admin_registration_tokens
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES auth.users(id);

-- Add comment explaining the audit purpose
COMMENT ON COLUMN public.admin_registration_tokens.created_by_user_id IS
    'Foreign key to auth.users - tracks which admin created this token for audit trail';

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'admin_registration_tokens'
          AND column_name = 'created_by_user_id'
    ) THEN
        RAISE NOTICE '✅ Column created_by_user_id added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add created_by_user_id column';
    END IF;
END $$;

COMMIT;

-- =====================================================
-- MIGRATION 017 COMPLETE
-- =====================================================
-- Next steps:
--   1. Test token creation via admin UI
--   2. Verify audit trail in database
--   3. Check that existing tokens still work
-- =====================================================
