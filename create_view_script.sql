-- First, let's create a simple function to help us see the airtable table structure
CREATE OR REPLACE FUNCTION get_airtable_atlas_structure()
RETURNS TABLE(column_name text, data_type text)
LANGUAGE sql
AS $$
  SELECT 
    column_name::text,
    data_type::text
  FROM information_schema.columns 
  WHERE table_schema = 'airtable' 
    AND table_name = 'atlas_public_view'
  ORDER BY ordinal_position;
$$;

-- Get a sample of the data to understand the structure
CREATE OR REPLACE FUNCTION get_airtable_atlas_sample()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT row_to_json(t) FROM (SELECT * FROM airtable.atlas_public_view LIMIT 1) t'
  INTO result;
  RETURN result;
END;
$$;

-- Create the view in the public schema
-- Note: We'll need to update this based on the actual column structure
DROP VIEW IF EXISTS public.atlas_public_view;

-- This is a template - we'll need to adjust based on actual columns
CREATE VIEW public.atlas_public_view AS 
SELECT * FROM airtable.atlas_public_view;

-- Grant appropriate permissions
GRANT SELECT ON public.atlas_public_view TO anon;
GRANT SELECT ON public.atlas_public_view TO authenticated; 