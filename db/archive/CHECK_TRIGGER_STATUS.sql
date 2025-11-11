-- =====================================================
-- Check if trigger is actually installed and working
-- =====================================================

BEGIN;

-- Check if trigger exists
DO $$
DECLARE
    trigger_count integer;
    function_count integer;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CHECKING TRIGGER STATUS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'prevent_is_admin_self_modification'
      AND tgrelid = 'public.profiles'::regclass;

    RAISE NOTICE 'Trigger "prevent_is_admin_self_modification": %',
        CASE WHEN trigger_count > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END;

    -- Check function
    SELECT COUNT(*) INTO function_count
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    RAISE NOTICE 'Function "prevent_is_admin_modification": %',
        CASE WHEN function_count > 0 THEN 'EXISTS' ELSE 'NOT FOUND' END;

    RAISE NOTICE '';
END $$;

-- Show trigger details
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE 'Trigger details:';
    FOR trigger_record IN
        SELECT
            tgname,
            tgtype,
            tgenabled,
            pg_get_triggerdef(oid) as definition
        FROM pg_trigger
        WHERE tgname = 'prevent_is_admin_self_modification'
          AND tgrelid = 'public.profiles'::regclass
    LOOP
        RAISE NOTICE '  Name: %', trigger_record.tgname;
        RAISE NOTICE '  Type: %', trigger_record.tgtype;
        RAISE NOTICE '  Enabled: %', trigger_record.tgenabled;
        RAISE NOTICE '  Definition: %', trigger_record.definition;
    END LOOP;
    RAISE NOTICE '';
END $$;

-- Show function source
DO $$
DECLARE
    func_source text;
BEGIN
    SELECT pg_get_functiondef(oid) INTO func_source
    FROM pg_proc
    WHERE proname = 'prevent_is_admin_modification'
      AND pronamespace = 'public'::regnamespace;

    RAISE NOTICE 'Function source:';
    RAISE NOTICE '%', func_source;
    RAISE NOTICE '';
END $$;

-- Test the trigger with a direct call
DO $$
DECLARE
    test_user_id uuid;
    is_admin_before boolean;
    is_admin_after boolean;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TESTING TRIGGER BEHAVIOR';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Get a non-admin user
    SELECT id INTO test_user_id
    FROM profiles
    WHERE is_admin = false
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No non-admin users found';
    END IF;

    SELECT is_admin INTO is_admin_before FROM profiles WHERE id = test_user_id;
    RAISE NOTICE 'Test user: %', test_user_id;
    RAISE NOTICE 'Current is_admin: %', is_admin_before;
    RAISE NOTICE '';

    -- Set JWT claim to simulate authenticated user
    RAISE NOTICE 'Setting JWT claim to simulate authenticated user...';
    PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);

    -- Try to update
    RAISE NOTICE 'Attempting UPDATE is_admin = true...';
    BEGIN
        UPDATE profiles SET is_admin = true WHERE id = test_user_id;

        -- If we get here, the update succeeded (BAD!)
        SELECT is_admin INTO is_admin_after FROM profiles WHERE id = test_user_id;
        RAISE NOTICE '✗ FAIL: UPDATE succeeded (is_admin = %)', is_admin_after;
        RAISE NOTICE 'Trigger did NOT fire or did NOT block the update!';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '✓ PASS: UPDATE blocked by trigger';
        RAISE NOTICE 'Error message: %', SQLERRM;
    END;

    -- Reset
    PERFORM set_config('request.jwt.claim.sub', '', true);
    RAISE NOTICE '';
END $$;

ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CHECK COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;
