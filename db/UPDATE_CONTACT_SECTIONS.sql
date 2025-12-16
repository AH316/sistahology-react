-- =====================================================
-- UPDATE: Fix Contact Page Content
-- =====================================================
-- Purpose: Correct email and remove placeholder/wrong data
--
-- Changes:
-- 1. Email: hello@sistahology.com → info@sistahology.com
-- 2. Phone/Address/Hours: Replace fake data with professional placeholders
-- 3. Social: Remove Instagram (wrong account), keep Facebook and Twitter
--
-- To rollback: Run ROLLBACK; instead of COMMIT;
-- =====================================================

BEGIN;

-- Update contact information
UPDATE public.site_sections
SET content_json = jsonb_build_object(
    'email', 'info@sistahology.com',
    'phone', 'Contact information coming soon',
    'address', 'Location details coming soon',
    'hours', 'Availability hours coming soon'
),
updated_at = NOW()
WHERE page_slug = 'contact'
  AND section_key = 'contact_info';

-- Update social media (remove Instagram, keep Facebook and Twitter)
UPDATE public.site_sections
SET content_json = jsonb_build_object(
    'platforms', jsonb_build_array(
        jsonb_build_object(
            'name', 'Facebook',
            'handle', 'Sistahology',
            'url', 'https://facebook.com/sistahology'
        ),
        jsonb_build_object(
            'name', 'Twitter',
            'handle', '@sistahology',
            'url', 'https://twitter.com/sistahology'
        )
    )
),
updated_at = NOW()
WHERE page_slug = 'contact'
  AND section_key = 'social_media';

-- Verify the updates
SELECT
    section_key,
    section_title,
    content_json,
    updated_at
FROM public.site_sections
WHERE page_slug = 'contact'
  AND section_key IN ('contact_info', 'social_media')
ORDER BY section_key;

-- Commit the changes
COMMIT;
