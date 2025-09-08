-- =====================================================
-- CHECK FOR TESTADMIN USER IN PROFILES TABLE
-- =====================================================
-- 
-- This script checks if a testadmin@example.com user exists
-- in the profiles table and returns their information.
-- 
-- Safe read-only query with no side effects.
-- =====================================================

BEGIN;

-- Check for testadmin user in profiles table
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CHECKING FOR TESTADMIN USER';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Return the single row if found (id, email, role-ish fields).
SELECT
  p.id,
  p.email,
  /* Include any role field/metadata your schema uses, if present */
  CASE 
    WHEN p.name IS NOT NULL THEN p.name
    ELSE NULL
  END as name,
  CASE 
    WHEN p.journal_id IS NOT NULL THEN p.journal_id
    ELSE NULL
  END as journal_id,
  /* Check for any role-related columns */
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN (SELECT p.role::text)
    ELSE NULL
  END as role,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'is_admin'
    ) THEN (SELECT p.is_admin::text)
    ELSE NULL
  END as is_admin
FROM public.profiles p
WHERE lower(p.email) = lower('testadmin@example.com')
LIMIT 1;

-- Also check if the profiles table exists and what columns it has
DO $$
DECLARE
    profile_exists boolean;
    column_list text;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
        RAISE NOTICE '';
        RAISE NOTICE 'RESULT: The profiles table does not exist in the public schema.';
        RAISE NOTICE '';
    ELSE
        -- Get list of columns in profiles table
        SELECT string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position)
        INTO column_list
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles';
        
        RAISE NOTICE '';
        RAISE NOTICE 'Profiles table columns: %', column_list;
        RAISE NOTICE '';
        
        -- Count total users to provide context
        DECLARE
            total_users integer;
            admin_count integer;
        BEGIN
            SELECT COUNT(*) INTO total_users FROM public.profiles;
            
            -- Try to count admin users if any role column exists
            SELECT COUNT(*) INTO admin_count 
            FROM public.profiles p
            WHERE lower(p.email) LIKE '%admin%'
               OR (EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                            AND table_name = 'profiles' 
                            AND column_name = 'role')
                   AND p.role = 'admin')
               OR (EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                            AND table_name = 'profiles' 
                            AND column_name = 'is_admin')
                   AND p.is_admin = true);
            
            RAISE NOTICE 'Total profiles: %', total_users;
            RAISE NOTICE 'Profiles with admin indicators: %', admin_count;
            RAISE NOTICE '';
        END;
    END IF;
END $$;

-- Final summary
DO $$
DECLARE
    user_found boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE lower(email) = lower('testadmin@example.com')
    ) INTO user_found;
    
    RAISE NOTICE '==========================================';
    IF user_found THEN
        RAISE NOTICE 'RESULT: User testadmin@example.com EXISTS in profiles table';
        RAISE NOTICE 'See query results above for user details';
    ELSE
        RAISE NOTICE 'RESULT: User testadmin@example.com NOT FOUND in profiles table';
    END IF;
    RAISE NOTICE '==========================================';
END $$;

ROLLBACK;

-- End of verification script