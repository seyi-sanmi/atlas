import { supabase, Event } from './supabase'

// Fetch all events
export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching events:', error)
    throw error
  }

  return data || []
}

// Search events by title, description, location, city, organizer, or categories
export async function searchEvents(query: string): Promise<Event[]> {
  if (!query.trim()) {
    return getAllEvents()
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or(`title.ilike.%${query}%, description.ilike.%${query}%, location.ilike.%${query}%, city.ilike.%${query}%, organizer.ilike.%${query}%`)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error searching events:', error)
    throw error
  }

  return data || []
}

// Filter events by city
export async function getEventsByLocation(location: string): Promise<Event[]> {
  if (location === 'All Locations') {
    return getAllEvents()
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('city', location)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error filtering events by city:', error)
    throw error
  }

  return data || []
}

// Filter events by AI event type (modern approach) or fallback to legacy categories  
export async function getEventsByCategory(category: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .or(`ai_event_type.eq.${category},categories.cs.{${category}}`)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error filtering events by category:', error)
    throw error
  }

  return data || []
}

// I don't know it's used or not, but it's here - Get featured events (not used)
export async function getFeaturedEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_featured', true)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching featured events:', error)
    throw error
  }

  return data || []
}

// Get starred events
export async function getStarredEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_starred', true)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching starred events:', error)
    throw error
  }

  return data || []
}

// Combined search and filter function
export async function searchAndFilterEvents(options: {
  query?: string
  location?: string
  category?: string
  interestAreas?: string[]
  eventTypes?: string[]
  featured?: boolean
  starred?: boolean
  date?: Date | null
}): Promise<Event[]> {
  let queryBuilder = supabase.from('events').select('*')

  // Apply search query
  if (options.query && options.query.trim()) {
    queryBuilder = queryBuilder.or(`title.ilike.%${options.query}%, description.ilike.%${options.query}%, location.ilike.%${options.query}%, city.ilike.%${options.query}%, organizer.ilike.%${options.query}%`)
  }

  // Apply city filter
  if (options.location && options.location !== 'All Locations') {
    queryBuilder = queryBuilder.eq('city', options.location)
  }

  // Apply category filter (try AI event type first, fallback to legacy categories)
  if (options.category) {
    queryBuilder = queryBuilder.or(`ai_event_type.eq.${options.category},categories.cs.{${options.category}}`)
  }

  // Apply interest areas filter (AI interest areas)
  if (options.interestAreas && options.interestAreas.length > 0) {
    // Filter events that have any of the selected interest areas
    const interestAreaFilters = options.interestAreas.map(area => `ai_interest_areas.cs.{${area}}`).join(',')
    queryBuilder = queryBuilder.or(interestAreaFilters)
  }

  // Apply event types filter (AI event types)
  if (options.eventTypes && options.eventTypes.length > 0) {
    // Filter events that have any of the selected event types
    const eventTypeFilters = options.eventTypes.map(type => `ai_event_type.eq.${type}`).join(',')
    queryBuilder = queryBuilder.or(eventTypeFilters)
  }

  // Apply featured filter
  if (options.featured) {
    queryBuilder = queryBuilder.eq('is_featured', true)
  }

  // Apply starred filter
  if (options.starred) {
    queryBuilder = queryBuilder.eq('is_starred', true)
  }

  // Apply date filter
  if (options.date) {
    // Filter by specific date (format: YYYY-MM-DD)
    const dateString = options.date.toISOString().split('T')[0]
    queryBuilder = queryBuilder.eq('date', dateString)
  }

  // Order by date
  queryBuilder = queryBuilder.order('date', { ascending: true })

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error searching and filtering events:', error)
    throw error
  }

  return data || []
}

// Get unique cities from all events
export async function getUniqueLocations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('city')

  if (error) {
    console.error('Error fetching cities:', error)
    throw error
  }

  // Extract unique cities and filter out empty/null values
  const uniqueCities = [...new Set(
    data
      ?.map(event => event.city)
      .filter(city => city && city.trim() && city !== 'TBD') || []
  )].sort()

  return uniqueCities
}

// Get unique AI event types from all events (preferred) with fallback to legacy categories
export async function getUniqueCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('ai_event_type, categories')

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  // Collect AI event types and legacy categories, prioritizing AI types
  const aiEventTypes = data?.map(event => event.ai_event_type).filter(Boolean) || []
  const legacyCategories = data?.flatMap(event => event.categories || []) || []
  
  // Combine and deduplicate, prioritizing AI event types
  const allCategories = [...new Set([...aiEventTypes, ...legacyCategories])].sort()
  
  return allCategories
}

// Get unique AI event types only
export async function getUniqueAIEventTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('ai_event_type')
    .not('ai_event_type', 'is', null)

  if (error) {
    console.error('Error fetching AI event types:', error)
    throw error
  }

  // Get unique AI event types
  const aiEventTypes = data?.map(event => event.ai_event_type).filter(Boolean) || []
  const uniqueAITypes = [...new Set(aiEventTypes)].sort()
  
  return uniqueAITypes
}

// Get unique AI interest areas from all events
export async function getUniqueAIInterestAreas(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('ai_interest_areas')
    .not('ai_interest_areas', 'is', null)

  if (error) {
    console.error('Error fetching AI interest areas:', error)
    throw error
  }

  // Flatten all interest areas arrays and get unique values
  const allInterestAreas = data?.flatMap(event => event.ai_interest_areas || []) || []
  const uniqueInterestAreas = [...new Set(allInterestAreas)].sort()
  
  return uniqueInterestAreas
}