-- =============================================
-- Auto-Sync Communities from Airtable (pg_cron)
-- =============================================
-- This sets up automatic hourly sync from Airtable to Supabase

-- STEP 1: Enable pg_cron extension (if not already enabled)
-- Note: In Supabase, you may need to enable this in the Database > Extensions section
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- STEP 2: Create the sync function
CREATE OR REPLACE FUNCTION sync_communities_from_airtable()
RETURNS TABLE(
  total_synced INTEGER,
  total_added INTEGER,
  total_updated INTEGER,
  sync_time TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, airtable
AS $$
DECLARE
  v_synced INTEGER := 0;
  v_added INTEGER := 0;
  v_updated INTEGER := 0;
BEGIN
  -- Clear and re-import all data
  TRUNCATE public.communities;
  
  -- Import from Airtable with proper type conversion
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
    -- JSONB to TEXT[] conversions
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
    website,
    CASE 
      WHEN research_area_names IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(research_area_names) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(research_area_names))
      ELSE ARRAY[research_area_names::TEXT]
    END,
    community_linkedin,
    size,
    purpose,
    members_selection,
    member_locations,
    target_members,
    CASE 
      WHEN member_communication IS NULL THEN NULL::TEXT[]
      WHEN jsonb_typeof(member_communication) = 'array' THEN 
        ARRAY(SELECT jsonb_array_elements_text(member_communication))
      ELSE ARRAY[member_communication::TEXT]
    END,
    meeting_frequency,
    meeting_location,
    leadership_change_frequency,
    CASE 
      WHEN community_interest_areas IS NULL THEN NULL::TEXT[]
      WHEN community_interest_areas = '' THEN NULL::TEXT[]
      ELSE ARRAY[community_interest_areas]::TEXT[]
    END,
    community_information,
    starred_on_website
  FROM airtable.atlas_public_view;
  
  -- Get count of synced records
  GET DIAGNOSTICS v_synced = ROW_COUNT;
  v_added := v_synced; -- All are "added" since we truncate first
  
  -- Return sync statistics
  RETURN QUERY SELECT v_synced, v_added, v_updated, NOW();
END;
$$;

-- STEP 3: Grant execute permission
GRANT EXECUTE ON FUNCTION sync_communities_from_airtable() TO postgres;

-- STEP 4: Test the sync function manually first
SELECT * FROM sync_communities_from_airtable();

-- STEP 5: Schedule automatic sync every hour
-- This runs at minute 0 of every hour (e.g., 1:00, 2:00, 3:00, etc.)
SELECT cron.schedule(
  'sync-airtable-communities-hourly',  -- Job name
  '0 * * * *',                          -- Cron expression: every hour at :00
  $$SELECT sync_communities_from_airtable();$$
);

-- ALTERNATIVE SCHEDULES (choose one, comment out the hourly one above):

-- Every 6 hours (4 times a day):
-- SELECT cron.schedule(
--   'sync-airtable-communities-6hourly',
--   '0 */6 * * *',
--   $$SELECT sync_communities_from_airtable();$$
-- );

-- Once per day at 2 AM:
-- SELECT cron.schedule(
--   'sync-airtable-communities-daily',
--   '0 2 * * *',
--   $$SELECT sync_communities_from_airtable();$$
-- );

-- Every 30 minutes:
-- SELECT cron.schedule(
--   'sync-airtable-communities-30min',
--   '*/30 * * * *',
--   $$SELECT sync_communities_from_airtable();$$
-- );

-- STEP 6: Verify the cron job is scheduled
SELECT * FROM cron.job WHERE jobname LIKE '%airtable%';

-- STEP 7: Check cron job history/logs (after it runs)
SELECT * FROM cron.job_run_details 
WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%airtable%')
ORDER BY start_time DESC
LIMIT 10;

-- =============================================
-- MANAGEMENT COMMANDS
-- =============================================

-- To manually trigger a sync anytime:
-- SELECT * FROM sync_communities_from_airtable();

-- To disable the automatic sync (pause it):
-- SELECT cron.unschedule('sync-airtable-communities-hourly');

-- To re-enable after disabling:
-- SELECT cron.schedule(
--   'sync-airtable-communities-hourly',
--   '0 * * * *',
--   $$SELECT sync_communities_from_airtable();$$
-- );

-- To change the schedule (unschedule old, then schedule new):
-- SELECT cron.unschedule('sync-airtable-communities-hourly');
-- SELECT cron.schedule(
--   'sync-airtable-communities-daily',
--   '0 2 * * *',
--   $$SELECT sync_communities_from_airtable();$$
-- );

-- To delete the job completely:
-- SELECT cron.unschedule('sync-airtable-communities-hourly');

-- =============================================
-- CRON EXPRESSION GUIDE
-- =============================================
/*
Format: minute hour day month day_of_week

Examples:
'0 * * * *'      - Every hour at minute 0
'*/30 * * * *'   - Every 30 minutes
'0 */6 * * *'    - Every 6 hours
'0 2 * * *'      - Daily at 2 AM
'0 2 * * 1'      - Every Monday at 2 AM
'0 0 1 * *'      - First day of every month at midnight
'0 9-17 * * *'   - Every hour from 9 AM to 5 PM

Supabase uses UTC timezone, so adjust times accordingly!
*/

-- =============================================
-- TROUBLESHOOTING
-- =============================================
/*
If pg_cron is not available:
1. Go to Supabase Dashboard
2. Database > Extensions
3. Search for "pg_cron"
4. Click "Enable"
5. Re-run this script

To check if sync is working:
1. Make a change in Airtable
2. Wait for the next hour (or trigger manually)
3. Check your website - changes should appear
4. Check logs: SELECT * FROM cron.job_run_details WHERE jobname LIKE '%airtable%' ORDER BY start_time DESC;

If sync fails:
- Check cron.job_run_details for error messages
- Ensure Airtable FDW connection is still working
- Manually run: SELECT * FROM sync_communities_from_airtable();
- Check the error message and troubleshoot

Common issues:
- pg_cron not enabled → Enable in Supabase Extensions
- Permission errors → Function has SECURITY DEFINER, should work
- Airtable connection lost → Check FDW configuration
- Timeout on large datasets → Consider batching or increasing timeout
*/

-- =============================================
-- SUMMARY
-- =============================================
/*
✅ WHAT WAS SET UP:
1. sync_communities_from_airtable() function - syncs data from Airtable
2. Automatic hourly cron job - runs every hour at :00
3. Proper JSONB → TEXT[] conversion during sync
4. Logging and monitoring via cron.job_run_details

✅ HOW IT WORKS:
- Every hour, the function:
  1. Clears the communities table
  2. Re-imports all data from Airtable
  3. Converts JSONB arrays to TEXT[] arrays
  4. Logs the results

✅ WHAT YOU CAN DO:
- Manual sync: SELECT * FROM sync_communities_from_airtable();
- Check schedule: SELECT * FROM cron.job;
- View logs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
- Change schedule: Unschedule old, schedule new (see examples above)

✅ BENEFITS:
- Automatic updates (no manual intervention needed)
- Runs in background (doesn't affect website performance)
- Logged and monitored (can check if it's working)
- Flexible schedule (change frequency as needed)

Your communities will now automatically sync every hour! 🎉
*/






