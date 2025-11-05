-- =====================================================
-- MIGRATION: Optional Enhancements
-- Version: 010
-- Created: 2025-11-03
-- Purpose: Add mood tracking and writing prompts
-- =====================================================
--
-- FEATURES ADDED:
--   1. Entry Mood Tracking - Optional mood field for journal entries
--   2. Writing Prompts System - Admin-managed prompts to inspire writers
--
-- IDEMPOTENT: Safe to run multiple times
-- TRANSACTION: Wrapped in BEGIN/COMMIT for atomicity
--
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'OPTIONAL ENHANCEMENTS MIGRATION';
    RAISE NOTICE 'Migration 010';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- FEATURE 1: ENTRY MOOD TRACKING
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FEATURE 1: ENTRY MOOD TRACKING';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Purpose: Allow users to optionally tag journal entries with mood';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  • Track emotional patterns over time';
    RAISE NOTICE '  • Filter entries by mood';
    RAISE NOTICE '  • Visualize mood trends in analytics';
    RAISE NOTICE '  • Gain insights into emotional well-being';
    RAISE NOTICE '';
END $$;

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
        -- Add mood column with CHECK constraint for valid values
        ALTER TABLE public.entry
        ADD COLUMN mood TEXT CHECK (mood IN ('happy', 'neutral', 'sad', 'anxious', 'excited', 'grateful'));

        RAISE NOTICE '✓ Added mood column to entry table';
        RAISE NOTICE '  - Type: TEXT (nullable)';
        RAISE NOTICE '  - Values: happy, neutral, sad, anxious, excited, grateful';
        RAISE NOTICE '  - NULL = no mood selected';
    ELSE
        RAISE NOTICE '✓ Mood column already exists (skipping)';
    END IF;
    RAISE NOTICE '';
END $$;

-- Add comment explaining the column
COMMENT ON COLUMN public.entry.mood IS 'Optional mood tracking for journal entries. Valid values: happy, neutral, sad, anxious, excited, grateful. NULL indicates no mood selected. Use for emotional pattern tracking and analytics.';

DO $$
BEGIN
    RAISE NOTICE '✓ Added column comment for documentation';
    RAISE NOTICE '';
END $$;

-- Create partial index for mood filtering (only index non-null moods)
CREATE INDEX IF NOT EXISTS idx_entry_mood
ON public.entry(mood)
WHERE mood IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✓ Created partial index: idx_entry_mood';
    RAISE NOTICE '  - Condition: WHERE mood IS NOT NULL';
    RAISE NOTICE '  - Purpose: Fast mood filtering queries';
    RAISE NOTICE '  - Performance: Only indexes entries with mood set';
    RAISE NOTICE '';
END $$;

-- Create composite index for user + mood queries
CREATE INDEX IF NOT EXISTS idx_entry_user_mood
ON public.entry(user_id, mood, entry_date DESC)
WHERE mood IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✓ Created composite index: idx_entry_user_mood';
    RAISE NOTICE '  - Columns: user_id, mood, entry_date DESC';
    RAISE NOTICE '  - Purpose: User-specific mood timeline queries';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- FEATURE 2: WRITING PROMPTS SYSTEM
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FEATURE 2: WRITING PROMPTS SYSTEM';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Purpose: Provide inspiration for users with writer''s block';
    RAISE NOTICE 'Benefits:';
    RAISE NOTICE '  • Help users overcome blank page anxiety';
    RAISE NOTICE '  • Encourage reflection and creativity';
    RAISE NOTICE '  • Admin-managed content for quality control';
    RAISE NOTICE '  • Categorized prompts for different moods/goals';
    RAISE NOTICE '';
END $$;

-- Create writing_prompts table
CREATE TABLE IF NOT EXISTS public.writing_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_text TEXT NOT NULL,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'writing_prompts'
    ) THEN
        RAISE NOTICE '✓ Created table: writing_prompts';
        RAISE NOTICE '  - id: UUID primary key (auto-generated)';
        RAISE NOTICE '  - prompt_text: TEXT (required)';
        RAISE NOTICE '  - category: TEXT (optional, for filtering)';
        RAISE NOTICE '  - is_active: BOOLEAN (default TRUE)';
        RAISE NOTICE '  - created_at: Timestamp (auto)';
        RAISE NOTICE '  - updated_at: Timestamp (auto, trigger)';
    END IF;
    RAISE NOTICE '';
END $$;

-- Add table comment
COMMENT ON TABLE public.writing_prompts IS 'Admin-managed writing prompts to inspire journal entries. Categorized prompts help users overcome writer''s block and encourage reflection.';

-- Add column comments
COMMENT ON COLUMN public.writing_prompts.prompt_text IS 'The text of the writing prompt. Should be a question or statement to inspire reflection.';
COMMENT ON COLUMN public.writing_prompts.category IS 'Optional category for filtering prompts. Examples: gratitude, reflection, goal-setting, creativity, self-discovery.';
COMMENT ON COLUMN public.writing_prompts.is_active IS 'Whether this prompt is currently active and shown to users. Admins can deactivate prompts without deleting them.';

DO $$
BEGIN
    RAISE NOTICE '✓ Added table and column comments for documentation';
    RAISE NOTICE '';
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompts_active
ON public.writing_prompts(is_active)
WHERE is_active = TRUE;

DO $$
BEGIN
    RAISE NOTICE '✓ Created partial index: idx_prompts_active';
    RAISE NOTICE '  - Condition: WHERE is_active = TRUE';
    RAISE NOTICE '  - Purpose: Fast retrieval of active prompts';
    RAISE NOTICE '';
END $$;

CREATE INDEX IF NOT EXISTS idx_prompts_category
ON public.writing_prompts(category)
WHERE category IS NOT NULL;

DO $$
BEGIN
    RAISE NOTICE '✓ Created partial index: idx_prompts_category';
    RAISE NOTICE '  - Condition: WHERE category IS NOT NULL';
    RAISE NOTICE '  - Purpose: Category-based filtering';
    RAISE NOTICE '';
END $$;

-- Apply updated_at trigger to writing_prompts
CREATE TRIGGER update_writing_prompts_updated_at
BEFORE UPDATE ON public.writing_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✓ Created trigger: update_writing_prompts_updated_at';
    RAISE NOTICE '  - Function: update_updated_at_column()';
    RAISE NOTICE '  - Purpose: Auto-update updated_at timestamp';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- RLS CONFIGURATION FOR WRITING PROMPTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'RLS POLICIES FOR WRITING PROMPTS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
END $$;

-- Enable RLS
ALTER TABLE public.writing_prompts ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    RAISE NOTICE '✓ RLS: ENABLED on writing_prompts table';
    RAISE NOTICE '';
END $$;

-- Policy 1: SELECT - Anyone can view active prompts (including anonymous users)
CREATE POLICY "Anyone can view active prompts"
    ON public.writing_prompts
    FOR SELECT
    USING (is_active = TRUE);

DO $$
BEGIN
    RAISE NOTICE '✓ Created policy: Anyone can view active prompts';
    RAISE NOTICE '  - Operation: SELECT';
    RAISE NOTICE '  - Roles: ALL (including anonymous)';
    RAISE NOTICE '  - Rule: is_active = TRUE';
    RAISE NOTICE '  - Purpose: Public read access to active prompts';
    RAISE NOTICE '';
END $$;

-- Policy 2: ALL operations - Only admins can manage prompts
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

DO $$
BEGIN
    RAISE NOTICE '✓ Created policy: Admins can manage prompts';
    RAISE NOTICE '  - Operations: INSERT, UPDATE, DELETE';
    RAISE NOTICE '  - Roles: authenticated (with is_admin = TRUE)';
    RAISE NOTICE '  - Rule: Check profiles.is_admin column';
    RAISE NOTICE '  - Purpose: Admin-only content management';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- SEED DEFAULT PROMPTS
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SEEDING DEFAULT PROMPTS';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Inserting default writing prompts...';
    RAISE NOTICE '';
END $$;

-- Insert default prompts (only if table is empty to prevent duplicates)
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

        RAISE NOTICE '✓ Inserted 15 default prompts across 5 categories:';
        RAISE NOTICE '  • Gratitude: 3 prompts';
        RAISE NOTICE '  • Reflection: 3 prompts';
        RAISE NOTICE '  • Goal-setting: 3 prompts';
        RAISE NOTICE '  • Creativity: 3 prompts';
        RAISE NOTICE '  • Self-discovery: 3 prompts';
    ELSE
        RAISE NOTICE '⚠ Prompts already exist (% total), skipping seed', prompt_count;
        RAISE NOTICE '  To re-seed: DELETE FROM writing_prompts; then re-run migration';
    END IF;
    RAISE NOTICE '';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
    mood_column_exists boolean;
    prompts_table_exists boolean;
    prompts_rls_enabled boolean;
    prompts_policy_count integer;
    active_prompts_count integer;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    -- Check mood column
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'entry'
          AND column_name = 'mood'
    ) INTO mood_column_exists;

    IF mood_column_exists THEN
        RAISE NOTICE '✓ Feature 1: Mood tracking column exists';
    ELSE
        RAISE EXCEPTION 'Mood column not found!';
    END IF;

    -- Check writing_prompts table
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'writing_prompts'
    ) INTO prompts_table_exists;

    IF prompts_table_exists THEN
        RAISE NOTICE '✓ Feature 2: Writing prompts table exists';
    ELSE
        RAISE EXCEPTION 'Writing prompts table not found!';
    END IF;

    -- Check RLS enabled on writing_prompts
    SELECT pc.relrowsecurity INTO prompts_rls_enabled
    FROM pg_class pc
    JOIN pg_namespace pn ON pc.relnamespace = pn.oid
    WHERE pn.nspname = 'public' AND pc.relname = 'writing_prompts';

    IF prompts_rls_enabled THEN
        RAISE NOTICE '✓ RLS: ENABLED on writing_prompts';
    ELSE
        RAISE EXCEPTION 'RLS is DISABLED on writing_prompts!';
    END IF;

    -- Count policies
    SELECT COUNT(*) INTO prompts_policy_count
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'writing_prompts';

    RAISE NOTICE '✓ Policies: % total (expected: 2)', prompts_policy_count;

    IF prompts_policy_count != 2 THEN
        RAISE WARNING 'Expected 2 policies, found %', prompts_policy_count;
    END IF;

    -- Count active prompts
    SELECT COUNT(*) INTO active_prompts_count
    FROM public.writing_prompts
    WHERE is_active = TRUE;

    RAISE NOTICE '✓ Active prompts: %', active_prompts_count;

    RAISE NOTICE '';
END $$;

-- =====================================================
-- MIGRATION SUMMARY
-- =====================================================

DO $$
DECLARE
    total_prompts integer;
    prompts_by_category RECORD;
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MIGRATION SUMMARY';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';

    RAISE NOTICE 'FEATURE 1: ENTRY MOOD TRACKING';
    RAISE NOTICE '';
    RAISE NOTICE '  What it does:';
    RAISE NOTICE '    • Adds optional mood field to journal entries';
    RAISE NOTICE '    • 6 mood options: happy, neutral, sad, anxious, excited, grateful';
    RAISE NOTICE '    • NULL = no mood selected (completely optional)';
    RAISE NOTICE '';
    RAISE NOTICE '  Performance:';
    RAISE NOTICE '    • Partial indexes for fast mood filtering';
    RAISE NOTICE '    • Composite index for user mood timelines';
    RAISE NOTICE '';
    RAISE NOTICE '  Usage:';
    RAISE NOTICE '    • Set mood when creating/editing entries';
    RAISE NOTICE '    • Filter entries by mood in search';
    RAISE NOTICE '    • Track emotional patterns over time';
    RAISE NOTICE '    • Visualize mood trends in analytics (future)';
    RAISE NOTICE '';

    RAISE NOTICE 'FEATURE 2: WRITING PROMPTS SYSTEM';
    RAISE NOTICE '';
    RAISE NOTICE '  What it does:';
    RAISE NOTICE '    • Provides curated prompts to inspire writing';
    RAISE NOTICE '    • Admin-managed content for quality';
    RAISE NOTICE '    • Categorized prompts for different purposes';
    RAISE NOTICE '    • Active/inactive toggle for content curation';
    RAISE NOTICE '';

    SELECT COUNT(*) INTO total_prompts FROM public.writing_prompts;
    RAISE NOTICE '  Prompts loaded: %', total_prompts;
    RAISE NOTICE '';

    IF total_prompts > 0 THEN
        RAISE NOTICE '  Prompts by category:';
        FOR prompts_by_category IN
            SELECT category, COUNT(*) as count
            FROM public.writing_prompts
            WHERE is_active = TRUE
            GROUP BY category
            ORDER BY category
        LOOP
            RAISE NOTICE '    • %: % prompts', prompts_by_category.category, prompts_by_category.count;
        END LOOP;
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '  Security:';
    RAISE NOTICE '    • Public read access to active prompts';
    RAISE NOTICE '    • Admin-only write access (create/update/delete)';
    RAISE NOTICE '    • RLS policies enforce access control';
    RAISE NOTICE '';

    RAISE NOTICE '  Frontend Usage:';
    RAISE NOTICE '    • Display random prompt on new entry page';
    RAISE NOTICE '    • "Get Another Prompt" button for inspiration';
    RAISE NOTICE '    • Filter prompts by category';
    RAISE NOTICE '    • Admin CMS for prompt management';
    RAISE NOTICE '';

    RAISE NOTICE 'DATABASE CHANGES:';
    RAISE NOTICE '  • 1 new column: entry.mood';
    RAISE NOTICE '  • 1 new table: writing_prompts';
    RAISE NOTICE '  • 4 new indexes (partial indexes for performance)';
    RAISE NOTICE '  • 2 new RLS policies';
    RAISE NOTICE '  • 1 new trigger (updated_at)';
    RAISE NOTICE '';

    RAISE NOTICE 'MIGRATION COMPLETE';
    RAISE NOTICE '';
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'OPTIONAL ENHANCEMENTS APPLIED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update frontend to support mood selection';
    RAISE NOTICE '  2. Add writing prompts to new entry page';
    RAISE NOTICE '  3. Create admin UI for prompt management';
    RAISE NOTICE '  4. Consider mood analytics/visualization features';
    RAISE NOTICE '';
    RAISE NOTICE 'For verification queries, see below.';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Run manually to test)
-- =====================================================
--
-- Verify mood column exists:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'entry'
--   AND column_name = 'mood';
-- Expected: 1 row, type = text, nullable = YES
--
-- Verify writing_prompts table:
-- SELECT table_name, (
--   SELECT COUNT(*) FROM information_schema.columns c
--   WHERE c.table_name = t.table_name
-- ) as column_count
-- FROM information_schema.tables t
-- WHERE table_schema = 'public'
--   AND table_name = 'writing_prompts';
-- Expected: 1 row, 6 columns
--
-- List all active prompts:
-- SELECT category, prompt_text
-- FROM public.writing_prompts
-- WHERE is_active = TRUE
-- ORDER BY category, prompt_text;
-- Expected: 15 rows across 5 categories
--
-- Test RLS (as authenticated non-admin user):
-- SELECT * FROM public.writing_prompts WHERE is_active = TRUE;
-- Expected: Success, returns active prompts
--
-- INSERT INTO public.writing_prompts (prompt_text, category) VALUES ('Test', 'test');
-- Expected: Error (permission denied - admin only)
--
-- =====================================================
