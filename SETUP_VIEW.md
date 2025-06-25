# Setting up atlas_public_view in Public Schema

## Step 1: Create Helper Functions (Run in Supabase SQL Editor)

```sql
-- Function to get table structure
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

-- Function to get sample data
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
```

## Step 2: Check Table Structure

Run these queries to see what columns are available:

```sql
-- See table structure
SELECT * FROM get_airtable_atlas_structure();

-- See sample data
SELECT get_airtable_atlas_sample();

-- Count records
SELECT COUNT(*) FROM airtable.atlas_public_view;
```

## Step 3: Create the View

Once we know the structure, create the view:

```sql
-- Create view in public schema
DROP VIEW IF EXISTS public.atlas_public_view;

CREATE VIEW public.atlas_public_view AS 
SELECT * FROM airtable.atlas_public_view;

-- Grant permissions
GRANT SELECT ON public.atlas_public_view TO anon;
GRANT SELECT ON public.atlas_public_view TO authenticated;
```

## Step 4: Test the View

```sql
-- Test the new view
SELECT * FROM public.atlas_public_view LIMIT 5;
```

---

**Instructions:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run Step 1 SQL first
4. Run Step 2 queries to see the structure
5. Run Step 3 to create the view
6. Run Step 4 to test

Then we can update your React code to use the new view! 