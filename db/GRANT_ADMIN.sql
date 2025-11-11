-- =====================================================
-- ADMIN GRANT SCRIPT: Grant Admin Access to User
-- Purpose: Set is_admin = true for specific user(s)
-- Safety: Requires service role key or superuser access
-- =====================================================
--
-- USAGE INSTRUCTIONS:
-- 1. Replace 'user@example.com' with the actual user email
-- 2. Run this script in Supabase SQL Editor
-- 3. Verify the grant with: SELECT id, email, is_admin FROM profiles WHERE is_admin = true;
--
-- SECURITY NOTES:
-- - This script requires service role key or database superuser access
-- - Regular users cannot grant themselves admin access (RLS prevents this)
-- - Admin access grants CMS editing and admin panel features
-- - Review admin users regularly for security auditing
--
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Find User by Email
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FINDING USER TO GRANT ADMIN ACCESS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Find user(s) to grant admin access
-- Modify the WHERE clause to match your target user(s)
SELECT
    id,
    email,
    is_admin AS current_admin_status,
    CASE
        WHEN is_admin = true THEN 'Already admin'
        ELSE 'Will be granted admin access'
    END AS action_needed
FROM public.profiles
WHERE email = 'user@example.com'; -- CHANGE THIS EMAIL

-- =====================================================
-- STEP 2: Grant Admin Access
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'GRANTING ADMIN ACCESS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Grant admin access by setting is_admin = true
-- OPTION 1: Grant by email (recommended)
UPDATE public.profiles
SET is_admin = true,
    updated_at = NOW()
WHERE email = 'user@example.com' -- CHANGE THIS EMAIL
  AND is_admin = false; -- Only update if not already admin

-- OPTION 2: Grant by user ID (if you know the UUID)
-- Uncomment and modify the following lines:
-- UPDATE public.profiles
-- SET is_admin = true,
--     updated_at = NOW()
-- WHERE id = 'user-uuid-here'
--   AND is_admin = false;

-- OPTION 3: Grant to multiple users by email list
-- Uncomment and modify the following lines:
-- UPDATE public.profiles
-- SET is_admin = true,
--     updated_at = NOW()
-- WHERE email IN (
--     'admin1@example.com',
--     'admin2@example.com',
--     'admin3@example.com'
-- ) AND is_admin = false;

-- =====================================================
-- STEP 3: Verify Admin Grant
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION: NEW ADMIN STATUS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Verify the user now has admin access
SELECT
    id,
    email,
    is_admin,
    updated_at,
    CASE
        WHEN is_admin = true THEN '✓ Admin access granted'
        ELSE '✗ Admin grant failed - check email and RLS policies'
    END AS status
FROM public.profiles
WHERE email = 'user@example.com'; -- CHANGE THIS EMAIL

-- =====================================================
-- STEP 4: List All Admin Users
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ALL ADMIN USERS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Show all users with admin access for auditing
SELECT
    id,
    email,
    is_admin,
    created_at,
    updated_at
FROM public.profiles
WHERE is_admin = true
ORDER BY email;

-- =====================================================
-- COMMIT OR ROLLBACK
-- =====================================================

-- OPTION A: Commit the changes (uncomment to apply)
COMMIT;

-- OPTION B: Rollback to undo (uncomment to cancel)
-- ROLLBACK;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'ADMIN GRANT COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. User should sign out and sign back in';
    RAISE NOTICE '  2. Application will load is_admin flag from profile';
    RAISE NOTICE '  3. Admin link should appear in navigation';
    RAISE NOTICE '  4. User can access CMS and admin panel';
    RAISE NOTICE '';
    RAISE NOTICE 'Security reminders:';
    RAISE NOTICE '  - Review admin users regularly';
    RAISE NOTICE '  - Revoke admin access when no longer needed';
    RAISE NOTICE '  - Monitor admin actions for security auditing';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- REVOKE ADMIN ACCESS (if needed)
-- =====================================================
-- Uncomment and modify to revoke admin access:
--
-- UPDATE public.profiles
-- SET is_admin = false,
--     updated_at = NOW()
-- WHERE email = 'user@example.com';
--
-- =====================================================
