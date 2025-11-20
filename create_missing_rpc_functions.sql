-- =============================================
-- Create Missing RPC Functions for Communities Filters
-- =============================================
-- The app calls get_unique_jsonb_array_text_values which was deleted
-- Now we need a version that works with TEXT[] arrays (not JSONB)

-- STEP 1: Create function to get unique values from TEXT[] array columns
CREATE OR REPLACE FUNCTION get_unique_text_array_values(
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result TEXT[];
  query TEXT;
BEGIN
  -- Build dynamic query to get unique values from TEXT[] column
  query := format(
    'SELECT ARRAY(
      SELECT DISTINCT unnest(%I) 
      FROM %I 
      WHERE %I IS NOT NULL 
      ORDER BY 1
    )',
    p_column_name,
    p_table_name,
    p_column_name
  );
  
  -- Execute and return
  EXECUTE query INTO result;
  RETURN result;
END;
$$;

-- STEP 2: Create alias with old name for backward compatibility
CREATE OR REPLACE FUNCTION get_unique_jsonb_array_text_values(
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Just call the new function
  RETURN get_unique_text_array_values(p_table_name, p_column_name);
END;
$$;

-- STEP 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_unique_text_array_values(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unique_jsonb_array_text_values(TEXT, TEXT) TO anon, authenticated;

-- STEP 4: Test the functions
SELECT '=== TEST COMMUNITY TYPES ===' as section,
  get_unique_jsonb_array_text_values('atlas_public_view_in_public', 'community_type') as unique_types;

SELECT '=== TEST LOCATIONS ===' as section,
  get_unique_jsonb_array_text_values('atlas_public_view_in_public', 'location_names') as unique_locations;

SELECT '=== TEST RESEARCH AREAS ===' as section,
  get_unique_jsonb_array_text_values('atlas_public_view_in_public', 'research_area_names') as unique_research_areas;

-- =============================================
-- NOTES
-- =============================================
/*
✅ WHAT THIS DOES:
1. Creates get_unique_text_array_values() - works with TEXT[] arrays
2. Creates get_unique_jsonb_array_text_values() - alias for backward compatibility
3. Both functions use SECURITY DEFINER with search_path set (secure)
4. Grants execute permissions to anon and authenticated roles

HOW IT WORKS:
- Uses unnest() to explode TEXT[] array into rows
- Uses DISTINCT to get unique values
- Orders alphabetically
- Returns as TEXT[] array

This replaces the old JSONB version with one that works with TEXT[] arrays.
The app will work without any code changes!
*/




