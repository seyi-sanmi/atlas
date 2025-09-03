-- =============================================
-- Fix Ambiguous Column References in Admin Functions
-- =============================================

-- 1. Fix get_admin_dashboard_stats function
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_events BIGINT,
    active_research_areas BIGINT,
    active_locations BIGINT,
    events_this_week BIGINT,
    users_this_week BIGINT,
    upcoming_events BIGINT
) AS $$
BEGIN
    -- Check if the calling user is an admin (fix ambiguous column reference)
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Return the stats (only if user is admin)
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM auth.users)::BIGINT as total_users,
        (SELECT COUNT(*) FROM events)::BIGINT as total_events,
        (SELECT COUNT(*) FROM hero_content WHERE type = 'research_area' AND is_active = true)::BIGINT as active_research_areas,
        (SELECT COUNT(*) FROM hero_content WHERE type = 'location' AND is_active = true)::BIGINT as active_locations,
        (SELECT COUNT(*) FROM events WHERE created_at >= NOW() - INTERVAL '7 days')::BIGINT as events_this_week,
        (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days')::BIGINT as users_this_week,
        (SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE)::BIGINT as upcoming_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix get_admin_user_data function
CREATE OR REPLACE FUNCTION get_admin_user_data()
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    organization TEXT,
    job_title TEXT,
    location TEXT,
    linkedin_url TEXT,
    research_interests TEXT[],
    preferred_categories TEXT[],
    last_activity_at TIMESTAMPTZ,
    onboarding_completed BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    role TEXT,
    last_sign_in_at TIMESTAMPTZ,
    event_views_count INTEGER,
    event_clicks_count INTEGER
) AS $$
BEGIN
    -- Check if the calling user is an admin (fix ambiguous column reference)
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    -- Return user data (only if user is admin)
    RETURN QUERY
    SELECT 
        p.id,
        u.email,
        p.full_name,
        p.avatar_url,
        p.organization,
        p.job_title,
        p.location,
        p.linkedin_url,
        p.research_interests,
        p.preferred_categories,
        p.last_activity_at,
        p.onboarding_completed,
        p.created_at,
        p.updated_at,
        p.role,
        u.last_sign_in_at,
        CASE 
            WHEN p.event_views IS NOT NULL 
            THEN jsonb_array_length(p.event_views)
            ELSE 0 
        END as event_views_count,
        CASE 
            WHEN p.event_clicks IS NOT NULL 
            THEN jsonb_array_length(p.event_clicks)
            ELSE 0 
        END as event_clicks_count
    FROM profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix get_admin_user_engagement_summary function
CREATE OR REPLACE FUNCTION get_admin_user_engagement_summary()
RETURNS TABLE (
    user_identifier TEXT,
    user_id UUID,
    email TEXT,
    total_interactions BIGINT,
    unique_events BIGINT,
    total_views BIGINT,
    total_clicks BIGINT,
    last_activity TIMESTAMPTZ,
    first_activity TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if the calling user is an admin (fix ambiguous column reference)
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(p.full_name, uei.email, 'Anonymous Session: ' || uei.session_id) as user_identifier,
        p.id as user_id,
        uei.email,
        COUNT(*) as total_interactions,
        COUNT(DISTINCT uei.event_id) as unique_events,
        COUNT(*) FILTER (WHERE uei.interaction_type = 'view') as total_views,
        COUNT(*) FILTER (WHERE uei.interaction_type = 'click_external') as total_clicks,
        MAX(uei.timestamp) as last_activity,
        MIN(uei.timestamp) as first_activity
    FROM user_event_interactions uei
    LEFT JOIN profiles p ON uei.user_id = p.id
    GROUP BY p.id, p.full_name, uei.email, uei.session_id
    ORDER BY total_interactions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix get_admin_event_popularity function
CREATE OR REPLACE FUNCTION get_admin_event_popularity()
RETURNS TABLE (
    id TEXT,
    title TEXT,
    ai_interest_areas TEXT[],
    total_interactions BIGINT,
    unique_engagers BIGINT,
    total_views BIGINT,
    total_clicks BIGINT,
    click_through_rate DECIMAL(5,2)
) AS $$
BEGIN
    -- Check if the calling user is an admin (fix ambiguous column reference)
    IF NOT EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.ai_interest_areas,
        COUNT(uei.*) as total_interactions,
        COUNT(DISTINCT COALESCE(uei.user_id::text, uei.email, uei.session_id)) as unique_engagers,
        COUNT(*) FILTER (WHERE uei.interaction_type = 'view') as total_views,
        COUNT(*) FILTER (WHERE uei.interaction_type = 'click_external') as total_clicks,
        CASE 
            WHEN COUNT(*) FILTER (WHERE uei.interaction_type = 'view') > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE uei.interaction_type = 'click_external') * 100.0 / COUNT(*) FILTER (WHERE uei.interaction_type = 'view')), 2)
            ELSE 0 
        END as click_through_rate
    FROM events e
    LEFT JOIN user_event_interactions uei ON e.id = uei.event_id
    GROUP BY e.id, e.title, e.ai_interest_areas
    ORDER BY total_interactions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Test the functions
SELECT * FROM get_admin_dashboard_stats();

COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Fixed function with proper table aliases to avoid ambiguous column references';
COMMENT ON FUNCTION get_admin_user_data IS 'Fixed function with proper table aliases to avoid ambiguous column references';
COMMENT ON FUNCTION get_admin_user_engagement_summary IS 'Fixed function with proper table aliases to avoid ambiguous column references';
COMMENT ON FUNCTION get_admin_event_popularity IS 'Fixed function with proper table aliases to avoid ambiguous column references';
