-- Check the current structure of the profiles table
\d profiles;

-- Also check what columns actually exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are any users with duplicate emails in auth.users instead
SELECT email, COUNT(*) as duplicate_count 
FROM auth.users 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- See a sample of the profiles data
SELECT * FROM profiles LIMIT 5;
