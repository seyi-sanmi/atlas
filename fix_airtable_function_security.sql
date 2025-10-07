-- =============================================
-- ATLAS Airtable Security Fix - Function Version
-- =============================================
-- This fixes the security issue with the get_atlas_public_data_as_postgres function
-- and recreates the view to work properly

-- STEP 1: Check the current function (for reference)
SELECT 
  proname as function_name,
  CASE WHEN prosecdef THEN '⚠️ HAS SECURITY DEFINER' ELSE '✅ No Security Definer' END as status
FROM pg_proc 
WHERE proname = 'get_atlas_public_data_as_postgres';

-- STEP 2: Drop the existing view (it will be recreated)
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;

-- STEP 3: Drop and recreate the function WITHOUT SECURITY DEFINER
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
-- IMPORTANT: Remove SECURITY DEFINER - this is the security fix!
-- The function will now run with the caller's permissions
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

-- STEP 4: Recreate the view using the fixed function
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT 
  name,
  community_type,
  location_names,
  academic_association,
  website,
  research_area_names,
  community_linkedin,
  size,
  purpose,
  members_selection,
  member_locations,
  target_members,
  member_communication,
  meeting_frequency,
  meeting_location,
  leadership_change_frequency,
  community_interest_areas,
  community_information,
  starred_on_website
FROM get_atlas_public_data_as_postgres();

-- STEP 5: Grant necessary permissions
-- Grant execute permission on the function to public roles
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO anon;
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO authenticated;

-- Grant select permission on the view to public roles
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;

-- STEP 6: Grant postgres role permission to access the foreign table
-- This is needed because the function now runs with caller's permissions
GRANT USAGE ON FOREIGN SERVER airtable_server TO anon, authenticated;
GRANT SELECT ON airtable.atlas_public_view TO anon, authenticated;

-- STEP 7: Verify the fix
SELECT 
  '=== VERIFICATION ===' as section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '⚠️ STILL HAS SECURITY DEFINER - FIX FAILED'
    ELSE '✅ Security Definer Removed - FIXED!'
  END as status
FROM pg_proc 
WHERE proname = 'get_atlas_public_data_as_postgres';

-- STEP 8: Test data access
SELECT '=== TEST DATA ACCESS ===' as section, COUNT(*) as community_count 
FROM public.atlas_public_view_in_public;

SELECT '=== SAMPLE DATA ===' as section, name, community_type, location_names 
FROM public.atlas_public_view_in_public 
LIMIT 3;

-- =============================================
-- ALTERNATIVE FIX: Direct View (No Function)
-- =============================================
-- If the above doesn't work or you prefer a simpler approach,
-- uncomment and run this alternative that bypasses the function entirely:

/*
-- Drop the view and function
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

-- Create a direct view without any function
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT 
  name,
  community_type,
  location_names,
  academic_association,
  website,
  research_area_names,
  community_linkedin,
  size,
  purpose,
  members_selection,
  member_locations,
  target_members,
  member_communication,
  meeting_frequency,
  meeting_location,
  leadership_change_frequency,
  community_interest_areas,
  community_information,
  starred_on_website
FROM airtable.atlas_public_view;

-- Grant permissions
GRANT SELECT ON airtable.atlas_public_view TO anon, authenticated;
GRANT SELECT ON public.atlas_public_view_in_public TO anon, authenticated;

-- Test
SELECT COUNT(*) FROM public.atlas_public_view_in_public;
*/

-- =============================================
-- NOTES
-- =============================================
/*
This fix:
1. ✅ Removes SECURITY DEFINER from the function
2. ✅ Grants proper permissions to anon/authenticated roles
3. ✅ Allows the function to access the foreign table
4. ✅ Maintains backward compatibility with your code

After running this:
- The security warning in Supabase should disappear
- Your communities page should work normally
- The function runs with caller's permissions (more secure)

If you get permission errors after this fix:
- The anon role might need additional foreign table access
- Try the alternative fix (direct view) which is simpler
- Check Supabase logs for specific permission errors

Why the ALTERNATIVE FIX might be better:
- Simpler (no function, just direct view)
- Fewer permission issues
- Easier to maintain
- Same functionality

Choose whichever approach works for your setup!
*/




