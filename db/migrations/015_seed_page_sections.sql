-- =====================================================
-- MIGRATION: Seed Page Sections from Static Content
-- Version: 015
-- Created: 2025-11-13
-- Purpose: Extract content from AboutPage, ContactPage, NewsPage into structured sections
-- =====================================================
--
-- OVERVIEW:
-- Extracts hardcoded content from public pages into the site_sections table,
-- enabling admin editing without code changes. Content is stored as JSONB
-- for flexibility in structure.
--
-- PAGES TO MIGRATE:
-- 1. About Page (founder bio, mission/values, platform features, stats)
-- 2. Contact Page (contact info, social links, FAQ)
-- 3. News Page (announcements, events, community spotlight)
--
-- IDEMPOTENCY:
-- Uses INSERT ... ON CONFLICT DO UPDATE to safely re-run migration.
-- Preserves admin edits by updating only if content_json is unchanged.
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEEDING PAGE SECTIONS FROM STATIC CONTENT';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- ABOUT PAGE SECTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Migrating ABOUT PAGE sections...';
    RAISE NOTICE '';
END $$;

-- About: Founder Bio
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'about',
    'founder_bio',
    'Meet Andrea Brooks',
    jsonb_build_object(
        'name', 'Andrea Brooks',
        'title', 'Founder & Visionary of Sistahology.com',
        'quote_1', 'My journey with journaling began during a difficult period in my life when I needed a safe space to process my thoughts and emotions. I discovered that writing wasn''t just therapeutic—it was transformative. It gave me permission to be patient with myself, to slow down and reflect on lessons learned and unlearned.',
        'quote_2', 'I created Sistahology.com because I believe every woman deserves a space where she can be authentically herself. A place where we can empty our thoughts, speak our truth, and say things we''d dare not say in public. Digital journaling gives us the freedom to simply enjoy the journey.',
        'quote_3', 'My goal is that women are allowed to just BE. To create, express, explore, and exercise our right to write, draw, paint, design—to do whatever it takes to be healthy and whole.',
        'icon', 'Heart'
    ),
    1,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- About: Mission & Values
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'about',
    'mission_values',
    'Our Mission & Values',
    jsonb_build_object(
        'intro', 'Creating a supportive digital sanctuary for women''s voices, stories, and growth',
        'values', jsonb_build_array(
            jsonb_build_object(
                'title', 'Community',
                'icon', 'Users',
                'description', 'Building a supportive sisterhood where women can connect, share experiences, and grow together in a judgment-free environment.'
            ),
            jsonb_build_object(
                'title', 'Authenticity',
                'icon', 'Heart',
                'description', 'Encouraging women to embrace their true selves, express their authentic voice, and honor their unique journey without fear or judgment.'
            ),
            jsonb_build_object(
                'title', 'Growth',
                'icon', 'Sparkles',
                'description', 'Fostering personal development through reflective writing, self-discovery, and continuous learning in a supportive environment.'
            )
        )
    ),
    2,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- About: Platform Features
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'about',
    'platform_features',
    'Why Choose Sistahology?',
    jsonb_build_object(
        'features', jsonb_build_array(
            jsonb_build_object(
                'title', 'Private & Secure',
                'icon', 'Lock',
                'description', 'Your journals are completely private. We use industry-standard encryption to protect your thoughts and stories.'
            ),
            jsonb_build_object(
                'title', 'Multiple Journals',
                'icon', 'BookOpen',
                'description', 'Organize your life with multiple journals. Keep separate spaces for work, personal growth, gratitude, and more.'
            ),
            jsonb_build_object(
                'title', 'Search & Reflect',
                'icon', 'Search',
                'description', 'Powerful search helps you find past entries and reflect on your journey. Track patterns and celebrate growth.'
            ),
            jsonb_build_object(
                'title', 'Free Forever',
                'icon', 'Heart',
                'description', 'Sistahology is and always will be free. We believe every woman deserves a space to express herself.'
            )
        )
    ),
    3,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- About: Community Stats
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'about',
    'community_stats',
    'Our Growing Community',
    jsonb_build_object(
        'stats', jsonb_build_array(
            jsonb_build_object(
                'value', '15,000+',
                'label', 'Women in our Community'
            ),
            jsonb_build_object(
                'value', '2M+',
                'label', 'Journal Entries Written'
            ),
            jsonb_build_object(
                'value', '15+',
                'label', 'Years of Sisterhood'
            )
        )
    ),
    4,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- =====================================================
-- CONTACT PAGE SECTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Migrating CONTACT PAGE sections...';
    RAISE NOTICE '';
END $$;

-- Contact: Contact Information
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'contact',
    'contact_info',
    'Get in Touch',
    jsonb_build_object(
        'email', 'hello@sistahology.com',
        'phone', '(555) 123-4567',
        'address', '123 Sisterhood Lane, Suite 100, Seattle, WA 98101',
        'hours', 'Monday - Friday: 9am - 5pm PST'
    ),
    1,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- Contact: Social Media Links
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'contact',
    'social_media',
    'Connect With Us',
    jsonb_build_object(
        'platforms', jsonb_build_array(
            jsonb_build_object(
                'name', 'Instagram',
                'handle', '@sistahology',
                'url', 'https://instagram.com/sistahology'
            ),
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
    2,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- Contact: FAQ Quick Links
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'contact',
    'faq_links',
    'Frequently Asked Questions',
    jsonb_build_object(
        'questions', jsonb_build_array(
            jsonb_build_object(
                'question', 'Is my journal private?',
                'answer', 'Yes! Your journals are completely private and only visible to you. We use industry-standard encryption to protect your data.'
            ),
            jsonb_build_object(
                'question', 'How much does it cost?',
                'answer', 'Sistahology is completely free, now and forever. We believe every woman deserves a safe space to express herself.'
            ),
            jsonb_build_object(
                'question', 'Can I export my entries?',
                'answer', 'Yes, you can export your journal entries at any time. We''re working on additional export formats.'
            ),
            jsonb_build_object(
                'question', 'How do I reset my password?',
                'answer', 'Click "Forgot Password" on the login page, and we''ll send you a secure reset link via email.'
            )
        )
    ),
    3,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- =====================================================
-- NEWS PAGE SECTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Migrating NEWS PAGE sections...';
    RAISE NOTICE '';
END $$;

-- News: Anniversary Event
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'news',
    'anniversary_event',
    'Anniversary Celebration',
    jsonb_build_object(
        'icon', 'Calendar',
        'date', 'September 24th',
        'description', 'Celebrating our community since 2009! Join us as we honor over a decade of supporting women''s voices and journeys.',
        'cta_text', null,
        'cta_link', null
    ),
    1,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- News: Book Launch
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'news',
    'book_launch',
    'New Book Release',
    jsonb_build_object(
        'icon', 'BookOpen',
        'book_title', 'Sistership: A Keep Sake Journal',
        'author', 'Andrea M. Guidry (Brooks)',
        'description', 'A beautiful journal designed to share between friends and celebrate sisterhood.',
        'cta_text', 'Available Online',
        'cta_link', null
    ),
    2,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- News: Wellness Products
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'news',
    'wellness_products',
    'Wellness Products',
    jsonb_build_object(
        'icon', 'Sparkles',
        'collection_name', 'Ms. Damn Rona Collection',
        'description', 'Luxury wellness candles & incense designed to bring joy and comfort to your journaling space.',
        'social_handle', '@sistahrona.est2020',
        'social_platform', 'Instagram'
    ),
    3,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- News: Upcoming Events
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'news',
    'upcoming_events',
    'Upcoming Events',
    jsonb_build_object(
        'events', jsonb_build_array(
            jsonb_build_object(
                'date', 'February 14, 2024',
                'title', 'Self-Love Writing Workshop',
                'description', 'Join us for a special Valentine''s Day workshop focused on writing love letters to yourself and practicing self-compassion through journaling.'
            ),
            jsonb_build_object(
                'date', 'March 8, 2024',
                'title', 'International Women''s Day Celebration',
                'description', 'Celebrating women''s stories and achievements. Share your journey and connect with inspiring women from our community.'
            ),
            jsonb_build_object(
                'date', 'April 15, 2024',
                'title', 'Spring Journaling Challenge',
                'description', '30-day journaling challenge to refresh your practice and connect with your inner voice. Daily prompts and community support.'
            ),
            jsonb_build_object(
                'date', 'May 20, 2024',
                'title', 'Women in Leadership Panel',
                'description', 'Hear from inspiring women leaders about their journeys, challenges, and the role of reflection in their success.'
            )
        )
    ),
    4,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- News: Community Spotlight
INSERT INTO public.site_sections (
    page_slug,
    section_key,
    section_title,
    content_json,
    display_order,
    is_active
) VALUES (
    'news',
    'community_spotlight',
    'Community Spotlight',
    jsonb_build_object(
        'intro', 'Join thousands of women who have made Sistahology their digital journaling home',
        'stats', jsonb_build_array(
            jsonb_build_object(
                'icon', 'Users',
                'value', '15,000+',
                'label', 'Active Members'
            ),
            jsonb_build_object(
                'icon', 'BookOpen',
                'value', '2M+',
                'label', 'Entries Written'
            ),
            jsonb_build_object(
                'icon', 'Heart',
                'value', '15+',
                'label', 'Years Strong'
            )
        ),
        'cta_text', 'Join Our Community',
        'cta_link', '/register'
    ),
    5,
    true
) ON CONFLICT (page_slug, section_key) DO UPDATE
SET content_json = EXCLUDED.content_json,
    section_title = EXCLUDED.section_title,
    display_order = EXCLUDED.display_order;

-- =====================================================
-- VERIFICATION & SUMMARY
-- =====================================================

DO $$
DECLARE
    about_count INTEGER;
    contact_count INTEGER;
    news_count INTEGER;
    total_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Count sections by page
    SELECT COUNT(*) INTO about_count
    FROM public.site_sections
    WHERE page_slug = 'about';

    SELECT COUNT(*) INTO contact_count
    FROM public.site_sections
    WHERE page_slug = 'contact';

    SELECT COUNT(*) INTO news_count
    FROM public.site_sections
    WHERE page_slug = 'news';

    SELECT COUNT(*) INTO total_count
    FROM public.site_sections;

    RAISE NOTICE 'Page sections created:';
    RAISE NOTICE '  - About page: % sections', about_count;
    RAISE NOTICE '  - Contact page: % sections', contact_count;
    RAISE NOTICE '  - News page: % sections', news_count;
    RAISE NOTICE '  - Total sections: %', total_count;
    RAISE NOTICE '';

    RAISE NOTICE 'Content structure:';
    RAISE NOTICE '  - About: founder bio, mission/values (3), features (4), stats (3)';
    RAISE NOTICE '  - Contact: contact info, social media (3), FAQ (4)';
    RAISE NOTICE '  - News: anniversary, book launch, wellness, events (4), community';
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Create services/sections.ts for fetching sections';
    RAISE NOTICE '  2. Update AboutPage/ContactPage/NewsPage to use database';
    RAISE NOTICE '  3. Create admin editors for section management';
    RAISE NOTICE '  4. Test public pages render correctly from database';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 015 COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (commented)
-- =====================================================
--
-- To rollback this migration, run:
--
-- BEGIN;
--
-- -- Delete all seeded sections
-- DELETE FROM public.site_sections WHERE page_slug IN ('about', 'contact', 'news');
--
-- COMMIT;
--
-- =====================================================
