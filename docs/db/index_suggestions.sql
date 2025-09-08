-- =====================================================
-- SISTAHOLOGY DATABASE - PERFORMANCE INDEX SUGGESTIONS
-- =====================================================
-- 
-- Generated: 2025-09-02
-- Purpose: Performance optimization suggestions based on schema analysis
-- Status: SUGGESTIONS ONLY - NOT FOR DIRECT EXECUTION
-- 
-- IMPORTANT: These are COMMENTED OUT suggestions for performance optimization.
-- Review each suggestion carefully before implementing in production.
-- All suggestions should be tested in staging environment first.
-- 
-- =====================================================

-- =====================================================
-- CURRENT INDEX COVERAGE ANALYSIS
-- =====================================================
-- 
-- ✅ WELL COVERED:
-- - User-based filtering (profiles, journal, entry tables)
-- - Journal-entry relationships  
-- - Chronological sorting (journal, entry)
-- - Full-text search (entry content)
-- - CMS routing (pages slug)
-- - Archive status filtering (entry)
-- 
-- ⚠️  POTENTIAL GAPS:
-- - Composite queries combining user + date filters
-- - Multi-column sorts on journal/entry tables
-- - Performance optimization for complex RLS queries

-- =====================================================
-- COMPOSITE INDEX SUGGESTIONS
-- =====================================================

-- SUGGESTION 1: Optimize user + date range queries on entries
-- USE CASE: Dashboard "recent entries for user" queries
-- CURRENT: Separate indexes on user_id and entry_date  
-- BENEFIT: Single composite index for combined filtering + sorting
-- 
-- CREATE INDEX CONCURRENTLY idx_entry_user_date 
--     ON public.entry (user_id, entry_date DESC);
-- 
-- ANALYSIS:
-- - Replaces need for separate user_id and entry_date indexes in combined queries
-- - Particularly beneficial for dashboard and calendar views
-- - Estimated query performance improvement: 2-3x for date-filtered user queries

-- SUGGESTION 2: Optimize journal + entry date queries  
-- USE CASE: "Show recent entries in specific journal" queries
-- CURRENT: Separate indexes on journal_id and entry_date
-- BENEFIT: Combined filtering and sorting in single index lookup
--
-- CREATE INDEX CONCURRENTLY idx_entry_journal_date
--     ON public.entry (journal_id, entry_date DESC);
--
-- ANALYSIS: 
-- - Accelerates journal-specific chronological navigation
-- - Useful for journal detail pages with date-sorted entries
-- - May allow removal of individual idx_entry_journal_id if queries always include date

-- SUGGESTION 3: User + created_at composite for journals
-- USE CASE: User dashboard showing journals by creation order  
-- CURRENT: Separate indexes on user_id and created_at
-- BENEFIT: Single index scan for user journal timeline
-- 
-- CREATE INDEX CONCURRENTLY idx_journal_user_created
--     ON public.journal (user_id, created_at DESC);
-- 
-- ANALYSIS:
-- - Optimizes user dashboard journal loading
-- - Current separate indexes require two lookups + merge
-- - Low storage overhead due to relatively small journal table

-- =====================================================
-- ARCHIVE OPTIMIZATION SUGGESTIONS
-- =====================================================

-- SUGGESTION 4: Active entries optimization  
-- USE CASE: Filter out archived entries efficiently
-- CURRENT: General index on is_archived boolean
-- BENEFIT: Optimized composite for active entry queries
--
-- CREATE INDEX CONCURRENTLY idx_entry_user_active_date
--     ON public.entry (user_id, entry_date DESC) 
--     WHERE is_archived = false;
-- 
-- ANALYSIS:
-- - Partial index reduces storage overhead
-- - Optimizes most common case (viewing non-archived entries)
-- - WHERE clause eliminates archived entries from index entirely

-- SUGGESTION 5: Journal active entries composite
-- USE CASE: Journal view with only active entries
-- CURRENT: Requires journal_id + is_archived filters
-- BENEFIT: Single index lookup for active journal entries
--
-- CREATE INDEX CONCURRENTLY idx_entry_journal_active_date  
--     ON public.entry (journal_id, entry_date DESC)
--     WHERE is_archived = false;
--
-- ANALYSIS:
-- - Partial index focused on most frequent access pattern
-- - Reduces I/O for journal navigation queries
-- - Combines relationship traversal with archive filtering

-- =====================================================
-- SEARCH OPTIMIZATION SUGGESTIONS  
-- =====================================================

-- SUGGESTION 6: User-scoped search optimization
-- USE CASE: Search within user's entries (RLS-aware)
-- CURRENT: GIN index on content + separate user_id filtering
-- BENEFIT: Combined full-text + user filtering in single index
--
-- CREATE INDEX CONCURRENTLY idx_entry_user_search
--     ON public.entry USING gin (user_id, to_tsvector('english', content));
--
-- ANALYSIS:
-- - Accelerates user-scoped search queries (primary use case with RLS)
-- - May reduce need for separate user_id index on entry table
-- - GIN index handles both exact user match and text search efficiently

-- SUGGESTION 7: Title + content combined search
-- USE CASE: Search across both title and content fields
-- CURRENT: Only content indexed for full-text search
-- BENEFIT: Unified search across all text fields
--
-- CREATE INDEX CONCURRENTLY idx_entry_fulltext_combined
--     ON public.entry USING gin (
--         to_tsvector('english', COALESCE(title, '') || ' ' || content)
--     );
--
-- ANALYSIS:
-- - Enables search across title and content in single query
-- - COALESCE handles NULL titles gracefully  
-- - Consider replacing current content-only GIN index

-- =====================================================
-- PAGES TABLE OPTIMIZATION SUGGESTIONS
-- =====================================================

-- SUGGESTION 8: Pages slug uniqueness enforcement
-- USE CASE: Ensure slug uniqueness constraint is properly indexed
-- CURRENT: Unique index on slug (already exists - idx_pages_slug)
-- STATUS: ✅ ALREADY OPTIMAL
-- 
-- ANALYSIS:
-- - Current unique index on slug is sufficient
-- - No additional indexing needed for pages table
-- - Consider monitoring for slow admin queries if pages table grows large

-- =====================================================  
-- PROFILE TABLE OPTIMIZATION SUGGESTIONS
-- =====================================================

-- SUGGESTION 9: Email uniqueness consideration
-- USE CASE: Ensure email uniqueness if business logic requires it
-- CURRENT: Regular index on email
-- CONSIDERATION: Whether email should be UNIQUE constraint
-- 
-- -- UNIQUE constraint on email (business decision):
-- -- ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);
-- 
-- ANALYSIS:
-- - Current non-unique email index allows duplicate emails
-- - Consider business requirement: should one email = one profile?
-- - If unique required, ALTER TABLE + unique constraint is better than unique index

-- =====================================================
-- INDEX MAINTENANCE SUGGESTIONS  
-- =====================================================

-- SUGGESTION 10: Consider removing redundant indexes after composite additions
-- IF composite indexes above are implemented, consider removing:
--
-- -- Remove individual indexes if composite indexes provide same functionality:
-- -- DROP INDEX IF EXISTS idx_entry_user_id;         -- If idx_entry_user_date added
-- -- DROP INDEX IF EXISTS idx_entry_journal_id;      -- If idx_entry_journal_date added  
-- -- DROP INDEX IF EXISTS idx_journal_created_at;    -- If idx_journal_user_created added
-- -- DROP INDEX IF EXISTS idx_entry_content_search;  -- If idx_entry_user_search added
--
-- ANALYSIS:
-- - Composite indexes often eliminate need for individual component indexes
-- - Reduces storage overhead and index maintenance costs
-- - Test query performance before removing to ensure no regressions

-- =====================================================
-- MONITORING & MAINTENANCE RECOMMENDATIONS
-- =====================================================

-- SUGGESTION 11: Query performance monitoring
-- Monitor these query patterns for optimization opportunities:
-- 
-- -- User dashboard queries (frequent):
-- -- SELECT * FROM journal WHERE user_id = $1 ORDER BY created_at DESC;
-- -- SELECT * FROM entry WHERE user_id = $1 AND entry_date >= $2 ORDER BY entry_date DESC;
-- 
-- -- Journal navigation queries (frequent):
-- -- SELECT * FROM entry WHERE journal_id = $1 AND is_archived = false ORDER BY entry_date DESC;
-- 
-- -- Search queries (moderate frequency):  
-- -- SELECT * FROM entry WHERE user_id = $1 AND to_tsvector('english', content) @@ plainto_tsquery($2);

-- SUGGESTION 12: Index usage analysis
-- Periodically check index usage with:
--
-- -- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- -- FROM pg_stat_user_indexes 
-- -- WHERE schemaname = 'public' 
-- -- ORDER BY idx_scan DESC;
--
-- Monitor for:
-- - Unused indexes (idx_scan = 0) - candidates for removal
-- - High idx_tup_read vs idx_tup_fetch ratio - index inefficiency  
-- - Missing indexes causing sequential scans

-- =====================================================
-- IMPLEMENTATION PRIORITY RANKING
-- =====================================================

-- HIGH PRIORITY (Immediate Performance Impact):
-- 1. idx_entry_user_date - Dashboard performance
-- 2. idx_entry_user_active_date - Most common query pattern
-- 
-- MEDIUM PRIORITY (Moderate Impact):  
-- 3. idx_entry_journal_date - Journal navigation
-- 4. idx_journal_user_created - User dashboard
-- 
-- LOW PRIORITY (Specialized Use Cases):
-- 5. idx_entry_user_search - Search optimization
-- 6. idx_entry_fulltext_combined - Enhanced search
-- 
-- MONITORING ONLY:
-- 7-12. Index maintenance and performance monitoring

-- =====================================================
-- IMPLEMENTATION CHECKLIST
-- =====================================================

-- Before implementing any suggestions:
-- 
-- ✅ Test in staging environment first
-- ✅ Monitor query performance before and after  
-- ✅ Check storage overhead impact
-- ✅ Verify RLS policies still perform well
-- ✅ Consider peak usage times for index creation
-- ✅ Plan rollback strategy for each change
-- ✅ Update application queries to take advantage of new indexes
-- ✅ Document performance improvements achieved

-- =====================================================
-- STORAGE IMPACT ESTIMATES
-- =====================================================

-- Approximate storage overhead for suggested composite indexes:
-- 
-- idx_entry_user_date:        ~10-15% of entry table size
-- idx_entry_journal_date:     ~10-15% of entry table size  
-- idx_journal_user_created:   ~5-10% of journal table size (small table)
-- idx_entry_user_active_date: ~8-12% of entry table size (partial index)
-- idx_entry_user_search:      ~20-30% of entry table size (GIN index)
-- 
-- Total estimated overhead: 60-90% of current entry table size
-- Trade-off: Storage cost vs query performance improvement

-- =====================================================
-- END OF SUGGESTIONS
-- =====================================================

-- REMINDER: These are suggestions only. Do not execute directly.
-- Each suggestion should be evaluated based on:
-- - Current query patterns and performance bottlenecks  
-- - Storage constraints and maintenance costs
-- - Application-specific usage patterns
-- - Future scalability requirements

-- For questions about implementation, consult:
-- - PostgreSQL performance documentation
-- - Query execution plans (EXPLAIN ANALYZE)
-- - Application performance monitoring data
-- - Database administrator or performance specialist