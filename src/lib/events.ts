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

// Filter events by categories
export async function getEventsByCategory(category: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .contains('categories', [category])
    .order('date', { ascending: true })

  if (error) {
    console.error('Error filtering events by category:', error)
    throw error
  }

  return data || []
}

// Get featured events
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



// Combined search and filter function
export async function searchAndFilterEvents(options: {
  query?: string
  location?: string
  category?: string
  featured?: boolean
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

  // Apply category filter
  if (options.category) {
    queryBuilder = queryBuilder.contains('categories', [options.category])
  }

  // Apply featured filter
  if (options.featured) {
    queryBuilder = queryBuilder.eq('is_featured', true)
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

// Get unique categories from all events
export async function getUniqueCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('categories')

  if (error) {
    console.error('Error fetching categories:', error)
    throw error
  }

  // Flatten all categories arrays and get unique values
  const allCategories = data?.flatMap(event => event.categories || []) || []
  const uniqueCategories = [...new Set(allCategories)].sort()

  return uniqueCategories
}