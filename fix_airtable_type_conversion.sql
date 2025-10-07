-- =============================================
-- ATLAS Airtable Type Conversion Fix
-- =============================================
-- Fixes the JSONB to TEXT[] conversion issue

-- STEP 1: Drop the existing function and view
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

-- STEP 2: Recreate the function with proper JSONB to TEXT[] conversion
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
-- NO SECURITY DEFINER - runs with caller's permissions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name::TEXT,
    -- Convert JSONB arrays to TEXT[] arrays
    CASE 
      WHEN a.community_type IS NULL THEN NULL
      WHEN jsonb_typeof(a.community_type) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.community_type))
      ELSE ARRAY[a.community_type::TEXT]
    END::TEXT[],
    CASE 
      WHEN a.location_names IS NULL THEN NULL
      WHEN jsonb_typeof(a.location_names) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.location_names))
      ELSE ARRAY[a.location_names::TEXT]
    END::TEXT[],
    CASE 
      WHEN a.academic_association IS NULL THEN NULL
      WHEN jsonb_typeof(a.academic_association) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.academic_association))
      ELSE ARRAY[a.academic_association::TEXT]
    END::TEXT[],
    a.website::TEXT,
    CASE 
      WHEN a.research_area_names IS NULL THEN NULL
      WHEN jsonb_typeof(a.research_area_names) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.research_area_names))
      ELSE ARRAY[a.research_area_names::TEXT]
    END::TEXT[],
    a.community_linkedin::TEXT,
    a.size::TEXT,
    a.purpose::TEXT,
    a.members_selection::TEXT,
    a.member_locations::TEXT,
    a.target_members::TEXT,
    CASE 
      WHEN a.member_communication IS NULL THEN NULL
      WHEN jsonb_typeof(a.member_communication) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.member_communication))
      ELSE ARRAY[a.member_communication::TEXT]
    END::TEXT[],
    a.meeting_frequency::TEXT,
    a.meeting_location::TEXT,
    a.leadership_change_frequency::TEXT,
    CASE 
      WHEN a.community_interest_areas IS NULL THEN NULL
      WHEN jsonb_typeof(a.community_interest_areas) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.community_interest_areas))
      ELSE ARRAY[a.community_interest_areas::TEXT]
    END::TEXT[],
    a.community_information::TEXT,
    a.starred_on_website::BOOLEAN
  FROM airtable.atlas_public_view a;
END;
$$;

-- STEP 3: Recreate the view
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

-- STEP 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO anon;
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO authenticated;
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;

-- Grant access to the foreign table
GRANT USAGE ON FOREIGN SERVER airtable_server TO anon, authenticated;
GRANT SELECT ON airtable.atlas_public_view TO anon, authenticated;

-- STEP 5: Verify the fix
SELECT 
  '=== VERIFICATION ===' as section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '⚠️ HAS SECURITY DEFINER'
    ELSE '✅ No Security Definer'
  END as status
FROM pg_proc 
WHERE proname = 'get_atlas_public_data_as_postgres';

-- STEP 6: Test data access
SELECT '=== TEST DATA ACCESS ===' as section, COUNT(*) as community_count 
FROM public.atlas_public_view_in_public;

-- STEP 7: Sample data
SELECT 
  '=== SAMPLE DATA ===' as section,
  name,
  community_type,
  location_names,
  starred_on_website
FROM public.atlas_public_view_in_public 
LIMIT 3;

-- =============================================
-- SIMPLER ALTERNATIVE: Direct View with Type Casting
-- =============================================
-- This is often easier and more maintainable than a function
-- Uncomment and run if you prefer a simpler approach:

/*
-- Drop existing view and function
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

-- Create direct view with JSONB to TEXT[] conversion
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT 
  name::TEXT,
  -- Convert JSONB arrays to TEXT[]
  CASE 
    WHEN community_type IS NULL THEN NULL
    WHEN jsonb_typeof(community_type) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(community_type))
    ELSE ARRAY[community_type::TEXT]
  END::TEXT[] as community_type,
  CASE 
    WHEN location_names IS NULL THEN NULL
    WHEN jsonb_typeof(location_names) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(location_names))
    ELSE ARRAY[location_names::TEXT]
  END::TEXT[] as location_names,
  CASE 
    WHEN academic_association IS NULL THEN NULL
    WHEN jsonb_typeof(academic_association) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(academic_association))
    ELSE ARRAY[academic_association::TEXT]
  END::TEXT[] as academic_association,
  website::TEXT,
  CASE 
    WHEN research_area_names IS NULL THEN NULL
    WHEN jsonb_typeof(research_area_names) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(research_area_names))
    ELSE ARRAY[research_area_names::TEXT]
  END::TEXT[] as research_area_names,
  community_linkedin::TEXT,
  size::TEXT,
  purpose::TEXT,
  members_selection::TEXT,
  member_locations::TEXT,
  target_members::TEXT,
  CASE 
    WHEN member_communication IS NULL THEN NULL
    WHEN jsonb_typeof(member_communication) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(member_communication))
    ELSE ARRAY[member_communication::TEXT]
  END::TEXT[] as member_communication,
  meeting_frequency::TEXT,
  meeting_location::TEXT,
  leadership_change_frequency::TEXT,
  CASE 
    WHEN community_interest_areas IS NULL THEN NULL
    WHEN jsonb_typeof(community_interest_areas) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(community_interest_areas))
    ELSE ARRAY[community_interest_areas::TEXT]
  END::TEXT[] as community_interest_areas,
  community_information::TEXT,
  starred_on_website::BOOLEAN
FROM airtable.atlas_public_view;

-- Grant permissions
GRANT USAGE ON FOREIGN SERVER airtable_server TO anon, authenticated;
GRANT SELECT ON airtable.atlas_public_view TO anon, authenticated;
GRANT SELECT ON public.atlas_public_view_in_public TO anon, authenticated;

-- Test
SELECT COUNT(*) as total FROM public.atlas_public_view_in_public;
SELECT name, community_type, location_names FROM public.atlas_public_view_in_public LIMIT 3;
*/

-- =============================================
-- NOTES
-- =============================================
/*
This fix:
1. ✅ Converts JSONB arrays to TEXT[] arrays properly
2. ✅ No SECURITY DEFINER (secure)
3. ✅ Handles NULL values correctly
4. ✅ Maintains backward compatibility with your app

The conversion logic handles three cases:
- NULL values → NULL
- JSONB arrays → TEXT[] arrays (proper conversion)
- Single values → Single-element TEXT[] array

Why the alternative (direct view) is better:
- Simpler SQL (no function)
- Better performance (no function call overhead)
- Easier to maintain and debug
- Same functionality

I recommend trying the ALTERNATIVE approach if this one is too complex!
*/


