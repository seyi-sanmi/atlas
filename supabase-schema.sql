-- Create the events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT DEFAULT '',
  categories TEXT[] DEFAULT '{}',
  organizer TEXT NOT NULL,
  presented_by TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  url TEXT,
  links TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Create an index on title for search functionality
CREATE INDEX IF NOT EXISTS idx_events_title ON events USING gin(to_tsvector('english', title));

-- Create an index on location for search functionality
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING gin(to_tsvector('english', location));

-- Create an index on organizer for search functionality
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events USING gin(to_tsvector('english', organizer));

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an events listing app)
-- Allow anyone to read events
CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

-- Allow anyone to insert events (you may want to restrict this later)
CREATE POLICY "Allow public insert access" ON events
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update events (you may want to restrict this later)
CREATE POLICY "Allow public update access" ON events
  FOR UPDATE USING (true);

-- Allow anyone to delete events (you may want to restrict this later)
CREATE POLICY "Allow public delete access" ON events
  FOR DELETE USING (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 