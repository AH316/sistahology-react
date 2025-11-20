-- =====================================================
-- MIGRATION: Create Site Sections Table for CMS
-- Version: 012
-- Created: 2025-01-13
-- Purpose: Enable admin-editable structured content for public pages
-- =====================================================
--
-- OVERVIEW:
-- Creates the site_sections table to replace hardcoded content in
-- AboutPage.tsx, ContactPage.tsx, and NewsPage.tsx. Provides flexible
-- JSON storage for different section types.
--
-- SECTION KEY NAMING CONVENTION:
-- Format: {page_slug}/{section_key}
-- Examples:
--   - about/founder_bio
--   - about/mission
--   - contact/contact_info
--   - news/announcements
--
-- SECURITY MODEL:
-- - Admins: Full CRUD access to all sections
-- - Public: Read-only access to active sections (is_active=true)
-- - Anonymous users: Same as public
--
-- IDEMPOTENCY:
-- Safe to run multiple times. Uses IF NOT EXISTS and conditional logic.
--
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: TABLE CREATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING SITE_SECTIONS TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create site_sections table
CREATE TABLE IF NOT EXISTS public.site_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_slug TEXT NOT NULL,
    section_key TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content_json JSONB NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_page_section UNIQUE(page_slug, section_key)
);

-- Add table comment
COMMENT ON TABLE public.site_sections IS
    'Structured content sections for public pages (About, Contact, News), enabling admin editing without code changes. Content stored as flexible JSONB.';

-- Add column comments
COMMENT ON COLUMN public.site_sections.id IS
    'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.site_sections.page_slug IS
    'Page identifier (e.g., "about", "contact", "news") - corresponds to route';
COMMENT ON COLUMN public.site_sections.section_key IS
    'Unique key within page (e.g., "founder_bio", "contact_info", "upcoming_events")';
COMMENT ON COLUMN public.site_sections.section_title IS
    'Display title for the section (shown in admin UI and optionally on frontend)';
COMMENT ON COLUMN public.site_sections.content_json IS
    'Flexible JSONB structure containing section content. Schema varies by section type. Examples: {bio_html: "...", image_url: "..."} or {email: "...", phone: "..."}';
COMMENT ON COLUMN public.site_sections.display_order IS
    'Integer for controlling section order on page (lower = higher on page). Default: 0';
COMMENT ON COLUMN public.site_sections.is_active IS
    'Soft delete/hide flag. If false, section is hidden from public but admins can still see it. Default: true';
COMMENT ON COLUMN public.site_sections.created_at IS
    'Timestamp when section was first created';
COMMENT ON COLUMN public.site_sections.updated_at IS
    'Timestamp of last update (auto-updated by trigger)';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'site_sections'
    ) THEN
        RAISE NOTICE 'site_sections table created/verified successfully';
    END IF;
END $$;

-- =====================================================
-- SECTION 2: PERFORMANCE INDEXES
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING PERFORMANCE INDEXES';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Index on page_slug for fetching all sections for a specific page
CREATE INDEX IF NOT EXISTS idx_site_sections_page_slug
ON public.site_sections(page_slug);

-- Composite index for common query: active sections for a page, sorted by display_order
CREATE INDEX IF NOT EXISTS idx_site_sections_page_active_ordered
ON public.site_sections(page_slug, display_order)
WHERE is_active = true;

-- Index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_site_sections_is_active
ON public.site_sections(is_active);

-- GIN index on content_json for JSONB queries (future enhancement)
CREATE INDEX IF NOT EXISTS idx_site_sections_content_json
ON public.site_sections USING GIN(content_json);

DO $$
BEGIN
    RAISE NOTICE 'Created indexes:';
    RAISE NOTICE '  - idx_site_sections_page_slug (page lookup)';
    RAISE NOTICE '  - idx_site_sections_page_active_ordered (composite query optimization)';
    RAISE NOTICE '  - idx_site_sections_is_active (active filter)';
    RAISE NOTICE '  - idx_site_sections_content_json (JSONB queries)';
END $$;

-- =====================================================
-- SECTION 3: UPDATED_AT TRIGGER
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING UPDATED_AT TRIGGER';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create or replace trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_site_sections_updated_at()
RETURNS TRIGGER AS $trigger$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_site_sections_updated_at ON public.site_sections;

-- Create trigger
CREATE TRIGGER trigger_update_site_sections_updated_at
    BEFORE UPDATE ON public.site_sections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_site_sections_updated_at();

COMMENT ON FUNCTION public.update_site_sections_updated_at() IS
    'Automatically updates the updated_at timestamp whenever a site section is modified';

DO $$
BEGIN
    RAISE NOTICE 'Created trigger to auto-update updated_at timestamp on modifications';
END $$;

-- =====================================================
-- SECTION 4: ROW LEVEL SECURITY (RLS)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CONFIGURING ROW LEVEL SECURITY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Enable RLS on site_sections table
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS enabled on site_sections table';
END $$;

-- =====================================================
-- ADMIN POLICIES: Full CRUD Access for Admins
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating ADMIN policies (full CRUD access)...';
END $$;

-- Admin SELECT policy: View all sections (active and inactive)
DROP POLICY IF EXISTS admin_select_site_sections ON public.site_sections;
CREATE POLICY admin_select_site_sections
ON public.site_sections
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_select_site_sections ON public.site_sections IS
    'Admins can view all site sections regardless of is_active status';

-- Admin INSERT policy: Create new sections
DROP POLICY IF EXISTS admin_insert_site_sections ON public.site_sections;
CREATE POLICY admin_insert_site_sections
ON public.site_sections
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_insert_site_sections ON public.site_sections IS
    'Admins can create new site sections';

-- Admin UPDATE policy: Edit any section
DROP POLICY IF EXISTS admin_update_site_sections ON public.site_sections;
CREATE POLICY admin_update_site_sections
ON public.site_sections
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_update_site_sections ON public.site_sections IS
    'Admins can update any site section';

-- Admin DELETE policy: Delete any section
DROP POLICY IF EXISTS admin_delete_site_sections ON public.site_sections;
CREATE POLICY admin_delete_site_sections
ON public.site_sections
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_delete_site_sections ON public.site_sections IS
    'Admins can delete site sections';

DO $$
BEGIN
    RAISE NOTICE 'Admin policies created: SELECT, INSERT, UPDATE, DELETE';
END $$;

-- =====================================================
-- PUBLIC POLICIES: Read-Only Access to Active Sections
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating PUBLIC policies (read-only active content)...';
END $$;

-- Public SELECT policy: View active sections only
DROP POLICY IF EXISTS public_select_site_sections ON public.site_sections;
CREATE POLICY public_select_site_sections
ON public.site_sections
FOR SELECT
TO authenticated, anon
USING (
    is_active = true
);

COMMENT ON POLICY public_select_site_sections ON public.site_sections IS
    'Public users can only view active sections (is_active = true)';

DO $$
BEGIN
    RAISE NOTICE 'Public policy created: SELECT (active sections only)';
    RAISE NOTICE '';
    RAISE NOTICE 'NO INSERT/UPDATE/DELETE policies for public users (read-only)';
END $$;

-- =====================================================
-- SECTION 5: VERIFICATION & SUMMARY
-- =====================================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Verify RLS is enabled
    SELECT pc.relrowsecurity INTO rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'site_sections';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS is ENABLED on site_sections table';
    ELSE
        RAISE WARNING '✗ RLS is DISABLED - security risk!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_sections';

    RAISE NOTICE '✓ Total RLS policies: %', policy_count;
    RAISE NOTICE '';

    RAISE NOTICE 'Schema created:';
    RAISE NOTICE '  - site_sections table with 9 columns';
    RAISE NOTICE '  - UNIQUE constraint on (page_slug, section_key)';
    RAISE NOTICE '  - 4 performance indexes including GIN for JSONB';
    RAISE NOTICE '  - Auto-update trigger for updated_at';
    RAISE NOTICE '';

    RAISE NOTICE 'Security configured:';
    RAISE NOTICE '  - Admins: Full CRUD access (4 policies)';
    RAISE NOTICE '  - Public: Read-only active sections (1 policy)';
    RAISE NOTICE '  - Anonymous: Same as public';
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 013 to create admin_registration_tokens table';
    RAISE NOTICE '  2. Run migration 015 to seed page sections from hardcoded pages';
    RAISE NOTICE '  3. Test RLS policies with VERIFY script';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 012 COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK INSTRUCTIONS (commented)
-- =====================================================
--
-- To rollback this migration, run the following in order:
--
-- BEGIN;
--
-- -- Drop policies
-- DROP POLICY IF EXISTS admin_select_site_sections ON public.site_sections;
-- DROP POLICY IF EXISTS admin_insert_site_sections ON public.site_sections;
-- DROP POLICY IF EXISTS admin_update_site_sections ON public.site_sections;
-- DROP POLICY IF EXISTS admin_delete_site_sections ON public.site_sections;
-- DROP POLICY IF EXISTS public_select_site_sections ON public.site_sections;
--
-- -- Drop trigger and function
-- DROP TRIGGER IF EXISTS trigger_update_site_sections_updated_at ON public.site_sections;
-- DROP FUNCTION IF EXISTS public.update_site_sections_updated_at();
--
-- -- Drop indexes (cascade removes dependent objects)
-- DROP INDEX IF EXISTS public.idx_site_sections_page_slug CASCADE;
-- DROP INDEX IF EXISTS public.idx_site_sections_page_active_ordered CASCADE;
-- DROP INDEX IF EXISTS public.idx_site_sections_is_active CASCADE;
-- DROP INDEX IF EXISTS public.idx_site_sections_content_json CASCADE;
--
-- -- Drop table (cascade removes dependent objects)
-- DROP TABLE IF EXISTS public.site_sections CASCADE;
--
-- COMMIT;
--
-- =====================================================
