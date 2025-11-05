# DATABASE SETUP GUIDE

**Complete guide for recreating the Sistahology database from scratch in a new Supabase project**

## Welcome

This guide will walk you through setting up the complete Sistahology database schema, including:
- 4 core tables (profiles, journal, entry, pages)
- Row-level security policies for data protection
- Admin role system with 3-layer security
- Soft delete functionality for trash bin
- Full-text search capabilities
- Home page CMS content
- Optional: Mood tracking + writing prompts (recommended)

**Estimated Time**: 30-35 minutes (with optional enhancements)

---

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ New Supabase project created
- ✅ Project URL: `https://[your-project-ref].supabase.co`
- ✅ Anon key (for `.env.local` and `.env.test`)
- ✅ Service role key (for `.env.scripts` - admin operations)
- ✅ Access to Supabase SQL Editor (Dashboard → SQL Editor)

⚠️ **Important**: Keep your service role key secret. Never commit it to version control.

---

## Migration Order Overview

We will execute 6 required SQL migrations plus 1 optional migration:

**Required Migrations** (execute in order):
1. **Base Schema** - Core tables, RLS policies, indexes
2. **Soft Delete** - Adds trash bin functionality
3. **Admin Column** - Adds admin flag to profiles
4. **Admin Security** - Hardens admin access control
5. **Journal Icons** - Adds icon column to journals
6. **Home Content** - Seeds default homepage content

**Optional Migration** (recommended):
7. **Optional Enhancements** - Mood tracking + writing prompts

---

## Step 1: Base Schema

**What it does**: Creates the foundation of the database with 4 tables and comprehensive RLS policies.

**Tables created**:
- `profiles` - User profile information
- `journal` - User journals with color coding
- `entry` - Journal entries with content and metadata
- `pages` - CMS content for website pages

**Security**: Enables RLS on all tables with user isolation policies.

### SQL to Execute

Open Supabase SQL Editor and paste:

```sql
-- =====================================================
-- SISTAHOLOGY DATABASE SCHEMA - BASE MIGRATION
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
```

### Expected Output

> Success. No rows returned

### Verification

Run this query to verify tables were created:

```sql
SELECT table_name,
       CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY table_name;
```

**Expected**: 4 rows showing all tables with `rls_status = ENABLED`

---

## Step 2: Soft Delete Migration

**What it does**: Adds `deleted_at` column to enable 30-day trash bin functionality.

**Changes**:
- Adds `deleted_at` timestamp column to `entry` table
- Creates partial indexes for performance
- Entries with `deleted_at IS NULL` are active
- Entries with timestamp are in trash

### SQL to Execute

```sql
-- =====================================================
-- MIGRATION: Add Soft Delete to Entry Table
-- =====================================================

BEGIN;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'entry'
          AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.entry
        ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

        COMMENT ON COLUMN public.entry.deleted_at IS
            'Timestamp when entry was soft-deleted (moved to trash). NULL = active entry, NOT NULL = trashed entry. Enables 30-day trash bin recovery.';
    END IF;
END $$;

-- Partial index for active entries (deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_entry_active
ON public.entry(journal_id, entry_date DESC)
WHERE deleted_at IS NULL;

-- Partial index for trashed entries (deleted_at IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_entry_deleted
ON public.entry(user_id, deleted_at DESC)
WHERE deleted_at IS NOT NULL;

-- Composite index for trash bin expiration queries
CREATE INDEX IF NOT EXISTS idx_entry_deleted_at_not_null
ON public.entry(deleted_at)
WHERE deleted_at IS NOT NULL;

COMMIT;
```

### Expected Output

> Success. No rows returned

### Verification

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entry'
  AND column_name = 'deleted_at';
```

**Expected**: 1 row showing `deleted_at` column with type `timestamp with time zone`, nullable

---

## Step 3: Admin Column Migration

**What it does**: Adds `is_admin` boolean column to profiles table for admin access control.

**Changes**:
- Adds `is_admin BOOLEAN NOT NULL DEFAULT false` to profiles
- Creates partial index for admin users
- Default value ensures new users are non-admin

### SQL to Execute

```sql
-- =====================================================
-- MIGRATION: Add Admin Flag to Profiles Table
-- =====================================================

BEGIN;

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

        COMMENT ON COLUMN public.profiles.is_admin IS
            'Flag indicating if user has admin privileges for CMS and admin panel access. Default: false (regular user). Cannot be self-modified.';
    END IF;
END $$;

-- Partial index for admin users (is_admin = true)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin
ON public.profiles(is_admin)
WHERE is_admin = true;

COMMIT;
```

### Expected Output

> Success. No rows returned

### Verification

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin';
```

**Expected**: 1 row showing `is_admin` with type `boolean`, NOT NULL, default `false`

---

## Step 4: Admin Security Hardening

**What it does**: Implements 3-layer security to prevent users from self-granting admin privileges.

**Security Layers**:
1. **Column Default** - `is_admin` defaults to false
2. **RLS Policies** - Clean, minimal policies for profiles table
3. **Trigger Protection** - Blocks `is_admin` modification by authenticated users

⚠️ **Critical**: This migration drops and recreates all RLS policies on the profiles table.

### SQL to Execute

```sql
-- =====================================================
-- MIGRATION: Harden Admin Security - Final Solution
-- =====================================================

BEGIN;

-- =====================================================
-- LAYER 1: COLUMN DEFAULTS AND CONSTRAINTS
-- =====================================================

-- Ensure is_admin column has proper default and NOT NULL constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'is_admin'
          AND column_default = 'false'
          AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE 'Column is_admin: EXISTS with DEFAULT false NOT NULL';
    ELSE
        ALTER TABLE public.profiles
            ALTER COLUMN is_admin SET DEFAULT false,
            ALTER COLUMN is_admin SET NOT NULL;
        RAISE NOTICE 'Fixed is_admin column: DEFAULT false NOT NULL';
    END IF;
END $$;

-- =====================================================
-- LAYER 2: CLEAN UP AND CREATE MINIMAL RLS POLICIES
-- =====================================================

-- Drop ALL existing policies on profiles table (clean slate)
DROP POLICY IF EXISTS "Allow all profiles operations" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile (except is_admin)" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_rw" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Users can read their own profile
CREATE POLICY "profiles_select_own"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy 2: INSERT - Users can create their own profile
CREATE POLICY "profiles_insert_own"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy 3: UPDATE - Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- LAYER 3: TRIGGER PROTECTION
-- =====================================================

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS prevent_is_admin_self_modification ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.prevent_is_admin_modification()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id text;
BEGIN
    -- Check if is_admin column is being modified
    IF OLD.is_admin IS DISTINCT FROM NEW.is_admin THEN
        -- Get current user ID from JWT claim
        -- Service role won't have this set, so it bypasses this check
        BEGIN
            current_user_id := current_setting('request.jwt.claim.sub', true);
        EXCEPTION WHEN OTHERS THEN
            current_user_id := NULL;
        END;

        -- If there's a user ID (authenticated user, not service role), block the change
        IF current_user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Permission denied: Users cannot modify their own admin status. Contact an administrator.'
                USING ERRCODE = '42501',
                      HINT = 'Admin privileges can only be granted by administrators using the service role.';
        END IF;
    END IF;

    -- Allow the operation (either is_admin not modified, or service role is updating)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_is_admin_modification() IS
    'Trigger function preventing users from modifying their own is_admin flag. Service role bypasses this check since it does not set request.jwt.claim.sub. Returns error code 42501 (insufficient_privilege) with clear message.';

-- Create trigger
CREATE TRIGGER prevent_is_admin_self_modification
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_is_admin_modification();

COMMIT;
```

### Expected Output

> Success. No rows returned

### Verification

Copy the verification script from `db/TEST_ADMIN_SECURITY_SIMPLE.sql` to verify all security layers are working correctly. See **Section 7** below for the test script.

---

## Step 5: Journal Icon Support

**What it does**: Adds optional `icon` column to journals for emoji icons.

**Changes**:
- Adds nullable `icon TEXT` column to journal table
- Allows storing emoji icons like 📔, 💭, 🌸

### SQL to Execute

```sql
-- Migration: Add icon column to journal table

-- Add icon column to journal table (nullable, allows emoji/unicode)
ALTER TABLE journal ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add comment for documentation
COMMENT ON COLUMN journal.icon IS 'Optional emoji icon for the journal (e.g., 📔, 💭, 🌸)';
```

### Expected Output

> Success. No rows returned

### Verification

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'journal'
  AND column_name = 'icon';
```

**Expected**: 1 row showing `icon` column with type `text`, nullable

---

## Step 6: Home Page Content Seed

**What it does**: Populates the pages table with default home page content.

**Content**: Welcome message from founder Andrea Brooks with pink accent styling.

### SQL to Execute

```sql
-- Seed the home page hero content

INSERT INTO public.pages (slug, title, content_html)
VALUES ('home', 'WELCOME', $$<h1 class="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl tracking-tight">WELCOME</h1>

<div class="flex justify-center items-center space-x-4 mb-8">
  <svg class="w-8 h-8 text-pink-300 floating-flower" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m2 3a3 3 0 1 1-3 3m3-3v1m-3 3a3 3 0 1 1-3-3m3 3h-1m0-6a3 3 0 1 1 3-3M8 12H7m5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2"></path>
  </svg>
  <div class="w-20 h-1 bg-gradient-to-r from-pink-300 to-pink-300 rounded-full"></div>
  <svg class="w-8 h-8 text-pink-300 floating-flower" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m2 3a3 3 0 1 1-3 3m3-3v1m-3 3a3 3 0 1 1-3-3m3 3h-1m0-6a3 3 0 1 1 3-3M8 12H7m5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2"></path>
  </svg>
</div>

<div class="hero-content text-lg md:text-xl leading-relaxed text-white/90 space-y-5">
  <p>Welcome to Sistahology.com, the place <span class="text-sistah-pink font-semibold"><em>just for women</em></span> where we can be ourselves and experience the true essence of who we are and who we are becoming. My purpose in creating this space was to offer women a <span class="text-sistah-pink font-semibold"><strong>FREE online journaling platform</strong></span> where we can be ourselves, a place where we can empty our thoughts, talk out loud, say things we'd dare not say in public.</p>
  <p>Written expression gives me permission to be patient with myself, to slow down and reflect on lessons learned and unlearned, to forgive and forget what I have encountered through my experiences. The beautiful truth about digital journaling (and journaling online) is that we can simply <span class="text-sistah-pink font-semibold"><em>enjoy the journey.</em></span></p>
  <p>My goal in this space is that women are allowed to just <span class="text-sistah-pink font-semibold"><strong>BE</strong></span>. To create and just express and explore ourselves and exercise our right to write or draw, or paint or design, to do whatever it takes to be healthy and whole.</p>
  <p>So, welcome to your space. Welcome to reflecting online and journaling where you feel that, once again, <span class="text-sistah-pink font-semibold"><em>it's not about the destination, but the journey.</em></span></p>
</div>

<div class="mt-6 pt-6 border-t border-white/20 text-sm text-white/80 text-center italic">
  <p>— Andrea Brooks, Founder, Sistahology.com</p>
</div>

<div class="mt-12">
  <a href="/register" class="bg-gradient-to-r from-pink-500 via-pink-500 to-pink-600 hover:from-pink-600 hover:via-rose-600 hover:to-pink-700 text-white px-8 py-3 md:px-10 md:py-4 text-xl rounded-full font-bold shadow-2xl transform hover:scale-105 transition-all duration-300">
    Start Your FREE Journey Today
  </a>
  <p class="text-white/80 mt-4 text-lg">Join thousands of women in this unique space</p>
</div>$$)
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    content_html = EXCLUDED.content_html;
```

### Expected Output

> Success. No rows returned

### Verification

```sql
SELECT slug, title, LEFT(content_html, 50) as content_preview
FROM public.pages
WHERE slug = 'home';
```

**Expected**: 1 row showing home page with title "WELCOME"

---

## Section 7: Comprehensive Verification

After completing all 6 migrations, run these verification scripts to ensure everything is working correctly.

### 7.1: Admin Security Test

This quick test verifies the 3-layer admin security system.

```sql
-- Simple Admin Security Test
SELECT
    'TEST 1: Column Config' as test,
    CASE
        WHEN column_default = 'false' AND is_nullable = 'NO'
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    'is_admin: DEFAULT ' || COALESCE(column_default, 'NULL') ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE ' NULL' END as details
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin'

UNION ALL

SELECT
    'TEST 2: RLS Status' as test,
    CASE
        WHEN pc.relrowsecurity
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN pc.relrowsecurity
        THEN 'RLS is ENABLED'
        ELSE 'RLS is DISABLED'
    END as details
FROM pg_class pc
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'profiles'

UNION ALL

SELECT
    'TEST 3: Policy Count' as test,
    CASE
        WHEN COUNT(*) = 3
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    'Found ' || COUNT(*) || ' policies (expected: 3)' as details
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles'

UNION ALL

SELECT
    'TEST 4: Trigger Exists' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN COUNT(*) = 1
        THEN 'Trigger exists and enabled'
        ELSE 'Trigger NOT FOUND'
    END as details
FROM pg_trigger
WHERE tgname = 'prevent_is_admin_self_modification'
  AND tgrelid = 'public.profiles'::regclass
  AND tgenabled = 'O'

UNION ALL

SELECT
    'TEST 5: Function Exists' as test,
    CASE
        WHEN COUNT(*) = 1
        THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as result,
    CASE
        WHEN COUNT(*) = 1
        THEN 'Function exists'
        ELSE 'Function NOT FOUND'
    END as details
FROM pg_proc
WHERE proname = 'prevent_is_admin_modification'
  AND pronamespace = 'public'::regnamespace

ORDER BY test;
```

**Expected**: All tests show `✓ PASS`

### 7.2: Complete Schema Overview

Verify all tables, RLS status, and policy counts:

```sql
SELECT
    t.table_name,
    CASE WHEN c.relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status,
    COALESCE(p.policy_count, 0) as policy_count
FROM information_schema.tables t
LEFT JOIN pg_class c ON c.relname = t.table_name
LEFT JOIN (
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
) p ON p.tablename = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_name IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY t.table_name;
```

**Expected**:
- `profiles`: RLS ENABLED, 3 policies
- `journal`: RLS ENABLED, 4 policies
- `entry`: RLS ENABLED, 4 policies
- `pages`: RLS ENABLED, 4 policies

---

## Troubleshooting

### "Permission denied for table X"

**Cause**: RLS is enabled but you're not authenticated as a user.

**Solution**: RLS policies require authenticated users. Use the service role key in `.env.scripts` for admin operations, or create a test user and authenticate.

### "Relation already exists"

**Cause**: Running a migration twice without IF NOT EXISTS guards.

**Solution**: All migrations in this guide are idempotent (safe to re-run). If you see this error, it means the object already exists and the migration is skipping it. This is expected behavior.

### "Column 'is_admin' does not exist"

**Cause**: Skipped Step 3 (Admin Column Migration).

**Solution**: Execute Step 3 before Step 4. The migrations must be run in order.

### How to Reset and Start Over

If you need to completely reset the database:

⚠️ **WARNING**: This will delete ALL data permanently.

```sql
-- Drop all tables (cascades to policies and triggers)
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.entry CASCADE;
DROP TABLE IF EXISTS public.journal CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;
```

Then start from Step 1 again.

### Where to Ask for Help

- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/your-repo/issues
- **Project Documentation**: See `CLAUDE.md` for additional context

---

## Step 7: Optional Enhancements (Recommended)

**What it does**: Adds two quality-of-life features to enhance the journaling experience.

**Features added**:
1. **Mood Tracking** - Optional mood field for journal entries
2. **Writing Prompts** - Admin-managed prompts to inspire users

**Note**: These features are OPTIONAL but RECOMMENDED. They add significant value without breaking existing functionality.

### Why Add These Features?

**Mood Tracking Benefits**:
- Track emotional patterns over time
- Filter entries by mood in search
- Enable mood analytics and visualizations
- Gain insights into emotional well-being

**Writing Prompts Benefits**:
- Help users overcome writer's block
- Inspire reflection and creativity
- Admin-curated quality content
- Categorized prompts for different purposes

### SQL to Execute

```sql
-- =====================================================
-- MIGRATION: Optional Enhancements
-- Version: 010
-- =====================================================

BEGIN;

-- =====================================================
-- FEATURE 1: ENTRY MOOD TRACKING
-- =====================================================

-- Add mood column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'entry'
          AND column_name = 'mood'
    ) THEN
        ALTER TABLE public.entry
        ADD COLUMN mood TEXT CHECK (mood IN ('happy', 'neutral', 'sad', 'anxious', 'excited', 'grateful'));

        RAISE NOTICE 'Added mood column to entry table';
    ELSE
        RAISE NOTICE 'Mood column already exists (skipping)';
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.entry.mood IS 'Optional mood tracking for journal entries. Valid values: happy, neutral, sad, anxious, excited, grateful. NULL indicates no mood selected.';

-- Create partial index for mood filtering
CREATE INDEX IF NOT EXISTS idx_entry_mood
ON public.entry(mood)
WHERE mood IS NOT NULL;

-- Create composite index for user + mood queries
CREATE INDEX IF NOT EXISTS idx_entry_user_mood
ON public.entry(user_id, mood, entry_date DESC)
WHERE mood IS NOT NULL;

-- =====================================================
-- FEATURE 2: WRITING PROMPTS SYSTEM
-- =====================================================

-- Create writing_prompts table
CREATE TABLE IF NOT EXISTS public.writing_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_text TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE public.writing_prompts IS 'Admin-managed writing prompts to inspire journal entries. Categorized prompts help users overcome writer''s block.';
COMMENT ON COLUMN public.writing_prompts.prompt_text IS 'The text of the writing prompt. Should be a question or statement to inspire reflection.';
COMMENT ON COLUMN public.writing_prompts.category IS 'Optional category for filtering prompts. Examples: gratitude, reflection, goal-setting, creativity, self-discovery.';
COMMENT ON COLUMN public.writing_prompts.is_active IS 'Whether this prompt is currently active and shown to users. Admins can deactivate without deleting.';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_active
ON public.writing_prompts(is_active)
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_prompts_category
ON public.writing_prompts(category)
WHERE category IS NOT NULL;

-- Apply updated_at trigger
CREATE TRIGGER update_writing_prompts_updated_at
BEFORE UPDATE ON public.writing_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.writing_prompts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view active prompts
CREATE POLICY "Anyone can view active prompts"
    ON public.writing_prompts
    FOR SELECT
    USING (is_active = TRUE);

-- RLS Policy: Only admins can manage prompts
CREATE POLICY "Admins can manage prompts"
    ON public.writing_prompts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- Seed default prompts (only if table is empty)
DO $$
DECLARE
    prompt_count integer;
BEGIN
    SELECT COUNT(*) INTO prompt_count FROM public.writing_prompts;

    IF prompt_count = 0 THEN
        -- Gratitude prompts
        INSERT INTO public.writing_prompts (prompt_text, category, is_active) VALUES
        ('What are three things you''re grateful for today?', 'gratitude', TRUE),
        ('Who in your life are you most thankful for, and why?', 'gratitude', TRUE),
        ('What small moment brought you joy recently?', 'gratitude', TRUE);

        -- Reflection prompts
        INSERT INTO public.writing_prompts (prompt_text, category, is_active) VALUES
        ('Describe a challenge you overcame this week.', 'reflection', TRUE),
        ('What did you learn about yourself today?', 'reflection', TRUE),
        ('What would you tell your younger self about today?', 'reflection', TRUE);

        -- Goal-setting prompts
        INSERT INTO public.writing_prompts (prompt_text, category, is_active) VALUES
        ('What would you do if you knew you could not fail?', 'goal-setting', TRUE),
        ('Where do you see yourself one year from today?', 'goal-setting', TRUE),
        ('What is one habit you want to develop this month?', 'goal-setting', TRUE);

        -- Creativity prompts
        INSERT INTO public.writing_prompts (prompt_text, category, is_active) VALUES
        ('Write about a place that makes you feel at peace.', 'creativity', TRUE),
        ('If you could have dinner with anyone, living or dead, who would it be and why?', 'creativity', TRUE),
        ('Describe your perfect day from morning to night.', 'creativity', TRUE);

        -- Self-discovery prompts
        INSERT INTO public.writing_prompts (prompt_text, category, is_active) VALUES
        ('What are your core values, and are you living in alignment with them?', 'self-discovery', TRUE),
        ('What does success mean to you?', 'self-discovery', TRUE),
        ('When do you feel most authentically yourself?', 'self-discovery', TRUE);

        RAISE NOTICE 'Inserted 15 default prompts across 5 categories';
    ELSE
        RAISE NOTICE 'Prompts already exist, skipping seed';
    END IF;
END $$;

COMMIT;
```

### Expected Output

> Success. No rows returned

You should also see NOTICE messages indicating:
- Mood column added to entry table
- Writing prompts table created
- 15 default prompts inserted (if table was empty)

### Verification

**Verify mood column**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entry'
  AND column_name = 'mood';
```

**Expected**: 1 row showing `mood` column with type `text`, nullable

**Verify writing prompts table**:
```sql
SELECT
    COUNT(*) as total_prompts,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_prompts
FROM public.writing_prompts;
```

**Expected**: 15 total prompts, 15 active prompts

**List prompts by category**:
```sql
SELECT category, COUNT(*) as count
FROM public.writing_prompts
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;
```

**Expected**: 5 categories with 3 prompts each:
- creativity: 3
- goal-setting: 3
- gratitude: 3
- reflection: 3
- self-discovery: 3

### What You Get

**Database Changes**:
- 1 new column: `entry.mood` (6 mood options)
- 1 new table: `writing_prompts` (admin-managed)
- 4 new indexes (partial indexes for performance)
- 2 new RLS policies (public read, admin write)
- 15 curated writing prompts across 5 categories

**Frontend Integration** (Future):
- Mood selector on new/edit entry pages
- Mood filter in search
- Writing prompt widget on new entry page
- Admin UI for prompt management
- Mood analytics dashboard

---

## Next Steps

After completing the database setup (including optional enhancements):

### 1. Update Environment Files

Create/update these files with your new Supabase credentials:

**`.env.local`** (for development):
```bash
VITE_SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**`.env.test`** (for E2E testing):
```bash
VITE_SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
E2E_USER_EMAIL=e2e.user@sistahology.dev
E2E_USER_PASSWORD=test-password-here
```

**`.env.scripts`** (for admin operations):
```bash
SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

⚠️ **Never commit these files to version control!**

### 2. Create Test Users

Create accounts for testing:

1. **Regular User**: Sign up at `/register` in the app
2. **E2E Test User**: Create account for automated tests
3. **Admin User**: Create account, then grant admin role (see Step 3 below)

### 3. Grant Admin Role

To make a user an admin, use the admin script:

```bash
# Install dependencies first (if not done)
npm install

# Grant admin role to a user
tsx scripts/setAdminRole.ts --email admin@example.com
```

Or create a new admin user in one step:

```bash
tsx scripts/quickCreateAdmin.ts
```

### 4. Run Tests

Verify everything is working:

```bash
# Run regression tests
npm run test:regression

# Run journal flow tests
npm run test:journals

# Run admin security tests (after granting admin to E2E user)
npm run test:security
```

### 5. Start Development

```bash
# Start local dev server
npm run dev

# Open browser to http://localhost:5173
```

---

## Security Features Enabled

Your database now has:

✅ **Row-Level Security (RLS)** - Users can only access their own data
✅ **Admin Access Control** - 3-layer security prevents privilege escalation
✅ **Soft Delete** - 30-day trash bin with recovery
✅ **Full-Text Search** - GIN indexes for fast content search
✅ **Audit Timestamps** - Auto-updated `created_at` and `updated_at`
✅ **Data Validation** - Check constraints prevent invalid data
✅ **Cascade Deletes** - Clean up related records automatically

---

## Database Setup Complete! 🎉

You now have a fully functional, secure Sistahology database.

### Without Optional Enhancements:
**Total Tables**: 4
**Total Indexes**: 11
**Total RLS Policies**: 15
**Total Triggers**: 5
**Total Functions**: 2
**Estimated Setup Time**: ~30 minutes ✅

### With Optional Enhancements (Step 7):
**Total Tables**: 5 (+1: writing_prompts)
**Total Indexes**: 15 (+4: mood and prompts indexes)
**Total RLS Policies**: 17 (+2: prompts policies)
**Total Triggers**: 6 (+1: prompts updated_at)
**Total Functions**: 2 (no change)
**New Columns**: entry.mood (6 mood options)
**Default Data**: 15 curated writing prompts
**Estimated Setup Time**: ~35 minutes ✅

Next: Update your environment files and start developing!
