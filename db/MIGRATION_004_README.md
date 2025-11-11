# Migration 004: Soft Delete for Entry Table

## Overview

This migration adds soft delete functionality to the `entry` table, enabling a 30-day trash bin feature for journal entries. Users can delete entries, recover them within 30 days, and permanently delete them after that period.

## What This Migration Does

### Schema Changes
- Adds `deleted_at` column (type: `TIMESTAMPTZ`, nullable, default `NULL`)
  - `NULL` = active entry
  - `NOT NULL` = entry in trash bin

### Performance Optimizations
- **idx_entry_active**: Partial index for active entries (`WHERE deleted_at IS NULL`)
- **idx_entry_deleted**: Partial index for trashed entries by user (`WHERE deleted_at IS NOT NULL`)
- **idx_entry_deleted_at_not_null**: Index for expiration queries (30-day purge)

### Security
- **No new RLS policies required**: Existing policies already protect deleted entries
- Users can only see/modify their own deleted entries
- Cross-user access to deleted entries is blocked by existing RLS

## Pre-Migration Checklist

- [ ] **Backup database**: Create a snapshot in Supabase dashboard before proceeding
- [ ] **Review current entries**: Check `SELECT COUNT(*) FROM entry;` to understand data volume
- [ ] **Verify RLS enabled**: Confirm RLS is active on `entry` table
- [ ] **Schedule maintenance window**: Migration takes ~5-30 seconds depending on entry count
- [ ] **Communicate to users**: Inform users about upcoming trash bin feature

## How to Apply Migration

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Navigate to your project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Go to SQL Editor

2. **Run Migration**
   - Copy contents of `/db/004_add_deleted_at_to_entries.sql`
   - Paste into new query
   - Click "Run" button
   - Wait for success confirmation

3. **Expected Output**
   ```
   ==========================================
   ADDING SOFT DELETE COLUMN TO ENTRY TABLE
   ==========================================

   Added deleted_at column to entry table
   Created/verified partial index for active entries
   Created/verified partial index for deleted entries
   Created/verified index for trash expiration queries

   Entry table statistics:
     - Total entries: 150
     - Active entries: 150
     - Deleted entries: 0

   SOFT DELETE MIGRATION SUCCESSFULLY APPLIED
   ```

4. **Verify Success**
   - Look for "SUCCESSFULLY APPLIED" message
   - No errors or warnings should appear
   - Check that indexes were created

### Option 2: psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Run migration
\i db/004_add_deleted_at_to_entries.sql

# Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'entry' AND column_name = 'deleted_at';
```

## Post-Migration Verification

### Step 1: Run Verification Script

```sql
-- Copy and run db/VERIFY_SOFT_DELETE.sql in Supabase SQL Editor
-- This script tests soft delete functionality without making changes
-- Expected runtime: < 30 seconds
```

### Step 2: Manual Verification

```sql
-- Check column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entry'
  AND column_name = 'deleted_at';

-- Expected result:
-- column_name  | data_type                   | is_nullable | column_default
-- deleted_at   | timestamp with time zone    | YES         | NULL

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'entry'
  AND indexname LIKE '%deleted%';

-- Expected: 3 indexes (idx_entry_active, idx_entry_deleted, idx_entry_deleted_at_not_null)

-- Verify all existing entries are active
SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE deleted_at IS NULL) as active,
    COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted
FROM entry;

-- Expected: All entries have deleted_at IS NULL (100% active)
```

### Step 3: Review Verification Output

Look for these key indicators:
- ✅ "PASS" messages for all tests
- ✅ No "FAIL" or "RLS BREACH" warnings
- ✅ Indexes created successfully
- ✅ Active entries count matches total entries

## Rollback Procedure

If you need to undo this migration:

```sql
BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS public.idx_entry_active;
DROP INDEX IF EXISTS public.idx_entry_deleted;
DROP INDEX IF EXISTS public.idx_entry_deleted_at_not_null;

-- Remove column (WARNING: This will delete any trash bin data)
ALTER TABLE public.entry DROP COLUMN IF EXISTS deleted_at;

-- Verify rollback
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entry'
  AND column_name = 'deleted_at';
-- Expected: No rows (column removed)

COMMIT;
```

**⚠️ WARNING**: Rollback will permanently delete any entries currently in the trash bin. Users will not be able to recover these entries. Only rollback if absolutely necessary.

## Application Implementation Guide

After migration, update your application code:

### 1. Update Active Entry Queries

```typescript
// BEFORE (shows all entries including deleted)
const { data } = await supabase
  .from('entry')
  .select('*')
  .eq('journal_id', journalId);

// AFTER (shows only active entries)
const { data } = await supabase
  .from('entry')
  .select('*')
  .eq('journal_id', journalId)
  .is('deleted_at', null);  // ← Add this filter
```

### 2. Create Trash Bin Query

```typescript
// Query for deleted entries (trash bin)
const { data: trashedEntries } = await supabase
  .from('entry')
  .select('*, journal!inner(journal_name, color)')
  .not('deleted_at', 'is', null)
  .order('deleted_at', { ascending: false });

// Calculate days remaining for each entry
const entriesWithExpiry = trashedEntries?.map(entry => ({
  ...entry,
  daysRemaining: 30 - Math.floor(
    (Date.now() - new Date(entry.deleted_at).getTime()) / (1000 * 60 * 60 * 24)
  )
}));
```

### 3. Implement Soft Delete

```typescript
// Soft delete (move to trash)
async function softDeleteEntry(entryId: string) {
  const { error } = await supabase
    .from('entry')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', entryId);

  if (error) throw error;
  // Show toast: "Entry moved to trash. You have 30 days to restore it."
}
```

### 4. Implement Restore

```typescript
// Restore from trash
async function restoreEntry(entryId: string) {
  const { error } = await supabase
    .from('entry')
    .update({ deleted_at: null })
    .eq('id', entryId);

  if (error) throw error;
  // Show toast: "Entry restored successfully"
}
```

### 5. Implement Permanent Delete

```typescript
// Permanent delete (only allow for trashed entries)
async function permanentlyDeleteEntry(entryId: string) {
  // First verify entry is in trash
  const { data: entry } = await supabase
    .from('entry')
    .select('deleted_at')
    .eq('id', entryId)
    .single();

  if (!entry?.deleted_at) {
    throw new Error('Cannot permanently delete active entries');
  }

  // Confirm with user before deleting
  const confirmed = window.confirm(
    'Permanently delete this entry? This action cannot be undone.'
  );

  if (confirmed) {
    const { error } = await supabase
      .from('entry')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
    // Show toast: "Entry permanently deleted"
  }
}
```

### 6. Update Search Queries

```typescript
// Search should exclude deleted entries by default
const { data } = await supabase
  .from('entry')
  .select('*, journal!inner(journal_name)')
  .textSearch('content', searchTerm)
  .is('deleted_at', null);  // ← Add this filter

// Optional: Add toggle to search trash bin
if (includeTrash) {
  query = query.not('deleted_at', 'is', null);
}
```

### 7. Update Calendar View

```typescript
// Calendar should only show active entries
const { data } = await supabase
  .from('entry')
  .select('*')
  .gte('entry_date', startDate)
  .lte('entry_date', endDate)
  .is('deleted_at', null)  // ← Add this filter
  .order('entry_date', { ascending: true });
```

## Optional: Auto-Purge Function

For automatic deletion of entries older than 30 days:

```sql
-- Create function to purge expired entries
CREATE OR REPLACE FUNCTION purge_expired_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.entry
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run manually
SELECT purge_expired_entries();
-- Returns: Number of entries permanently deleted
```

**Setup Cron Job** (via Supabase Edge Functions or external cron):
- Run `SELECT purge_expired_entries()` daily at midnight
- Log results for audit trail
- Consider sending email notifications before purging

## Troubleshooting

### Issue: Migration fails with "column already exists"

**Solution**: This is safe - the migration is idempotent. The column was already added in a previous run. Verify with:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'entry' AND column_name = 'deleted_at';
```

### Issue: Queries return zero results after migration

**Cause**: Forgot to add `deleted_at IS NULL` filter to queries.

**Solution**: Update all entry queries to include `.is('deleted_at', null)` filter.

### Issue: Users see other users' deleted entries

**Cause**: RLS policies may be misconfigured.

**Solution**: Run verification script:
```sql
\i db/VERIFY_SOFT_DELETE.sql
```
Look for "RLS BREACH" warnings in output.

### Issue: Performance degradation on entry queries

**Cause**: Missing partial indexes.

**Solution**: Verify indexes exist:
```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'entry' AND indexname LIKE 'idx_entry_%deleted%';
```

Expected: 3 rows. If missing, re-run migration.

## Support and Questions

- **Documentation**: See `CLAUDE.md` for project architecture
- **Database Schema**: Review `db/exports/schema.sql`
- **Security Audit**: Run `db/VERIFY_READONLY.sql` for comprehensive RLS testing
- **Migration Issues**: Check Supabase logs in Dashboard > Database > Logs

## Summary

✅ **Migration adds**: `deleted_at` column with performance indexes
✅ **Security**: Existing RLS policies protect deleted entries
✅ **Safe to run**: Idempotent - can be run multiple times
✅ **Rollback available**: See rollback procedure above
✅ **Next steps**: Update application code to use soft delete filters

Migration is production-ready and follows Supabase best practices.
