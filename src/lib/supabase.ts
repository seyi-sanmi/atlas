import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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