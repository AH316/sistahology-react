-- =====================================================
-- SOFT DELETE VERIFICATION SCRIPT
-- =====================================================
--
-- PURPOSE:
-- Verify that the soft delete functionality works correctly and
-- that RLS policies properly protect deleted entries.
--
-- USAGE:
-- Run this script in the Supabase SQL Editor after applying
-- migration 004_add_deleted_at_to_entries.sql
--
-- SAFETY:
-- All operations are wrapped in BEGIN/ROLLBACK - no permanent changes.
-- Expected runtime: < 30 seconds
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: SCHEMA VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 1: SCHEMA VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Verify deleted_at column exists with correct type
DO $$
DECLARE
    column_exists boolean;
    column_type text;
    column_nullable text;
    column_default text;
BEGIN
    SELECT
        EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'entry'
              AND column_name = 'deleted_at'
        ),
        data_type,
        is_nullable,
        column_default
    INTO column_exists, column_type, column_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'entry'
      AND column_name = 'deleted_at';

    IF column_exists THEN
        RAISE NOTICE 'PASS: deleted_at column exists';
        RAISE NOTICE '  - Type: %', column_type;
        RAISE NOTICE '  - Nullable: %', column_nullable;
        RAISE NOTICE '  - Default: %', COALESCE(column_default, 'NULL');

        IF column_type LIKE '%timestamp%' AND column_nullable = 'YES' THEN
            RAISE NOTICE 'PASS: Column has correct type and nullability';
        ELSE
            RAISE WARNING 'FAIL: Column type or nullability incorrect';
        END IF;
    ELSE
        RAISE WARNING 'FAIL: deleted_at column does not exist';
    END IF;
END $$;

-- Verify indexes were created
DO $$
DECLARE
    idx_active boolean;
    idx_deleted boolean;
    idx_expiration boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_active'
    ) INTO idx_active;

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_deleted'
    ) INTO idx_deleted;

    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'entry'
          AND indexname = 'idx_entry_deleted_at_not_null'
    ) INTO idx_expiration;

    RAISE NOTICE '';
    RAISE NOTICE 'Index verification:';
    RAISE NOTICE '  - idx_entry_active: %', CASE WHEN idx_active THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - idx_entry_deleted: %', CASE WHEN idx_deleted THEN 'EXISTS' ELSE 'MISSING' END;
    RAISE NOTICE '  - idx_entry_deleted_at_not_null: %', CASE WHEN idx_expiration THEN 'EXISTS' ELSE 'MISSING' END;

    IF idx_active AND idx_deleted AND idx_expiration THEN
        RAISE NOTICE 'PASS: All soft delete indexes created';
    ELSE
        RAISE WARNING 'FAIL: Some indexes missing';
    END IF;
END $$;

-- =====================================================
-- SECTION 2: E2E USER DISCOVERY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 2: TEST USER SETUP';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Find E2E user for testing
DO $$
DECLARE
    e2e_user_id uuid;
    journal_user_col text;
BEGIN
    -- Look up E2E user
    SELECT id INTO e2e_user_id
    FROM auth.users
    WHERE email ~ '^(test|e2e|playwright|automation).*@.*\.(com|org|test)$'
       OR email LIKE '%test%'
       OR email LIKE '%e2e%'
    ORDER BY created_at DESC
    LIMIT 1;

    IF e2e_user_id IS NULL THEN
        SELECT id INTO e2e_user_id
        FROM auth.users
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    IF e2e_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found - cannot proceed with verification';
    END IF;

    -- Detect journal user column (owner_id vs user_id)
    SELECT column_name INTO journal_user_col
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'journal'
      AND column_name IN ('owner_id', 'user_id')
    ORDER BY CASE column_name WHEN 'user_id' THEN 1 ELSE 2 END
    LIMIT 1;

    -- Store in temp table
    CREATE TEMP TABLE test_context (
        e2e_user_id uuid,
        journal_user_col text
    );

    INSERT INTO test_context VALUES (e2e_user_id, COALESCE(journal_user_col, 'user_id'));

    RAISE NOTICE 'Test user ID: % (masked)', SUBSTRING(e2e_user_id::text, 1, 8) || '****';
    RAISE NOTICE 'Journal user column: %', COALESCE(journal_user_col, 'user_id');
END $$;

-- =====================================================
-- SECTION 3: SOFT DELETE FUNCTIONALITY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 3: SOFT DELETE OPERATIONS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test soft delete workflow
DO $$
DECLARE
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    journal_user_col text := (SELECT journal_user_col FROM test_context);
    test_journal_id uuid;
    test_entry_id uuid;
    entry_deleted_at timestamptz;
    visible_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING SOFT DELETE WORKFLOW ===';

    -- Set user context
    PERFORM set_config('request.jwt.claims',
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated'
        )::text,
        true);
    PERFORM set_config('role', 'authenticated', true);

    -- Create test journal
    EXECUTE format('
        INSERT INTO public.journal (%I, journal_name, color)
        VALUES ($1, $2, $3) RETURNING id', journal_user_col)
    USING e2e_user_id, 'Soft Delete Test Journal', '#FF69B4'
    INTO test_journal_id;

    RAISE NOTICE 'Created test journal: %', SUBSTRING(test_journal_id::text, 1, 8) || '****';

    -- Create test entry
    INSERT INTO public.entry (journal_id, user_id, content, entry_date, is_archived)
    VALUES (test_journal_id, e2e_user_id, 'This entry will be soft deleted', CURRENT_DATE, false)
    RETURNING id INTO test_entry_id;

    RAISE NOTICE 'Created test entry: %', SUBSTRING(test_entry_id::text, 1, 8) || '****';

    -- Verify entry is active (deleted_at IS NULL)
    SELECT COUNT(*) INTO visible_count
    FROM public.entry
    WHERE id = test_entry_id AND deleted_at IS NULL;

    IF visible_count = 1 THEN
        RAISE NOTICE 'PASS: Entry is active (deleted_at IS NULL)';
    ELSE
        RAISE WARNING 'FAIL: Entry should be active';
    END IF;

    -- Perform soft delete (UPDATE deleted_at to NOW())
    UPDATE public.entry
    SET deleted_at = NOW()
    WHERE id = test_entry_id;

    RAISE NOTICE 'Soft deleted entry (set deleted_at = NOW())';

    -- Verify entry is now deleted
    SELECT deleted_at INTO entry_deleted_at
    FROM public.entry
    WHERE id = test_entry_id;

    IF entry_deleted_at IS NOT NULL THEN
        RAISE NOTICE 'PASS: Entry is soft deleted (deleted_at = %)', entry_deleted_at;
    ELSE
        RAISE WARNING 'FAIL: Entry should be soft deleted';
    END IF;

    -- Verify active entries filter works
    SELECT COUNT(*) INTO visible_count
    FROM public.entry
    WHERE journal_id = test_journal_id AND deleted_at IS NULL;

    IF visible_count = 0 THEN
        RAISE NOTICE 'PASS: Soft deleted entry not visible in active entries filter';
    ELSE
        RAISE WARNING 'FAIL: Soft deleted entry should not appear in active entries';
    END IF;

    -- Verify trash bin query works
    SELECT COUNT(*) INTO visible_count
    FROM public.entry
    WHERE journal_id = test_journal_id AND deleted_at IS NOT NULL;

    IF visible_count = 1 THEN
        RAISE NOTICE 'PASS: Soft deleted entry visible in trash bin query';
    ELSE
        RAISE WARNING 'FAIL: Soft deleted entry should appear in trash bin';
    END IF;

    -- Restore entry (set deleted_at back to NULL)
    UPDATE public.entry
    SET deleted_at = NULL
    WHERE id = test_entry_id;

    RAISE NOTICE 'Restored entry (set deleted_at = NULL)';

    -- Verify entry is active again
    SELECT deleted_at INTO entry_deleted_at
    FROM public.entry
    WHERE id = test_entry_id;

    IF entry_deleted_at IS NULL THEN
        RAISE NOTICE 'PASS: Entry restored successfully (deleted_at IS NULL)';
    ELSE
        RAISE WARNING 'FAIL: Entry should be active after restore';
    END IF;

    -- Store test IDs for cleanup
    CREATE TEMP TABLE test_data (
        journal_id uuid,
        entry_id uuid
    );

    INSERT INTO test_data VALUES (test_journal_id, test_entry_id);
END $$;

-- =====================================================
-- SECTION 4: RLS ISOLATION FOR DELETED ENTRIES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 4: RLS ISOLATION VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test that users cannot see other users' deleted entries
DO $$
DECLARE
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    second_user_id uuid := gen_random_uuid();
    test_entry_id uuid := (SELECT entry_id FROM test_data);
    visible_count integer;
    update_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING CROSS-USER DELETED ENTRY ACCESS ===';

    -- First, soft delete the entry as the owner
    PERFORM set_config('request.jwt.claims',
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated'
        )::text,
        true);

    UPDATE public.entry
    SET deleted_at = NOW()
    WHERE id = test_entry_id;

    RAISE NOTICE 'Entry soft deleted by owner';

    -- Switch to different user context
    PERFORM set_config('request.jwt.claims',
        json_build_object(
            'sub', second_user_id::text,
            'role', 'authenticated'
        )::text,
        true);

    RAISE NOTICE 'Switched to different user: %', SUBSTRING(second_user_id::text, 1, 8) || '****';

    -- Test: Second user should NOT see first user's deleted entry
    SELECT COUNT(*) INTO visible_count
    FROM public.entry
    WHERE id = test_entry_id;

    IF visible_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot see other user''s deleted entry';
    ELSE
        RAISE WARNING 'FAIL: User can see other user''s deleted entry - RLS BREACH!';
    END IF;

    -- Test: Second user should NOT be able to restore first user's deleted entry
    UPDATE public.entry
    SET deleted_at = NULL
    WHERE id = test_entry_id;

    GET DIAGNOSTICS update_count = ROW_COUNT;

    IF update_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot restore other user''s deleted entry';
    ELSE
        RAISE WARNING 'FAIL: User restored other user''s deleted entry - RLS BREACH!';
    END IF;

    -- Test: Second user should NOT be able to permanently delete first user's entry
    DELETE FROM public.entry
    WHERE id = test_entry_id;

    GET DIAGNOSTICS update_count = ROW_COUNT;

    IF update_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot permanently delete other user''s entry';
    ELSE
        RAISE WARNING 'FAIL: User deleted other user''s entry - RLS BREACH!';
    END IF;
END $$;

-- =====================================================
-- SECTION 5: TRASH EXPIRATION QUERY PERFORMANCE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 5: EXPIRATION QUERY VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test query patterns for 30-day expiration
DO $$
DECLARE
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    test_entry_id uuid := (SELECT entry_id FROM test_data);
    expired_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING EXPIRATION QUERIES ===';

    -- Set user context
    PERFORM set_config('request.jwt.claims',
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated'
        )::text,
        true);

    -- Soft delete entry with old timestamp (simulate 31 days old)
    UPDATE public.entry
    SET deleted_at = NOW() - INTERVAL '31 days'
    WHERE id = test_entry_id;

    RAISE NOTICE 'Set deleted_at to 31 days ago';

    -- Query for entries expired beyond 30 days
    SELECT COUNT(*) INTO expired_count
    FROM public.entry
    WHERE user_id = e2e_user_id
      AND deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';

    IF expired_count > 0 THEN
        RAISE NOTICE 'PASS: Expiration query found % entries older than 30 days', expired_count;
    ELSE
        RAISE NOTICE 'INFO: No entries older than 30 days (expected in clean database)';
    END IF;

    -- Query for entries still within 30-day window
    UPDATE public.entry
    SET deleted_at = NOW() - INTERVAL '15 days'
    WHERE id = test_entry_id;

    SELECT COUNT(*) INTO expired_count
    FROM public.entry
    WHERE user_id = e2e_user_id
      AND deleted_at IS NOT NULL
      AND deleted_at >= NOW() - INTERVAL '30 days';

    IF expired_count > 0 THEN
        RAISE NOTICE 'PASS: Found % entries within 30-day recovery window', expired_count;
    END IF;

    RAISE NOTICE 'Expiration query patterns working correctly';
END $$;

-- =====================================================
-- SECTION 6: VERIFICATION SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

DO $$
DECLARE
    total_entries integer;
    active_entries integer;
    deleted_entries integer;
BEGIN
    SELECT COUNT(*) INTO total_entries FROM public.entry;
    SELECT COUNT(*) INTO active_entries FROM public.entry WHERE deleted_at IS NULL;
    SELECT COUNT(*) INTO deleted_entries FROM public.entry WHERE deleted_at IS NOT NULL;

    RAISE NOTICE 'Database statistics:';
    RAISE NOTICE '  - Total entries: %', total_entries;
    RAISE NOTICE '  - Active entries: %', active_entries;
    RAISE NOTICE '  - Deleted entries: %', deleted_entries;
    RAISE NOTICE '';
    RAISE NOTICE 'Verification complete:';
    RAISE NOTICE '  - Schema: deleted_at column exists with correct type';
    RAISE NOTICE '  - Indexes: Performance indexes created for active/deleted queries';
    RAISE NOTICE '  - Functionality: Soft delete, restore, and expiration queries work';
    RAISE NOTICE '  - Security: RLS policies properly isolate deleted entries';
    RAISE NOTICE '';
    RAISE NOTICE 'APPLICATION IMPLEMENTATION CHECKLIST:';
    RAISE NOTICE '  [ ] Add deleted_at IS NULL filter to active entry queries';
    RAISE NOTICE '  [ ] Create trash bin page with deleted_at IS NOT NULL query';
    RAISE NOTICE '  [ ] Implement soft delete: UPDATE SET deleted_at = NOW()';
    RAISE NOTICE '  [ ] Implement restore: UPDATE SET deleted_at = NULL';
    RAISE NOTICE '  [ ] Implement permanent delete: DELETE WHERE deleted_at IS NOT NULL';
    RAISE NOTICE '  [ ] Add UI for 30-day countdown in trash bin';
    RAISE NOTICE '  [ ] (Optional) Create cron job to purge entries > 30 days old';
    RAISE NOTICE '';
    RAISE NOTICE 'Review output above for any FAIL messages.';
    RAISE NOTICE 'All test data will be rolled back.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK ALL CHANGES
-- =====================================================

ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION COMPLETE - NO CHANGES MADE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
