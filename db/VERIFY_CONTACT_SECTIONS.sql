-- =====================================================
-- VERIFICATION: Contact Page Sections
-- =====================================================
-- Purpose: Verify Contact page content is correct (read-only)
-- Run this after: UPDATE_CONTACT_SECTIONS.sql
-- =====================================================

BEGIN;

-- Show all contact sections
SELECT
    section_key,
    section_title,
    content_json,
    display_order,
    is_active,
    updated_at
FROM public.site_sections
WHERE page_slug = 'contact'
ORDER BY display_order;

-- Verification checks
SELECT
    'Email Check' AS test,
    CASE
        WHEN content_json->>'email' = 'info@sistahology.com'
        THEN '✓ PASS - Email is info@sistahology.com'
        ELSE '✗ FAIL - Email is ' || COALESCE(content_json->>'email', 'NULL')
    END AS result
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info';

SELECT
    'Placeholders Check' AS test,
    CASE
        WHEN content_json->>'phone' LIKE '%coming soon%'
         AND content_json->>'address' LIKE '%coming soon%'
         AND content_json->>'hours' LIKE '%coming soon%'
        THEN '✓ PASS - All placeholders are "coming soon"'
        ELSE '✗ FAIL - Placeholders not updated'
    END AS result
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info';

SELECT
    'Platform Count Check' AS test,
    CASE
        WHEN jsonb_array_length(content_json->'platforms') = 2
        THEN '✓ PASS - Exactly 2 platforms'
        ELSE '✗ FAIL - Expected 2, found ' || jsonb_array_length(content_json->'platforms')
    END AS result
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'social_media';

SELECT
    'Instagram Check' AS test,
    CASE
        WHEN NOT EXISTS (
            SELECT 1
            FROM public.site_sections,
            jsonb_array_elements(content_json->'platforms') AS platform
            WHERE page_slug = 'contact'
              AND section_key = 'social_media'
              AND platform->>'name' = 'Instagram'
        )
        THEN '✓ PASS - Instagram removed'
        ELSE '✗ FAIL - Instagram still present'
    END AS result;

SELECT
    'Facebook Check' AS test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM public.site_sections,
            jsonb_array_elements(content_json->'platforms') AS platform
            WHERE page_slug = 'contact'
              AND section_key = 'social_media'
              AND platform->>'name' = 'Facebook'
              AND platform->>'handle' = 'Sistahology'
        )
        THEN '✓ PASS - Facebook present'
        ELSE '✗ FAIL - Facebook missing'
    END AS result;

SELECT
    'Twitter Check' AS test,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM public.site_sections,
            jsonb_array_elements(content_json->'platforms') AS platform
            WHERE page_slug = 'contact'
              AND section_key = 'social_media'
              AND platform->>'name' = 'Twitter'
              AND platform->>'handle' = '@sistahology'
        )
        THEN '✓ PASS - Twitter present (shows as X icon)'
        ELSE '✗ FAIL - Twitter missing'
    END AS result;

-- Contact info details
SELECT
    'Email' AS field,
    content_json->>'email' AS value
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info'
UNION ALL
SELECT 'Phone', content_json->>'phone'
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info'
UNION ALL
SELECT 'Address', content_json->>'address'
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info'
UNION ALL
SELECT 'Hours', content_json->>'hours'
FROM public.site_sections
WHERE page_slug = 'contact' AND section_key = 'contact_info';

-- Social media platforms
SELECT
    platform->>'name' AS platform,
    platform->>'handle' AS handle,
    platform->>'url' AS url
FROM public.site_sections,
jsonb_array_elements(content_json->'platforms') AS platform
WHERE page_slug = 'contact' AND section_key = 'social_media'
ORDER BY platform->>'name';

ROLLBACK; -- Read-only, no changes
