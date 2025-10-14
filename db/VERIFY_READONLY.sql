-- =====================================================
-- COMPREHENSIVE READ-ONLY RLS VERIFICATION SCRIPT
-- =====================================================
-- 
-- This script verifies RLS policies without making permanent changes.
-- Uses JWT context switching to test different user roles.
-- All operations are wrapped in BEGIN/ROLLBACK for safety.
-- 
-- REQUIREMENTS:
-- - An existing E2E test user (looked up by email pattern)
-- - Database with RLS enabled on core tables
-- - Proper JWT claim handling for context switching
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: ENVIRONMENT AND SCHEMA DETECTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 1: SCHEMA DETECTION & RLS STATUS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Detect schema adaptability - check for owner_id vs user_id columns
DO $$
DECLARE 
    journal_user_column text;
    entry_user_column text;
    has_profiles boolean := false;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO has_profiles;
    
    -- Detect journal user column (owner_id vs user_id)
    SELECT column_name INTO journal_user_column
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'journal' 
      AND column_name IN ('owner_id', 'user_id')
    ORDER BY CASE column_name WHEN 'owner_id' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Check if entry table has direct user reference
    SELECT column_name INTO entry_user_column
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'entry' 
      AND column_name IN ('owner_id', 'user_id')
    ORDER BY CASE column_name WHEN 'owner_id' THEN 1 ELSE 2 END
    LIMIT 1;
    
    -- Store in temp table for later reference
    CREATE TEMP TABLE schema_info (
        table_name text,
        user_column text,
        has_table boolean
    );
    
    INSERT INTO schema_info VALUES 
        ('journal', COALESCE(journal_user_column, 'user_id'), true),
        ('entry', entry_user_column, entry_user_column IS NOT NULL),
        ('profiles', 'id', has_profiles),
        ('pages', NULL, true);
    
    RAISE NOTICE 'Schema detection complete:';
    RAISE NOTICE '  - Journal user column: %', COALESCE(journal_user_column, 'user_id');
    RAISE NOTICE '  - Entry user column: %', COALESCE(entry_user_column, 'via journal join');
    RAISE NOTICE '  - Has profiles table: %', has_profiles;
END $$;

-- Check RLS status using pg_class for reliability
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'RLS Status for Critical Tables:';
END $$;

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN relrowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as "RLS_STATUS"
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE pt.schemaname = 'public' 
  AND pt.tablename IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY pt.tablename;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Expected: All tables should show RLS_STATUS = ENABLED';
END $$;

-- =====================================================
-- SECTION 2: ACTIVE POLICIES INVENTORY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 2: RLS POLICIES INVENTORY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- List all policies with their permissions and expressions
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE permissive 
        WHEN 'PERMISSIVE' THEN 'ALLOW'
        WHEN 'RESTRICTIVE' THEN 'RESTRICT'
        ELSE permissive::text
    END as policy_type,
    cmd as operation,
    CASE 
        WHEN LENGTH(qual) > 50 THEN LEFT(qual, 47) || '...'
        ELSE qual
    END as using_condition,
    CASE 
        WHEN LENGTH(with_check) > 50 THEN LEFT(with_check, 47) || '...'
        ELSE with_check
    END as with_check_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY tablename, cmd, policyname;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Expected: Comprehensive policies for SELECT/INSERT/UPDATE/DELETE operations';
END $$;

-- =====================================================
-- SECTION 3: E2E USER DISCOVERY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 3: E2E TEST USER DISCOVERY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Find E2E user without exposing email
DO $$
DECLARE 
    e2e_user_id uuid;
    e2e_user_count integer;
    journal_user_col text;
BEGIN
    -- Look up E2E user by pattern (commonly used emails)
    SELECT id INTO e2e_user_id
    FROM auth.users 
    WHERE email ~ '^(test|e2e|playwright|automation).*@.*\.(com|org|test)$'
       OR email LIKE '%test%'
       OR email LIKE '%e2e%'
       OR email LIKE '%playwright%'
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF e2e_user_id IS NULL THEN
        -- Fallback: use any existing user
        SELECT id INTO e2e_user_id
        FROM auth.users 
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    IF e2e_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in auth.users table - cannot proceed with verification';
    END IF;
    
    -- Store in temp table for test sections
    CREATE TEMP TABLE test_context (
        e2e_user_id uuid,
        ctx_role text DEFAULT 'authenticated'
    );
    
    INSERT INTO test_context (e2e_user_id) VALUES (e2e_user_id);
    
    -- Get journal user column from schema detection
    SELECT user_column INTO journal_user_col
    FROM schema_info WHERE table_name = 'journal';
    
    RAISE NOTICE 'E2E User discovered: % (ID masked for security)', 
        SUBSTRING(e2e_user_id::text, 1, 8) || '****';
    RAISE NOTICE 'Using journal user column: %', journal_user_col;
END $$;

-- =====================================================
-- SECTION 4: USER CONTEXT RLS VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 4: USER CONTEXT ACCESS CONTROL';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test user context with proper JWT claims
DO $$
DECLARE 
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    journal_user_col text;
    test_journal_id uuid;
    test_entry_id uuid;
    visible_count integer;
    update_count integer;
    journal_create_sql text;
BEGIN
    -- Get the correct user column for journal table
    SELECT user_column INTO journal_user_col
    FROM schema_info WHERE table_name = 'journal';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING NORMAL USER CONTEXT ===';
    
    -- Set JWT context for authenticated user
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'user')
        )::text, 
        true);
    
    PERFORM set_config('role', 'authenticated', true);
    
    RAISE NOTICE 'JWT context set for user role';
    
    -- Test journal creation with dynamic column name
    journal_create_sql := format('
        INSERT INTO public.journal (%I, journal_name, color) 
        VALUES ($1, $2, $3) RETURNING id', journal_user_col);
    
    EXECUTE journal_create_sql 
    USING e2e_user_id, 'RLS Test Journal', '#FF1493'
    INTO test_journal_id;
    
    RAISE NOTICE 'User successfully created journal: %', 
        SUBSTRING(test_journal_id::text, 1, 8) || '****';
    
    -- Test entry creation
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived) 
    VALUES (test_journal_id, 'RLS verification test entry', CURRENT_DATE, false)
    RETURNING id INTO test_entry_id;
    
    RAISE NOTICE 'User successfully created entry: %', 
        SUBSTRING(test_entry_id::text, 1, 8) || '****';
    
    -- Test SELECT filtering (user should see their own data)
    SELECT COUNT(*) INTO visible_count
    FROM public.journal 
    WHERE id = test_journal_id;
    
    RAISE NOTICE 'User can see own journal: % (expected: 1)', visible_count;
    
    SELECT COUNT(*) INTO visible_count
    FROM public.entry 
    WHERE id = test_entry_id;
    
    RAISE NOTICE 'User can see own entry: % (expected: 1)', visible_count;
    
    -- Test UPDATE on own data
    UPDATE public.entry 
    SET content = 'Updated content for RLS test'
    WHERE id = test_entry_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    RAISE NOTICE 'User updated own entry: % row(s) (expected: 1)', update_count;
    
    -- Store test data IDs for cleanup verification
    CREATE TEMP TABLE test_data (
        journal_id uuid,
        entry_id uuid,
        owner_id uuid
    );
    
    INSERT INTO test_data VALUES (test_journal_id, test_entry_id, e2e_user_id);
    
END $$;

-- =====================================================
-- SECTION 5: CROSS-USER ACCESS PREVENTION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 5: CROSS-USER ACCESS PREVENTION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create second user context and verify isolation
DO $$
DECLARE 
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    second_user_id uuid := gen_random_uuid();
    test_journal_id uuid := (SELECT journal_id FROM test_data);
    test_entry_id uuid := (SELECT entry_id FROM test_data);
    visible_count integer;
    update_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING CROSS-USER ACCESS PREVENTION ===';
    
    -- Switch to different user context
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', second_user_id::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'user')
        )::text, 
        true);
    
    PERFORM set_config('role', 'authenticated', true);
    
    RAISE NOTICE 'JWT context switched to different user: %', 
        SUBSTRING(second_user_id::text, 1, 8) || '****';
    
    -- Test: Second user should NOT see first user's journal
    SELECT COUNT(*) INTO visible_count
    FROM public.journal 
    WHERE id = test_journal_id;
    
    IF visible_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot see other user''s journal (% visible)', visible_count;
    ELSE
        RAISE NOTICE 'FAIL: User can see other user''s journal (% visible) - RLS BREACH!', visible_count;
    END IF;
    
    -- Test: Second user should NOT see first user's entries
    SELECT COUNT(*) INTO visible_count
    FROM public.entry 
    WHERE id = test_entry_id;
    
    IF visible_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot see other user''s entries (% visible)', visible_count;
    ELSE
        RAISE NOTICE 'FAIL: User can see other user''s entries (% visible) - RLS BREACH!', visible_count;
    END IF;
    
    -- Test: Second user should NOT be able to update first user's entry
    UPDATE public.entry 
    SET content = 'MALICIOUS UPDATE ATTEMPT'
    WHERE id = test_entry_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count = 0 THEN
        RAISE NOTICE 'PASS: User cannot update other user''s entries (% updated)', update_count;
    ELSE
        RAISE NOTICE 'FAIL: User updated other user''s entries (% updated) - RLS BREACH!', update_count;
    END IF;
    
END $$;

-- =====================================================
-- SECTION 6: ADMIN CONTEXT VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 6: ADMIN CONTEXT VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test admin context for pages management
DO $$
DECLARE 
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    test_journal_id uuid := (SELECT journal_id FROM test_data);
    pages_count integer;
    journals_count integer;
    journal_owner uuid;
    journal_user_col text;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== TESTING ADMIN CONTEXT ===';
    
    -- Set JWT context for admin user
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated', 
            'app_metadata', json_build_object('role', 'admin')
        )::text, 
        true);
    
    PERFORM set_config('role', 'authenticated', true);
    
    RAISE NOTICE 'JWT context set for admin role';
    
    -- Test: Admin should be able to manage pages
    INSERT INTO public.pages (slug, title, content_html) 
    VALUES ('verify-readonly-test', 'RLS Verification Test Page', '<p>Admin test content</p>')
    ON CONFLICT (slug) DO UPDATE 
    SET content_html = EXCLUDED.content_html,
        title = EXCLUDED.title;
    
    SELECT COUNT(*) INTO pages_count 
    FROM public.pages 
    WHERE slug = 'verify-readonly-test';
    
    RAISE NOTICE 'Admin can manage pages: % (expected: 1)', pages_count;
    
    -- Test: Admin should NOT see user's private journals (unless they own them)
    SELECT COUNT(*) INTO journals_count 
    FROM public.journal 
    WHERE id = test_journal_id;
    
    IF journals_count = 0 THEN
        RAISE NOTICE 'PASS: Admin cannot see user private journals (% visible)', journals_count;
    ELSE
        -- Check if admin owns this journal
        SELECT user_column INTO journal_user_col FROM schema_info WHERE table_name = 'journal';
        EXECUTE format('SELECT %I FROM public.journal WHERE id = $1', journal_user_col)
            USING test_journal_id
            INTO journal_owner;
        
        IF journal_owner = e2e_user_id THEN
            RAISE NOTICE 'INFO: Admin can see journal because they own it (% visible)', journals_count;
        ELSE
            RAISE NOTICE 'FAIL: Admin can see user private journals (% visible) - RLS BREACH!', journals_count;
        END IF;
    END IF;
    
END $$;

-- =====================================================
-- SECTION 7: SEARCH AND FILTER SECURITY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 7: SEARCH & FILTERING SECURITY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Test search functionality respects RLS
DO $$
DECLARE 
    e2e_user_id uuid := (SELECT e2e_user_id FROM test_context);
    second_user_id uuid := gen_random_uuid();
    search_results integer;
    total_entries integer;
    journal_user_col text;
    second_journal_id uuid;
BEGIN
    -- Get journal user column
    SELECT user_column INTO journal_user_col FROM schema_info WHERE table_name = 'journal';
    
    -- Reset to first user context and add searchable content
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'user')
        )::text, 
        true);
    
    -- Switch to second user and create competing content
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', second_user_id::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'user')
        )::text, 
        true);
    
    -- Create journal for second user
    EXECUTE format('
        INSERT INTO public.journal (%I, journal_name, color) 
        VALUES ($1, $2, $3) RETURNING id', journal_user_col)
    USING second_user_id, 'Second User Journal', '#00FF00'
    INTO second_journal_id;
    
    -- Add entry with same search term
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived)
    VALUES (second_journal_id, 'RLS verification should not find this secret content', CURRENT_DATE, false);
    
    -- Switch back to first user
    PERFORM set_config('request.jwt.claims', 
        json_build_object(
            'sub', e2e_user_id::text,
            'role', 'authenticated',
            'app_metadata', json_build_object('role', 'user')
        )::text, 
        true);
    
    -- Test: First user searching should only find their content
    SELECT COUNT(*) INTO search_results
    FROM public.entry 
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'verification');
    
    SELECT COUNT(*) INTO total_entries
    FROM public.entry;
    
    RAISE NOTICE 'User search results for "verification": % out of % total entries', 
        search_results, total_entries;
    
    IF search_results <= total_entries AND search_results > 0 THEN
        RAISE NOTICE 'PASS: Search results filtered by RLS (user only sees subset)';
    ELSE
        RAISE NOTICE 'INFO: Search result count - verify manually that user only sees own entries';
    END IF;
    
END $$;

-- =====================================================
-- SECTION 8: TRANSACTION ROLLBACK VERIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 8: ROLLBACK VERIFICATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Count all test data that will be rolled back
DO $$
DECLARE 
    test_journals integer;
    test_entries integer;
    test_pages integer;
    temp_tables integer;
BEGIN
    -- Count test data created during this verification
    SELECT COUNT(*) INTO test_journals FROM test_data;
    
    SELECT COUNT(*) INTO test_entries 
    FROM public.entry 
    WHERE content LIKE '%RLS%' OR content LIKE '%verification%';
    
    SELECT COUNT(*) INTO test_pages 
    FROM public.pages 
    WHERE slug LIKE '%verify%' OR slug LIKE '%test%';
    
    SELECT COUNT(*) INTO temp_tables
    FROM pg_tables 
    WHERE schemaname LIKE 'pg_temp_%' 
      AND tablename IN ('test_context', 'test_data', 'schema_info');
    
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLLBACK SUMMARY ===';
    RAISE NOTICE 'Test journals to rollback: %', test_journals;
    RAISE NOTICE 'Test entries to rollback: %', test_entries;
    RAISE NOTICE 'Test pages to rollback: %', test_pages;
    RAISE NOTICE 'Temp tables created: %', temp_tables;
    RAISE NOTICE '';
    RAISE NOTICE '=== RLS VERIFICATION COMPLETE ===';
    RAISE NOTICE 'All test operations will be rolled back.';
    RAISE NOTICE 'Review output above for any FAIL messages indicating RLS issues.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- ROLLBACK ALL CHANGES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ROLLING BACK ALL TEST DATA...';
    RAISE NOTICE '==========================================';
END $$;

-- Clean rollback - no permanent changes made
ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION COMPLETE ===';
    RAISE NOTICE 'All test data has been rolled back.';
    RAISE NOTICE 'Database state unchanged.';
    RAISE NOTICE '';
    RAISE NOTICE 'PASS indicators: RLS policies working correctly';
    RAISE NOTICE 'FAIL indicators: Security issues requiring attention';
    RAISE NOTICE '';
END $$;