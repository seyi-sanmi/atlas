-- =============================================
-- ATLAS Admin Panel Database Setup
-- =============================================

-- 1. Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- 1.5. Add analytics and scraping columns to events table
ALTER TABLE events 
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN click_count INTEGER DEFAULT 0,
ADD COLUMN last_scraped_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for analytics
CREATE INDEX idx_events_view_count ON events(view_count);
CREATE INDEX idx_events_click_count ON events(click_count);
CREATE INDEX idx_events_last_scraped_at ON events(last_scraped_at);

-- 2. Create admin_logs table for audit trail
CREATE TABLE admin_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view audit logs" ON admin_logs
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Only system can insert logs (handled by admin functions)
CREATE POLICY "System can insert audit logs" ON admin_logs
    FOR INSERT 
    WITH CHECK (true);

-- Create indexes for admin_logs
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);

-- 3. Create hero_content table for managing hero sections
CREATE TABLE hero_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('research_area', 'location')),
    name TEXT NOT NULL,
    
    -- For locations
    image_url TEXT,
    
    -- Common fields
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique names per type
    UNIQUE(type, name)
);

-- Enable RLS on hero_content
ALTER TABLE hero_content ENABLE ROW LEVEL SECURITY;

-- Public can read active hero content
CREATE POLICY "Anyone can view active hero content" ON hero_content
    FOR SELECT 
    USING (is_active = true);

-- Only admins can modify hero content
CREATE POLICY "Admins can manage hero content" ON hero_content
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Create indexes for hero_content
CREATE INDEX idx_hero_content_type ON hero_content(type);
CREATE INDEX idx_hero_content_is_active ON hero_content(is_active);
CREATE INDEX idx_hero_content_display_order ON hero_content(display_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hero_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hero_content
CREATE TRIGGER update_hero_content_updated_at
    BEFORE UPDATE ON hero_content
    FOR EACH ROW
    EXECUTE FUNCTION update_hero_content_updated_at();

-- 4. Insert default hero content (research areas)
INSERT INTO hero_content (type, name, display_order) VALUES
    ('research_area', 'Biotechnology & Synthetic Biology', 1),
    ('research_area', 'Genetics & Genomics', 2),
    ('research_area', 'Healthcare & Medicine', 3),
    ('research_area', 'Longevity & Aging', 4),
    ('research_area', 'Biosecurity & Biodefense', 5),
    ('research_area', 'Neuroscience', 6),
    ('research_area', 'Materials Science & Engineering', 7),
    ('research_area', 'Quantum Computing', 8),
    ('research_area', 'Robotics & AI', 9),
    ('research_area', 'Nanotechnology', 10),
    ('research_area', 'Space & Astronomy', 11),
    ('research_area', 'Neurotechnology', 12),
    ('research_area', 'Climate & Atmospheric Science', 13),
    ('research_area', 'Renewable Energy', 14),
    ('research_area', 'Deep Tech', 15),
    ('research_area', 'Ocean & Marine Science', 16),
    ('research_area', 'Conservation Biology', 17),
    ('research_area', 'Agriculture & Food Systems', 18),
    ('research_area', 'Environmental Health', 19),
    ('research_area', 'Artificial Intelligence', 20),
    ('research_area', 'Machine Learning', 21),
    ('research_area', 'Bioinformatics', 22),
    ('research_area', 'Chemoinformatics', 23),
    ('research_area', 'High-Performance Computing', 24),
    ('research_area', 'Data Analytics', 25),
    ('research_area', 'Natural Language Processing', 26),
    ('research_area', 'Biochemistry', 27),
    ('research_area', 'Chemistry', 28),
    ('research_area', 'Physics', 29),
    ('research_area', 'Biology', 30),
    ('research_area', 'Mathematics', 31),
    ('research_area', 'Photonics', 32),
    ('research_area', 'Computer Vision', 33);

-- 5. Insert default hero content (locations)
INSERT INTO hero_content (type, name, image_url, display_order) VALUES
    ('location', 'London', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 1),
    ('location', 'Birmingham', 'https://images.unsplash.com/photo-1610818647551-866cce9f06d5?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 2),
    ('location', 'Oxford', 'https://images.unsplash.com/photo-1579628151787-e17a97e79feb?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 3),
    ('location', 'Edinburgh', 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 4),
    ('location', 'Manchester', 'https://images.unsplash.com/photo-1588934375041-0478480ae4c2?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 5),
    ('location', 'Bristol', 'https://images.unsplash.com/photo-1597079013069-bd1681f7454f?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 6),
    ('location', 'Liverpool', 'https://images.unsplash.com/photo-1557925179-a524ea601317?ixlib=rb-4.1.0&auto=format&fit=crop&w=1200&q=70&fm=jpg&auto=compress&sat=50', 7),
    ('location', 'Belfast', 'https://images.unsplash.com/photo-1593255136145-da399169fadd?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 8),
    ('location', 'Cambridge', 'https://images.unsplash.com/photo-1596967082890-810f0f4cf634?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 9);

-- 6. Create view for analytics (to be expanded later)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM hero_content WHERE type = 'research_area' AND is_active = true) as active_research_areas,
    (SELECT COUNT(*) FROM hero_content WHERE type = 'location' AND is_active = true) as active_locations,
    (SELECT COUNT(*) FROM events WHERE created_at >= NOW() - INTERVAL '7 days') as events_this_week,
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '7 days') as users_this_week,
    (SELECT COUNT(*) FROM events WHERE date >= CURRENT_DATE) as upcoming_events;

-- Grant access to admin view
GRANT SELECT ON admin_dashboard_stats TO authenticated;

-- 7. Functions for hero content management
CREATE OR REPLACE FUNCTION get_hero_research_areas()
RETURNS TABLE(name TEXT, display_order INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT hero_content.name, hero_content.display_order
    FROM hero_content
    WHERE type = 'research_area' AND is_active = true
    ORDER BY display_order, hero_content.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_hero_locations()
RETURNS TABLE(name TEXT, image_url TEXT, display_order INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT hero_content.name, hero_content.image_url, hero_content.display_order
    FROM hero_content
    WHERE type = 'location' AND is_active = true
    ORDER BY display_order, hero_content.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_hero_research_areas() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_hero_locations() TO anon, authenticated;

-- =============================================
-- Manual Admin Setup (Run after schema)
-- =============================================

-- IMPORTANT: Manually set admin role for your account
-- Replace 'your-email@example.com' with your actual email
 UPDATE profiles SET role = 'super_admin' 
 WHERE id = (SELECT id FROM auth.users WHERE email = 'seyi@renphil.org');

-- You can add more admins later:
-- UPDATE profiles SET role = 'admin' 
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@example.com'); 