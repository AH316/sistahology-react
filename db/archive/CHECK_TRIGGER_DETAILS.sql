-- Check trigger configuration details

-- 1. Check if trigger exists and what events it handles
SELECT
    tgname as trigger_name,
    tgtype,
    tgenabled as enabled,
    CASE
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        WHEN tgtype & 64 = 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    CASE
        WHEN tgtype & 4 = 4 THEN 'INSERT '
        ELSE ''
    END ||
    CASE
        WHEN tgtype & 8 = 8 THEN 'DELETE '
        ELSE ''
    END ||
    CASE
        WHEN tgtype & 16 = 16 THEN 'UPDATE '
        ELSE ''
    END as events,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger
WHERE tgname = 'prevent_is_admin_self_modification'
  AND tgrelid = 'public.profiles'::regclass;

-- 2. Check function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'prevent_is_admin_modification'
  AND pronamespace = 'public'::regnamespace;
