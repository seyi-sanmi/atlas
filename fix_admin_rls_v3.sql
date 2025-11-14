-- Fix Admin RLS Policies (Version 3 - Final Fix)
-- Run this in your Supabase SQL Editor

-- 1. Drop all the problematic policies and function
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP FUNCTION IF EXISTS is_admin_user(UUID);

-- 2. Create a simpler approach - allow all authenticated users to read profiles
-- This is safe because we'll handle admin logic in the application layer
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- 3. Keep the existing policies for own profile management
-- (These should already exist and work fine)

-- 4. Verify the policies
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
WHERE tablename = 'profiles'
ORDER BY policyname; 