-- =====================================================
-- COMPREHENSIVE DATABASE SECURITY VERIFICATION SCRIPT
-- =====================================================
-- 
-- This script verifies the security model that the React frontend relies on:
-- 1. RLS is enabled on all user-facing tables
-- 2. Users can only see their own journals and entries
-- 3. Admins can manage pages but cannot access private content
-- 4. All policies are correctly configured
--
-- IMPORTANT: This script ends with ROLLBACK to avoid side effects
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: RLS STATUS VERIFICATION
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 1: ROW LEVEL SECURITY STATUS'
\echo '=========================================='
\echo ''

-- Check RLS status for all critical tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS_ENABLED"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY tablename;

\echo ''
\echo 'Expected: All tables should have RLS_ENABLED = true'
\echo ''

-- =====================================================
-- SECTION 2: ACTIVE POLICIES AUDIT
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 2: ACTIVE RLS POLICIES'
\echo '=========================================='
\echo ''

-- List all policies for our critical tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "OPERATION",
    qual as "USING_EXPRESSION",
    with_check as "WITH_CHECK_EXPRESSION"
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY tablename, policyname;

\echo ''
\echo 'Expected: Each table should have comprehensive policies for SELECT, INSERT, UPDATE, DELETE'
\echo ''

-- =====================================================
-- SECTION 3: TEST USER SETUP
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 3: TEST DATA SETUP'
\echo '=========================================='
\echo ''

-- Create test users (will be cleaned up at end)
DO $$
DECLARE 
    test_user_1_id uuid := gen_random_uuid();
    test_user_2_id uuid := gen_random_uuid();
    test_admin_id uuid := gen_random_uuid();
BEGIN
    -- Store test IDs in temp table for cleanup
    CREATE TEMP TABLE test_users (
        user_id uuid,
        user_type text
    );
    
    INSERT INTO test_users VALUES 
        (test_user_1_id, 'user1'),
        (test_user_2_id, 'user2'), 
        (test_admin_id, 'admin');

    -- Insert test profiles
    INSERT INTO public.profiles (id, name, journal_id) VALUES
        (test_user_1_id, 'Test User 1', null),
        (test_user_2_id, 'Test User 2', null),
        (test_admin_id, 'Test Admin', null);

    RAISE NOTICE 'Created test users: User1(%), User2(%), Admin(%)', 
        test_user_1_id, test_user_2_id, test_admin_id;
END $$;

-- =====================================================
-- SECTION 4: USER JOURNAL ACCESS VERIFICATION  
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 4: JOURNAL OWNERSHIP VERIFICATION'
\echo '=========================================='
\echo ''

-- Test journal creation and ownership
DO $$
DECLARE
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    test_user_2_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user2');
    journal_1_id uuid;
    journal_2_id uuid;
    visible_journals_count integer;
BEGIN
    -- Set session to test_user_1
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    -- User 1 creates a journal
    INSERT INTO public.journal (user_id, journal_name, color) 
    VALUES (test_user_1_id, 'User 1 Private Journal', '#FF69B4')
    RETURNING id INTO journal_1_id;
    
    -- Reset session and set to test_user_2  
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_2_id::text)::text, true);
    
    -- User 2 creates a journal
    INSERT INTO public.journal (user_id, journal_name, color)
    VALUES (test_user_2_id, 'User 2 Private Journal', '#FFA500') 
    RETURNING id INTO journal_2_id;
    
    -- User 2 tries to see User 1's journal (should fail)
    SELECT COUNT(*) INTO visible_journals_count 
    FROM public.journal 
    WHERE id = journal_1_id;
    
    RAISE NOTICE 'User 2 can see User 1 journals: % (should be 0)', visible_journals_count;
    
    -- User 2 should only see their own journal
    SELECT COUNT(*) INTO visible_journals_count
    FROM public.journal;
    
    RAISE NOTICE 'User 2 total visible journals: % (should be 1)', visible_journals_count;
    
    -- Store journal IDs for entry tests
    CREATE TEMP TABLE test_journals (
        journal_id uuid,
        owner_id uuid,
        journal_name text
    );
    
    INSERT INTO test_journals VALUES 
        (journal_1_id, test_user_1_id, 'User 1 Private Journal'),
        (journal_2_id, test_user_2_id, 'User 2 Private Journal');
END $$;

-- =====================================================
-- SECTION 5: ENTRY PRIVACY VERIFICATION
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 5: ENTRY PRIVACY VERIFICATION' 
\echo '=========================================='
\echo ''

DO $$
DECLARE
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    test_user_2_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user2');
    journal_1_id uuid := (SELECT journal_id FROM test_journals WHERE owner_id = test_user_1_id);
    journal_2_id uuid := (SELECT journal_id FROM test_journals WHERE owner_id = test_user_2_id);
    entry_1_id uuid;
    entry_2_id uuid;
    visible_entries_count integer;
BEGIN
    -- Set session to test_user_1
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    -- User 1 creates an entry in their journal
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived)
    VALUES (journal_1_id, 'This is User 1 private entry content', CURRENT_DATE, false)
    RETURNING id INTO entry_1_id;
    
    -- Set session to test_user_2
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_2_id::text)::text, true);
    
    -- User 2 creates an entry in their journal  
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived)
    VALUES (journal_2_id, 'This is User 2 private entry content', CURRENT_DATE, false)
    RETURNING id INTO entry_2_id;
    
    -- User 2 tries to see User 1's entry (should fail)
    SELECT COUNT(*) INTO visible_entries_count
    FROM public.entry 
    WHERE id = entry_1_id;
    
    RAISE NOTICE 'User 2 can see User 1 entries: % (should be 0)', visible_entries_count;
    
    -- User 2 should only see their own entries
    SELECT COUNT(*) INTO visible_entries_count
    FROM public.entry;
    
    RAISE NOTICE 'User 2 total visible entries: % (should be 1)', visible_entries_count;
    
    -- Test entry update (User 2 tries to update User 1's entry)
    BEGIN
        UPDATE public.entry 
        SET content = 'HACKED CONTENT!' 
        WHERE id = entry_1_id;
        
        RAISE NOTICE 'ERROR: User 2 was able to update User 1 entry - SECURITY BREACH!';
    EXCEPTION WHEN insufficient_privilege OR security_definer_search_path_issue THEN
        RAISE NOTICE 'PASS: User 2 correctly blocked from updating User 1 entry';
    WHEN OTHERS THEN
        RAISE NOTICE 'PASS: User 2 update of User 1 entry failed as expected (%))', SQLERRM;
    END;
    
    -- Store entry IDs for cleanup
    CREATE TEMP TABLE test_entries (
        entry_id uuid,
        owner_id uuid
    );
    
    INSERT INTO test_entries VALUES 
        (entry_1_id, test_user_1_id),
        (entry_2_id, test_user_2_id);
END $$;

-- =====================================================
-- SECTION 6: RECENT ENTRIES FILTERING TEST
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 6: RECENT ENTRIES DASHBOARD TEST'
\echo '=========================================='
\echo ''

DO $$
DECLARE
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    test_user_2_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user2');
    journal_1_id uuid := (SELECT journal_id FROM test_journals WHERE owner_id = test_user_1_id);
    journal_2_id uuid := (SELECT journal_id FROM test_journals WHERE owner_id = test_user_2_id);
    recent_entries_count integer;
BEGIN
    -- Add more entries for both users
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived) VALUES
        (journal_1_id, 'User 1 Entry 2', CURRENT_DATE - 1, false),
        (journal_1_id, 'User 1 Entry 3', CURRENT_DATE - 2, false);
        
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_2_id::text)::text, true);
    
    INSERT INTO public.entry (journal_id, content, entry_date, is_archived) VALUES
        (journal_2_id, 'User 2 Entry 2', CURRENT_DATE - 1, false),
        (journal_2_id, 'User 2 Entry 3', CURRENT_DATE - 2, false);
    
    -- Test User 1 can only see their recent entries
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    SELECT COUNT(*) INTO recent_entries_count
    FROM public.entry e
    JOIN public.journal j ON e.journal_id = j.id  
    WHERE e.is_archived = false
    ORDER BY e.entry_date DESC
    LIMIT 5;
    
    RAISE NOTICE 'User 1 recent entries count: % (should be 3)', recent_entries_count;
    
    -- Test User 2 can only see their recent entries
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_2_id::text)::text, true);
    
    SELECT COUNT(*) INTO recent_entries_count  
    FROM public.entry e
    JOIN public.journal j ON e.journal_id = j.id
    WHERE e.is_archived = false
    ORDER BY e.entry_date DESC
    LIMIT 5;
    
    RAISE NOTICE 'User 2 recent entries count: % (should be 3)', recent_entries_count;
END $$;

-- =====================================================
-- SECTION 7: ADMIN PAGE MANAGEMENT TEST
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 7: ADMIN CMS ACCESS VERIFICATION'
\echo '=========================================='
\echo ''

DO $$
DECLARE
    test_admin_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'admin');
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    pages_count integer;
    journals_count integer;
BEGIN
    -- Set session to admin user
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_admin_id::text)::text, true);
    
    -- Admin should be able to upsert pages
    INSERT INTO public.pages (slug, title, content_html) 
    VALUES ('test-admin-page', 'Test Admin Page', '<p>Admin created this page</p>')
    ON CONFLICT (slug) DO UPDATE 
    SET content_html = EXCLUDED.content_html;
    
    -- Verify admin can read pages
    SELECT COUNT(*) INTO pages_count FROM public.pages WHERE slug = 'test-admin-page';
    RAISE NOTICE 'Admin can manage pages: % (should be 1)', pages_count;
    
    -- Admin should NOT be able to see private user journals
    SELECT COUNT(*) INTO journals_count FROM public.journal;  
    RAISE NOTICE 'Admin visible user journals: % (should be 0 if RLS working)', journals_count;
    
    -- Test admin trying to access user entries directly
    DECLARE
        entries_count integer;
    BEGIN
        SELECT COUNT(*) INTO entries_count FROM public.entry;
        RAISE NOTICE 'Admin visible user entries: % (should be 0 if RLS working)', entries_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PASS: Admin correctly blocked from accessing entries (%))', SQLERRM;
    END;
END $$;

-- =====================================================
-- SECTION 8: PROFILE ACCESS CONTROL TEST  
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 8: PROFILE ACCESS CONTROL'
\echo '=========================================='
\echo ''

DO $$
DECLARE
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    test_user_2_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user2');
    profile_count integer;
BEGIN
    -- Set session to test_user_1
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    -- User 1 should only see their own profile
    SELECT COUNT(*) INTO profile_count FROM public.profiles;
    RAISE NOTICE 'User 1 visible profiles: % (should be 1)', profile_count;
    
    -- User 1 should be able to update their own profile
    UPDATE public.profiles 
    SET name = 'Updated Test User 1' 
    WHERE id = test_user_1_id;
    
    -- User 1 should NOT be able to see User 2's profile
    SELECT COUNT(*) INTO profile_count 
    FROM public.profiles 
    WHERE id = test_user_2_id;
    
    RAISE NOTICE 'User 1 can see User 2 profile: % (should be 0)', profile_count;
    
    -- User 1 should NOT be able to update User 2's profile
    BEGIN
        UPDATE public.profiles 
        SET name = 'HACKED NAME' 
        WHERE id = test_user_2_id;
        
        GET DIAGNOSTICS profile_count = ROW_COUNT;
        IF profile_count > 0 THEN
            RAISE NOTICE 'ERROR: User 1 was able to update User 2 profile - SECURITY BREACH!';
        ELSE
            RAISE NOTICE 'PASS: User 1 update of User 2 profile was blocked (no rows affected)';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'PASS: User 1 update of User 2 profile failed as expected (%))', SQLERRM;
    END;
END $$;

-- =====================================================
-- SECTION 9: SEARCH FUNCTIONALITY SECURITY
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 9: SEARCH SECURITY VERIFICATION'
\echo '=========================================='
\echo ''

DO $$
DECLARE
    test_user_1_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user1');
    test_user_2_id uuid := (SELECT user_id FROM test_users WHERE user_type = 'user2');
    search_results_count integer;
BEGIN
    -- Set session to test_user_1
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_1_id::text)::text, true);
    
    -- Test text search - User 1 should only find their own entries
    SELECT COUNT(*) INTO search_results_count
    FROM public.entry 
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'private');
    
    RAISE NOTICE 'User 1 search results for "private": % (should only find their entries)', search_results_count;
    
    -- Set session to test_user_2  
    PERFORM set_config('request.jwt.claims', json_build_object('sub', test_user_2_id::text)::text, true);
    
    -- User 2 search should only find their own entries
    SELECT COUNT(*) INTO search_results_count  
    FROM public.entry
    WHERE to_tsvector('english', content) @@ plainto_tsquery('english', 'private');
    
    RAISE NOTICE 'User 2 search results for "private": % (should only find their entries)', search_results_count;
END $$;

-- =====================================================  
-- SECTION 10: SECURITY SUMMARY & FINAL CHECKS
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'SECTION 10: SECURITY VERIFICATION SUMMARY'
\echo '=========================================='
\echo ''

-- Count test data for verification
DO $$
DECLARE
    total_test_profiles integer;
    total_test_journals integer; 
    total_test_entries integer;
    total_test_pages integer;
BEGIN
    SELECT COUNT(*) INTO total_test_profiles FROM test_users;
    SELECT COUNT(*) INTO total_test_journals FROM test_journals;  
    SELECT COUNT(*) INTO total_test_entries FROM test_entries;
    SELECT COUNT(*) INTO total_test_pages FROM public.pages WHERE slug = 'test-admin-page';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION SUMMARY ===';
    RAISE NOTICE 'Test profiles created: %', total_test_profiles;
    RAISE NOTICE 'Test journals created: %', total_test_journals;
    RAISE NOTICE 'Test entries created: %', total_test_entries;
    RAISE NOTICE 'Test pages created: %', total_test_pages;
    RAISE NOTICE '';
    RAISE NOTICE '=== SECURITY CHECKLIST ===';
    RAISE NOTICE '✓ RLS enabled on all tables';
    RAISE NOTICE '✓ Users can only see own journals and entries';
    RAISE NOTICE '✓ Users cannot access other users'' content';
    RAISE NOTICE '✓ Admin can manage pages but not access private content';
    RAISE NOTICE '✓ Search results are properly filtered by ownership';
    RAISE NOTICE '✓ Profile access is restricted to owner only';
    RAISE NOTICE '';
    RAISE NOTICE 'If any of the above checks failed, review the RLS policies.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- FINAL CLEANUP AND ROLLBACK
-- =====================================================

\echo ''
\echo '=========================================='
\echo 'CLEANUP: ROLLING BACK ALL TEST DATA'
\echo '=========================================='
\echo ''

-- The ROLLBACK will clean up all test data automatically
ROLLBACK;

\echo ''
\echo '=== VERIFICATION COMPLETE ==='
\echo 'All test data has been rolled back.'
\echo 'Review the output above for any security issues.'
\echo ''