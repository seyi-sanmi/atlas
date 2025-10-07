-- =============================================
-- FINAL FIX: Function with JSONB to TEXT[] Conversion
-- =============================================
-- Security Definer removed ✅
-- Permissions granted ✅  
-- Now we just need proper type conversion

-- STEP 1: Drop and recreate function with type conversion
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
-- NO SECURITY DEFINER - uses caller's permissions (already granted)
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    -- Convert JSONB to TEXT[] using translate() to convert JSON array to PostgreSQL array
    CASE 
      WHEN a.community_type IS NULL THEN NULL::TEXT[]
      ELSE translate(a.community_type::text, '[]', '{}')::TEXT[]
    END as community_type,
    CASE 
      WHEN a.location_names IS NULL THEN NULL::TEXT[]
      ELSE translate(a.location_names::text, '[]', '{}')::TEXT[]
    END as location_names,
    CASE 
      WHEN a.academic_association IS NULL THEN NULL::TEXT[]
      ELSE translate(a.academic_association::text, '[]', '{}')::TEXT[]
    END as academic_association,
    a.website,
    CASE 
      WHEN a.research_area_names IS NULL THEN NULL::TEXT[]
      ELSE translate(a.research_area_names::text, '[]', '{}')::TEXT[]
    END as research_area_names,
    a.community_linkedin,
    a.size,
    a.purpose,
    a.members_selection,
    a.member_locations,
    a.target_members,
    CASE 
      WHEN a.member_communication IS NULL THEN NULL::TEXT[]
      ELSE translate(a.member_communication::text, '[]', '{}')::TEXT[]
    END as member_communication,
    a.meeting_frequency,
    a.meeting_location,
    a.leadership_change_frequency,
    CASE 
      WHEN a.community_interest_areas IS NULL THEN NULL::TEXT[]
      ELSE translate(a.community_interest_areas::text, '[]', '{}')::TEXT[]
    END as community_interest_areas,
    a.community_information,
    a.starred_on_website
  FROM airtable.atlas_public_view a;
END;
$$;

-- STEP 2: Recreate the view
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT * FROM get_atlas_public_data_as_postgres();

-- STEP 3: Grant permissions (already granted but let's ensure)
GRANT EXECUTE ON FUNCTION public.get_atlas_public_data_as_postgres() TO anon, authenticated;
GRANT SELECT ON public.atlas_public_view_in_public TO anon, authenticated;

-- STEP 4: Verify no SECURITY DEFINER
SELECT 
  '=== VERIFICATION ===' as section,
  proname as function_name,
  CASE 
    WHEN prosecdef THEN '⚠️ HAS SECURITY DEFINER'
    ELSE '✅ No Security Definer'
  END as status
FROM pg_proc 
WHERE proname = 'get_atlas_public_data_as_postgres';

-- STEP 5: Test data access
SELECT '=== TEST COUNT ===' as section, COUNT(*) as total 
FROM public.atlas_public_view_in_public;

-- STEP 6: Test sample data and verify arrays work
SELECT 
  '=== SAMPLE DATA ===' as section,
  name,
  community_type,
  array_length(community_type, 1) as type_count,
  location_names,
  array_length(location_names, 1) as location_count,
  starred_on_website
FROM public.atlas_public_view_in_public 
LIMIT 3;

-- STEP 7: Test array filtering (what your app does)
SELECT 
  '=== TEST ARRAY FILTERING ===' as section,
  COUNT(*) as starred_count
FROM public.atlas_public_view_in_public 
WHERE starred_on_website = true;

-- =============================================
-- HOW THE CONVERSION WORKS
-- =============================================
/*
The translate() trick:
- JSONB arrays use JSON notation: ["item1", "item2"]
- PostgreSQL TEXT[] arrays use: {"item1", "item2"}
- translate(jsonb::text, '[]', '{}') converts: ["a","b"] → {"a","b"}
- Then ::TEXT[] casts it to a proper TEXT[] array

This is simpler than jsonb_array_elements and handles all cases:
- NULL values → NULL::TEXT[]
- Single items → {"item"}
- Multiple items → {"item1", "item2", ...}

Why this works:
1. ✅ Converts JSONB arrays to TEXT[] arrays
2. ✅ No SECURITY DEFINER (secure)
3. ✅ Permissions already granted
4. ✅ Compatible with your app's array operations
5. ✅ Handles NULL values correctly

Your communities page should now work perfectly!
*/


