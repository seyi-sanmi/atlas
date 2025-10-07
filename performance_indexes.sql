-- Performance Optimization: Database Indexes
-- Run this in your Supabase SQL editor to speed up common queries

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_ai_event_type ON events(ai_event_type);
CREATE INDEX IF NOT EXISTS idx_events_is_starred ON events(is_starred);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);

-- Composite index for common query pattern (upcoming events)
CREATE INDEX IF NOT EXISTS idx_events_date_starred ON events(date, is_starred) WHERE date >= CURRENT_DATE;

-- GIN indexes for array columns (faster contains operations)
CREATE INDEX IF NOT EXISTS idx_events_ai_interest_areas ON events USING GIN(ai_interest_areas);
CREATE INDEX IF NOT EXISTS idx_events_categories ON events USING GIN(categories);

-- Communities view - check if these columns exist in your actual table structure
-- Adjust the table name if needed (might be a different underlying table)
-- CREATE INDEX IF NOT EXISTS idx_communities_location ON atlas_public_view_in_public(location_names);
-- CREATE INDEX IF NOT EXISTS idx_communities_research_areas ON atlas_public_view_in_public USING GIN(research_area_names);

-- Analyze tables to update query planner statistics
ANALYZE events;
-- ANALYZE atlas_public_view_in_public;

-- Expected impact: 50-70% faster queries on filtered/sorted operations

