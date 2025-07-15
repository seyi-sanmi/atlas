-- Fix Admin RLS Policies (Version 2 - No Recursion)
-- Run this in your Supabase SQL Editor

-- 1. First, drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

-- 2. Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add new admin policies using the function
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    is_admin_user(auth.uid())
  );

-- 4. Verify the policies were created
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