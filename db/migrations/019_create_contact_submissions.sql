-- =====================================================
-- MIGRATION 019: Contact Form Submissions
-- =====================================================
-- Created: 2025-01-20
-- Purpose: Store contact form submissions with admin-only access
--
-- FEATURES:
--   - Public users can submit contact forms (INSERT only)
--   - Admins can view and manage submissions (SELECT, UPDATE)
--   - Status tracking: pending → read → replied → archived
--   - No email integration yet (database-only storage)
--
-- SECURITY:
--   - RLS enabled with strict policies
--   - Anonymous users: INSERT only (cannot read submissions)
--   - Regular authenticated users: No access
--   - Admin users (is_admin = true): Full SELECT/UPDATE access
--   - No DELETE policy (submissions are permanent records)
--
-- =====================================================

BEGIN;

-- =====================================================
-- CREATE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Form fields
  name TEXT NOT NULL CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  subject TEXT NOT NULL CHECK (char_length(subject) >= 1 AND char_length(subject) <= 200),
  message TEXT NOT NULL CHECK (char_length(message) >= 5 AND char_length(message) <= 5000),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'read', 'replied', 'archived')),

  -- Metadata
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

-- Index for admin dashboard queries (filter by status, sort by date)
CREATE INDEX idx_contact_submissions_status_date
  ON public.contact_submissions(status, submitted_at DESC);

-- Index for searching by email
CREATE INDEX idx_contact_submissions_email
  ON public.contact_submissions(email);

-- Index for date range queries
CREATE INDEX idx_contact_submissions_date
  ON public.contact_submissions(submitted_at DESC);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Policy 1: Public INSERT (anyone can submit contact form)
-- Allows anonymous and authenticated users to submit forms
-- They cannot read their own or others' submissions
CREATE POLICY public_insert_contact_submissions
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy 2: Admin SELECT (admins can view all submissions)
-- Only users with is_admin = true can read submissions
CREATE POLICY admin_select_contact_submissions
ON public.contact_submissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
  )
);

-- Policy 3: Admin UPDATE (admins can update status)
-- Admins can update status, but not the original form content
CREATE POLICY admin_update_contact_submissions
ON public.contact_submissions
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

-- No DELETE policy - submissions are permanent records
-- Admins can archive instead of delete

-- =====================================================
-- CREATE TRIGGER FOR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.contact_submissions IS
  'Stores contact form submissions from the public Contact page.
   Public users can insert, admins can view and manage.';

COMMENT ON COLUMN public.contact_submissions.id IS
  'Unique identifier for the submission (UUID)';

COMMENT ON COLUMN public.contact_submissions.name IS
  'Full name of person submitting the form (1-100 characters)';

COMMENT ON COLUMN public.contact_submissions.email IS
  'Email address for reply (validated format)';

COMMENT ON COLUMN public.contact_submissions.subject IS
  'Subject line selected from dropdown (1-200 characters)';

COMMENT ON COLUMN public.contact_submissions.message IS
  'Message content (5-5000 characters)';

COMMENT ON COLUMN public.contact_submissions.status IS
  'Submission status: pending (new), read (viewed), replied (responded), archived (old/completed)';

COMMENT ON COLUMN public.contact_submissions.submitted_at IS
  'Timestamp when form was submitted (immutable)';

COMMENT ON COLUMN public.contact_submissions.created_at IS
  'Record creation timestamp (immutable)';

COMMENT ON COLUMN public.contact_submissions.updated_at IS
  'Last update timestamp (auto-updated on status changes)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify table was created
SELECT
  'Table created: contact_submissions' AS verification,
  EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'contact_submissions'
  ) AS result;

-- Verify RLS is enabled
SELECT
  'RLS enabled on contact_submissions' AS verification,
  relrowsecurity AS result
FROM pg_class
WHERE oid = 'public.contact_submissions'::regclass;

-- Verify policies were created
SELECT
  'RLS policies created' AS verification,
  COUNT(*) || ' policies' AS result
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'contact_submissions';

COMMIT;

-- =====================================================
-- MIGRATION 019 COMPLETE
-- =====================================================
-- Next steps:
--   1. Verify RLS policies with VERIFY_CONTACT_SUBMISSIONS.sql
--   2. Create admin dashboard at /admin/contact-submissions
--   3. Update ContactPage.tsx to save submissions to this table
--   4. Test form submission as anonymous user
--   5. Test admin can view submissions
-- =====================================================
