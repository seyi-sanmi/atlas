-- =============================================
-- Fix: Grant Foreign Table Access to Public Roles
-- =============================================
-- This allows the function to work WITHOUT SECURITY DEFINER
-- by giving anon/authenticated roles proper access

-- STEP 1: Grant schema usage
GRANT USAGE ON SCHEMA airtable TO anon, authenticated;

-- STEP 2: Grant foreign server usage
GRANT USAGE ON FOREIGN SERVER airtable_server TO anon, authenticated;

-- STEP 3: Grant select on the foreign table
GRANT SELECT ON airtable.atlas_public_view TO anon, authenticated;

-- STEP 4: Drop and recreate function WITHOUT SECURITY DEFINER
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

CREATE OR REPLACE FUNCTION public.get_atlas_public_data_as_postgres()
RETURNS TABLE (
  name TEXT,
  community_type TEXT[],
  location_names TEXT[],
  academic_association TEXT[],
  website TEXT,
  research_area_names TEXT[],
  community_linkedin TEXT,
  size TEXT,
  purpose TEXT,
  members_selection TEXT,
  member_locations TEXT,
  target_members TEXT,
  member_communication TEXT[],
  meeting_frequency TEXT,
  meeting_location TEXT,
  leadership_change_frequency TEXT,
  community_interest_areas TEXT[],
  community_information TEXT,
  starred_on_website BOOLEAN
)
LANGUAGE plpgsql
-- NO SECURITY DEFINER - uses caller's permissions (now properly granted)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    a.community_type,
    a.location_names,
    a.academic_association,
    a.website,
    a.research_area_names,
    a.community_linkedin,
    a.size,
    a.purpose,
    a.members_selection,
    a.member_locations,
    a.target_members,
    a.member_communication,
    a.meeting_frequency,
    a.meeting_location,
    a.leadership_change_frequency,
    a.community_interest_areas,
    a.community_information,
    a.starred_on_website
  FROM airtable.atlas_public_view a;
END;
$$;

-- STEP 5: Recreate the view
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT * FROM get_atlas_public_data_as_postgres();

-- STEP 6: Grant permissions on function and view
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO anon, authenticated;
GRANT SELECT ON public.atlas_public_view_in_public TO anon, authenticated;

-- STEP 7: Verify no SECURITY DEFINER
SELECT 
  '=== VERIFICATION ===' as section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '⚠️ HAS SECURITY DEFINER'
    ELSE '✅ No Security Definer'
  END as status
FROM pg_proc 
WHERE proname = 'get_atlas_public_data_as_postgres';

-- STEP 8: Test data access
SELECT '=== TEST COUNT ===' as section, COUNT(*) as total 
FROM public.atlas_public_view_in_public;

-- STEP 9: Test sample data
SELECT 
  '=== SAMPLE DATA ===' as section,
  name,
  community_type,
  location_names,
  starred_on_website
FROM public.atlas_public_view_in_public 
LIMIT 3;

-- STEP 10: Check permissions
SELECT 
  '=== PERMISSIONS CHECK ===' as section,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'airtable' 
  AND table_name = 'atlas_public_view'
  AND grantee IN ('anon', 'authenticated');

-- =============================================
-- EXPECTED RESULTS
-- =============================================
/*
Step 7 should show: ✅ No Security Definer
Step 8 should show: Your total community count
Step 9 should show: Sample community data
Step 10 should show: SELECT permissions for anon and authenticated

If Step 8 or 9 fails with permission errors:
- Foreign table permissions might not work for anon role
- You may need SECURITY DEFINER on the function (unavoidable)
- Consider migrating to native table (migrate_airtable_to_native_table.sql)

If it works:
- ✅ Security issue resolved
- ✅ Communities page should work
- ✅ No more Supabase warnings
*/


