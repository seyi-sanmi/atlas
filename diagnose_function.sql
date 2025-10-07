-- =============================================
-- Check the get_atlas_public_data_as_postgres Function
-- =============================================

-- Get the full function definition
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_atlas_public_data_as_postgres';

-- Check if it has SECURITY DEFINER
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  CASE 
    WHEN prosecdef THEN '⚠️ HAS SECURITY DEFINER'
    ELSE '✅ No Security Definer'
  END as security_status,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_atlas_public_data_as_postgres';




