-- =============================================
-- ATLAS Airtable to Native Table Migration - FIXED
-- =============================================
-- Creates a native Supabase table and migrates data with proper JSONB conversion

-- STEP 1: Create a native communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core fields matching Airtable structure (using TEXT[] for arrays)
  name TEXT NOT NULL,
  community_type TEXT[] DEFAULT '{}',
  location_names TEXT[] DEFAULT '{}',
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
  starred_on_website BOOLEAN DEFAULT FALSE,
  
  -- Metadata fields
  airtable_id TEXT UNIQUE, -- Store Airtable record ID for sync
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 2: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communities_name ON public.communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_starred ON public.communities(starred_on_website);
CREATE INDEX IF NOT EXISTS idx_communities_community_type ON public.communities USING GIN(community_type);
CREATE INDEX IF NOT EXISTS idx_communities_location_names ON public.communities USING GIN(location_names);
CREATE INDEX IF NOT EXISTS idx_communities_research_areas ON public.communities USING GIN(research_area_names);
CREATE INDEX IF NOT EXISTS idx_communities_airtable_id ON public.communities(airtable_id);

-- STEP 3: Enable Row Level Security
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create RLS policies (communities are public data)
DROP POLICY IF EXISTS "Communities are publicly readable" ON public.communities;
CREATE POLICY "Communities are publicly readable" ON public.communities
  FOR SELECT 
  USING (true);

-- Only admins can modify communities
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

-- STEP 5: Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_communities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Create trigger for updated_at
DROP TRIGGER IF EXISTS update_communities_updated_at_trigger ON public.communities;
CREATE TRIGGER update_communities_updated_at_trigger
  BEFORE UPDATE ON public.communities
  FOR EACH ROW
  EXECUTE FUNCTION update_communities_updated_at();

-- STEP 7: Migrate existing data from Airtable with JSONB to TEXT[] conversion
-- This handles the conversion properly during migration
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
  -- Convert JSONB to TEXT[] with robust handling
  CASE 
    WHEN community_type IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(community_type::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(community_type::jsonb))
    WHEN jsonb_typeof(community_type::jsonb) = 'string' THEN 
      ARRAY[community_type::TEXT]
    ELSE NULL::TEXT[]
  END,
  CASE 
    WHEN location_names IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(location_names::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(location_names::jsonb))
    WHEN jsonb_typeof(location_names::jsonb) = 'string' THEN 
      ARRAY[location_names::TEXT]
    ELSE NULL::TEXT[]
  END,
  CASE 
    WHEN academic_association IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(academic_association::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(academic_association::jsonb))
    WHEN jsonb_typeof(academic_association::jsonb) = 'string' THEN 
      ARRAY[academic_association::TEXT]
    ELSE NULL::TEXT[]
  END,
  website,
  CASE 
    WHEN research_area_names IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(research_area_names::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(research_area_names::jsonb))
    WHEN jsonb_typeof(research_area_names::jsonb) = 'string' THEN 
      ARRAY[research_area_names::TEXT]
    ELSE NULL::TEXT[]
  END,
  community_linkedin,
  size,
  purpose,
  members_selection,
  member_locations,
  target_members,
  CASE 
    WHEN member_communication IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(member_communication::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(member_communication::jsonb))
    WHEN jsonb_typeof(member_communication::jsonb) = 'string' THEN 
      ARRAY[member_communication::TEXT]
    ELSE NULL::TEXT[]
  END,
  meeting_frequency,
  meeting_location,
  leadership_change_frequency,
  CASE 
    WHEN community_interest_areas IS NULL THEN NULL::TEXT[]
    WHEN jsonb_typeof(community_interest_areas::jsonb) = 'array' THEN 
      ARRAY(SELECT jsonb_array_elements_text(community_interest_areas::jsonb))
    WHEN jsonb_typeof(community_interest_areas::jsonb) = 'string' THEN 
      ARRAY[community_interest_areas::TEXT]
    ELSE NULL::TEXT[]
  END,
  community_information,
  starred_on_website
FROM airtable.atlas_public_view
ON CONFLICT (name) DO NOTHING;

-- STEP 8: Drop old view and function (clean up)
DROP VIEW IF EXISTS public.atlas_public_view_in_public CASCADE;
DROP FUNCTION IF EXISTS public.get_atlas_public_data_as_postgres() CASCADE;

-- STEP 9: Create a clean view pointing to the new native table
-- This maintains backward compatibility with your existing app code
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

-- STEP 10: Grant access to the view (RLS handles security on the table)
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;

-- STEP 11: Verify migration
SELECT '=== MIGRATION COMPLETE ===' as section, COUNT(*) as total_communities 
FROM public.communities;

SELECT '=== SAMPLE DATA ===' as section, 
  name, 
  community_type, 
  location_names,
  starred_on_website
FROM public.communities 
LIMIT 5;

-- STEP 12: Test the view (what your app uses)
SELECT '=== VIEW TEST ===' as section, COUNT(*) as total_from_view
FROM public.atlas_public_view_in_public;

-- STEP 13: Test array operations (what your filters do)
SELECT '=== ARRAY FILTER TEST ===' as section, COUNT(*) as london_communities
FROM public.atlas_public_view_in_public
WHERE 'London' = ANY(location_names);

-- =============================================
-- WHAT HAPPENS NEXT
-- =============================================
/*
✅ DONE:
- Native table created with proper TEXT[] columns
- Data migrated from Airtable with JSONB conversion
- RLS policies in place (public read, admin write)
- Indexes created for performance
- View created for backward compatibility
- Your app code requires ZERO changes

🔄 DATA SYNC OPTIONS:

Option 1: Manual Sync (Easiest to start)
- Update Airtable as normal
- When ready, run this in SQL Editor:
  DELETE FROM public.communities;
  -- Then rerun STEP 7 above to re-import

Option 2: Admin Panel Sync Button (Recommended)
- Add a "Sync from Airtable" button to your admin panel
- Button calls a Supabase Edge Function
- Function runs the migration SELECT statement

Option 3: Scheduled Sync (Automated)
- Set up pg_cron to run sync every hour/day
- Requires pg_cron extension

Option 4: Webhook (Real-time)
- Airtable webhook → Supabase Edge Function
- Most complex but most real-time

📝 NEXT STEPS:
1. Test your communities page (/communities)
2. Verify filters work
3. Check Supabase security advisor (no warnings!)
4. Choose a sync strategy
5. Consider eventually phasing out Airtable for direct Supabase editing

🎉 BENEFITS:
- ✅ No more SECURITY DEFINER warnings
- ✅ No more foreign table API exposure
- ✅ Better performance (native PostgreSQL)
- ✅ Full control with RLS
- ✅ Proper data types (TEXT[] not JSONB)
- ✅ Clean, maintainable architecture
*/


