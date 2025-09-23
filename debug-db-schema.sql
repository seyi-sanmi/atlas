-- Debug script to check database schema for events table
-- Run this in your Supabase SQL Editor to check what columns exist

-- 1. Check if events table exists and show all columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check specifically for the new ai_event_types column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name = 'ai_event_types';

-- 3. Check for any constraints on the ai_event_types column
SELECT constraint_name, constraint_type, table_name, column_name
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.table_constraints tc ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'events' 
AND ccu.column_name = 'ai_event_types';

-- 4. Show sample data structure (if any events exist)
SELECT id, title, ai_event_type, ai_event_types, platform
FROM events 
LIMIT 3;
