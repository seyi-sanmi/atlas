-- =============================================
-- Fix Duplicate User Profiles Issue
-- =============================================

-- 1. First, let's see the current duplicates
SELECT email, COUNT(*) as duplicate_count 
FROM profiles 
WHERE email IS NOT NULL 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 2. Add unique constraint on email to prevent future duplicates
ALTER TABLE profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 3. Clean up existing duplicates (keep the most recent one)
DELETE FROM profiles 
WHERE id NOT IN (
    SELECT DISTINCT ON (email) id 
    FROM profiles 
    WHERE email IS NOT NULL 
    ORDER BY email, created_at DESC
);

-- 4. Fix the profile creation function to handle duplicates gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use INSERT ... ON CONFLICT to prevent duplicates
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Also create a function to merge duplicate tracking data
CREATE OR REPLACE FUNCTION merge_duplicate_user_tracking()
RETURNS void AS $$
DECLARE
    duplicate_record RECORD;
    primary_user_id UUID;
BEGIN
    -- For each email that has duplicates in user_event_interactions
    FOR duplicate_record IN 
        SELECT email, array_agg(DISTINCT user_id) as user_ids
        FROM user_event_interactions 
        WHERE email IS NOT NULL AND user_id IS NOT NULL
        GROUP BY email 
        HAVING COUNT(DISTINCT user_id) > 1
    LOOP
        -- Get the primary user_id (most recent profile)
        SELECT id INTO primary_user_id
        FROM profiles 
        WHERE email = duplicate_record.email 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Update all interactions to use the primary user_id
        UPDATE user_event_interactions 
        SET user_id = primary_user_id
        WHERE email = duplicate_record.email 
        AND user_id != primary_user_id;
        
        RAISE NOTICE 'Merged tracking data for email: % to user_id: %', duplicate_record.email, primary_user_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Run the merge function
SELECT merge_duplicate_user_tracking();

-- 7. Update event tracking to link by email when user_id is missing
UPDATE user_event_interactions 
SET user_id = p.id
FROM profiles p
WHERE user_event_interactions.email = p.email 
AND user_event_interactions.user_id IS NULL;

-- 8. Clean up newsletter subscribers table
UPDATE newsletter_subscribers 
SET converted_to_user_id = p.id,
    converted_at = COALESCE(converted_at, NOW())
FROM profiles p
WHERE newsletter_subscribers.email = p.email 
AND newsletter_subscribers.converted_to_user_id IS NULL;

-- 9. Show final state
SELECT 
    'Total Profiles' as metric,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'Profiles with Email' as metric,
    COUNT(*) as count
FROM profiles WHERE email IS NOT NULL
UNION ALL
SELECT 
    'Duplicate Emails' as metric,
    COUNT(*) as count
FROM (
    SELECT email 
    FROM profiles 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
) duplicates;

COMMENT ON FUNCTION handle_new_user IS 'Fixed function that prevents duplicate profile creation using ON CONFLICT';
COMMENT ON FUNCTION merge_duplicate_user_tracking IS 'One-time function to merge tracking data from duplicate users';
