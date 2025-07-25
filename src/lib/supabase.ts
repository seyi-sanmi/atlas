import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Community interface matching the 'atlas_public_view_in_public' view
export interface Community {
  name: string;
  community_type: string[];
  location_names: string[];
  academic_association: string[] | null;
  website: string | null;
  research_area_names: string[] | null;
  community_linkedin: string | null;
  size: string | null;
  purpose: string | null;
  members_selection: string | null;
  member_locations: string | null;
  target_members: string | null;
  member_communication: string[] | null;
  meeting_frequency: string | null;
  meeting_location: string | null;
  leadership_change_frequency: string | null;
  community_interest_areas: string[] | null;
  community_information: string | null;
  starred_on_website?: boolean;
}

// Database types based on your event structure
export type Event = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  categories: string[];
  organizer: string;
  url: string;
  image_url?: string;
  imported_at: string;
  platform: string;
  ai_event_type: string;
  ai_interest_areas: string[];
  ai_categorized: boolean;
  ai_categorized_at: string;
  ai_summary: string;
  ai_technical_keywords: string[];
  ai_excitement_hook: string;
  ai_summarized: boolean;
  ai_summarized_at: string;
  is_starred?: boolean;
  is_featured?: boolean;
  // Removing luma_synced, luma_sync_url, luma_sync_date fields
}; 