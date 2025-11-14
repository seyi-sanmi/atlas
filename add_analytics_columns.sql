-- Add Analytics Columns to Events Table
-- Run this in your Supabase SQL Editor

-- 1. Add view_count column
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 2. Add click_count column  
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- 3. Add last_scraped_at column
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP WITH TIME ZONE;

-- 4. Update existing events to have last_scraped_at = imported_at
UPDATE events 
SET last_scraped_at = imported_at 
WHERE last_scraped_at IS NULL AND imported_at IS NOT NULL;

-- 5. Verify the columns were added
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('view_count', 'click_count', 'last_scraped_at')
ORDER BY column_name;

-- 6. Check a sample event with the new columns
SELECT 
  id,
  title,
  platform,
  view_count,
  click_count,
  last_scraped_at,
  created_at
FROM events 
ORDER BY created_at DESC 
LIMIT 3; 