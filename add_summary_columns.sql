-- Add AI summary columns to events table
ALTER TABLE events 
ADD COLUMN ai_summary TEXT,
ADD COLUMN ai_technical_keywords TEXT[],
ADD COLUMN ai_excitement_hook TEXT,
ADD COLUMN ai_summarized BOOLEAN DEFAULT FALSE,
ADD COLUMN ai_summarized_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX idx_events_ai_summarized ON events(ai_summarized);
CREATE INDEX idx_events_ai_technical_keywords ON events USING GIN(ai_technical_keywords);

-- Update existing events to mark them as not summarized
UPDATE events SET ai_summarized = FALSE WHERE ai_summarized IS NULL; 