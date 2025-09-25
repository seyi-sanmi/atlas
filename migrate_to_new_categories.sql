-- =============================================
-- Migrate to New 7-Category Structure with Multi-Categorization
-- =============================================
-- This migration updates the event categorization system to use 7 new categories
-- with support for multi-categorization (max 2 categories per event)

-- 1. First, let's see the current state
SELECT 
  ai_event_type,
  ai_event_types,
  COUNT(*) as count
FROM events 
GROUP BY ai_event_type, ai_event_types
ORDER BY count DESC;

-- 2. Create a mapping table for the migration
CREATE TEMP TABLE category_mapping AS
SELECT 
  id,
  title,
  description,
  ai_event_type,
  ai_event_types,
  CASE 
    -- Technical Talk / Presentation
    WHEN (title ILIKE '%info session%' OR title ILIKE '%activator%' OR 
          description ILIKE '%info session%' OR description ILIKE '%program overview%' OR
          description ILIKE '%technical%' OR description ILIKE '%research%' OR
          description ILIKE '%scientific%' OR description ILIKE '%innovation%' OR
          description ILIKE '%talk%' OR description ILIKE '%presentation%' OR
          description ILIKE '%flash talks%')
    THEN ARRAY['Technical Talk / Presentation']
    
    -- Workshop / Discussion  
    WHEN (title ILIKE '%thinking big science%' OR
          description ILIKE '%workshop%' OR description ILIKE '%discussion%' OR
          description ILIKE '%explore how%' OR description ILIKE '%structured group%' OR
          description ILIKE '%group rotations%' OR description ILIKE '%interactive%' OR
          description ILIKE '%brainstorming%' OR description ILIKE '%hands-on%' OR
          description ILIKE '%practical%' OR description ILIKE '%turning ideas into action%' OR
          description ILIKE '%ambitious thinkers%' OR description ILIKE '%thought experiment%')
    THEN ARRAY['Workshop / Discussion']
    
    -- Demo / Showcase
    WHEN (title ILIKE '%demo night%' OR title ILIKE '%demo%' OR title ILIKE '%showcase%' OR
          description ILIKE '%demo%' OR description ILIKE '%demonstration%' OR
          description ILIKE '%showcase%' OR description ILIKE '%exhibition%' OR
          description ILIKE '%technical showcase%' OR description ILIKE '%frontier AI demos%')
    THEN ARRAY['Demo / Showcase']
    
    -- Social / Mixer
    WHEN (title ILIKE '%mixer%' OR title ILIKE '%networking%' OR title ILIKE '%drinks%' OR
          title ILIKE '%chill%' OR description ILIKE '%networking%' OR
          description ILIKE '%social%' OR description ILIKE '%meet other%' OR
          description ILIKE '%community%' OR description ILIKE '%mixer%' OR
          description ILIKE '%drinks%' OR description ILIKE '%get together%' OR
          description ILIKE '%mingle%' OR description ILIKE '%afterwork%')
    THEN ARRAY['Social / Mixer']
    
    -- Panel Discussion
    WHEN (title ILIKE '%panel%' OR description ILIKE '%panel%' OR
          description ILIKE '%expert panel%' OR description ILIKE '%roundtable%' OR
          description ILIKE '%panel discussion%' OR description ILIKE '%moderated discussion%' OR
          description ILIKE '%Q&A%' OR description ILIKE '%experts%')
    THEN ARRAY['Panel Discussion']
    
    -- Research / Academic Conference
    WHEN (title ILIKE '%conference%' AND (title ILIKE '%society%' OR title ILIKE '%annual%' OR
          title ILIKE '%academic%' OR description ILIKE '%annual conference%' OR
          description ILIKE '%society conference%' OR description ILIKE '%academic conference%' OR
          description ILIKE '%symposium%' OR description ILIKE '%formal conference%'))
    THEN ARRAY['Research / Academic Conference']
    
    -- Competition / Hackathon
    WHEN (title ILIKE '%hackathon%' OR title ILIKE '%hack%' OR title ILIKE '%competition%' OR
          description ILIKE '%hackathon%' OR description ILIKE '%competition%' OR
          description ILIKE '%contest%' OR description ILIKE '%challenge%' OR
          description ILIKE '%hack%' OR description ILIKE '%competitive%')
    THEN ARRAY['Competition / Hackathon']
    
    -- Default fallback
    ELSE ARRAY['Technical Talk / Presentation']
  END as primary_category
FROM events;

-- 3. Add multi-category logic for hybrid events
UPDATE category_mapping 
SET primary_category = CASE 
  -- Lunch & Learn events: Technical Talk + Social/Mixer
  WHEN title ILIKE '%lunch & learn%' OR title ILIKE '%lunch and learn%'
  THEN ARRAY['Technical Talk / Presentation', 'Social / Mixer']
  
  -- Thinking Big Science: Workshop + Technical Talk
  WHEN title ILIKE '%thinking big science%'
  THEN ARRAY['Workshop / Discussion', 'Technical Talk / Presentation']
  
  -- Demo nights with networking: Demo + Technical Talk
  WHEN title ILIKE '%demo night%' AND (description ILIKE '%networking%' OR description ILIKE '%food%')
  THEN ARRAY['Demo / Showcase', 'Technical Talk / Presentation']
  
  -- Events with both technical and social elements
  WHEN (description ILIKE '%networking%' OR description ILIKE '%food and networking%' OR 
        description ILIKE '%drinks%' OR description ILIKE '%social%') 
       AND (description ILIKE '%technical%' OR description ILIKE '%research%' OR 
            description ILIKE '%innovation%' OR description ILIKE '%presentation%')
       AND NOT (title ILIKE '%conference%' AND (title ILIKE '%society%' OR title ILIKE '%annual%'))
  THEN ARRAY['Technical Talk / Presentation', 'Social / Mixer']
  
  -- Hackathons with talks/presentations
  WHEN (title ILIKE '%hackathon%' OR description ILIKE '%hackathon%') 
       AND (description ILIKE '%talk%' OR description ILIKE '%presentation%' OR description ILIKE '%technical%')
  THEN ARRAY['Competition / Hackathon', 'Technical Talk / Presentation']
  
  -- Keep existing single category
  ELSE primary_category
END;

-- 4. Check the mapping results before applying
SELECT 
  primary_category,
  COUNT(*) as count,
  STRING_AGG(title, '; ' ORDER BY title) as example_titles
FROM category_mapping 
GROUP BY primary_category
ORDER BY count DESC;

-- 5. Apply the new categories to the events table
UPDATE events 
SET ai_event_types = cm.primary_category
FROM category_mapping cm
WHERE events.id = cm.id;

-- 6. Ensure the constraint still works (max 2 categories)
-- Check if any events have more than 2 categories
SELECT id, title, ai_event_types, array_length(ai_event_types, 1) as category_count
FROM events 
WHERE array_length(ai_event_types, 1) > 2;

-- 7. Update any events that somehow got more than 2 categories
UPDATE events 
SET ai_event_types = ai_event_types[1:2]
WHERE array_length(ai_event_types, 1) > 2;

-- 8. Verify the migration results
SELECT 
  UNNEST(ai_event_types) as category,
  COUNT(*) as count
FROM events 
GROUP BY UNNEST(ai_event_types)
ORDER BY count DESC;

-- 9. Show multi-category events
SELECT 
  title,
  ai_event_types,
  array_length(ai_event_types, 1) as category_count
FROM events 
WHERE array_length(ai_event_types, 1) > 1
ORDER BY title;

-- 10. Clean up temporary table
DROP TABLE category_mapping;

-- 11. Final verification - show sample of migrated events
SELECT 
  title,
  ai_event_type as old_category,
  ai_event_types as new_categories
FROM events 
ORDER BY created_at DESC
LIMIT 10;
