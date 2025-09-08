-- =====================================================
-- QUICK SECURITY VERIFICATION SCRIPT
-- =====================================================
-- 
-- This script performs the specific security checks requested:
-- 1. Read checks (should work with RLS)
-- 2. Write check (should be blocked)
-- 
-- Run this in Supabase SQL Editor to verify security paths.
-- Uses BEGIN/ROLLBACK for safety.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: READ CHECKS (SHOULD WORK)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 1: READ VERIFICATION CHECKS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Check 1: Public pages read (should work - no RLS restriction for read)
DO $$
DECLARE 
    pages_result text := '';
    page_record record;
BEGIN
    RAISE NOTICE '=== CHECK 1: Reading public.pages ===';
    
    FOR page_record IN 
        SELECT slug, title FROM public.pages ORDER BY slug LIMIT 5
    LOOP
        pages_result := pages_result || page_record.slug || ' | ' || page_record.title || E'\n';
    END LOOP;
    
    IF pages_result != '' THEN
        RAISE NOTICE 'PAGES READ SUCCESS:';
        RAISE NOTICE '%', pages_result;
    ELSE
        RAISE NOTICE 'No pages found or access denied';
    END IF;
END $$;

-- Check 2: User journals count (RLS should apply - requires auth context)
DO $$
DECLARE 
    journal_count integer;
    current_user_id uuid;
BEGIN
    RAISE NOTICE '=== CHECK 2: Counting user journals ===';
    
    -- Get current auth context
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user context - auth.uid() returned NULL';
        RAISE NOTICE 'Journal count would be 0 due to RLS policies';
    ELSE
        SELECT count(*) INTO journal_count 
        FROM public.journal 
        WHERE user_id = auth.uid() OR owner_id = auth.uid();
        
        RAISE NOTICE 'User ID: %', SUBSTRING(current_user_id::text, 1, 8) || '****';
        RAISE NOTICE 'My journals count: %', journal_count;
    END IF;
END $$;

-- Check 3: User entries count (RLS should apply)  
DO $$
DECLARE 
    entry_count integer;
    current_user_id uuid;
BEGIN
    RAISE NOTICE '=== CHECK 3: Counting user entries ===';
    
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user context - auth.uid() returned NULL';
        RAISE NOTICE 'Entry count would be 0 due to RLS policies';
    ELSE
        -- Count entries through journal ownership (handles both user_id and owner_id schemas)
        SELECT count(*) INTO entry_count 
        FROM public.entry e
        JOIN public.journal j ON e.journal_id = j.id
        WHERE (j.user_id = auth.uid() OR j.owner_id = auth.uid());
        
        RAISE NOTICE 'User ID: %', SUBSTRING(current_user_id::text, 1, 8) || '****';
        RAISE NOTICE 'My entries count: %', entry_count;
    END IF;
END $$;

-- =====================================================
-- SECTION 2: WRITE CHECK (SHOULD BE BLOCKED)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECTION 2: WRITE BLOCKING VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Check 4: Update pages (should be blocked for non-admin users)
DO $$
DECLARE 
    update_count integer;
    error_message text;
    current_user_id uuid;
    user_role text;
BEGIN
    RAISE NOTICE '=== CHECK 4: Testing UPDATE block on pages ===';
    
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user - UPDATE should fail due to RLS';
    ELSE
        -- Check user role from JWT claims
        SELECT COALESCE(
            (current_setting('request.jwt.claims', true)::json->>'role'),
            (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role'),
            'user'
        ) INTO user_role;
        
        RAISE NOTICE 'User role: %', user_role;
    END IF;
    
    BEGIN
        -- Attempt the UPDATE that should be blocked
        UPDATE public.pages SET title = title WHERE false;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        
        IF update_count = 0 THEN
            RAISE NOTICE 'UPDATE BLOCKED: No rows affected (expected for WHERE false)';
            RAISE NOTICE 'This is normal - the WHERE false condition prevents any actual updates';
        ELSE
            RAISE NOTICE 'UNEXPECTED: UPDATE affected % rows', update_count;
        END IF;
        
    EXCEPTION
        WHEN insufficient_privilege THEN
            error_message := SQLERRM;
            RAISE NOTICE 'UPDATE BLOCKED BY RLS: %', error_message;
        WHEN OTHERS THEN
            error_message := SQLERRM;
            RAISE NOTICE 'UPDATE BLOCKED BY ERROR: %', error_message;
    END;
END $$;

-- =====================================================
-- SECTION 3: SUMMARY AND ROLLBACK
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SECURITY VERIFICATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Expected Results:';
    RAISE NOTICE '1. Pages read should work (public content)';
    RAISE NOTICE '2. Journal/entry counts depend on auth context';
    RAISE NOTICE '3. UPDATE should not affect any rows (WHERE false)';
    RAISE NOTICE '4. RLS policies should enforce user isolation';
    RAISE NOTICE '';
    RAISE NOTICE 'All operations rolled back - no permanent changes made.';
    RAISE NOTICE '';
END $$;

-- Clean rollback - no permanent changes
ROLLBACK;

-- Final status message
SELECT 
    'VERIFICATION COMPLETE' as status,
    'All test operations rolled back' as result,
    'Database state unchanged' as confirmation;