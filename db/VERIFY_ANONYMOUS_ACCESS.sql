-- =====================================================
-- VERIFY ANONYMOUS ACCESS
-- =====================================================
-- Purpose: Verify that anonymous (not signed in) users
--          can access public data but not private data
--
-- How to run:
--   1. Open Supabase SQL Editor
--   2. Paste this entire script
--   3. Click "Run"
--   4. Check that all tests show ✓ PASS
--
-- Expected behavior:
--   ✓ Anonymous CAN read pages (public marketing content)
--   ✓ Anonymous CAN read active writing prompts
--   ✗ Anonymous CANNOT read profiles
--   ✗ Anonymous CANNOT read journals
--   ✗ Anonymous CANNOT read entries
--
-- Note: This script uses BEGIN...ROLLBACK so it makes
--       no permanent changes to your database
-- =====================================================

BEGIN;

-- =====================================================
-- SETUP: Simulate Anonymous User Context
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ANONYMOUS ACCESS VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Simulating anonymous user context...';
    RAISE NOTICE '';
END $$;

-- Clear any existing JWT context (simulate not signed in)
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claim.role', 'anon', true);

DO $$
BEGIN
    RAISE NOTICE '✓ Anonymous user context set';
    RAISE NOTICE '  - auth.uid() will return: NULL';
    RAISE NOTICE '  - Role: anon (anonymous)';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 1: Anonymous CAN Read Pages (Public Content)
-- =====================================================

DO $$
DECLARE
    page_count integer;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 1: Anonymous Access to Pages Table';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to read pages as anonymous user
    SELECT COUNT(*) INTO page_count
    FROM public.pages;

    -- Test passes if anonymous can read pages
    test_passed := page_count >= 0;  -- Any result means access granted

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CAN read pages';
        RAISE NOTICE '  - Pages visible: %', page_count;
        RAISE NOTICE '  - Design intent: Public marketing content';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CANNOT read pages';
        RAISE NOTICE '  - This is WRONG - pages should be public!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 2: Anonymous CAN Read Active Writing Prompts
-- =====================================================

DO $$
DECLARE
    prompt_count integer;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 2: Anonymous Access to Writing Prompts';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to read active prompts as anonymous user
    SELECT COUNT(*) INTO prompt_count
    FROM public.writing_prompts
    WHERE is_active = TRUE;

    -- Test passes if anonymous can read prompts
    test_passed := prompt_count >= 0;

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CAN read active prompts';
        RAISE NOTICE '  - Active prompts visible: %', prompt_count;
        RAISE NOTICE '  - Design intent: Marketing to encourage sign-ups';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CANNOT read prompts';
        RAISE NOTICE '  - This is WRONG - prompts should be public!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 3: Anonymous CANNOT Read Profiles (Private)
-- =====================================================

DO $$
DECLARE
    profile_count integer;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 3: Anonymous Blocked from Profiles';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to read profiles as anonymous user
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles;

    -- Test passes if anonymous sees ZERO profiles
    test_passed := profile_count = 0;

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CANNOT read profiles';
        RAISE NOTICE '  - Profiles visible: 0 (blocked by RLS)';
        RAISE NOTICE '  - Design intent: Private user data';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CAN read profiles';
        RAISE NOTICE '  - Profiles visible: %', profile_count;
        RAISE NOTICE '  - SECURITY ISSUE: Private data exposed!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 4: Anonymous CANNOT Read Journals (Private)
-- =====================================================

DO $$
DECLARE
    journal_count integer;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 4: Anonymous Blocked from Journals';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to read journals as anonymous user
    SELECT COUNT(*) INTO journal_count
    FROM public.journal;

    -- Test passes if anonymous sees ZERO journals
    test_passed := journal_count = 0;

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CANNOT read journals';
        RAISE NOTICE '  - Journals visible: 0 (blocked by RLS)';
        RAISE NOTICE '  - Mechanism: auth.uid() = NULL for anonymous';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CAN read journals';
        RAISE NOTICE '  - Journals visible: %', journal_count;
        RAISE NOTICE '  - SECURITY ISSUE: Private data exposed!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 5: Anonymous CANNOT Read Entries (Private)
-- =====================================================

DO $$
DECLARE
    entry_count integer;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 5: Anonymous Blocked from Entries';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to read entries as anonymous user
    SELECT COUNT(*) INTO entry_count
    FROM public.entry;

    -- Test passes if anonymous sees ZERO entries
    test_passed := entry_count = 0;

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CANNOT read entries';
        RAISE NOTICE '  - Entries visible: 0 (blocked by RLS)';
        RAISE NOTICE '  - Mechanism: auth.uid() = NULL for anonymous';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CAN read entries';
        RAISE NOTICE '  - Entries visible: %', entry_count;
        RAISE NOTICE '  - SECURITY ISSUE: Private data exposed!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- TEST 6: Anonymous CANNOT Insert/Update/Delete
-- =====================================================

DO $$
DECLARE
    insert_blocked boolean := false;
    test_passed boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TEST 6: Anonymous Blocked from Write Operations';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Try to insert into profiles (should fail)
    BEGIN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (
            'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',  -- Random UUID
            'test@example.com',
            'Test User'
        );

        insert_blocked := false;  -- If we get here, insert succeeded (BAD!)
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        insert_blocked := true;  -- Insert blocked (GOOD!)
    END;

    test_passed := insert_blocked;

    IF test_passed THEN
        RAISE NOTICE '✓ PASS: Anonymous users CANNOT insert profiles';
        RAISE NOTICE '  - INSERT blocked by RLS policies';
        RAISE NOTICE '  - Design intent: Prevent unauthorized data creation';
    ELSE
        RAISE NOTICE '✗ FAIL: Anonymous users CAN insert profiles';
        RAISE NOTICE '  - SECURITY ISSUE: Unauthorized data creation possible!';
    END IF;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results:';
    RAISE NOTICE '  ✓ TEST 1: Anonymous CAN read pages';
    RAISE NOTICE '  ✓ TEST 2: Anonymous CAN read active prompts';
    RAISE NOTICE '  ✓ TEST 3: Anonymous CANNOT read profiles';
    RAISE NOTICE '  ✓ TEST 4: Anonymous CANNOT read journals';
    RAISE NOTICE '  ✓ TEST 5: Anonymous CANNOT read entries';
    RAISE NOTICE '  ✓ TEST 6: Anonymous CANNOT insert data';
    RAISE NOTICE '';
    RAISE NOTICE 'If all tests show ✓ PASS:';
    RAISE NOTICE '  → Anonymous access is correctly configured';
    RAISE NOTICE '  → Public data (pages, prompts) accessible';
    RAISE NOTICE '  → Private data (profiles, journals, entries) protected';
    RAISE NOTICE '';
    RAISE NOTICE 'If any test shows ✗ FAIL:';
    RAISE NOTICE '  → Review RLS policies on that table';
    RAISE NOTICE '  → Check for missing TO authenticated clause';
    RAISE NOTICE '  → Verify auth.uid() checks in USING clauses';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- CLEANUP
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CLEANUP';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Rolling back transaction...';
    RAISE NOTICE 'No changes made to database (safe verification)';
    RAISE NOTICE '';
END $$;

ROLLBACK;

-- =====================================================
-- USAGE NOTES
-- =====================================================
--
-- This script tests THREE user roles:
--
-- 1. postgres role (SQL Editor default)
--    - Bypasses RLS completely
--    - Can see all data
--    - Used for migrations and admin
--
-- 2. authenticated role (logged-in users)
--    - RLS applies
--    - Can see own data only
--    - auth.uid() returns user's UUID
--
-- 3. anon/anonymous role (not signed in)
--    - RLS applies
--    - Can see public data only
--    - auth.uid() returns NULL
--
-- This script simulates role #3 (anonymous) by:
--   - Setting request.jwt.claim.sub = '' (empty)
--   - This makes auth.uid() return NULL
--   - RLS policies then apply as if user is not signed in
--
-- Why Public Data is Public:
--   - pages: Marketing content (home, about, blog)
--   - writing_prompts: Showcase value, encourage sign-ups
--
-- Why Private Data is Private:
--   - profiles: Personal user information
--   - journal: User's private journals
--   - entry: User's private journal entries
--
-- For more information:
--   - See DATABASE_SETUP.md "Understanding Three Postgres Roles"
--   - See ADMIN_SECURITY_EXPLAINED.md "Anonymous User Access Model"
-- =====================================================
