import { supabase } from './supabase'
import { Event } from './supabase'
import { logAdminAction } from './admin'
import { importEvent } from '@/app/actions/import-event'

export interface EventWithAnalytics extends Event {
  view_count?: number
  click_count?: number
  last_scraped_at?: string
}

/**
 * Get all events with basic analytics for admin view
 */
export async function getEventsForAdmin(): Promise<EventWithAnalytics[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      view_count,
      click_count,
      last_scraped_at
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching events for admin:', error)
    throw error
  }

  return data || []
}

/**
 * Delete multiple events (bulk delete)
 */
export async function bulkDeleteEvents(eventIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .in('id', eventIds)

  if (error) {
    console.error('Error bulk deleting events:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('bulk_delete_events', {
    event_ids: eventIds,
    count: eventIds.length
  })
}

/**
 * Delete a single event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting event:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('delete_event', { event_id: eventId })
}

/**
 * Update event details
 */
export async function updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)

  if (error) {
    console.error('Error updating event:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('update_event', { 
    event_id: eventId, 
    updated_fields: Object.keys(updates)
  })
}

/**
 * Re-scrape event from original URL
 */
export async function reScrapeEvent(eventId: string): Promise<EventWithAnalytics> {
  // First get the current event to find the original URL
  const { data: currentEvent, error: fetchError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (fetchError || !currentEvent) {
    throw new Error('Event not found')
  }

  if (!currentEvent.url) {
    throw new Error('No original URL found for this event')
  }

  try {
    // Use the existing import function to re-scrape with force update
    const importResult = await importEvent(currentEvent.url, true)
    
    if (!importResult.success || !importResult.event) {
      throw new Error(importResult.error || 'Failed to re-scrape event')
    }

    const scrapedData = importResult.event
    
    // Update the event with fresh data, preserving analytics and IDs
    const updates = {
      title: scrapedData.title,
      description: scrapedData.description,
      date: scrapedData.date,
      time: scrapedData.time,
      location: scrapedData.location,
      city: scrapedData.city,
      organizer: scrapedData.organizer,
      image_url: scrapedData.image_url,
      categories: scrapedData.categories || [],
      ai_event_type: scrapedData.ai_event_type,
      ai_interest_areas: scrapedData.ai_interest_areas || [],
      ai_categorized: scrapedData.ai_categorized || false,
      ai_categorized_at: scrapedData.ai_categorized_at,
      last_scraped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select('*')
      .single()

    if (updateError) {
      throw updateError
    }

    // Log admin action
    await logAdminAction('rescrape_event', { 
      event_id: eventId,
      url: currentEvent.url,
      changes_detected: JSON.stringify(updates)
    })

    return updatedEvent as EventWithAnalytics

  } catch (error) {
    console.error('Error re-scraping event:', error)
    // Log failed attempt
    await logAdminAction('rescrape_event_failed', { 
      event_id: eventId,
      url: currentEvent.url,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    throw error
  }
}

/**
 * Get event analytics summary
 */
export async function getEventAnalytics(eventId: string): Promise<{
  views: number
  clicks: number
  last_viewed?: string
  last_clicked?: string
}> {
  // For now, return simple counters from the events table
  // In the future, this could query a separate analytics table for detailed tracking
  const { data, error } = await supabase
    .from('events')
    .select('view_count, click_count')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching event analytics:', error)
    return { views: 0, clicks: 0 }
  }

  return {
    views: data?.view_count || 0,
    clicks: data?.click_count || 0
  }
}

/**
 * Search and filter events for admin
 */
export async function searchEventsForAdmin(options: {
  query?: string
  platform?: string
  dateFrom?: string
  dateTo?: string
  category?: string
  limit?: number
  offset?: number
}): Promise<EventWithAnalytics[]> {
  let queryBuilder = supabase
    .from('events')
    .select('*, view_count, click_count, last_scraped_at')

  // Apply search query
  if (options.query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${options.query}%,description.ilike.%${options.query}%,organizer.ilike.%${options.query}%`
    )
  }

  // Apply platform filter
  if (options.platform) {
    queryBuilder = queryBuilder.eq('platform', options.platform)
  }

  // Apply date range filter
  if (options.dateFrom) {
    queryBuilder = queryBuilder.gte('date', options.dateFrom)
  }
  if (options.dateTo) {
    queryBuilder = queryBuilder.lte('date', options.dateTo)
  }

  // Apply category filter (supports multi-select AI event types)
  if (options.category) {
    queryBuilder = queryBuilder.or(
      `ai_event_type.eq.${options.category},ai_event_types.cs.{${options.category}},categories.cs.{${options.category}}`
    )
  }

  // Apply pagination
  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit)
  }
  if (options.offset) {
    queryBuilder = queryBuilder.range(options.offset, (options.offset || 0) + (options.limit || 50) - 1)
  }

  // Order by newest first
  queryBuilder = queryBuilder.order('created_at', { ascending: false })

  const { data, error } = await queryBuilder

  if (error) {
    console.error('Error searching events for admin:', error)
    throw error
  }

  return data || []
} 