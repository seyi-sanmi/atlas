-- =============================================
-- Check Actual Column Types in Airtable Foreign Table
-- =============================================

-- Check the column types
SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'airtable' 
  AND table_name = 'atlas_public_view'
ORDER BY ordinal_position;

-- Sample the actual data to see format
SELECT 
  name,
  community_type,
  pg_typeof(community_type) as community_type_type,
  location_names,
  pg_typeof(location_names) as location_names_type
FROM airtable.atlas_public_view
LIMIT 3;


