-- =====================================================
-- MIGRATION: Create Blog Posts Table for CMS
-- Version: 011
-- Created: 2025-01-13
-- Purpose: Enable admin-managed blog posts via CMS interface
-- =====================================================
--
-- OVERVIEW:
-- Creates the blog_posts table to replace hardcoded posts in staticPosts.ts.
-- Supports draft/published workflow with publish dates and featured images.
--
-- SECURITY MODEL:
-- - Admins: Full CRUD access to all blog posts
-- - Public: Read-only access to published posts (status='published' AND published_at IS NOT NULL)
-- - Anonymous users: Same as public (published content only)
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
    RAISE NOTICE 'CREATING BLOG_POSTS TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content_html TEXT NOT NULL,
    author TEXT DEFAULT 'sistahology.com',
    published_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    featured_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.blog_posts IS
    'Blog posts for the Weekly Blog section, admin-managed via CMS. Supports draft/published workflow.';

-- Add column comments
COMMENT ON COLUMN public.blog_posts.id IS
    'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.blog_posts.slug IS
    'URL-friendly unique identifier for routing (e.g., "priorities", "loving-yourself-first")';
COMMENT ON COLUMN public.blog_posts.title IS
    'Post title displayed in lists and detail view';
COMMENT ON COLUMN public.blog_posts.excerpt IS
    'Brief summary shown in blog list/preview cards (optional)';
COMMENT ON COLUMN public.blog_posts.content_html IS
    'Full HTML content of the blog post (sanitized before display)';
COMMENT ON COLUMN public.blog_posts.author IS
    'Post author name, defaults to "sistahology.com"';
COMMENT ON COLUMN public.blog_posts.published_at IS
    'Publication timestamp. NULL = unpublished/draft, NOT NULL = published on this date';
COMMENT ON COLUMN public.blog_posts.status IS
    'Post status: "draft" (not visible to public) or "published" (visible if published_at is set)';
COMMENT ON COLUMN public.blog_posts.featured_image_url IS
    'Optional URL for featured/hero image (future enhancement)';
COMMENT ON COLUMN public.blog_posts.created_at IS
    'Timestamp when post was first created';
COMMENT ON COLUMN public.blog_posts.updated_at IS
    'Timestamp of last update (auto-updated by trigger)';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'blog_posts'
    ) THEN
        RAISE NOTICE 'blog_posts table created/verified successfully';
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

-- Index on slug for fast lookups by URL
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
ON public.blog_posts(slug);

-- Index on published_at for sorting published posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at
ON public.blog_posts(published_at DESC NULLS LAST);

-- Index on status for filtering drafts vs published
CREATE INDEX IF NOT EXISTS idx_blog_posts_status
ON public.blog_posts(status);

-- Composite index for common query: published posts ordered by date
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_sorted
ON public.blog_posts(status, published_at DESC)
WHERE status = 'published' AND published_at IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Created indexes:';
    RAISE NOTICE '  - idx_blog_posts_slug (fast URL lookups)';
    RAISE NOTICE '  - idx_blog_posts_published_at (date sorting)';
    RAISE NOTICE '  - idx_blog_posts_status (draft/published filter)';
    RAISE NOTICE '  - idx_blog_posts_published_sorted (composite query optimization)';
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
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS TRIGGER AS $trigger$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;

-- Create trigger
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_blog_posts_updated_at();

COMMENT ON FUNCTION public.update_blog_posts_updated_at() IS
    'Automatically updates the updated_at timestamp whenever a blog post is modified';

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

-- Enable RLS on blog_posts table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS enabled on blog_posts table';
END $$;

-- =====================================================
-- ADMIN POLICIES: Full CRUD Access for Admins
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating ADMIN policies (full CRUD access)...';
END $$;

-- Admin SELECT policy: View all posts (drafts and published)
DROP POLICY IF EXISTS admin_select_blog_posts ON public.blog_posts;
CREATE POLICY admin_select_blog_posts
ON public.blog_posts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_select_blog_posts ON public.blog_posts IS
    'Admins can view all blog posts regardless of status';

-- Admin INSERT policy: Create new posts
DROP POLICY IF EXISTS admin_insert_blog_posts ON public.blog_posts;
CREATE POLICY admin_insert_blog_posts
ON public.blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_insert_blog_posts ON public.blog_posts IS
    'Admins can create new blog posts';

-- Admin UPDATE policy: Edit any post
DROP POLICY IF EXISTS admin_update_blog_posts ON public.blog_posts;
CREATE POLICY admin_update_blog_posts
ON public.blog_posts
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

COMMENT ON POLICY admin_update_blog_posts ON public.blog_posts IS
    'Admins can update any blog post';

-- Admin DELETE policy: Delete any post
DROP POLICY IF EXISTS admin_delete_blog_posts ON public.blog_posts;
CREATE POLICY admin_delete_blog_posts
ON public.blog_posts
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_delete_blog_posts ON public.blog_posts IS
    'Admins can delete blog posts';

DO $$
BEGIN
    RAISE NOTICE 'Admin policies created: SELECT, INSERT, UPDATE, DELETE';
END $$;

-- =====================================================
-- PUBLIC POLICIES: Read-Only Access to Published Posts
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating PUBLIC policies (read-only published content)...';
END $$;

-- Public SELECT policy: View published posts only
DROP POLICY IF EXISTS public_select_blog_posts ON public.blog_posts;
CREATE POLICY public_select_blog_posts
ON public.blog_posts
FOR SELECT
TO authenticated, anon
USING (
    status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
);

COMMENT ON POLICY public_select_blog_posts ON public.blog_posts IS
    'Public users can only view published posts that have a published_at date in the past';

DO $$
BEGIN
    RAISE NOTICE 'Public policy created: SELECT (published posts only)';
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
    WHERE pn.nspname = 'public' AND pc.relname = 'blog_posts';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS is ENABLED on blog_posts table';
    ELSE
        RAISE WARNING '✗ RLS is DISABLED - security risk!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'blog_posts';

    RAISE NOTICE '✓ Total RLS policies: %', policy_count;
    RAISE NOTICE '';

    RAISE NOTICE 'Schema created:';
    RAISE NOTICE '  - blog_posts table with 10 columns';
    RAISE NOTICE '  - 4 performance indexes';
    RAISE NOTICE '  - Auto-update trigger for updated_at';
    RAISE NOTICE '';

    RAISE NOTICE 'Security configured:';
    RAISE NOTICE '  - Admins: Full CRUD access (4 policies)';
    RAISE NOTICE '  - Public: Read-only published posts (1 policy)';
    RAISE NOTICE '  - Anonymous: Same as public';
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 012 to create site_sections table';
    RAISE NOTICE '  2. Run migration 014 to seed blog posts from staticPosts.ts';
    RAISE NOTICE '  3. Test RLS policies with VERIFY script';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 011 COMPLETE';
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
-- DROP POLICY IF EXISTS admin_select_blog_posts ON public.blog_posts;
-- DROP POLICY IF EXISTS admin_insert_blog_posts ON public.blog_posts;
-- DROP POLICY IF EXISTS admin_update_blog_posts ON public.blog_posts;
-- DROP POLICY IF EXISTS admin_delete_blog_posts ON public.blog_posts;
-- DROP POLICY IF EXISTS public_select_blog_posts ON public.blog_posts;
--
-- -- Drop trigger and function
-- DROP TRIGGER IF EXISTS trigger_update_blog_posts_updated_at ON public.blog_posts;
-- DROP FUNCTION IF EXISTS public.update_blog_posts_updated_at();
--
-- -- Drop indexes (cascade removes dependent objects)
-- DROP INDEX IF EXISTS public.idx_blog_posts_slug CASCADE;
-- DROP INDEX IF EXISTS public.idx_blog_posts_published_at CASCADE;
-- DROP INDEX IF EXISTS public.idx_blog_posts_status CASCADE;
-- DROP INDEX IF EXISTS public.idx_blog_posts_published_sorted CASCADE;
--
-- -- Drop table (cascade removes dependent objects)
-- DROP TABLE IF EXISTS public.blog_posts CASCADE;
--
-- COMMIT;
--
-- =====================================================
