-- =============================================
-- Enhance Newsletter Schema for MailChimp/Beehive Integration
-- =============================================

-- 1. Add columns to newsletter_subscribers table for external integrations
ALTER TABLE newsletter_subscribers 
ADD COLUMN IF NOT EXISTS mailchimp_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS beehive_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'subscribed' CHECK (status IN ('pending', 'subscribed', 'unsubscribed', 'bounced')),
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_mailchimp_id ON newsletter_subscribers(mailchimp_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_beehive_id ON newsletter_subscribers(beehive_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_tags ON newsletter_subscribers USING GIN(tags);

-- 3. Create function to get newsletter analytics
CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS TABLE (
    total_subscribers BIGINT,
    active_subscribers BIGINT,
    signups_this_week BIGINT,
    signups_this_month BIGINT,
    top_sources JSON,
    top_tags JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'subscribed') as active,
            COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '7 days') as week_signups,
            COUNT(*) FILTER (WHERE subscribed_at >= NOW() - INTERVAL '30 days') as month_signups
        FROM newsletter_subscribers
    ),
    sources AS (
        SELECT 
            json_agg(
                json_build_object('source', source_page, 'count', count)
                ORDER BY count DESC
            ) as top_sources
        FROM (
            SELECT source_page, COUNT(*) as count
            FROM newsletter_subscribers
            WHERE status = 'subscribed'
            GROUP BY source_page
            ORDER BY count DESC
            LIMIT 10
        ) s
    ),
    tags AS (
        SELECT 
            json_agg(
                json_build_object('tag', tag, 'count', count)
                ORDER BY count DESC
            ) as top_tags
        FROM (
            SELECT 
                UNNEST(tags) as tag, 
                COUNT(*) as count
            FROM newsletter_subscribers
            WHERE status = 'subscribed' AND tags IS NOT NULL
            GROUP BY UNNEST(tags)
            ORDER BY count DESC
            LIMIT 10
        ) t
    )
    SELECT 
        s.total,
        s.active,
        s.week_signups,
        s.month_signups,
        COALESCE(src.top_sources, '[]'::json),
        COALESCE(t.top_tags, '[]'::json)
    FROM stats s
    CROSS JOIN sources src
    CROSS JOIN tags t;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to auto-tag subscribers based on their event interests
CREATE OR REPLACE FUNCTION auto_tag_subscriber(subscriber_email VARCHAR)
RETURNS TEXT[] AS $$
DECLARE
    interest_tags TEXT[];
BEGIN
    -- Get top 3 research areas from user interactions
    SELECT array_agg(research_area ORDER BY interaction_count DESC)
    INTO interest_tags
    FROM (
        SELECT 
            UNNEST(research_areas) as research_area,
            COUNT(*) as interaction_count
        FROM user_event_interactions
        WHERE email = subscriber_email
        GROUP BY UNNEST(research_areas)
        ORDER BY interaction_count DESC
        LIMIT 3
    ) top_interests;
    
    -- Update subscriber with tags
    UPDATE newsletter_subscribers 
    SET tags = interest_tags,
        metadata = metadata || json_build_object('auto_tagged_at', NOW())::jsonb
    WHERE email = subscriber_email;
    
    RETURN COALESCE(interest_tags, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create view for subscriber insights
CREATE OR REPLACE VIEW newsletter_subscriber_insights AS
SELECT 
    ns.email,
    ns.status,
    ns.subscribed_at,
    ns.source_page,
    ns.tags,
    ns.mailchimp_id,
    ns.beehive_id,
    -- User engagement metrics
    COUNT(uei.id) as total_interactions,
    COUNT(DISTINCT uei.event_id) as unique_events_engaged,
    COUNT(uei.id) FILTER (WHERE uei.interaction_type = 'click_external') as event_clicks,
    MAX(uei.timestamp) as last_event_interaction,
    -- Research interest profile
    (
        SELECT array_agg(research_area ORDER BY count DESC)
        FROM (
            SELECT 
                UNNEST(uei2.research_areas) as research_area,
                COUNT(*) as count
            FROM user_event_interactions uei2
            WHERE uei2.email = ns.email
            GROUP BY UNNEST(uei2.research_areas)
            ORDER BY count DESC
            LIMIT 5
        ) interests
    ) as top_research_interests
FROM newsletter_subscribers ns
LEFT JOIN user_event_interactions uei ON ns.email = uei.email
GROUP BY ns.email, ns.status, ns.subscribed_at, ns.source_page, ns.tags, ns.mailchimp_id, ns.beehive_id;

-- 6. Create function to sync with external providers (placeholder for API calls)
CREATE OR REPLACE FUNCTION sync_with_external_provider(
    provider_name VARCHAR,
    operation VARCHAR,
    subscriber_email VARCHAR,
    provider_data JSONB DEFAULT '{}'::jsonb
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    -- This function will be used to track sync operations with MailChimp/Beehive
    -- For now, it just logs the operation
    
    INSERT INTO newsletter_sync_log (
        provider,
        operation,
        email,
        data,
        attempted_at
    ) VALUES (
        provider_name,
        operation,
        subscriber_email,
        provider_data,
        NOW()
    );
    
    -- Return success for now (will be replaced with actual API calls)
    result := json_build_object(
        'success', true,
        'provider', provider_name,
        'operation', operation,
        'email', subscriber_email
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create sync log table for tracking external provider operations
CREATE TABLE IF NOT EXISTS newsletter_sync_log (
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    data JSONB,
    attempted_at TIMESTAMPTZ DEFAULT NOW(),
    success BOOLEAN,
    error_message TEXT,
    response_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_sync_log_provider ON newsletter_sync_log(provider);
CREATE INDEX IF NOT EXISTS idx_sync_log_email ON newsletter_sync_log(email);
CREATE INDEX IF NOT EXISTS idx_sync_log_attempted_at ON newsletter_sync_log(attempted_at);

-- 8. Grant permissions
GRANT ALL ON newsletter_sync_log TO authenticated;
GRANT SELECT ON newsletter_subscriber_insights TO authenticated;

-- 9. Test the new functionality
SELECT * FROM get_newsletter_stats();

COMMENT ON TABLE newsletter_subscribers IS 'Enhanced newsletter subscribers table with MailChimp/Beehive integration support';
COMMENT ON FUNCTION get_newsletter_stats IS 'Returns comprehensive newsletter analytics';
COMMENT ON FUNCTION auto_tag_subscriber IS 'Automatically tags subscribers based on their event interaction history';
COMMENT ON VIEW newsletter_subscriber_insights IS 'Rich view combining newsletter and event engagement data';
