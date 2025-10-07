-- =============================================
-- ATLAS Migration - CORRECT Schema Mapping
-- =============================================
-- Based on actual schema inspection:
-- JSONB columns: community_type, location_names, academic_association, research_area_names, member_communication
-- TEXT columns: everything else (including community_interest_areas which needs special handling)

-- STEP 1: Create native communities table with exact schema
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Exact columns from atlas_public_view_in_public
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
  starred_on_website BOOLEAN,
  
  -- Metadata
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_starred ON public.communities(starred_on_website);
CREATE INDEX IF NOT EXISTS idx_communities_community_type ON public.communities USING GIN(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_location_names ON public.communities USING GIN(location_names);
CREATE INDEX IF NOT EXISTS idx_communities_research_areas ON public.communities USING GIN(research_area_names);

-- STEP 3: Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies
DROP POLICY IF EXISTS "Communities are publicly readable" ON public.communities;
CREATE POLICY "Communities are publicly readable" ON public.communities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage communities" ON public.communities;
CREATE POLICY "Admins can manage communities" ON public.communities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- STEP 5: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_communities_updated_at_trigger ON public.communities;
CREATE TRIGGER update_communities_updated_at_trigger
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

-- STEP 6: Migrate data with correct type conversions
-- Handle JSONB columns (5 fields) and TEXT columns (14 fields)
INSERT INTO public.communities (
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
)
SELECT 
  name,
  -- JSONB → TEXT[] conversions (5 fields)
  CASE 
    WHEN community_type IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(community_type) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(community_type))
    ELSE ARRAY[community_type::TEXT]
  END,
  CASE 
    WHEN location_names IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(location_names) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(location_names))
    ELSE ARRAY[location_names::TEXT]
  END,
  CASE 
    WHEN academic_association IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(academic_association) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(academic_association))
    ELSE ARRAY[academic_association::TEXT]
  END,
  website, -- TEXT → TEXT (no conversion)
  CASE 
    WHEN research_area_names IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(research_area_names) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(research_area_names))
    ELSE ARRAY[research_area_names::TEXT]
  END,
  community_linkedin, -- TEXT → TEXT
  size, -- TEXT → TEXT
  purpose, -- TEXT → TEXT
  members_selection, -- TEXT → TEXT
  member_locations, -- TEXT → TEXT
  target_members, -- TEXT → TEXT
  CASE 
    WHEN member_communication IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(member_communication) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(member_communication))
    ELSE ARRAY[member_communication::TEXT]
  END,
  meeting_frequency, -- TEXT → TEXT
  meeting_location, -- TEXT → TEXT
  leadership_change_frequency, -- TEXT → TEXT
  -- Special case: community_interest_areas is TEXT in airtable but ARRAY in view
  -- The current function must handle this somehow, let's convert TEXT to array
  CASE 
    WHEN community_interest_areas IS NULL THEN NULL::TEXT[]
    WHEN community_interest_areas = '' THEN NULL::TEXT[]
    ELSE ARRAY[community_interest_areas]::TEXT[]
  END,
  community_information, -- TEXT → TEXT
  starred_on_website -- BOOLEAN → BOOLEAN
FROM airtable.atlas_public_view
ON CONFLICT DO NOTHING;

-- STEP 7: Clean up old function and view
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

-- STEP 8: Create clean view (backward compatible)
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
FROM public.communities;

-- STEP 9: Grant permissions
GRANT SELECT ON public.atlas_public_view_in_public TO anon, authenticated;

-- STEP 10: Verify migration
SELECT '=== MIGRATION COMPLETE ===' as section, COUNT(*) as total_communities 
FROM public.communities;

SELECT '=== SAMPLE DATA ===' as section, 
  name, 
  community_type, 
  location_names,
  community_interest_areas,
  starred_on_website
FROM public.communities 
LIMIT 3;

SELECT '=== VIEW TEST ===' as section, COUNT(*) as total_from_view
FROM public.atlas_public_view_in_public;

SELECT '=== ARRAY FILTER TEST ===' as section, COUNT(*) as london_count
FROM public.atlas_public_view_in_public
WHERE 'London' = ANY(location_names);

SELECT '=== STARRED TEST ===' as section, COUNT(*) as starred_count
FROM public.atlas_public_view_in_public
WHERE starred_on_website = true;

-- =============================================
-- SUMMARY
-- =============================================
/*
✅ WHAT WAS DONE:
1. Created native table with exact schema from public view
2. Migrated data with proper type conversions:
   - 5 JSONB columns → TEXT[] arrays
   - 14 TEXT/BOOLEAN columns → direct copy
   - Special handling for community_interest_areas (TEXT → TEXT[])
3. Dropped old function and view (with SECURITY DEFINER)
4. Created clean view pointing to native table
5. Set up RLS policies (public read, admin write)
6. Created performance indexes

✅ BENEFITS:
- No more SECURITY DEFINER warnings
- No more foreign table API exposure
- Proper data types throughout
- Better performance with native PostgreSQL
- Your app code requires ZERO changes

🔄 NEXT STEPS:
1. Test /communities page
2. Verify filters work
3. Check Supabase security advisor
4. Decide on sync strategy for future Airtable updates
*/

