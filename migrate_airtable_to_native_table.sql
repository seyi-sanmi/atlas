-- =============================================
-- ATLAS Airtable to Native Table Migration
-- =============================================
-- Alternative long-term solution: Create a native Supabase table
-- and sync data from Airtable instead of using Foreign Data Wrapper

-- OPTION 2: Migrate to a native Supabase communities table
-- This is a more robust, secure, and performant long-term solution

-- STEP 1: Create a native communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Core fields matching Airtable structure
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
CREATE POLICY "Communities are publicly readable" ON public.communities
  FOR SELECT 
  USING (true);

-- Only admins can modify communities
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

-- STEP 7: Migrate existing data from Airtable foreign table
-- (Only run this if you want to migrate existing data)
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
FROM airtable.atlas_public_view
ON CONFLICT (airtable_id) DO NOTHING;

-- STEP 8: Create a sync function to update from Airtable
-- This can be called periodically or via webhook
CREATE OR REPLACE FUNCTION sync_communities_from_airtable()
RETURNS TABLE(
  synced_count INTEGER,
  updated_count INTEGER,
  new_count INTEGER
) AS $$
DECLARE
  v_synced INTEGER := 0;
  v_updated INTEGER := 0;
  v_new INTEGER := 0;
BEGIN
  -- Upsert communities from Airtable
  WITH upsert_result AS (
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
      starred_on_website,
      last_synced_at
    )
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
      starred_on_website,
      NOW()
    FROM airtable.atlas_public_view
    ON CONFLICT (name) DO UPDATE SET
      community_type = EXCLUDED.community_type,
      location_names = EXCLUDED.location_names,
      academic_association = EXCLUDED.academic_association,
      website = EXCLUDED.website,
      research_area_names = EXCLUDED.research_area_names,
      community_linkedin = EXCLUDED.community_linkedin,
      size = EXCLUDED.size,
      purpose = EXCLUDED.purpose,
      members_selection = EXCLUDED.members_selection,
      member_locations = EXCLUDED.member_locations,
      target_members = EXCLUDED.target_members,
      member_communication = EXCLUDED.member_communication,
      meeting_frequency = EXCLUDED.meeting_frequency,
      meeting_location = EXCLUDED.meeting_location,
      leadership_change_frequency = EXCLUDED.leadership_change_frequency,
      community_interest_areas = EXCLUDED.community_interest_areas,
      community_information = EXCLUDED.community_information,
      starred_on_website = EXCLUDED.starred_on_website,
      last_synced_at = NOW()
    RETURNING (xmax = 0) AS is_new
  )
  SELECT 
    COUNT(*) INTO v_synced,
    COUNT(*) FILTER (WHERE NOT is_new) INTO v_updated,
    COUNT(*) FILTER (WHERE is_new) INTO v_new
  FROM upsert_result;
  
  RETURN QUERY SELECT v_synced, v_updated, v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create a view that matches the old view name for backward compatibility
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

-- Grant access to the view
GRANT SELECT ON public.atlas_public_view_in_public TO anon;
GRANT SELECT ON public.atlas_public_view_in_public TO authenticated;

-- STEP 10: Set up automatic sync (optional - requires pg_cron extension)
-- This will sync every hour
-- Uncomment if you have pg_cron enabled
/*
SELECT cron.schedule(
  'sync-communities-from-airtable',
  '0 * * * *', -- Every hour
  $$SELECT sync_communities_from_airtable();$$
);
*/

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check the new table
SELECT COUNT(*) as community_count FROM public.communities;

-- Test the sync function
SELECT * FROM sync_communities_from_airtable();

-- Verify the view still works
SELECT COUNT(*) FROM public.atlas_public_view_in_public;

-- =============================================
-- INSTRUCTIONS FOR CODE CHANGES
-- =============================================
-- 
-- After running this migration:
-- 
-- OPTION A: Keep using the view (no code changes needed)
-- The view 'atlas_public_view_in_public' now points to the native table
-- Your existing code will continue to work without modifications
--
-- OPTION B: Update code to use the new table directly
-- Change: .from('atlas_public_view_in_public')
-- To: .from('communities')
--
-- SYNCING DATA:
-- - Manual: Run `SELECT * FROM sync_communities_from_airtable();` in SQL editor
-- - Automatic: Uncomment the cron job section above (requires pg_cron)
-- - Webhook: Set up Airtable webhook to call a Supabase Edge Function
--
-- BENEFITS OF THIS APPROACH:
-- 1. ✅ No security issues (proper RLS)
-- 2. ✅ Better performance (indexed native table)
-- 3. ✅ Full control over data
-- 4. ✅ Can add custom fields/features
-- 5. ✅ Proper audit trail with timestamps
-- 6. ✅ Backward compatible with existing code
-- =============================================



