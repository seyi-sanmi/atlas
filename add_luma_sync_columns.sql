-- Add columns to track Lu.ma sync status
ALTER TABLE events 
ADD COLUMN luma_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN luma_sync_url TEXT,
ADD COLUMN luma_sync_date TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance
CREATE INDEX idx_events_luma_synced ON events(luma_synced);

-- Update existing events to set luma_synced to false
UPDATE events SET luma_synced = FALSE WHERE luma_synced IS NULL;

COMMENT ON COLUMN events.luma_synced IS 'Whether this event has been synced to Lu.ma calendar';
COMMENT ON COLUMN events.luma_sync_url IS 'URL of the event in Lu.ma calendar after sync';
COMMENT ON COLUMN events.luma_sync_date IS 'Timestamp when the event was last synced to Lu.ma'; 