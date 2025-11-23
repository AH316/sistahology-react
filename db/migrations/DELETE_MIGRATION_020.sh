#!/bin/bash
# =====================================================
# Script to Delete Migration 020 (Incorrect Diagnosis)
# =====================================================
# Created: 2025-01-23
# Purpose: Remove migration 020 as it diagnosed the wrong problem
#
# Background:
#   Migration 020 added GRANT statements thinking they were missing
#   However, the actual problem was a corrupted RLS policy
#   Migration 021 includes the GRANTs and fixes the real issue
#
# What this script does:
#   1. Verifies migration 021 exists (the replacement)
#   2. Backs up migration 020 to archive directory
#   3. Deletes migration 020 from migrations directory
#
# Safety:
#   - Creates backup before deletion
#   - Verifies replacement migration exists
#   - Can be undone by restoring from archive
# =====================================================

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR"
ARCHIVE_DIR="$SCRIPT_DIR/../archive/deleted_migrations"
MIGRATION_020="020_fix_contact_submissions_grants.sql"
MIGRATION_021="021_fix_contact_insert_policy.sql"

echo "========================================"
echo "DELETE MIGRATION 020 SCRIPT"
echo "========================================"
echo ""

# Step 1: Verify migration 021 exists
echo "Step 1: Verifying migration 021 exists..."
if [ ! -f "$MIGRATIONS_DIR/$MIGRATION_021" ]; then
    echo "ERROR: Migration 021 not found at $MIGRATIONS_DIR/$MIGRATION_021"
    echo "Cannot delete migration 020 without replacement migration 021"
    exit 1
fi
echo "✓ Migration 021 exists"
echo ""

# Step 2: Verify migration 020 exists
echo "Step 2: Verifying migration 020 exists..."
if [ ! -f "$MIGRATIONS_DIR/$MIGRATION_020" ]; then
    echo "WARNING: Migration 020 already deleted"
    echo "Nothing to do. Exiting."
    exit 0
fi
echo "✓ Migration 020 exists"
echo ""

# Step 3: Create archive directory
echo "Step 3: Creating archive directory..."
mkdir -p "$ARCHIVE_DIR"
echo "✓ Archive directory ready: $ARCHIVE_DIR"
echo ""

# Step 4: Backup migration 020
echo "Step 4: Backing up migration 020..."
BACKUP_FILENAME="020_fix_contact_submissions_grants_DELETED_$(date +%Y%m%d_%H%M%S).sql"
cp "$MIGRATIONS_DIR/$MIGRATION_020" "$ARCHIVE_DIR/$BACKUP_FILENAME"
echo "✓ Backup created: $ARCHIVE_DIR/$BACKUP_FILENAME"
echo ""

# Step 5: Delete migration 020
echo "Step 5: Deleting migration 020..."
rm "$MIGRATIONS_DIR/$MIGRATION_020"
echo "✓ Migration 020 deleted"
echo ""

# Step 6: Verification
echo "========================================"
echo "VERIFICATION"
echo "========================================"
echo ""
echo "✓ Migration 020 removed from migrations directory"
echo "✓ Backup saved to: $ARCHIVE_DIR/$BACKUP_FILENAME"
echo "✓ Migration 021 ready to apply"
echo ""
echo "To restore migration 020 (if needed):"
echo "  cp \"$ARCHIVE_DIR/$BACKUP_FILENAME\" \"$MIGRATIONS_DIR/$MIGRATION_020\""
echo ""
echo "Next steps:"
echo "  1. Apply migration 021 to your Supabase database"
echo "  2. Test contact form submissions"
echo "  3. Verify no 42501 errors occur"
echo ""
echo "========================================"
echo "DELETION COMPLETE"
echo "========================================"
