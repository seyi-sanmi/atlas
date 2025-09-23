-- =============================================
-- Multi Event Types Migration (Simplified)
-- =============================================
-- This migration adds support for multiple event types (max 2) per event
-- Uses existing 'platform' and 'url' fields instead of separate ID columns

-- 1. Add the new column for multiple event types
ALTER TABLE events 
ADD COLUMN ai_event_types TEXT[];

-- 2. Migrate existing single event types to the new array format
UPDATE events 
SET ai_event_types = CASE 
  WHEN ai_event_type IS NOT NULL AND ai_event_type != '' 
  THEN ARRAY[ai_event_type]
  ELSE ARRAY[]::TEXT[]
END
WHERE ai_event_types IS NULL;

-- 3. Add index for better performance on the new column
CREATE INDEX idx_events_ai_event_types ON events USING GIN(ai_event_types);

-- 4. Keep the old column for now (for rollback safety) - we'll drop it later
-- ALTER TABLE events DROP COLUMN ai_event_type;

-- 5. Add a constraint to ensure maximum 2 event types
ALTER TABLE events 
ADD CONSTRAINT check_max_event_types 
CHECK (array_length(ai_event_types, 1) <= 2);

-- 6. Update any null arrays to empty arrays for consistency
UPDATE events 
SET ai_event_types = ARRAY['Other']::TEXT[] 
WHERE ai_event_types IS NULL OR ai_event_types = ARRAY[]::TEXT[];

-- 7. Make the column NOT NULL after migration with default value
ALTER TABLE events 
ALTER COLUMN ai_event_types SET NOT NULL,
ALTER COLUMN ai_event_types SET DEFAULT ARRAY['Other']::TEXT[];

-- Note: We use existing 'platform' field for event source (luma, humanitix, partiful, etc.)
-- and existing 'url' field for the original event URL - no need for separate ID columns!
