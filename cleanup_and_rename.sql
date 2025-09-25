-- =============================================
-- CLEANUP AND SIMPLE CATEGORY RENAME
-- =============================================
-- This approach is much cleaner - just rename existing category values
-- No new columns needed!

-- 1. Remove the redundant ai_event_types column we mistakenly added
ALTER TABLE events DROP COLUMN IF EXISTS ai_event_types;

-- 2. Remove any constraints related to ai_event_types
ALTER TABLE events DROP CONSTRAINT IF EXISTS check_max_event_types;

-- 3. Remove any indexes related to ai_event_types
DROP INDEX IF EXISTS idx_events_ai_event_types;

-- 4. Now simply update the existing ai_event_type values to new categories
-- This is much cleaner than adding redundant columns!

-- Update Workshop -> Workshop / Discussion
UPDATE events 
SET ai_event_type = 'Workshop / Discussion'
WHERE ai_event_type = 'Workshop';

-- Update Conference -> Technical Talk / Presentation
UPDATE events 
SET ai_event_type = 'Technical Talk / Presentation'
WHERE ai_event_type = 'Conference';

-- Update Meetup / Mixer -> Social / Mixer
UPDATE events 
SET ai_event_type = 'Social / Mixer'
WHERE ai_event_type = 'Meetup / Mixer';

-- Panel Discussion stays the same
-- UPDATE events SET ai_event_type = 'Panel Discussion' WHERE ai_event_type = 'Panel Discussion';

-- Update Hackathon -> Competition / Hackathon
UPDATE events 
SET ai_event_type = 'Competition / Hackathon'
WHERE ai_event_type = 'Hackathon';

-- Update Other -> Technical Talk / Presentation (fallback)
UPDATE events 
SET ai_event_type = 'Technical Talk / Presentation'
WHERE ai_event_type = 'Other';

-- 5. Handle special cases based on content

-- Lunch & Learn events should be Social / Mixer (because they combine learning + networking)
UPDATE events 
SET ai_event_type = 'Social / Mixer'
WHERE title ILIKE '%lunch%learn%' OR title ILIKE '%lunch & learn%';

-- Thinking Big Science should be Workshop / Discussion
UPDATE events 
SET ai_event_type = 'Workshop / Discussion'
WHERE title ILIKE '%thinking big science%';

-- Demo Night events should be Demo / Showcase
UPDATE events 
SET ai_event_type = 'Demo / Showcase'
WHERE title ILIKE '%demo%night%' OR title ILIKE '%demo night%';

-- Academic conferences should be Research / Academic Conference
UPDATE events 
SET ai_event_type = 'Research / Academic Conference'
WHERE title ILIKE '%society%conference%' 
   OR title ILIKE '%annual%conference%' 
   OR title ILIKE '%academic%conference%'
   OR title ILIKE 'British Society%';

-- 6. Check the results
SELECT 
  ai_event_type,
  COUNT(*) as count
FROM events 
GROUP BY ai_event_type
ORDER BY count DESC;

-- 7. Show sample of updated events
SELECT 
  title,
  ai_event_type
FROM events 
ORDER BY title
LIMIT 10;
