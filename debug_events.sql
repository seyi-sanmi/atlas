-- Debug Events Table
-- Run this in your Supabase SQL Editor

-- 1. Check if events table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any events in the table
SELECT COUNT(*) as total_events FROM events;

-- 3. Check a few sample events
SELECT 
  id,
  title,
  platform,
  created_at,
  view_count,
  click_count
FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if RLS is enabled on events table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'events';

-- 5. Check RLS policies on events table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'events'; 