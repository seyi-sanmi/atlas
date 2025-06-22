'use server'

import { supabase } from '@/lib/supabase'
import { scrapeLumaEvent } from '@/lib/luma-scraper'

// Platform detection and URL parsing
function detectPlatform(url: string): 'luma' | 'eventbrite' | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'lu.ma') {
      return 'luma';
    }
    
    if (urlObj.hostname === 'www.eventbrite.com' || urlObj.hostname === 'eventbrite.com') {
      return 'eventbrite';
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Extract event ID from Luma URL
function extractLumaEventId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'lu.ma') {
      throw new Error('Invalid Luma URL');
    }
    
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) {
      throw new Error('Invalid Luma URL format');
    }
    
    return pathSegments[0];
  } catch (error) {
    return null;
  }
}

// Extract event ID from Eventbrite URL
function extractEventbriteEventId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (!urlObj.hostname.includes('eventbrite.com')) {
      throw new Error('Invalid Eventbrite URL');
    }
    
    // Eventbrite URLs are typically: https://www.eventbrite.com/e/event-name-tickets-123456789
    const pathMatch = urlObj.pathname.match(/\/e\/[^\/]+-(\d+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    
    // Alternative format: direct event ID in path
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    const eventSegment = pathSegments.find(segment => segment.match(/^\d+$/));
    if (eventSegment) {
      return eventSegment;
    }
    
    throw new Error('Could not extract event ID from Eventbrite URL');
  } catch (error) {
    return null;
  }
}

// Import from Luma API with scraper fallback
async function importFromLuma(eventId: string, originalUrl: string) {
  // First, try the API if available
  if (process.env.LUMA_API_KEY) {
    try {
      const response = await fetch(`https://api.lu.ma/public/v1/event/${eventId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-luma-api-key': process.env.LUMA_API_KEY,
        },
      });

      if (response.ok) {
        const lumaEventData = await response.json();
        console.log('Successfully imported from Luma API');
        
        return {
          title: lumaEventData.name || 'Untitled Event',
          description: lumaEventData.description || '',
          date: lumaEventData.start_at ? new Date(lumaEventData.start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: lumaEventData.start_at ? formatTime(lumaEventData.start_at, lumaEventData.end_at) : 'TBD',
          location: lumaEventData.location?.name || lumaEventData.location || 'TBD',
          city: getLumaCity(lumaEventData),
          categories: ['Imported'],
          organizer: lumaEventData.organizer?.name || 'Luma Event',
          url: originalUrl,
          luma_id: eventId,
          imported_at: new Date().toISOString(),
          platform: 'luma'
        };
      } else {
        console.log(`Luma API failed with status ${response.status}, falling back to scraper`);
      }
    } catch (apiError) {
      console.log('Luma API error, falling back to scraper:', apiError);
    }
  } else {
    console.log('No Luma API key found, using scraper');
  }

  // Fallback to scraper
  try {
    console.log('Attempting to scrape Luma event:', originalUrl);
    const scrapedData = await scrapeLumaEvent(originalUrl);
    
    if (scrapedData) {
      console.log('Successfully scraped Luma event');
      return {
        title: scrapedData.title,
        description: scrapedData.description,
        date: scrapedData.date,
        time: scrapedData.time,
        location: scrapedData.location,
        city: scrapedData.city,
        categories: ['Scraped'],
        organizer: scrapedData.organizer,
        url: originalUrl,
        luma_id: eventId,
        imported_at: new Date().toISOString(),
        platform: 'luma-scraped'
      };
    }
  } catch (scrapeError) {
    console.error('Scraper error:', scrapeError);
  }

  // If both API and scraper fail
  return {
    success: false,
    error: 'Unable to import event. Both API and scraper methods failed. This may be because: 1) The event is private or restricted, 2) The event URL is incorrect, or 3) The event page structure has changed. Please verify the URL and try again.'
  };
}

// Import from Eventbrite API
async function importFromEventbrite(eventId: string, originalUrl: string) {
  if (!process.env.EVENTBRITE_API_KEY) {
    return {
      success: false,
      error: 'Eventbrite API key not configured. Please contact an administrator.'
    };
  }

  // Fetch event details with expanded venue and organizer information
  const response = await fetch(`https://www.eventbriteapi.com/v3/events/${eventId}/?expand=venue,organizer`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.EVENTBRITE_API_KEY}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return {
        success: false,
        error: 'Event not found. Please check the URL or ensure the event is public.'
      };
    }
    if (response.status === 401) {
      return {
        success: false,
        error: 'Unauthorized access to Eventbrite API. Please check API key configuration.'
      };
    }
    throw new Error(`Eventbrite API error: ${response.status}`);
  }

  const eventbriteEventData = await response.json();

  return {
    title: eventbriteEventData.name?.text || 'Untitled Event',
    description: eventbriteEventData.description?.html || eventbriteEventData.description?.text || '',
    date: eventbriteEventData.start?.utc ? new Date(eventbriteEventData.start.utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: eventbriteEventData.start?.utc ? formatEventbriteTime(eventbriteEventData.start.utc, eventbriteEventData.end?.utc) : 'TBD',
    location: getEventbriteLocation(eventbriteEventData),
    city: getEventbriteCity(eventbriteEventData),
    categories: ['Imported'],
    organizer: getEventbriteOrganizer(eventbriteEventData),
    url: originalUrl,
    eventbrite_id: eventId,
    imported_at: new Date().toISOString(),
    platform: 'eventbrite'
  };
}

// Helper function to extract location from Eventbrite event data
function getEventbriteLocation(eventData: any): string {
  if (eventData.venue && eventData.venue.name) {
    return eventData.venue.name;
  }
  
  if (eventData.online_event) {
    return 'Online Event';
  }
  
  return 'TBD';
}

// Helper function to extract organizer from Eventbrite event data
function getEventbriteOrganizer(eventData: any): string {
  if (eventData.organizer) {
    const organizer = eventData.organizer;
    
    // Use organizer name first
    if (organizer.name) {
      return organizer.name;
    }
    
    // Fall back to description if name is empty
    if (organizer.description?.text) {
      return organizer.description.text;
    }
  }
  
  return 'Eventbrite Event';
}

// Helper function to extract city from Eventbrite event data
function getEventbriteCity(eventData: any): string {
  if (eventData.venue && eventData.venue.address && eventData.venue.address.city) {
    return eventData.venue.address.city;
  }
  
  if (eventData.online_event) {
    return 'Online';
  }
  
  return 'TBD';
}

// Helper function to extract city from Luma event data
function getLumaCity(eventData: any): string {
  // Luma location data structure can vary, try different possible paths
  if (eventData.location) {
    // If location has city field
    if (eventData.location.city) {
      return eventData.location.city;
    }
    
    // If location has address with city
    if (eventData.location.address && eventData.location.address.city) {
      return eventData.location.address.city;
    }
    
    // Try to extract city from location name/string if it follows common patterns
    if (typeof eventData.location === 'string' || eventData.location.name) {
      const locationStr = eventData.location.name || eventData.location;
      // Try to extract city from patterns like "Venue Name, City" or "City, State"
      const parts = locationStr.split(',').map((part: string) => part.trim());
      if (parts.length >= 2) {
        // Assume the second-to-last part is the city
        return parts[parts.length - 2];
      }
    }
  }
  
  if (eventData.online_event) {
    return 'Online';
  }
  
  return 'TBD';
}

// Helper function to format time from Eventbrite timestamps
function formatEventbriteTime(startUtc: string, endUtc?: string): string {
  try {
    const start = new Date(startUtc);
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (endUtc) {
      const end = new Date(endUtc);
      const endTime = end.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  } catch (error) {
    return 'TBD';
  }
}

// Helper function to format time from Luma timestamps
function formatTime(startAt: string, endAt?: string): string {
  try {
    const start = new Date(startAt);
    const startTime = start.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    if (endAt) {
      const end = new Date(endAt);
      const endTime = end.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  } catch (error) {
    return 'TBD';
  }
}

// Main import function that handles both platforms
export async function importEvent(eventUrl: string) {
  try {
    // 1. Detect platform and validate URL
    const platform = detectPlatform(eventUrl);
    if (!platform) {
      return { 
        success: false, 
        error: 'Unsupported URL. Please provide a valid Luma (lu.ma) or Eventbrite URL.' 
      };
    }

    // 2. Extract event ID based on platform
    let eventId: string | null = null;
    if (platform === 'luma') {
      eventId = extractLumaEventId(eventUrl);
    } else if (platform === 'eventbrite') {
      eventId = extractEventbriteEventId(eventUrl);
    }

    if (!eventId) {
      return { 
        success: false, 
        error: `Invalid ${platform} URL format. Please check the URL and try again.` 
      };
    }

    // 3. Check if event already exists in our database
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id, title')
      .or(`url.eq.${eventUrl},luma_id.eq.${eventId},eventbrite_id.eq.${eventId}`)
      .single();

    if (existingEvent) {
      return {
        success: false,
        error: `Event "${existingEvent.title}" has already been imported.`
      };
    }

    // 4. Import from the appropriate platform
    let eventData;
    if (platform === 'luma') {
      eventData = await importFromLuma(eventId, eventUrl);
    } else if (platform === 'eventbrite') {
      eventData = await importFromEventbrite(eventId, eventUrl);
    }

    if (!eventData || eventData.success === false) {
      return eventData || { success: false, error: 'Failed to import event data' };
    }

    return { 
      success: true, 
      event: eventData,
      message: `Event details imported successfully from ${platform.charAt(0).toUpperCase() + platform.slice(1)}. Please review and save.`
    };

  } catch (error) {
    console.error('Import error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import event. Please try again.' 
    };
  }
}

// Legacy function for backward compatibility
export async function importLumaEvent(lumaUrl: string) {
  return importEvent(lumaUrl);
}

export async function saveImportedEvent(eventData: any) {
  try {
    // Remove platform-specific fields that might be too large
    const { luma_data, eventbrite_data, ...eventToSave } = eventData;
    
    const { data, error } = await supabase
      .from('events')
      .insert([eventToSave])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, event: data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save event' 
    };
  }
} 