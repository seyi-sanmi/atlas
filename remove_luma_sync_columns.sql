-- Remove Lu.ma sync columns from events table
ALTER TABLE events
DROP COLUMN IF EXISTS luma_synced,
DROP COLUMN IF EXISTS luma_sync_url,
DROP COLUMN IF EXISTS luma_sync_date; 