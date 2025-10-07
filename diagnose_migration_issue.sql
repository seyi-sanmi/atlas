-- =============================================
-- Diagnose Why Communities Page Shows No Data
-- =============================================

-- STEP 1: Check if data exists in the native table
SELECT '=== DATA IN NATIVE TABLE ===' as section, COUNT(*) as count
FROM public.communities;

-- STEP 2: Check if view returns data
SELECT '=== DATA IN VIEW ===' as section, COUNT(*) as count
FROM public.atlas_public_view_in_public;

-- STEP 3: Check sample data from view (what the app queries)
SELECT '=== SAMPLE FROM VIEW ===' as section, 
  name, 
  community_type,
  location_names,
  starred_on_website
FROM public.atlas_public_view_in_public
LIMIT 5;

-- STEP 4: Check RLS policies on communities table
SELECT '=== RLS POLICIES ===' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'communities';

-- STEP 5: Check if RLS is enabled
SELECT '=== RLS STATUS ===' as section,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'communities';

-- STEP 6: Check view permissions
SELECT '=== VIEW PERMISSIONS ===' as section,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'atlas_public_view_in_public'
  AND grantee IN ('anon', 'authenticated', 'postgres');

-- STEP 7: Test query as anon role (what your app uses)
SET ROLE anon;
SELECT '=== TEST AS ANON ROLE ===' as section, COUNT(*) as count
FROM public.atlas_public_view_in_public;
RESET ROLE;

-- STEP 8: Test specific filters that your app might use
SELECT '=== TEST STARRED FILTER ===' as section, COUNT(*) as count
FROM public.atlas_public_view_in_public
WHERE starred_on_website = true;

-- STEP 9: Check for NULL values that might break queries
SELECT '=== NULL CHECK ===' as section,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE name IS NULL) as null_names,
  COUNT(*) FILTER (WHERE community_type IS NULL) as null_types,
  COUNT(*) FILTER (WHERE location_names IS NULL) as null_locations
FROM public.atlas_public_view_in_public;

-- STEP 10: Test the exact query your app uses
SELECT '=== APP QUERY TEST ===' as section, *
FROM public.atlas_public_view_in_public
ORDER BY name
LIMIT 5;

