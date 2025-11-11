-- Migration: Add icon column to journal table
-- Description: Adds optional icon field to store emoji icons for journals
-- Date: 2025-10-14

-- Add icon column to journal table (nullable, allows emoji/unicode)
ALTER TABLE journal ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add comment for documentation
COMMENT ON COLUMN journal.icon IS 'Optional emoji icon for the journal (e.g., 📔, 💭, 🌸)';

-- Update existing journals to have default icon if desired (optional)
-- UPDATE journal SET icon = '📔' WHERE icon IS NULL;
