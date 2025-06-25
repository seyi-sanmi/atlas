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
}

// Database types based on your event structure
export interface Event {
  id: string
  title: string
  date: string // Format: "2025-06-15" for proper date sorting
  time: string
  location: string
  city: string // City for location-based filtering
  description: string
  categories: string[]
  organizer: string
  presented_by?: string
  is_featured?: boolean
  url?: string // Optional URL to the original event page
  image_url?: string // Optional URL to the event image
  links?: string[] // Optional array of links extracted from the event page
  created_at?: string
  updated_at?: string
} 