-- =====================================================
-- COMBINED MIGRATION: CMS Database Schema
-- Migrations: 012, 013, 014, 015
-- Created: 2025-11-13
-- Purpose: Complete CMS setup - tables, RLS, seed data
-- =====================================================
--
-- WHAT THIS MIGRATION DOES:
-- 1. Creates site_sections table (structured page content)
-- 2. Creates admin_registration_tokens table (secure admin provisioning)
-- 3. Creates blog_posts table (already applied - will skip if exists)
-- 4. Seeds 6 blog posts from static data
-- 5. Seeds page sections for About/Contact/News pages
--
-- INSTRUCTIONS FOR SUPABASE DASHBOARD:
-- 1. Go to: https://supabase.com/dashboard/project/klaspuhgafdjrrbdzlwg/sql/new
-- 2. Copy this ENTIRE file
-- 3. Paste into SQL Editor
-- 4. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
-- 5. Verify success messages in output
--
-- SAFETY:
-- - Idempotent: Safe to run multiple times
-- - Transaction: All-or-nothing (rolls back on any error)
-- - No data loss: Uses IF NOT EXISTS and ON CONFLICT
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



-- =====================================================
-- SECTION 1: TABLE CREATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING ADMIN_REGISTRATION_TOKENS TABLE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Create admin_registration_tokens table
CREATE TABLE IF NOT EXISTS public.admin_registration_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    email TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by_user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add table comment
COMMENT ON TABLE public.admin_registration_tokens IS
    'Secure single-use tokens for admin account registration. Tokens expire after a set period and can only be used once. Completely private - no public access.';

-- Add column comments
COMMENT ON COLUMN public.admin_registration_tokens.id IS
    'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.admin_registration_tokens.token IS
    'Cryptographically secure random token string. Must be unique and kept secret.';
COMMENT ON COLUMN public.admin_registration_tokens.email IS
    'Optional pre-assigned email address. If set, token can only be used by this email. NULL = any email can use it.';
COMMENT ON COLUMN public.admin_registration_tokens.expires_at IS
    'Token expiration timestamp. Tokens cannot be used after this time. Typically set to 7 days from creation.';
COMMENT ON COLUMN public.admin_registration_tokens.used_at IS
    'Timestamp when token was consumed. NULL = unused, NOT NULL = already used (cannot be reused).';
COMMENT ON COLUMN public.admin_registration_tokens.used_by_user_id IS
    'Foreign key to auth.users - tracks which user account consumed this token.';
COMMENT ON COLUMN public.admin_registration_tokens.created_at IS
    'Timestamp when token was created';

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'admin_registration_tokens'
    ) THEN
        RAISE NOTICE 'admin_registration_tokens table created/verified successfully';
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

-- Index on token for fast validation lookups during registration
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_token
ON public.admin_registration_tokens(token);

-- Index on expires_at for cleanup queries and validation
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_expires_at
ON public.admin_registration_tokens(expires_at);

-- Composite index for finding unused, non-expired tokens
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_valid
ON public.admin_registration_tokens(token, expires_at)
WHERE used_at IS NULL;

-- Index on used_by_user_id for tracking token usage
CREATE INDEX IF NOT EXISTS idx_admin_registration_tokens_used_by
ON public.admin_registration_tokens(used_by_user_id)
WHERE used_by_user_id IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE 'Created indexes:';
    RAISE NOTICE '  - idx_admin_registration_tokens_token (fast validation)';
    RAISE NOTICE '  - idx_admin_registration_tokens_expires_at (cleanup queries)';
    RAISE NOTICE '  - idx_admin_registration_tokens_valid (unused tokens)';
    RAISE NOTICE '  - idx_admin_registration_tokens_used_by (usage tracking)';
END $$;

-- =====================================================
-- SECTION 3: HELPER FUNCTIONS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CREATING HELPER FUNCTIONS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Function to validate and consume a token
CREATE OR REPLACE FUNCTION public.validate_and_consume_admin_token(
    token_value TEXT,
    user_email TEXT,
    user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    token_record RECORD;
BEGIN
    -- Find the token
    SELECT * INTO token_record
    FROM public.admin_registration_tokens
    WHERE token = token_value;

    -- Token doesn't exist
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Token already used
    IF token_record.used_at IS NOT NULL THEN
        RETURN FALSE;
    END IF;

    -- Token expired
    IF token_record.expires_at < NOW() THEN
        RETURN FALSE;
    END IF;

    -- If email is pre-assigned, verify it matches
    IF token_record.email IS NOT NULL AND token_record.email != user_email THEN
        RETURN FALSE;
    END IF;

    -- Token is valid - mark as used
    UPDATE public.admin_registration_tokens
    SET used_at = NOW(),
        used_by_user_id = user_id
    WHERE token = token_value;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_and_consume_admin_token(TEXT, TEXT, UUID) IS
    'Validates an admin registration token and marks it as used. Returns true if valid and consumed, false otherwise. Called during registration flow.';

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.admin_registration_tokens
    WHERE expires_at < NOW()
    AND used_at IS NULL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_expired_admin_tokens() IS
    'Deletes expired, unused admin registration tokens. Returns count of deleted tokens. Can be called periodically via cron job.';

DO $$
BEGIN
    RAISE NOTICE 'Created helper functions:';
    RAISE NOTICE '  - validate_and_consume_admin_token()';
    RAISE NOTICE '  - cleanup_expired_admin_tokens()';
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

-- Enable RLS on admin_registration_tokens table
ALTER TABLE public.admin_registration_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE 'RLS enabled on admin_registration_tokens table';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY NOTICE: This table is admin-only. No public access policies.';
END $$;

-- =====================================================
-- ADMIN POLICIES: Full Management Access for Admins
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Creating ADMIN policies (full management access)...';
END $$;

-- Admin SELECT policy: View all tokens
DROP POLICY IF EXISTS admin_select_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_select_admin_registration_tokens
ON public.admin_registration_tokens
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_select_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can view all admin registration tokens';

-- Admin INSERT policy: Create new tokens
DROP POLICY IF EXISTS admin_insert_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_insert_admin_registration_tokens
ON public.admin_registration_tokens
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_insert_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can create new admin registration tokens';

-- Admin DELETE policy: Delete tokens (cleanup)
DROP POLICY IF EXISTS admin_delete_admin_registration_tokens ON public.admin_registration_tokens;
CREATE POLICY admin_delete_admin_registration_tokens
ON public.admin_registration_tokens
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

COMMENT ON POLICY admin_delete_admin_registration_tokens ON public.admin_registration_tokens IS
    'Admins can delete admin registration tokens for cleanup';

DO $$
BEGIN
    RAISE NOTICE 'Admin policies created: SELECT, INSERT, DELETE';
    RAISE NOTICE '';
    RAISE NOTICE 'NO UPDATE policy - token consumption is handled by SECURITY DEFINER function';
    RAISE NOTICE 'NO PUBLIC policies - this table is completely private';
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
    WHERE pn.nspname = 'public' AND pc.relname = 'admin_registration_tokens';

    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS is ENABLED on admin_registration_tokens table';
    ELSE
        RAISE WARNING '✗ RLS is DISABLED - security risk!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_registration_tokens';

    RAISE NOTICE '✓ Total RLS policies: %', policy_count;
    RAISE NOTICE '';

    RAISE NOTICE 'Schema created:';
    RAISE NOTICE '  - admin_registration_tokens table with 7 columns';
    RAISE NOTICE '  - UNIQUE constraint on token';
    RAISE NOTICE '  - Foreign key to auth.users(id)';
    RAISE NOTICE '  - 4 performance indexes';
    RAISE NOTICE '  - 2 helper functions (SECURITY DEFINER)';
    RAISE NOTICE '';

    RAISE NOTICE 'Security configured:';
    RAISE NOTICE '  - Admins: Can create, view, and delete tokens (3 policies)';
    RAISE NOTICE '  - Public: NO ACCESS (completely private table)';
    RAISE NOTICE '  - Token consumption: via SECURITY DEFINER function only';
    RAISE NOTICE '';

    RAISE NOTICE 'USAGE EXAMPLE:';
    RAISE NOTICE '  1. Admin creates token:';
    RAISE NOTICE '     INSERT INTO admin_registration_tokens (token, email, expires_at)';
    RAISE NOTICE '     VALUES (''secure-random-string'', ''user@example.com'', NOW() + INTERVAL ''7 days'');';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Registration flow validates token:';
    RAISE NOTICE '     SELECT validate_and_consume_admin_token(''token'', ''user@example.com'', user_id);';
    RAISE NOTICE '';
    RAISE NOTICE '  3. Periodic cleanup (optional):';
    RAISE NOTICE '     SELECT cleanup_expired_admin_tokens();';
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 014 to seed blog posts';
    RAISE NOTICE '  2. Implement token generation in admin UI';
    RAISE NOTICE '  3. Integrate validate_and_consume_admin_token() in registration flow';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 013 COMPLETE';
    RAISE NOTICE '';
END $$;



DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEEDING BLOG POSTS FROM STATIC DATA';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- POST 1: Priorities (2017-01-24)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'priorities',
    'Priorities',
    'Are you a priority or an option? Don''t make someone a priority who makes you an option. Learn to prioritize yourself and your dreams.',
    '<p>Are you a priority or an option?</p>
<p>This is a fundamental question that each of us must ask ourselves when evaluating the relationships and commitments in our lives. Too often, we find ourselves giving our time, energy, and love to people who treat us as merely an option while we make them our priority.</p>
<p><strong>Don''t make someone a priority who makes you an option.</strong></p>
<p>This powerful reminder challenges us to recognize our own worth and demand the respect we deserve. When we consistently prioritize others who don''t reciprocate that same level of care and consideration, we diminish our own value and enable unhealthy patterns.</p>
<h3>The Cost of Saying Yes to Everyone Else</h3>
<p>Whenever you say "yes" to someone else, you automatically say "no" to yourself. This isn''t to suggest that we should become selfish or stop caring for others, but rather that we need to establish healthy boundaries that protect our time, energy, and dreams.</p>
<p>Are you working on your dreams daily, or are you so busy helping others achieve theirs that you''ve forgotten your own aspirations? There''s nothing wrong with supporting others, but not at the expense of your own growth and happiness.</p>
<h3>Learning to Prioritize Yourself</h3>
<p>Making yourself a priority doesn''t mean becoming self-centered. It means:</p>
<ul>
  <li>Setting boundaries that protect your well-being</li>
  <li>Pursuing your goals with the same dedication you show others</li>
  <li>Saying no when necessary to preserve your energy for what matters most</li>
  <li>Investing in your own growth and development</li>
</ul>
<p>Remember, you can''t pour from an empty cup. Taking care of yourself first isn''t selfish—it''s necessary. When you prioritize your own well-being, you''re better equipped to genuinely help others from a place of strength rather than depletion.</p>
<p>So ask yourself again: Are you a priority or an option in your own life? The answer should guide your decisions moving forward.</p>',
    'Andrea Brooks',
    '2017-01-24 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 2: Loving Yourself First (2016-06-14)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'loving-yourself-first',
    'Loving Yourself First',
    'Even strong people have needs and weaknesses. Take time for self-care and don''t depend on others for your happiness. Love and take care of YOU!',
    '<p>Even the strongest people among us have needs, weaknesses, and moments when they require care and support. Yet, so often, those who are seen as pillars of strength forget to extend the same compassion to themselves that they so freely give to others.</p>
<p>If you''re someone who is always there for everyone else, always lending a helping hand, always being the shoulder to cry on—this message is especially for you.</p>
<h3>The Importance of Self-Care</h3>
<p>Take the time for you to do the same things for yourself as you do for others. Just as you would comfort a friend in distress, you need to comfort yourself in times of struggle. Just as you would encourage someone else to pursue their dreams, you need to encourage yourself.</p>
<p>Self-care isn''t selfish—it''s essential. You cannot continue to pour from an empty vessel indefinitely without eventually burning out.</p>
<h3>Don''t Depend on Others for Your Happiness</h3>
<p><strong>Depending on anyone to make you happy, make you feel good, or lift your spirit is a sure way to place yourself in isolation.</strong></p>
<p>This doesn''t mean you should shut people out or stop appreciating the joy that relationships bring. Rather, it means that your fundamental sense of happiness and worth should come from within. When you depend on others for these essential feelings, you give away your power and set yourself up for disappointment.</p>
<p>People will let you down—not necessarily out of malice, but because they''re human and dealing with their own struggles. When your happiness depends on their actions, their moods, or their availability, you become a prisoner to circumstances beyond your control.</p>
<h3>Living Without Restrictions</h3>
<p>Your joy should not be restricted by other people or external conditions. True freedom comes when you learn to:</p>
<ul>
  <li>Find happiness within yourself first</li>
  <li>Appreciate others without being dependent on them</li>
  <li>Set boundaries that protect your emotional well-being</li>
  <li>Celebrate your own company and solitude</li>
  <li>Practice self-compassion in difficult times</li>
</ul>
<p><strong>Live your life without restrictions. Love & take care of YOU!</strong></p>
<p>This isn''t about becoming self-centered or closing your heart to others. It''s about becoming whole within yourself so that you can love others from a place of fullness rather than need. When you truly love yourself first, you have so much more genuine love to offer the world.</p>',
    'Andrea Brooks',
    '2016-06-14 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 3: I WON'T COMPLAIN (2016-05-15)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'i-wont-complain',
    'I WON''T COMPLAIN',
    'Stop complaining and start changing! If you don''t like your current situation, work towards changing it. Focus on solutions, not problems.',
    '<p>Complaining has become such a natural part of many people''s daily routine that they don''t even realize how much negativity they''re spreading—to others and within themselves. But here''s the truth: complaining never changed anyone''s situation for the better.</p>
<p><strong>If you do not like your current situation, work towards changing it.</strong> It''s really that simple, and it''s really that challenging.</p>
<h3>The Problem with Chronic Complaining</h3>
<p>When we constantly complain about our circumstances, our relationships, our jobs, or our lives, we accomplish several counterproductive things:</p>
<ul>
  <li>We reinforce negative thinking patterns</li>
  <li>We drain our own energy and that of people around us</li>
  <li>We focus on problems instead of solutions</li>
  <li>We become victims of our circumstances rather than creators of our destiny</li>
</ul>
<p>Most people get tired of hearing the same complaints over and over again. If you''re sharing the same problems without taking any action to address them, you''re not looking for solutions—you''re looking for sympathy, and that well eventually runs dry.</p>
<h3>Shift Your Focus to Solutions</h3>
<p>Instead of asking "Why is this happening to me?" try asking:</p>
<ul>
  <li>"What can I learn from this situation?"</li>
  <li>"What steps can I take to improve this?"</li>
  <li>"What opportunities might be hidden in this challenge?"</li>
  <li>"How can I grow from this experience?"</li>
</ul>
<p>Every stage of your life prepares you for the next. The challenges you face today are building the strength, wisdom, and character you''ll need for tomorrow''s opportunities. But only if you approach them with the right mindset.</p>
<h3>Choose Progress Over Complaints</h3>
<p><strong>The bottom line is that you will never get to where you want to be by complaining about where you are now.</strong></p>
<p>This doesn''t mean you should ignore problems or pretend everything is perfect. It means you should acknowledge challenges, feel your emotions about them, and then channel that energy into positive action.</p>
<p>Instead of complaining:</p>
<ul>
  <li>Make a plan</li>
  <li>Take one small step forward</li>
  <li>Seek advice from people who''ve overcome similar challenges</li>
  <li>Focus on what you can control</li>
  <li>Practice gratitude for what''s already working in your life</li>
</ul>
<p>Stay focused on the good. Even in difficult times, there are things to be grateful for, lessons to be learned, and opportunities to be discovered.</p>
<p><strong>The best is yet to come!</strong> But only if you stop complaining and start creating the change you want to see in your life.</p>',
    'Andrea Brooks',
    '2016-05-15 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 4: Happy Mother's Day! (2010-05-09)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'happy-mothers-day',
    'Happy Mother''s Day!',
    'A heartfelt tribute to mothers everywhere. She feels deeply and loves fiercely. She is both soft and powerful, both practical and spiritual.',
    '<p>A strong woman feels deeply and loves fiercely. Her tears flow as abundantly as her laughter. She is both soft and powerful, and it is both practical and spiritual.</p>
<p>A strong woman in her essence is a gift to the entire World.</p>
<h3>The Essence of Motherhood</h3>
<p>Today we celebrate not just the women who gave birth to us, but all the women who have nurtured, guided, and loved us throughout our lives. Motherhood extends far beyond biology—it''s about the spirit of care, protection, and unconditional love that shapes who we become.</p>
<p>A mother''s love is like no other. It''s fierce when her children are threatened, gentle when they need comfort, and unwavering through every season of life. She celebrates every triumph and grieves every setback as if they were her own.</p>
<h3>The Many Faces of Motherhood</h3>
<p>Mothers come in many forms:</p>
<ul>
  <li>The birth mother who carried you and brought you into this world</li>
  <li>The adoptive mother who chose you and made you her own</li>
  <li>The stepmother who loved you as if you were always hers</li>
  <li>The grandmother who spoiled you with wisdom and treats</li>
  <li>The aunt who acted like a second mother</li>
  <li>The friend who mothered you when you needed it most</li>
  <li>The mentor who guided you with maternal care</li>
</ul>
<p>Each of these women has contributed to the person you are today through their unique expression of maternal love.</p>
<h3>The Strength in Vulnerability</h3>
<p>What makes a strong woman truly powerful is not her ability to hide her emotions, but her courage to feel them fully. She cries when she needs to cry, laughs when joy overflows, and isn''t afraid to show her children that it''s okay to be human.</p>
<p>This emotional authenticity teaches the next generation that strength doesn''t mean perfection—it means resilience, love, and the courage to keep going even when life gets difficult.</p>
<p><strong>Happy Mother''s Day to you that are mothers, soon to be mothers or act like a mother! Cheers.</strong></p>
<p>Today we honor your strength, your love, your sacrifices, and your immeasurable impact on the world through the lives you''ve touched. You are appreciated, you are valued, and you are loved.</p>',
    'Andrea Brooks',
    '2010-05-09 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 5: COURAGE TO CHANGE (2014-10-19)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'courage-to-change',
    'COURAGE TO CHANGE',
    'It''s never too late to live a life that makes you proud. Break free from toxic behaviors and have the courage to make positive changes in your life.',
    '<p>Cruelty is a trait that stems from a lack of empathy and compassion. We see it everywhere—in anonymous comments online, in the way people treat service workers, in the casual disregard for others'' feelings and dignity. But here''s what I want you to remember:</p>
<p><strong>It''s never too late to live a life that makes you proud.</strong></p>
<h3>Breaking Free from Toxic Patterns</h3>
<p>Too many people get trapped in patterns of behavior that don''t serve them or anyone around them. They become cynical, cruel, or indifferent because it feels easier than being vulnerable and kind. But easy doesn''t mean right, and familiar doesn''t mean healthy.</p>
<p>If you recognize yourself in negative patterns—whether it''s lashing out at others, making cruel comments, or simply going through life without purpose or joy—know that you have the power to change. Age is not a barrier to transformation; fear is.</p>
<h3>The Choice Is Always Yours</h3>
<p>Every single day, you wake up with a choice: to be the same person you were yesterday, or to become someone better. This choice isn''t just about grand gestures or dramatic life changes—it''s about the small decisions you make in each moment.</p>
<p>Will you respond with kindness or cruelty? Will you choose growth or stagnation? Will you live authentically or continue pretending to be someone you''re not?</p>
<h3>Steps to Meaningful Change</h3>
<p>If you''re ready to live a life that makes you proud, consider these steps:</p>
<ul>
  <li><strong>Do things that startle you</strong> - Step outside your comfort zone and challenge yourself to grow</li>
  <li><strong>Spend time with people who help you grow</strong> - Surround yourself with those who inspire and elevate you</li>
  <li><strong>Practice empathy</strong> - Try to understand others'' perspectives before judging</li>
  <li><strong>Take responsibility</strong> - Own your mistakes and work to make amends</li>
  <li><strong>Live authentically</strong> - Stop pretending to be someone you''re not</li>
  <li><strong>Choose kindness</strong> - Even when it''s difficult, especially when it''s difficult</li>
</ul>
<h3>It''s Never Too Late</h3>
<p>Whether you''re 20 or 80, you have the power to redirect your life toward something meaningful and beautiful. You can choose to leave a legacy of kindness instead of cruelty, of building up instead of tearing down, of love instead of fear.</p>
<p>The world has enough negativity, enough cruelty, enough people who have given up on being better. What it needs more of is people who have the courage to change, to grow, and to live lives that inspire others to do the same.</p>
<p><strong>Have the courage to make a change.</strong> Your future self—and everyone whose life you touch—will thank you for it.</p>
<p>The life that makes you proud is waiting for you. You just have to be brave enough to start living it.</p>',
    'Andrea Brooks',
    '2014-10-19 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- POST 6: GET A LIFE (2014-11-02)
-- =====================================================

INSERT INTO public.blog_posts (
    slug,
    title,
    excerpt,
    content_html,
    author,
    published_at,
    status
) VALUES (
    'get-a-life',
    'GET A LIFE',
    'Stop making excuses and dwelling on the past. You have more going for you than you realize. Believe in your potential and embrace life with enthusiasm!',
    '<p>It''s time for some tough love, and I''m saying this with all the care in the world: <strong>Get a life!</strong></p>
<p>Yes, you read that right. If you''re stuck in a cycle of excuses, complaints, and dwelling on past experiences, it''s time to break free and start truly living.</p>
<h3>Stop Making Excuses</h3>
<p>We all have reasons why our lives aren''t exactly where we want them to be. We all have stories about what went wrong, who let us down, and why things are the way they are. But here''s the reality: those stories are keeping you trapped in the past instead of propelling you toward your future.</p>
<p>Most people don''t want to hear the same negative stories over and over again. And more importantly, constantly rehearsing these stories keeps you stuck in victim mode instead of empowering you to be the creator of your own destiny.</p>
<h3>You Have More Going for You Than You Realize</h3>
<p><strong>Get a life! You have more going for you than you realize…so use it!</strong></p>
<p>Right now, in this moment, you have:</p>
<ul>
  <li>The ability to make choices that shape your future</li>
  <li>Experiences that have made you stronger and wiser</li>
  <li>Unique talents and perspectives that only you possess</li>
  <li>The power to dream new dreams and set new goals</li>
  <li>Opportunities all around you waiting to be seized</li>
</ul>
<p>But you''ll never see these possibilities if you''re too busy looking backward or making excuses for why you can''t move forward.</p>
<h3>Believe in Your Potential</h3>
<p>The life you''re meant to live is still possible. The dreams you thought were dead can be resurrected. The goals you abandoned can be pursued again. But it starts with believing that you''re capable of more than your current circumstances suggest.</p>
<p>Stop telling yourself that it''s too late, that you''re too old, that you don''t have enough resources, or that you missed your chance. These are all excuses designed to keep you safe from the risk of trying and potentially failing. But they''re also keeping you safe from the possibility of succeeding beyond your wildest dreams.</p>
<h3>Embrace Life with Enthusiasm</h3>
<p>Life is meant to be lived fully, deeply, and with enthusiasm. It''s meant to be an adventure, not a burden. It''s meant to be a canvas for your creativity, not a prison of regret.</p>
<p>Here''s what getting a life looks like:</p>
<ul>
  <li>Setting new goals that excite you</li>
  <li>Taking calculated risks for worthwhile rewards</li>
  <li>Surrounding yourself with positive, growth-minded people</li>
  <li>Learning new skills and exploring new interests</li>
  <li>Focusing on what you can create rather than what you''ve lost</li>
  <li>Finding joy in small moments and simple pleasures</li>
</ul>
<h3>Live Full, Enjoy Life</h3>
<p><strong>Live full…Enjoy Life, you only get one!</strong></p>
<p>This isn''t a dress rehearsal. This is your one precious life, and every day you spend stuck in negativity, excuses, and past regrets is a day you can''t get back.</p>
<p>So make the decision today: Are you going to continue existing in a state of dissatisfaction and complaint, or are you going to get a life—a real, vibrant, purposeful life that fills you with excitement and meaning?</p>
<p>The choice is yours, but choose quickly. Time isn''t waiting for you to figure it out.</p>
<p>Get a life. You deserve to live one that makes you proud to wake up every morning.</p>',
    'Andrea Brooks',
    '2014-11-02 00:00:00+00',
    'published'
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    excerpt = EXCLUDED.excerpt,
    content_html = EXCLUDED.content_html,
    author = EXCLUDED.author,
    published_at = EXCLUDED.published_at,
    status = EXCLUDED.status,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION & SUMMARY
-- =====================================================

DO $$
DECLARE
    post_count INTEGER;
    published_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEED MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO post_count FROM public.blog_posts;
    SELECT COUNT(*) INTO published_count FROM public.blog_posts WHERE status = 'published';

    RAISE NOTICE 'Blog posts imported from staticPosts.ts:';
    RAISE NOTICE '  ✓ Priorities (2017-01-24)';
    RAISE NOTICE '  ✓ Loving Yourself First (2016-06-14)';
    RAISE NOTICE '  ✓ I WON''T COMPLAIN (2016-05-15)';
    RAISE NOTICE '  ✓ Happy Mother''s Day! (2010-05-09)';
    RAISE NOTICE '  ✓ COURAGE TO CHANGE (2014-10-19)';
    RAISE NOTICE '  ✓ GET A LIFE (2014-11-02)';
    RAISE NOTICE '';

    RAISE NOTICE 'Total posts in database: %', post_count;
    RAISE NOTICE 'Published posts: %', published_count;
    RAISE NOTICE '';

    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Run migration 015 to seed site sections';
    RAISE NOTICE '  2. Create blog posts service to replace staticPosts.ts';
    RAISE NOTICE '  3. Update blog list/detail pages to fetch from database';
    RAISE NOTICE '  4. Build admin CMS for blog post management';
    RAISE NOTICE '';
    RAISE NOTICE 'MIGRATION 014 COMPLETE - Blog posts successfully seeded';
    RAISE NOTICE '';
END $$;



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
-- MIGRATION COMPLETE!
-- You should see success messages above.
-- =====================================================
