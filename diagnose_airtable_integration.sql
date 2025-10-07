-- =============================================
-- ATLAS Airtable Integration Diagnostic Script
-- =============================================
-- Run this script in Supabase SQL Editor to understand
-- the current state of your Airtable integration

-- =============================================
-- SECTION 1: Check Foreign Tables
-- =============================================
SELECT 
  '=== FOREIGN TABLES ===' as section,
  foreign_table_schema as schema,
  foreign_table_name as table_name,
  foreign_server_name as server
FROM information_schema.foreign_tables
WHERE foreign_table_name ILIKE '%atlas%' OR foreign_table_name ILIKE '%airtable%';

-- =============================================
-- SECTION 2: Check Views
-- =============================================
SELECT 
  '=== VIEWS ===' as section,
  schemaname as schema,
  viewname as view_name,
  viewowner as owner,
  CASE 
    WHEN definition ILIKE '%security definer%' THEN '⚠️ HAS SECURITY DEFINER'
    ELSE '✅ No Security Definer'
  END as security_status
FROM pg_views
WHERE schemaname IN ('public', 'airtable')
  AND (viewname ILIKE '%atlas%' OR viewname ILIKE '%community%');

-- =============================================
-- SECTION 3: Check View Definition
-- =============================================
SELECT 
  '=== VIEW DEFINITION ===' as section,
  viewname,
  definition
FROM pg_views
WHERE viewname = 'atlas_public_view_in_public';

-- =============================================
-- SECTION 4: Check Permissions on View
-- =============================================
SELECT 
  '=== VIEW PERMISSIONS ===' as section,
  grantee as role,
  privilege_type as permission
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'atlas_public_view_in_public'
ORDER BY grantee;

-- =============================================
-- SECTION 5: Check if Foreign Table is in Public Schema (BAD)
-- =============================================
SELECT 
  '=== FOREIGN TABLE LOCATION CHECK ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.foreign_tables 
      WHERE foreign_table_schema = 'public' 
      AND foreign_table_name ILIKE '%atlas%'
    ) THEN '⚠️ FOREIGN TABLE IN PUBLIC SCHEMA - SECURITY RISK!'
    ELSE '✅ Foreign tables not in public schema'
  END as status;

-- =============================================
-- SECTION 6: Test Data Access
-- =============================================
-- Check if we can access the view
SELECT 
  '=== DATA ACCESS TEST ===' as section,
  COUNT(*) as total_communities
FROM public.atlas_public_view_in_public;

-- Sample data from the view
SELECT 
  '=== SAMPLE DATA ===' as section,
  name,
  community_type,
  location_names,
  starred_on_website
FROM public.atlas_public_view_in_public
LIMIT 5;

-- =============================================
-- SECTION 7: Check Foreign Data Wrapper Configuration
-- =============================================
SELECT 
  '=== FOREIGN DATA WRAPPER ===' as section,
  srvname as server_name,
  srvowner::regrole as owner,
  fdwname as wrapper_name
FROM pg_foreign_server fs
JOIN pg_foreign_data_wrapper fdw ON fs.srvfdw = fdw.oid
WHERE srvname ILIKE '%airtable%' OR fdwname ILIKE '%airtable%';

-- =============================================
-- SECTION 8: Check for Security Definer Functions
-- =============================================
SELECT 
  '=== SECURITY DEFINER FUNCTIONS ===' as section,
  n.nspname as schema,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%security definer%'
  AND n.nspname = 'public'
  AND (p.proname ILIKE '%atlas%' OR p.proname ILIKE '%community%');

-- =============================================
-- SECTION 9: Check RLS Status
-- =============================================
SELECT 
  '=== ROW LEVEL SECURITY STATUS ===' as section,
  schemaname as schema,
  tablename as table_name,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename ILIKE '%community%';

-- =============================================
-- SECTION 10: Summarize Issues
-- =============================================
SELECT 
  '=== ISSUE SUMMARY ===' as section,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_views 
      WHERE viewname = 'atlas_public_view_in_public'
      AND definition ILIKE '%security definer%'
    ) THEN '⚠️ ISSUE 1: View has SECURITY DEFINER - Should be removed'
    ELSE '✅ ISSUE 1: No SECURITY DEFINER on view'
  END as issue_1,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.foreign_tables 
      WHERE foreign_table_schema = 'public'
      AND foreign_table_name ILIKE '%atlas%'
    ) THEN '⚠️ ISSUE 2: Foreign table in public schema - Move to airtable schema'
    ELSE '✅ ISSUE 2: Foreign table not exposed in public schema'
  END as issue_2,
  CASE 
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.table_privileges
      WHERE table_name = 'atlas_public_view_in_public'
      AND grantee IN ('anon', 'authenticated')
      AND privilege_type = 'SELECT'
    ) THEN '✅ ISSUE 3: View has proper permissions'
    ELSE '⚠️ ISSUE 3: View missing permissions for anon/authenticated roles'
  END as issue_3;

-- =============================================
-- RESULTS INTERPRETATION
-- =============================================
/*
After running this script, look for:

1. SECURITY DEFINER in view definition
   - If present: ⚠️ Security issue - run fix_airtable_security_issues.sql

2. Foreign table in 'public' schema
   - If yes: ⚠️ Security risk - table exposed via API
   - Should be in 'airtable' schema only

3. View permissions for 'anon' and 'authenticated'
   - If missing: ⚠️ Users can't access data
   - Run GRANT statements in fix script

4. Data access test returns 0 communities
   - Check Airtable FDW connection
   - Verify Airtable credentials
   - Check if Airtable table has data

5. View doesn't exist
   - Need to create it
   - Run appropriate fix script

RECOMMENDED ACTION:
- If you see ⚠️ warnings, run fix_airtable_security_issues.sql
- If issues persist, consider migrate_airtable_to_native_table.sql
*/



