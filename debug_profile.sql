-- Debug Profile and Role Check
-- Run this in your Supabase SQL Editor

-- 1. Check if your profile exists and what role you have
SELECT 
  id,
  full_name,
  role,
  created_at,
  updated_at
FROM profiles 
WHERE id = '89d395c2-b777-4e7f-85a0-874e37f41dd2';

-- 2. Check all profiles to see if yours is there
SELECT 
  id,
  full_name,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if RLS is enabled and what policies exist
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
WHERE tablename = 'profiles';

-- 4. Check if your user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '89d395c2-b777-4e7f-85a0-874e37f41dd2'; 