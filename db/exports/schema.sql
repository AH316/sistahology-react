-- =====================================================
-- SISTAHOLOGY DATABASE SCHEMA EXPORT
-- Generated: 2025-08-25
-- Purpose: Security audit and RLS review
-- =====================================================
-- NOTE: This is a reconstructed schema based on code analysis
-- For production audit, use pg_dump with database connection
-- =====================================================

-- =====================================================
-- CORE TABLES
-- =====================================================

-- profiles table (user profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- journal table (user journals)
CREATE TABLE IF NOT EXISTS public.journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    journal_name TEXT NOT NULL,
    color TEXT DEFAULT '#F5C3E2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_user_id ON public.journal(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON public.journal(created_at DESC);

-- entry table (journal entries)
CREATE TABLE IF NOT EXISTS public.entry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES public.journal(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_entry_journal_id ON public.entry(journal_id);
CREATE INDEX IF NOT EXISTS idx_entry_user_id ON public.entry(user_id);
CREATE INDEX IF NOT EXISTS idx_entry_date ON public.entry(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_entry_archived ON public.entry(is_archived);
CREATE INDEX IF NOT EXISTS idx_entry_content_search ON public.entry USING gin(to_tsvector('english', content));

-- pages table (CMS content)
CREATE TABLE IF NOT EXISTS public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content_html TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) CONFIGURATION
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - PROFILES TABLE
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE 
    USING (auth.uid() = id);

-- =====================================================
-- RLS POLICIES - JOURNAL TABLE
-- =====================================================

-- Users can view their own journals
CREATE POLICY "Users can view own journals" ON public.journal
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can create journals for themselves
CREATE POLICY "Users can create own journals" ON public.journal
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own journals
CREATE POLICY "Users can update own journals" ON public.journal
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own journals
CREATE POLICY "Users can delete own journals" ON public.journal
    FOR DELETE 
    USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - ENTRY TABLE
-- =====================================================

-- Users can view entries from their own journals
CREATE POLICY "Users can view own entries" ON public.entry
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.journal 
            WHERE journal.id = entry.journal_id 
            AND journal.user_id = auth.uid()
        )
    );

-- Users can create entries in their own journals
CREATE POLICY "Users can create entries in own journals" ON public.entry
    FOR INSERT 
    WITH CHECK (
        auth.uid() = user_id 
        AND 
        EXISTS (
            SELECT 1 FROM public.journal 
            WHERE journal.id = entry.journal_id 
            AND journal.user_id = auth.uid()
        )
    );

-- Users can update their own entries
CREATE POLICY "Users can update own entries" ON public.entry
    FOR UPDATE 
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.journal 
            WHERE journal.id = entry.journal_id 
            AND journal.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.journal 
            WHERE journal.id = entry.journal_id 
            AND journal.user_id = auth.uid()
        )
    );

-- Users can delete their own entries
CREATE POLICY "Users can delete own entries" ON public.entry
    FOR DELETE 
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.journal 
            WHERE journal.id = entry.journal_id 
            AND journal.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS POLICIES - PAGES TABLE (CMS)
-- =====================================================

-- Everyone can read pages (public content)
CREATE POLICY "Public can view pages" ON public.pages
    FOR SELECT 
    USING (true);

-- Only admins can insert pages
CREATE POLICY "Admins can insert pages" ON public.pages
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Only admins can update pages
CREATE POLICY "Admins can update pages" ON public.pages
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_app_meta_data->>'role' = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Only admins can delete pages
CREATE POLICY "Admins can delete pages" ON public.pages
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_updated_at BEFORE UPDATE ON public.journal
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_entry_updated_at BEFORE UPDATE ON public.entry
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- CONSTRAINTS AND VALIDATIONS
-- =====================================================

-- Ensure entry dates are not in the future
ALTER TABLE public.entry ADD CONSTRAINT check_entry_date_not_future 
    CHECK (entry_date <= CURRENT_DATE);

-- Ensure journal names are not empty
ALTER TABLE public.journal ADD CONSTRAINT check_journal_name_not_empty 
    CHECK (LENGTH(TRIM(journal_name)) > 0);

-- Ensure page slugs are URL-safe
ALTER TABLE public.pages ADD CONSTRAINT check_page_slug_format 
    CHECK (slug ~ '^[a-z0-9-]+$');

-- =====================================================
-- END OF SCHEMA EXPORT
-- =====================================================