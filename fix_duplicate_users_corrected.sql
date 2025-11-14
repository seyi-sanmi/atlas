-- =============================================
-- Fix Duplicate User Profiles - Corrected Version
-- =============================================

-- 1. Check for duplicate profiles by looking at auth.users emails that have multiple profiles
SELECT 
    u.email,
    COUNT(p.id) as profile_count,
    array_agg(p.id ORDER BY p.created_at DESC) as profile_ids,
    array_agg(p.created_at ORDER BY p.created_at DESC) as created_dates
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
GROUP BY u.email
HAVING COUNT(p.id) > 1;

-- 2. Check for orphaned profiles (profiles without corresponding auth.users)
SELECT 
    p.id,
    p.full_name,
    p.created_at,
    'No corresponding auth.users record' as issue
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 3. Check for auth.users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at,
    'No corresponding profile record' as issue
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Find the specific issue with seyi@renphil.org
SELECT 
    u.email,
    u.id as user_id,
    u.created_at as user_created,
    p.id as profile_id,
    p.created_at as profile_created,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'seyi@renphil.org'
ORDER BY u.created_at DESC;

-- 5. Check for duplicate tracking data by email
SELECT 
    email,
    COUNT(*) as interaction_count,
    COUNT(DISTINCT user_id) as unique_user_ids,
    array_agg(DISTINCT user_id) as user_ids
FROM user_event_interactions 
WHERE email = 'seyi@renphil.org'
GROUP BY email;

-- 6. Clean up any orphaned tracking data (interactions without valid user_id)
UPDATE user_event_interactions 
SET user_id = (
    SELECT u.id 
    FROM auth.users u 
    WHERE u.email = user_event_interactions.email 
    LIMIT 1
)
WHERE user_id IS NULL 
AND email IS NOT NULL 
AND email IN (SELECT email FROM auth.users);

-- 7. Merge tracking data for users with the same email but different user_ids
-- (This handles cases where someone might have signed up multiple times)
WITH duplicate_emails AS (
    SELECT 
        email,
        array_agg(DISTINCT user_id ORDER BY user_id) as user_ids
    FROM user_event_interactions 
    WHERE email IS NOT NULL AND user_id IS NOT NULL
    GROUP BY email 
    HAVING COUNT(DISTINCT user_id) > 1
),
primary_users AS (
    SELECT 
        de.email,
        de.user_ids[1] as primary_user_id,
        de.user_ids[2:] as duplicate_user_ids
    FROM duplicate_emails de
)
UPDATE user_event_interactions 
SET user_id = pu.primary_user_id
FROM primary_users pu
WHERE user_event_interactions.email = pu.email 
AND user_event_interactions.user_id = ANY(pu.duplicate_user_ids);

-- 8. Create missing profiles for auth.users that don't have them
INSERT INTO profiles (id, full_name, avatar_url, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
    u.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. Update the profile creation function to prevent future issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use INSERT ... ON CONFLICT to prevent duplicates
    INSERT INTO public.profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Set the correct role for your admin account
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = (
    SELECT id 
    FROM auth.users 
    WHERE email = 'seyi@renphil.org' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- 11. Final verification - show current state
SELECT 
    'Total auth.users' as metric,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'Total profiles' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Users without profiles' as metric,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 
    'Profiles without users' as metric,
    COUNT(*) as count
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 
    'Duplicate email tracking' as metric,
    COUNT(*) as count
FROM (
    SELECT email 
    FROM user_event_interactions 
    WHERE email IS NOT NULL AND user_id IS NOT NULL
    GROUP BY email 
    HAVING COUNT(DISTINCT user_id) > 1
) duplicates;

COMMENT ON FUNCTION handle_new_user IS 'Fixed function that prevents duplicate profile creation and handles conflicts gracefully';
