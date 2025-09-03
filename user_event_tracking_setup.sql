-- =============================================
-- ATLAS User Event Tracking System Setup
-- =============================================
-- Run this in your Supabase SQL Editor

-- 1. Create the main event interactions tracking table
CREATE TABLE user_event_interactions (
    id BIGSERIAL PRIMARY KEY,
    
    -- User identification (multiple methods)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for anonymous users
    email VARCHAR(255), -- For newsletter subscribers without accounts
    session_id VARCHAR(255), -- Cookie-based tracking for anonymous users
    
    -- Event information
    event_id UUID NOT NULL, -- References events table (changed from TEXT to UUID)
    event_title TEXT, -- Snapshot for historical data
    
    -- Research areas at time of interaction (snapshot from event.ai_interest_areas)
    research_areas TEXT[], -- Copy of event.ai_interest_areas at interaction time
    
    -- Interaction details
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'click_external', 'detail_view', 'share')),
    source_page VARCHAR(255), -- Page where interaction occurred
    external_url TEXT, -- The URL they clicked to (for external links)
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Technical data for analytics
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    
    -- GDPR compliance
    gdpr_consent BOOLEAN DEFAULT FALSE,
    data_retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 years') -- Auto-cleanup after 2 years
);

-- 2. Create indexes for optimal performance
CREATE INDEX idx_user_interactions_user_id ON user_event_interactions(user_id, timestamp DESC);
CREATE INDEX idx_user_interactions_email ON user_event_interactions(email, timestamp DESC);
CREATE INDEX idx_user_interactions_session ON user_event_interactions(session_id, timestamp DESC);
CREATE INDEX idx_user_interactions_event ON user_event_interactions(event_id, timestamp DESC);
CREATE INDEX idx_user_interactions_research_areas ON user_event_interactions USING GIN(research_areas);
CREATE INDEX idx_user_interactions_timestamp ON user_event_interactions(timestamp DESC);
CREATE INDEX idx_user_interactions_type ON user_event_interactions(interaction_type);

-- 3. Enable Row Level Security
ALTER TABLE user_event_interactions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON user_event_interactions
    FOR SELECT USING (
        auth.uid() = user_id 
        OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Admins can view all interactions
CREATE POLICY "Admins can view all interactions" ON user_event_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Allow inserts for tracking (authenticated and anonymous)
CREATE POLICY "Allow interaction tracking" ON user_event_interactions
    FOR INSERT WITH CHECK (true); -- We'll control this via application logic

-- 5. Create table for newsletter email tracking (before account creation)
CREATE TABLE newsletter_subscribers (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255), -- Link to cookie session
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    source_page VARCHAR(255), -- Where they subscribed
    gdpr_consent BOOLEAN DEFAULT FALSE,
    
    -- When they create account, we'll link this data
    converted_to_user_id UUID REFERENCES auth.users(id),
    converted_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_session ON newsletter_subscribers(session_id);

-- 6. Create function to calculate user research area interests
CREATE OR REPLACE FUNCTION get_user_research_interests(input_user_id UUID DEFAULT NULL, input_email VARCHAR DEFAULT NULL, input_session_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
    research_area TEXT,
    interaction_count BIGINT,
    percentage DECIMAL(5,2),
    total_interactions BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_interactions AS (
        SELECT research_areas
        FROM user_event_interactions uei
        WHERE 
            (input_user_id IS NOT NULL AND uei.user_id = input_user_id)
            OR (input_email IS NOT NULL AND uei.email = input_email)
            OR (input_session_id IS NOT NULL AND uei.session_id = input_session_id)
    ),
    total_count AS (
        SELECT COUNT(*) as total
        FROM user_interactions
    ),
    area_counts AS (
        SELECT 
            UNNEST(ui.research_areas) as area,
            COUNT(*) as count
        FROM user_interactions ui
        GROUP BY UNNEST(ui.research_areas)
    )
    SELECT 
        ac.area as research_area,
        ac.count as interaction_count,
        ROUND((ac.count * 100.0 / tc.total), 2) as percentage,
        tc.total as total_interactions
    FROM area_counts ac
    CROSS JOIN total_count tc
    ORDER BY percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get event engagement analytics
CREATE OR REPLACE FUNCTION get_event_engagement_stats(input_event_id TEXT)
RETURNS TABLE (
    total_views BIGINT,
    total_clicks BIGINT,
    unique_users BIGINT,
    unique_emails BIGINT,
    unique_sessions BIGINT,
    click_through_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE interaction_type = 'view') as total_views,
        COUNT(*) FILTER (WHERE interaction_type = 'click_external') as total_clicks,
        COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as unique_users,
        COUNT(DISTINCT email) FILTER (WHERE email IS NOT NULL) as unique_emails,
        COUNT(DISTINCT session_id) FILTER (WHERE session_id IS NOT NULL) as unique_sessions,
        CASE 
            WHEN COUNT(*) FILTER (WHERE interaction_type = 'view') > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE interaction_type = 'click_external') * 100.0 / COUNT(*) FILTER (WHERE interaction_type = 'view')), 2)
            ELSE 0 
        END as click_through_rate
    FROM user_event_interactions
    WHERE event_id = input_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function for GDPR data cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_tracking_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_event_interactions 
    WHERE data_retention_until < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create automated cleanup job (runs daily)
-- Note: This requires the pg_cron extension to be enabled in Supabase
-- You can enable it in Database > Extensions in Supabase dashboard
-- SELECT cron.schedule('cleanup-tracking-data', '0 2 * * *', 'SELECT cleanup_expired_tracking_data();');

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON user_event_interactions TO authenticated;
GRANT SELECT, INSERT ON user_event_interactions TO anon; -- For anonymous tracking
GRANT ALL ON newsletter_subscribers TO authenticated;
GRANT SELECT, INSERT ON newsletter_subscribers TO anon;

-- 11. Create helpful views for admin analytics
CREATE VIEW admin_user_engagement_summary AS
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

CREATE VIEW admin_event_popularity AS
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

-- 12. Sample queries for testing
-- Test user research interests:
-- SELECT * FROM get_user_research_interests(input_user_id := 'your-user-uuid');

-- Test event engagement:
-- SELECT * FROM get_event_engagement_stats('your-event-id');

-- View admin summaries:
-- SELECT * FROM admin_user_engagement_summary LIMIT 10;
-- SELECT * FROM admin_event_popularity LIMIT 10;

COMMENT ON TABLE user_event_interactions IS 'Tracks all user interactions with events for analytics and personalization';
COMMENT ON TABLE newsletter_subscribers IS 'Tracks newsletter email subscriptions before account creation';
COMMENT ON FUNCTION get_user_research_interests IS 'Calculates research area interest percentages for a user';
COMMENT ON FUNCTION get_event_engagement_stats IS 'Provides engagement analytics for a specific event';
