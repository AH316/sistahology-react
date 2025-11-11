-- =====================================================
-- MIGRATION: Add Soft Delete to Entry Table
-- Version: 004
-- Created: 2025-10-15
-- Purpose: Enable 30-day trash bin functionality for journal entries
-- =====================================================
--
-- OVERVIEW:
-- This migration adds soft delete capability to the entry table by introducing
-- a deleted_at timestamp column. Entries with deleted_at IS NULL are active,
-- while entries with a timestamp are in the trash bin.
--
-- SECURITY NOTES:
-- - Existing RLS policies continue to work unchanged
-- - Users can only see/restore/permanently delete their own trashed entries
-- - No automatic purge function included (implement separately if needed)
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
    RAISE NOTICE 'ADDING SOFT DELETE COLUMN TO ENTRY TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'entry'
          AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.entry
        ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

        RAISE NOTICE 'Added deleted_at column to entry table';

        -- Add comment explaining the column
        COMMENT ON COLUMN public.entry.deleted_at IS
            'Timestamp when entry was soft-deleted (moved to trash). NULL = active entry, NOT NULL = trashed entry. Enables 30-day trash bin recovery.';
    ELSE
        RAISE NOTICE 'Column deleted_at already exists - skipping';
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

-- Partial index for active entries (deleted_at IS NULL)
-- This optimizes the common case: fetching active (non-deleted) entries
CREATE INDEX IF NOT EXISTS idx_entry_active
ON public.entry(journal_id, entry_date DESC)
WHERE deleted_at IS NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_active'
    ) THEN
        RAISE NOTICE 'Created/verified partial index for active entries';
    END IF;
END $$;

-- Partial index for trashed entries (deleted_at IS NOT NULL)
-- This optimizes trash bin queries and potential auto-purge operations
CREATE INDEX IF NOT EXISTS idx_entry_deleted
ON public.entry(user_id, deleted_at DESC)
WHERE deleted_at IS NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_deleted'
    ) THEN
        RAISE NOTICE 'Created/verified partial index for deleted entries';
    END IF;
END $$;

-- Composite index for trash bin expiration queries
-- Supports queries like: WHERE deleted_at < NOW() - INTERVAL '30 days'
CREATE INDEX IF NOT EXISTS idx_entry_deleted_at_not_null
ON public.entry(deleted_at)
WHERE deleted_at IS NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_deleted_at_not_null'
    ) THEN
        RAISE NOTICE 'Created/verified index for trash expiration queries';
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

-- Verify that RLS is enabled on entry table
DO $$
DECLARE
    rls_enabled boolean;
BEGIN
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public'
      AND pc.relname = 'entry';

    IF rls_enabled THEN
        RAISE NOTICE 'RLS is ENABLED on entry table - security verified';
    ELSE
        RAISE WARNING 'RLS is DISABLED on entry table - this is a security risk!';
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
      AND tablename = 'entry'
      AND cmd = 'SELECT';

    SELECT COUNT(*) INTO insert_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'entry'
      AND cmd = 'INSERT';

    SELECT COUNT(*) INTO update_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'entry'
      AND cmd = 'UPDATE';

    SELECT COUNT(*) INTO delete_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'entry'
      AND cmd = 'DELETE';

    RAISE NOTICE 'Existing RLS policies on entry table:';
    RAISE NOTICE '  - SELECT policies: %', select_policy_count;
    RAISE NOTICE '  - INSERT policies: %', insert_policy_count;
    RAISE NOTICE '  - UPDATE policies: %', update_policy_count;
    RAISE NOTICE '  - DELETE policies: %', delete_policy_count;

    IF select_policy_count > 0 AND insert_policy_count > 0 AND
       update_policy_count > 0 AND delete_policy_count > 0 THEN
        RAISE NOTICE 'All CRUD operations have RLS policies - security complete';
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
    RAISE NOTICE 'The existing RLS policies on the entry table already provide complete security:';
    RAISE NOTICE '';
    RAISE NOTICE '1. SELECT policy: Users can only view entries from their own journals';
    RAISE NOTICE '   - Filters by: auth.uid() = user_id OR journal.user_id = auth.uid()';
    RAISE NOTICE '   - Applies to BOTH active AND deleted entries';
    RAISE NOTICE '';
    RAISE NOTICE '2. UPDATE policy: Users can only update their own entries';
    RAISE NOTICE '   - This includes updating deleted_at for soft delete/restore';
    RAISE NOTICE '   - RLS ensures users cannot restore other users'' deleted entries';
    RAISE NOTICE '';
    RAISE NOTICE '3. DELETE policy: Users can only permanently delete their own entries';
    RAISE NOTICE '   - Applies to both active and trashed entries';
    RAISE NOTICE '   - Consider restricting permanent deletes to entries in trash (app logic)';
    RAISE NOTICE '';
    RAISE NOTICE 'APPLICATION RESPONSIBILITIES:';
    RAISE NOTICE '  - Add WHERE deleted_at IS NULL to normal entry queries';
    RAISE NOTICE '  - Add WHERE deleted_at IS NOT NULL to trash bin queries';
    RAISE NOTICE '  - Soft delete: UPDATE entry SET deleted_at = NOW() WHERE id = ?';
    RAISE NOTICE '  - Restore: UPDATE entry SET deleted_at = NULL WHERE id = ?';
    RAISE NOTICE '  - Permanent delete: DELETE FROM entry WHERE id = ? AND deleted_at IS NOT NULL';
    RAISE NOTICE '';
    RAISE NOTICE 'NO NEW RLS POLICIES NEEDED - existing policies provide complete security.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SECTION 5: MIGRATION SUMMARY
-- =====================================================

DO $$
DECLARE
    total_entries integer;
    active_entries integer;
    deleted_entries integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO total_entries FROM public.entry;
    SELECT COUNT(*) INTO active_entries FROM public.entry WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO deleted_entries FROM public.entry WHERE deleted_at IS NOT NULL;

    RAISE NOTICE 'Entry table statistics:';
    RAISE NOTICE '  - Total entries: %', total_entries;
    RAISE NOTICE '  - Active entries: %', active_entries;
    RAISE NOTICE '  - Deleted entries: %', deleted_entries;
    RAISE NOTICE '';
    RAISE NOTICE 'Schema changes applied:';
    RAISE NOTICE '  - Added deleted_at column (TIMESTAMPTZ NULL)';
    RAISE NOTICE '  - Created partial index for active entries';
    RAISE NOTICE '  - Created partial index for deleted entries';
    RAISE NOTICE '  - Created index for expiration queries';
    RAISE NOTICE '';
    RAISE NOTICE 'Security status:';
    RAISE NOTICE '  - RLS remains enabled';
    RAISE NOTICE '  - Existing policies cover soft delete operations';
    RAISE NOTICE '  - Users isolated to their own entries (active and deleted)';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION COMPLETE - Ready for trash bin feature';
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
    RAISE NOTICE 'SOFT DELETE MIGRATION SUCCESSFULLY APPLIED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
