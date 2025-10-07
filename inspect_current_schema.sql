-- =============================================
-- Inspect Current Communities Schema
-- =============================================
-- Check the exact structure of both the view and foreign table

-- SECTION 1: Check public.atlas_public_view_in_public view columns
SELECT 
  '=== PUBLIC VIEW SCHEMA ===' as section,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'atlas_public_view_in_public'
ORDER BY ordinal_position;

-- SECTION 2: Check airtable.atlas_public_view foreign table columns
SELECT 
  '=== AIRTABLE FOREIGN TABLE SCHEMA ===' as section,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'airtable' 
  AND table_name = 'atlas_public_view'
ORDER BY ordinal_position;

-- SECTION 3: Sample data from public view (to see actual structure)
SELECT 
  '=== PUBLIC VIEW SAMPLE DATA ===' as section,
  *
FROM public.atlas_public_view_in_public
LIMIT 2;

-- SECTION 4: Sample data from airtable foreign table (to see actual structure)
SELECT 
  '=== AIRTABLE FOREIGN TABLE SAMPLE DATA ===' as section,
  *
FROM airtable.atlas_public_view
LIMIT 2;

-- SECTION 5: Check data types of array-like columns
SELECT 
  '=== ARRAY COLUMN TYPES ===' as section,
  name,
  pg_typeof(community_type) as community_type_type,
  pg_typeof(location_names) as location_names_type,
  pg_typeof(academic_association) as academic_association_type,
  pg_typeof(research_area_names) as research_area_names_type,
  pg_typeof(member_communication) as member_communication_type,
  pg_typeof(community_interest_areas) as community_interest_areas_type
FROM airtable.atlas_public_view
LIMIT 2;

-- SECTION 6: Count total records in each
SELECT '=== RECORD COUNTS ===' as section,
  (SELECT COUNT(*) FROM public.atlas_public_view_in_public) as public_view_count,
  (SELECT COUNT(*) FROM airtable.atlas_public_view) as airtable_table_count;

-- SECTION 7: Check if view definition uses the function or direct query
SELECT 
  '=== VIEW DEFINITION ===' as section,
  viewname,
  LEFT(definition, 200) as definition_preview
FROM pg_views
WHERE viewname = 'atlas_public_view_in_public';

-- SECTION 8: List all columns we need to migrate
SELECT 
  '=== MIGRATION COLUMN LIST ===' as section,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as all_columns
FROM information_schema.columns
WHERE table_schema = 'airtable' 
  AND table_name = 'atlas_public_view';


