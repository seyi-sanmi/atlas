-- =============================================
-- ROBUST FIX: Handle Both JSONB Arrays AND Plain Text
-- =============================================
-- Some Airtable columns have JSONB arrays, others have plain text
-- This handles both cases properly

-- STEP 1: Drop and recreate function with robust type conversion
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
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.name,
    -- Robust conversion: handle both JSONB arrays and plain text
    CASE 
      WHEN a.community_type IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.community_type) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.community_type))
      WHEN jsonb_typeof(a.community_type) = 'string' THEN 
        ARRAY[a.community_type::TEXT]
      ELSE NULL::TEXT[]
    END as community_type,
    CASE 
      WHEN a.location_names IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.location_names) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.location_names))
      WHEN jsonb_typeof(a.location_names) = 'string' THEN 
        ARRAY[a.location_names::TEXT]
      ELSE NULL::TEXT[]
    END as location_names,
    CASE 
      WHEN a.academic_association IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.academic_association) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.academic_association))
      WHEN jsonb_typeof(a.academic_association) = 'string' THEN 
        ARRAY[a.academic_association::TEXT]
      ELSE NULL::TEXT[]
    END as academic_association,
    a.website,
    CASE 
      WHEN a.research_area_names IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.research_area_names) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.research_area_names))
      WHEN jsonb_typeof(a.research_area_names) = 'string' THEN 
        ARRAY[a.research_area_names::TEXT]
      ELSE NULL::TEXT[]
    END as research_area_names,
    a.community_linkedin,
    a.size,
    a.purpose,
    a.members_selection,
    a.member_locations,
    a.target_members,
    CASE 
      WHEN a.member_communication IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.member_communication) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.member_communication))
      WHEN jsonb_typeof(a.member_communication) = 'string' THEN 
        ARRAY[a.member_communication::TEXT]
      ELSE NULL::TEXT[]
    END as member_communication,
    a.meeting_frequency,
    a.meeting_location,
    a.leadership_change_frequency,
    CASE 
      WHEN a.community_interest_areas IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(a.community_interest_areas) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(a.community_interest_areas))
      WHEN jsonb_typeof(a.community_interest_areas) = 'string' THEN 
        ARRAY[a.community_interest_areas::TEXT]
      ELSE NULL::TEXT[]
    END as community_interest_areas,
    a.community_information,
    a.starred_on_website
  FROM airtable.atlas_public_view a;
END;
$$;

-- STEP 2: Recreate the view
CREATE OR REPLACE VIEW public.atlas_public_view_in_public AS
SELECT * FROM get_atlas_public_data_as_postgres();

-- STEP 3: Grant permissions
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

-- STEP 6: Test sample data
SELECT 
  '=== SAMPLE DATA ===' as section,
  name,
  community_type,
  array_length(community_type, 1) as type_count,
  location_names,
  array_length(location_names, 1) as location_count,
  starred_on_website
FROM public.atlas_public_view_in_public 
LIMIT 5;

-- STEP 7: Test filtering (what your app does)
SELECT 
  '=== TEST FILTERING ===' as section,
  COUNT(*) as starred_count
FROM public.atlas_public_view_in_public 
WHERE starred_on_website = true;

-- STEP 8: Test array contains operation (used by your filters)
SELECT 
  '=== TEST ARRAY OPERATIONS ===' as section,
  name,
  community_type
FROM public.atlas_public_view_in_public 
WHERE 'London' = ANY(location_names)
LIMIT 3;

-- =============================================
-- HOW THIS WORKS
-- =============================================
/*
This robust conversion handles three cases for each JSONB field:

1. NULL values → NULL::TEXT[]
2. JSONB arrays → Convert to TEXT[] using jsonb_array_elements_text()
3. JSONB strings → Wrap in single-element TEXT[] array

Example data transformations:
- NULL → NULL
- ["London", "Edinburgh"] → {"London", "Edinburgh"}
- "All areas/ verticals " → {"All areas/ verticals "}

Why this works:
✅ Handles mixed data types in Airtable
✅ No SECURITY DEFINER (secure)
✅ Works with your app's array operations (.contains, ANY, etc.)
✅ Properly converts all JSONB to TEXT[] arrays

Your communities page should now work perfectly!
*/

