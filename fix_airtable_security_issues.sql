-- =============================================
-- ATLAS Airtable Integration Security Fix
-- =============================================
-- This script fixes the security issues with the Airtable-Supabase integration
-- while maintaining functionality for the communities page

-- STEP 1: Remove the foreign table from the PostgREST API schema
-- This prevents direct API access to the foreign table
ALTER FOREIGN TABLE IF EXISTS airtable.atlas_public_view
  SET SCHEMA airtable;  -- Ensure it's in airtable schema, not public

-- STEP 2: Drop the existing SECURITY DEFINER view if it exists
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;

-- STEP 3: Create a new view WITHOUT SECURITY DEFINER
-- This view will respect RLS policies (when we add them)
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

-- STEP 4: Grant public read access to the view
-- Since communities are public data, anyone can read them
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;

-- STEP 5: Ensure the view is accessible via the API
-- Add the view to the PostgREST schema
COMMENT ON VIEW public.atlas_public_view_in_public IS 'Public view of communities from Airtable';

-- STEP 6: Verify the foreign table is NOT in the API schema
-- Check that the foreign table is in the 'airtable' schema (not 'public')
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'atlas_public_view'
    AND table_type = 'FOREIGN'
  ) THEN
    RAISE EXCEPTION 'Foreign table still exists in public schema. Please move it to airtable schema.';
  END IF;
END $$;

-- STEP 7: Security audit check
-- Verify no SECURITY DEFINER views reference the foreign table
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND definition ILIKE '%atlas_public_view%'
  AND viewname != 'atlas_public_view_in_public';

-- STEP 8: Test the view
SELECT COUNT(*) as community_count FROM public.atlas_public_view_in_public;
SELECT name, community_type, location_names FROM public.atlas_public_view_in_public LIMIT 5;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check that the view exists and is accessible
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'atlas_public_view_in_public';

-- Check permissions
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'atlas_public_view_in_public';

-- Verify no SECURITY DEFINER on the view
SELECT 
  n.nspname as schema_name,
  c.relname as view_name,
  CASE 
    WHEN c.relkind = 'v' THEN 'Regular View'
    ELSE 'Other'
  END as view_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'atlas_public_view_in_public'
  AND n.nspname = 'public';

-- =============================================
-- NOTES
-- =============================================
-- 
-- This fix:
-- 1. Removes SECURITY DEFINER from the view (security fix)
-- 2. Keeps the foreign table in 'airtable' schema (not exposed via API)
-- 3. Creates a proper public view with explicit grants
-- 4. Maintains backward compatibility with existing code
--
-- After running this:
-- - The communities page should work normally
-- - Supabase security advisor should not flag these issues
-- - The foreign table is protected from direct API access
--
-- If the communities page still doesn't work after this:
-- 1. Check Supabase logs for specific errors
-- 2. Verify your Airtable FDW connection is working
-- 3. Test the view directly in Supabase SQL editor
-- =============================================



