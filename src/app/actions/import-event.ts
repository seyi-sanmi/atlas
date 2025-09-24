'use server'

import { supabase } from '@/lib/supabase'
import { scrapeEvent, detectEventPlatform, ScrapingError, ScrapedEventData } from '@/lib/luma-scraper'
import { categorizeEventWithRetry, generateEventSummaryWithRetry } from '@/lib/event-categorizer'
import { revalidatePath, revalidateTag } from 'next/cache'

// Helper function to add AI categorization and summarization to event data
async function addAIAnalysis(eventData: any) {
  try {
    console.log('🤖 Starting AI analysis for event:', eventData.title?.substring(0, 50) + '...');
    
    // Run AI categorization and summary generation in parallel for speed
    const [aiResult, summaryResult] = await Promise.all([
      categorizeEventWithRetry({
        title: eventData.title || '',
        description: eventData.description || ''
      }),
      generateEventSummaryWithRetry({
        eventName: eventData.title || '',
        eventDescription: eventData.description || '',
        targetAudience: [], // Will be inferred from description
        keyActivities: [], // Will be inferred from description
        keyTechnologies: [], // Will be inferred from description
        mainIncentive: '', // Will be inferred from description
        fullText: eventData.description || ''
      })
    ]);
    
    console.log('✅ AI categorization completed:', aiResult);
    console.log('✅ AI summary generation completed:', summaryResult);
    
    return {
      ...eventData,
      ai_event_type: aiResult.event_types[0] || 'Other', // Legacy field (first type)
      ai_event_types: Array.isArray(aiResult.event_types) && aiResult.event_types.length > 0 
        ? aiResult.event_types 
        : ['Other'], // New multi-select field (ensure always array)
      ai_interest_areas: aiResult.event_interest_areas,
      ai_categorized: true,
      ai_categorized_at: new Date().toISOString(),
      ai_summary: summaryResult.summary,
      ai_technical_keywords: summaryResult.technicalKeywords,
      ai_excitement_hook: summaryResult.excitementHook,
      ai_summarized: true,
      ai_summarized_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    
    // Return original data with default AI values on error
    return {
      ...eventData,
      ai_event_type: 'Other', // Legacy field
      ai_event_types: ['Other'], // New multi-select field
      ai_interest_areas: [],
      ai_categorized: false,
      ai_categorized_at: new Date().toISOString(),
      ai_summary: eventData.description || eventData.title || '',
      ai_technical_keywords: [],
      ai_excitement_hook: 'Join us for this exciting event',
      ai_summarized: false,
      ai_summarized_at: new Date().toISOString()
    };
  }
}

// Helper function to return basic event data without AI analysis
function createBasicEventData(scrapedData: any, eventId: string, originalUrl: string, platform: string) {
  return {
    title: scrapedData.title,
    description: scrapedData.description,
    date: scrapedData.date,
    time: scrapedData.time,
    location: scrapedData.location,
    city: scrapedData.city,
    categories: platform === 'luma-scraped' ? ['Scraped'] : ['Imported'],
    organizer: scrapedData.organizer,
    url: originalUrl,
    luma_id: platform.includes('luma') ? eventId : null,
    eventbrite_id: platform.includes('eventbrite') ? eventId : null,
    imported_at: new Date().toISOString(),
    platform: platform,
    // Default AI values that will be updated later
    ai_event_type: 'Other', // Legacy field
    ai_event_types: ['Other'], // New multi-select field (always array)
    ai_interest_areas: [],
    ai_categorized: false,
    ai_summary: scrapedData.description || scrapedData.title || '',
    ai_technical_keywords: [],
    ai_excitement_hook: 'Join us for this exciting event',
    ai_summarized: false
  };
}

// Platform detection and URL parsing (updated to support more platforms)
function detectPlatformLegacy(url: string): 'luma' | 'eventbrite' | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'lu.ma' || urlObj.hostname === 'luma.com') {
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
    if (urlObj.hostname !== 'lu.ma' && urlObj.hostname !== 'luma.com') {
      throw new Error('Invalid Luma URL - must be from lu.ma or luma.com');
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

// Import basic Luma event data without AI analysis (fast)
async function importFromLumaBasic(eventId: string, originalUrl: string) {
  console.log('🔍 Starting basic Luma import with:', { eventId, originalUrl });
  
  // First, try the API if available
  if (process.env.LUMA_API_KEY) {
    console.log('🔑 Luma API key found, attempting API import...');
    try {
      const response = await fetch(`https://api.lu.ma/public/v1/event/${eventId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-luma-api-key': process.env.LUMA_API_KEY,
        },
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const lumaEventData = await response.json();
        console.log('✅ Successfully imported basic data from Luma API');
        
        return createBasicEventData({
          title: lumaEventData.name || 'Untitled Event',
          description: lumaEventData.description || '',
          date: lumaEventData.start_at ? new Date(lumaEventData.start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: lumaEventData.start_at ? formatTime(lumaEventData.start_at, lumaEventData.end_at) : 'TBD',
          location: lumaEventData.location?.name || lumaEventData.location || 'TBD',
          city: await getLumaCity(lumaEventData),
          organizer: lumaEventData.organizer?.name || 'Organising Team'
        }, eventId, originalUrl, 'luma');
      } else {
        console.log(`⚠️ Luma API failed with status ${response.status}, falling back to scraper`);
      }
    } catch (apiError) {
      console.log('❌ Luma API error, falling back to scraper:', apiError);
    }
  } else {
    console.log('🔓 No Luma API key found, using scraper');
  }

  // Fallback to universal scraper
  try {
    console.log('🕷️ Attempting to scrape event:', originalUrl);
    const scrapedResult = await scrapeEvent(originalUrl);
    
    if ('error' in scrapedResult) {
      console.error('❌ Scraping failed:', scrapedResult.userMessage);
      return {
        success: false,
        error: scrapedResult.userMessage
      };
    }
    
    const scrapedData = scrapedResult as ScrapedEventData;
    console.log('✅ Successfully scraped basic event data');
    
    return createBasicEventData({
      title: scrapedData.title,
      description: scrapedData.description,
      date: scrapedData.date,
      time: scrapedData.time,
      location: scrapedData.location,
      city: scrapedData.city,
      organizer: scrapedData.organizer
    }, eventId, originalUrl, scrapedData.platform);
  } catch (scrapeError) {
    console.error('❌ Scraper error details:', scrapeError);
  }

  // If both API and scraper fail
  console.error('💥 Both API and scraper methods failed for event:', eventId);
  return {
    success: false,
    error: 'Unable to import event. Both API and scraper methods failed.'
  };
}

// Import basic Eventbrite event data without AI analysis (fast)
async function importFromEventbriteBasic(eventId: string, originalUrl: string) {
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

  return createBasicEventData({
    title: eventbriteEventData.name?.text || 'Untitled Event',
    description: eventbriteEventData.description?.html || eventbriteEventData.description?.text || '',
    date: eventbriteEventData.start?.utc ? new Date(eventbriteEventData.start.utc).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: eventbriteEventData.start?.utc ? formatEventbriteTime(eventbriteEventData.start.utc, eventbriteEventData.end?.utc) : 'TBD',
    location: getEventbriteLocation(eventbriteEventData),
    city: getEventbriteCity(eventbriteEventData),
    organizer: getEventbriteOrganizer(eventbriteEventData)
  }, eventId, originalUrl, 'eventbrite');
}

// Import from Luma API with scraper fallback
async function importFromLuma(eventId: string, originalUrl: string) {
  console.log('🔍 Starting importFromLuma with:', { eventId, originalUrl });
  
  // First, try the API if available
  if (process.env.LUMA_API_KEY) {
    console.log('🔑 Luma API key found, attempting API import...');
    try {
      const response = await fetch(`https://api.lu.ma/public/v1/event/${eventId}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'x-luma-api-key': process.env.LUMA_API_KEY,
        },
      });

      console.log('📡 API response status:', response.status);

      if (response.ok) {
        const lumaEventData = await response.json();
        console.log('✅ Successfully imported from Luma API');
        
        const title = lumaEventData.name || 'Untitled Event';
        const description = lumaEventData.description || '';
        const baseEventData = {
          title,
          description,
          date: lumaEventData.start_at ? new Date(lumaEventData.start_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: lumaEventData.start_at ? formatTime(lumaEventData.start_at, lumaEventData.end_at) : 'TBD',
          location: lumaEventData.location?.name || lumaEventData.location || 'TBD',
          city: await getLumaCity(lumaEventData),
          categories: ['Imported'],
          organizer: lumaEventData.organizer?.name || 'Organising Team',
          url: originalUrl,
          luma_id: eventId,
          imported_at: new Date().toISOString(),
          platform: 'luma'
        };
        // If scraper-like fields are desirable, attempt AI UK inference here as well to populate flags
        try {
          const { city, confidence } = await inferCityFromTitleAndDescriptionUKForImport(title, description);
          if (city && city !== 'TBD' && confidence >= 0.9) {
            (baseEventData as any).city = city;
            (baseEventData as any).city_confidence = confidence;
            (baseEventData as any).needs_city_confirmation = false;
          } else {
            (baseEventData as any).city_confidence = confidence || 0;
            (baseEventData as any).needs_city_confirmation = true;
          }
        } catch {}
        
        return await addAIAnalysis(baseEventData);
      } else {
        console.log(`⚠️ Luma API failed with status ${response.status}, falling back to scraper`);
      }
    } catch (apiError) {
      console.log('❌ Luma API error, falling back to scraper:', apiError);
    }
  } else {
    console.log('🔓 No Luma API key found, using scraper');
  }

  // Fallback to universal scraper
  try {
    console.log('🕷️ Attempting to scrape event:', originalUrl);
    const scrapedResult = await scrapeEvent(originalUrl);
    
    if ('error' in scrapedResult) {
      console.error('❌ Scraping failed:', scrapedResult.userMessage);
      return {
        success: false,
        error: scrapedResult.userMessage
      };
    }
    
    const scrapedData = scrapedResult as ScrapedEventData;
    console.log('✅ Successfully scraped event');
    console.log('📊 Scraped data preview:', {
      title: scrapedData.title?.substring(0, 50) + '...',
      time: scrapedData.time,
      city: scrapedData.city,
      platform: scrapedData.platform
    });
    
    const baseEventData = {
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
      platform: scrapedData.platform
    };
    
    return await addAIAnalysis(baseEventData);
  } catch (scrapeError) {
    console.error('❌ Scraper error details:', {
      message: scrapeError instanceof Error ? scrapeError.message : String(scrapeError),
      stack: scrapeError instanceof Error ? scrapeError.stack : undefined,
      name: scrapeError instanceof Error ? scrapeError.name : 'Unknown'
    });
  }

  // If both API and scraper fail
  console.error('💥 Both API and scraper methods failed for event:', eventId);
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

  const baseEventData = {
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
  
  return await addAIAnalysis(baseEventData);
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

// Helper function to get Luma calendar events
async function getLumaCalendarEvents() {
  const apiKey = process.env.LUMA_API_KEY || 'secret-AiIhGpdHuIDmNYRFrzgRZTtAU';
  
  try {
    const response = await fetch('https://api.lu.ma/public/v1/calendar/list-events', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-luma-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get calendar events with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📅 Available calendar events:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to get Luma calendar events:', error);
    throw error;
  }
}

// Helper function to add event to Luma calendar
async function addEventToLumaCalendar(eventUrl: string) {
  const apiKey = process.env.LUMA_API_KEY || 'secret-AiIhGpdHuIDmNYRFrzgRZTtAU';

  try {
    // First, lookup the event to get its details
    const lookupResponse = await fetch('https://api.lu.ma/public/v1/calendar/lookup-event', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-luma-api-key': apiKey,
      },
      body: JSON.stringify({
        event_url: eventUrl
      })
    });

    if (!lookupResponse.ok) {
      throw new Error(`Lookup failed with status: ${lookupResponse.status}`);
    }

    const lookupData = await lookupResponse.json();
    console.log('📋 Event lookup successful:', lookupData);

    // Now add the event to our calendar
    const addResponse = await fetch('https://api.lu.ma/public/v1/calendar/add-event', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-luma-api-key': apiKey,
      },
      body: JSON.stringify({
        event_id: lookupData.event_id,
        calendar_id: 'cal-O78lmGrO3fwEZll/' // Your calendar ID
      })
    });

    if (!addResponse.ok) {
      const errorText = await addResponse.text();
      throw new Error(`Add to calendar failed with status: ${addResponse.status}, error: ${errorText}`);
    }

    const addData = await addResponse.json();
    console.log('✅ Event added to calendar successfully:', addData);
    
    return addData;
  } catch (error) {
    console.error('❌ Failed to add event to Luma calendar:', error);
    throw error;
  }
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

// Helper function to extract city from Luma event data with comprehensive analysis
async function getLumaCity(eventData: any): Promise<string> {
  if (eventData.online_event) {
    return 'Online';
  }
  
  console.log('🔍 Analyzing Luma API location data:', JSON.stringify(eventData.location, null, 2));
  
  if (eventData.location) {
    // Handle string location
    if (typeof eventData.location === 'string') {
      console.log('📍 Found string location:', eventData.location);
      
      if (!isPlaceholderLocation(eventData.location)) {
        return await extractCityFromString(eventData.location);
      } else {
        console.log('⚠️ Location is placeholder text, skipping string extraction');
      }
    } 
    // Handle object location with detailed address structure
    else if (typeof eventData.location === 'object') {
      // Check address object for city information first (most reliable)
      if (eventData.location.address && typeof eventData.location.address === 'object') {
        const address = eventData.location.address;
        console.log('📍 Found address object:', JSON.stringify(address, null, 2));
        
        // Try multiple address fields in order of preference
        if (address.addressLocality && !isPlaceholderLocation(address.addressLocality)) {
          console.log('✅ Found city in addressLocality:', address.addressLocality);
          return address.addressLocality;
        } else if (address.city && !isPlaceholderLocation(address.city)) {
          console.log('✅ Found city in city field:', address.city);
          return address.city;
        } else if (address.addressRegion && !isPlaceholderLocation(address.addressRegion)) {
          console.log('✅ Found city in addressRegion:', address.addressRegion);
          return address.addressRegion;
        }
      }
      
      // Try location name if address didn't work
      if (eventData.location.name && !isPlaceholderLocation(eventData.location.name)) {
        console.log('📍 Found location name:', eventData.location.name);
        const city = await extractCityFromString(eventData.location.name);
        if (city !== 'TBD') {
          return city;
        }
      }
    }
  }
  
  // If still no city found, try extracting from event title (high priority for cases like "Nucleate Manchester Info Session")
  if (eventData.name) {
    console.log('🎯 No valid city found in location data, trying to extract from event title...');
    const titleCity = await extractCityFromTitle(eventData.name);
    if (titleCity !== 'TBD') {
      console.log('✅ Found city in event title:', titleCity);
      return titleCity;
    }
  }
  
  // If still no city found, check description (but only if it doesn't contain TBD)
  if (eventData.description) {
    console.log('🔍 No valid city found in title or location data, checking description...');
    
    if (!eventData.description.toLowerCase().includes('tbd') && 
        !eventData.description.toLowerCase().includes('to be determined') &&
        !eventData.description.toLowerCase().includes('to be announced')) {
      console.log('📝 Description doesn\'t contain TBD, extracting city from description...');
      return await extractCityFromDescription(eventData.description);
    } else {
      console.log('⚠️ Description contains TBD, keeping city as TBD');
    }
  }
  
  return 'TBD';
}

// AI-first UK city inference used in import path
async function inferCityFromTitleAndDescriptionUKForImport(title: string, description: string): Promise<{ city: string; confidence: number }> {
  if (!process.env.OPENAI_API_KEY) return { city: 'TBD', confidence: 0 };
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = `You are extracting a UK city for an event. Analyze title and description together.
Return STRICT JSON with keys city (string) and confidence (number 0..1). City must be a UK city name only (no country/region), or "TBD" if unknown. If event is clearly online/virtual, set city to "Online" and confidence 1.

Title: ${title}
Description: ${description?.slice(0, 1200) || ''}

Rules:
- Prefer an explicit city mention.
- If not explicit, infer only when ≥0.90 sure based on strong cues.
- UK focus: only UK cities are valid (except "Online").
- Output example: {"city":"Manchester","confidence":0.95}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 60,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || '';
    try {
      const parsed = JSON.parse(raw);
      let city: string = (parsed.city || '').toString().trim();
      let confidence: number = Number(parsed.confidence);
      if (!Number.isFinite(confidence)) confidence = 0;
      // Basic whitelist (should mirror UI validation)
      const UK_CITIES = ['London','Manchester','Birmingham','Leeds','Liverpool','Sheffield','Bristol','Glasgow','Edinburgh','Cardiff','Newcastle','Belfast','Nottingham','Southampton','Oxford','Cambridge','Brighton','Bath','York','Leicester','Coventry','Bradford','Wolverhampton','Plymouth','Derby','Reading','Newport','Preston','Sunderland','Norwich','Bournemouth','Southend','Swindon','Huddersfield','Middlesbrough','Blackpool','Bolton','Ipswich','Peterborough','Stockport','Gloucester','Exeter','Canterbury','Lancaster','Durham','Chelmsford','Chester','St Albans','Winchester','Worcester','Lincoln'];
      const valid = city.toLowerCase() === 'online' || UK_CITIES.some(c => c.toLowerCase() === city.toLowerCase());
      if (!valid) return { city: 'TBD', confidence: 0 };
      if (city.toLowerCase() === 'online') return { city: 'Online', confidence: Math.max(confidence, 0.95) };
      return { city, confidence };
    } catch {
      return { city: 'TBD', confidence: 0 };
    }
  } catch (e) {
    return { city: 'TBD', confidence: 0 };
  }
}

// Helper function to check if a location string is placeholder text
function isPlaceholderLocation(locationStr: string): boolean {
  if (!locationStr) return true;
  
  const normalized = locationStr.toLowerCase().trim();
  
  // Check for common placeholder patterns
  return normalized.includes('register to see') || 
         normalized.includes('register for details') ||
         normalized.includes('tbd') ||
         normalized.includes('to be determined') ||
         normalized.includes('to be announced') ||
         normalized.includes('coming soon') ||
         normalized.includes('details to follow') ||
         normalized.includes('venue tba') ||
         normalized.includes('location tba');
}

// Helper function to extract city from a location string with hybrid approach
async function extractCityFromString(locationStr: string): Promise<string> {
  if (!locationStr) return 'TBD';
  
  // First, try rule-based extraction
  const ruleBasedResult = extractCityRuleBased(locationStr);
  
  // If rule-based found a good result, use it
  if (ruleBasedResult !== 'TBD' && ruleBasedResult.length > 0) {
    console.log(`📍 Rule-based city extraction: "${locationStr}" → "${ruleBasedResult}"`);
    return ruleBasedResult;
  }
  
  // Fallback to AI extraction for complex cases
  console.log(`🤖 Rule-based failed, trying AI extraction for: "${locationStr}"`);
  try {
    const aiResult = await extractCityWithAI(locationStr);
    if (aiResult && aiResult !== 'TBD') {
      console.log(`✅ AI city extraction: "${locationStr}" → "${aiResult}"`);
      return aiResult;
    }
  } catch (error) {
    console.warn('AI city extraction failed, using rule-based result:', error);
  }
  
  console.log(`❌ Both methods failed for: "${locationStr}"`);
  return ruleBasedResult;
}

// Rule-based city extraction (fast and cheap)
function extractCityRuleBased(locationStr: string): string {
  if (!locationStr) return 'TBD';
  
  // Use the same placeholder detection as the main function
  if (isPlaceholderLocation(locationStr)) {
    return 'TBD';
  }
  
  // Common UK city patterns
  const ukCities = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Sheffield', 
    'Bristol', 'Glasgow', 'Edinburgh', 'Cardiff', 'Newcastle', 'Belfast',
    'Nottingham', 'Southampton', 'Oxford', 'Cambridge', 'Brighton', 'Bath',
    'York', 'Leicester', 'Coventry', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton',
    'Plymouth', 'Derby', 'Reading', 'Dudley', 'Newport', 'Preston', 'Sunderland',
    'Norwich', 'Walsall', 'Bournemouth', 'Southend', 'Swindon', 'Huddersfield',
    'Poole', 'Oxford', 'Middlesbrough', 'Blackpool', 'Oldham', 'Bolton',
    'Ipswich', 'York', 'West Bromwich', 'Peterborough', 'Stockport', 'Gloucester'
  ];
  
  // Normalize the string
  const normalized = locationStr.toLowerCase().trim();
  
  // First, try to find exact city matches
  for (const city of ukCities) {
    if (normalized.includes(city.toLowerCase())) {
      return city;
    }
  }
  
  // If no exact match, try to extract from comma-separated format
  const parts = locationStr.split(',').map(part => part.trim());
  
  // Look for parts that might be cities (not too long, not too short)
  for (const part of parts) {
    const cleanPart = part.replace(/[^\w\s]/g, '').trim();
    if (cleanPart.length >= 3 && cleanPart.length <= 20) {
      // Check if it looks like a city name (not a venue name, not a postal code)
      if (!/^\d+$/.test(cleanPart) && !cleanPart.includes('Street') && !cleanPart.includes('Road')) {
        return cleanPart;
      }
    }
  }
  
  // If still no match, return the last meaningful part
  const meaningfulParts = parts.filter(part => {
    const clean = part.replace(/[^\w\s]/g, '').trim();
    return clean.length >= 3 && clean.length <= 20 && !/^\d+$/.test(clean);
  });
  
  if (meaningfulParts.length > 0) {
    return meaningfulParts[meaningfulParts.length - 1];
  }
  
  return 'TBD';
}

// AI-powered city extraction (for complex cases)
async function extractCityWithAI(locationStr: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'TBD';
  }

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract the city name from this location string. Return ONLY the city name, nothing else.

Location: "${locationStr}"

Examples:
- "Science Creates, Bristol" → "Bristol"
- "The Royal Society, London" → "London"
- "Online Event" → "Online"
- "123 Main Street, Manchester, UK" → "Manchester"
- "Virtual Conference" → "Online"

City:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 20,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    return result || 'TBD';
  } catch (error) {
    console.error('AI city extraction failed:', error);
    return 'TBD';
  }
}

// Extract city from event title using hybrid approach (rule-based + AI fallback)
async function extractCityFromTitle(title: string): Promise<string> {
  if (!title) return 'TBD';
  
  // First, try rule-based extraction (works without API key)
  const ruleBasedResult = extractCityFromTitleRuleBased(title);
  if (ruleBasedResult !== 'TBD') {
    console.log(`📍 Rule-based title city extraction: "${title}" → "${ruleBasedResult}"`);
    return ruleBasedResult;
  }

  // If rule-based fails and API key is available, try AI
  if (!process.env.OPENAI_API_KEY) {
    console.log('🔓 No OpenAI API key, using rule-based result only');
    return ruleBasedResult;
  }

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract the city name from this event title if one is mentioned. Return ONLY the city name, nothing else.

Event Title: "${title}"

Examples:
- "Nucleate Manchester Info Session" → "Manchester"
- "London Tech Meetup: AI Innovation" → "London"
- "Bristol BioTech Conference 2024" → "Bristol"
- "Cambridge Networking Event" → "Cambridge"
- "Future of Healthcare (Online)" → "Online"
- "Startup Pitch Night" → "TBD"
- "Innovation Workshop" → "TBD"

Rules:
- Only extract if the city name is clearly mentioned in the title
- Focus on UK cities but also recognize international cities
- If the title mentions "Online", "Virtual", or "Remote", return "Online"
- If no clear city is mentioned, return "TBD"

City:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 20,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    console.log(`🤖 AI extracted city from title: "${title}" → "${result}"`);
    return result || 'TBD';
  } catch (error) {
    console.error('AI title city extraction failed:', error);
    return ruleBasedResult;
  }
}

// Rule-based city extraction from event title (works without API)
function extractCityFromTitleRuleBased(title: string): string {
  if (!title) return 'TBD';
  
  const normalized = title.toLowerCase();
  
  // Check for online/virtual events first
  if (normalized.includes('online') || normalized.includes('virtual') || normalized.includes('remote')) {
    return 'Online';
  }
  
  // Common UK cities to look for in titles
  const ukCities = [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Sheffield', 
    'Bristol', 'Glasgow', 'Edinburgh', 'Cardiff', 'Newcastle', 'Belfast',
    'Nottingham', 'Southampton', 'Oxford', 'Cambridge', 'Brighton', 'Bath',
    'York', 'Leicester', 'Coventry', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton',
    'Plymouth', 'Derby', 'Reading', 'Dudley', 'Newport', 'Preston', 'Sunderland',
    'Norwich', 'Walsall', 'Bournemouth', 'Southend', 'Swindon', 'Huddersfield',
    'Poole', 'Middlesbrough', 'Blackpool', 'Oldham', 'Bolton',
    'Ipswich', 'West Bromwich', 'Peterborough', 'Stockport', 'Gloucester'
  ];
  
  // Look for exact city matches in the title
  for (const city of ukCities) {
    const cityLower = city.toLowerCase();
    
    // Check for whole word matches to avoid false positives
    const regex = new RegExp(`\\b${cityLower}\\b`, 'i');
    if (regex.test(normalized)) {
      return city;
    }
  }
  
  // Common international cities
  const intlCities = [
    'New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle',
    'Toronto', 'Vancouver', 'Montreal', 'Paris', 'Berlin', 'Amsterdam', 'Dublin',
    'Copenhagen', 'Stockholm', 'Oslo', 'Helsinki', 'Zurich', 'Geneva', 'Milan',
    'Rome', 'Madrid', 'Barcelona', 'Lisbon', 'Vienna', 'Prague', 'Budapest',
    'Warsaw', 'Brussels', 'Luxembourg', 'Singapore', 'Hong Kong', 'Tokyo',
    'Sydney', 'Melbourne', 'Auckland'
  ];
  
  for (const city of intlCities) {
    const cityLower = city.toLowerCase();
    const regex = new RegExp(`\\b${cityLower.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(normalized)) {
      return city;
    }
  }
  
  return 'TBD';
}

// Extract city from event description using AI
async function extractCityFromDescription(description: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'TBD';
  }

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract the city name from this event description. Look for location information in the text. Return ONLY the city name, nothing else.

Event Description: "${description.substring(0, 1000)}"

Examples of what to look for:
- "Location: London (venue details when you register)" → "London"
- "Bristol, England" → "Bristol"
- "The event will be held in Manchester" → "Manchester"
- "Online Event" → "Online"
- "Virtual Conference" → "Online"

If no city is mentioned, return "TBD".

City:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 20,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    console.log(`🤖 AI extracted city from description: "${result}"`);
    return result || 'TBD';
  } catch (error) {
    console.error('AI description city extraction failed:', error);
    return 'TBD';
  }
}

// Extract location information from event description using AI
async function extractLocationFromDescription(description: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return 'TBD';
  }

  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Extract the location information from this event description. Look for venue or location details. Return a concise location description, nothing else.

Event Description: "${description.substring(0, 1000)}"

Examples of what to look for:
- "Location: London (venue details when you register)" → "London"
- "Bristol, England" → "Bristol"
- "The event will be held at Manchester University" → "Manchester University"
- "Online Event" → "Online"
- "Virtual Conference" → "Online"
- "Science Creates, Bristol" → "Science Creates, Bristol"

If no location is mentioned, return "TBD".

Location:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 50,
    });

    const result = completion.choices[0]?.message?.content?.trim();
    console.log(`🤖 AI extracted location from description: "${result}"`);
    return result || 'TBD';
  } catch (error) {
    console.error('AI description location extraction failed:', error);
    return 'TBD';
  }
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

// Progressive import function - returns basic data first, then AI-enhanced data
export async function importEventProgressive(eventUrl: string, forceUpdate: boolean = false) {
  try {
    // 1. First try the universal scraper for supported platforms
    const universalPlatform = detectEventPlatform(eventUrl);
    if (universalPlatform !== 'unknown') {
      console.log(`🚀 Using universal scraper for ${universalPlatform} platform...`);
      
      // Check if event already exists (only if not forcing update)
      if (!forceUpdate) {
        const { data: existingEvent } = await supabase
          .from('events')
          .select('id, title')
          .eq('url', eventUrl)
          .single();

        if (existingEvent) {
          return {
            success: false,
            error: `Event "${existingEvent.title}" has already been imported.`
          };
        }
      }

      // Use the universal scraper for quick import
      const scrapedResult = await scrapeEvent(eventUrl);
      
      if ('error' in scrapedResult) {
        const error = scrapedResult as ScrapingError;
        return {
          success: false,
          error: error.userMessage
        };
      }
      
      const scrapedData = scrapedResult as ScrapedEventData;
      
      // Create basic event data (without AI analysis for speed)
      const basicEventData = {
        title: scrapedData.title,
        description: scrapedData.description,
        date: scrapedData.date,
        time: scrapedData.time,
        location: scrapedData.location,
        city: scrapedData.city,
        categories: scrapedData.categories,
        organizer: scrapedData.organizer,
        url: eventUrl,
        imported_at: new Date().toISOString(),
        platform: scrapedData.platform,
        // Platform identification - use existing fields (url and platform)
        luma_id: universalPlatform === 'luma' ? extractLumaEventId(eventUrl) : null,
        // Default AI values that will be updated later
        ai_event_type: 'Other', // Legacy field
        ai_event_types: ['Other'], // New multi-select field (always array)
        ai_interest_areas: [],
        ai_categorized: false,
        ai_summary: scrapedData.description || scrapedData.title || '',
        ai_technical_keywords: [],
        ai_excitement_hook: 'Join us for this exciting event',
        ai_summarized: false
      };

      return { 
        success: true, 
        event: basicEventData,
        message: `Event details imported successfully from ${universalPlatform.charAt(0).toUpperCase() + universalPlatform.slice(1)}. AI analysis in progress...`,
        aiProcessing: true
      };
    }

    // Fallback to legacy platform detection for Eventbrite
    const platform = detectPlatformLegacy(eventUrl);
    if (!platform) {
      return { 
        success: false, 
        error: 'Unsupported URL. Please provide a valid Luma, Humanitix, Partiful, or Eventbrite URL.' 
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

    // 3. Check if event already exists (only if not forcing update)
    if (!forceUpdate) {
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
    }

    // 4. Get basic event data first (fast)
    let basicEventData;
    if (platform === 'luma') {
      const result = await importFromLumaBasic(eventId, eventUrl);
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        return result;
      }
      basicEventData = result;
    } else if (platform === 'eventbrite') {
      const result = await importFromEventbriteBasic(eventId, eventUrl);
      if (result && typeof result === 'object' && 'success' in result && result.success === false) {
        return result;
      }
      basicEventData = result;
    }

    if (!basicEventData) {
      return { success: false, error: 'Failed to import basic event data' };
    }

    // 5. Return basic data immediately for UI display
    return { 
      success: true, 
      event: basicEventData,
      message: `Event details imported successfully from ${platform.charAt(0).toUpperCase() + platform.slice(1)}. AI analysis in progress...`,
      aiProcessing: true
    };

  } catch (error) {
    console.error('Progressive import error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import event. Please try again.' 
    };
  }
}

// Function to get AI categorization (fast)
export async function enhanceEventWithCategories(basicEventData: any) {
  try {
    console.log('🎯 Starting AI categorization for event:', basicEventData.title?.substring(0, 50) + '...');
    
    const aiResult = await categorizeEventWithRetry({
      title: basicEventData.title || '',
      description: basicEventData.description || ''
    });
    
    console.log('✅ AI categorization completed:', aiResult);
    
    const categorizedData = {
      ...basicEventData,
      ai_event_type: aiResult.event_types[0] || 'Other', // Legacy field (first type)
      ai_event_types: Array.isArray(aiResult.event_types) && aiResult.event_types.length > 0 
        ? aiResult.event_types 
        : ['Other'], // New multi-select field (ensure always array)
      ai_interest_areas: aiResult.event_interest_areas,
      ai_categorized: true,
      ai_categorized_at: new Date().toISOString()
    };
    
    return {
      success: true,
      event: categorizedData,
      message: 'Event categorized! Summary generation in progress...'
    };
  } catch (error) {
    console.error('AI categorization error:', error);
    return {
      success: false,
      error: 'AI categorization failed',
      event: basicEventData
    };
  }
}

// Function to add AI summary to already categorized data (slower)
export async function enhanceEventWithSummary(categorizedEventData: any) {
  try {
    console.log('📝 Starting AI summary generation for event:', categorizedEventData.title?.substring(0, 50) + '...');
    
    const summaryResult = await generateEventSummaryWithRetry({
      eventName: categorizedEventData.title || '',
      eventDescription: categorizedEventData.description || '',
      targetAudience: [],
      keyActivities: [],
      keyTechnologies: [],
      mainIncentive: '',
      fullText: categorizedEventData.description || ''
    });
    
    console.log('✅ AI summary generation completed:', summaryResult);
    
    const fullyEnhancedData = {
      ...categorizedEventData,
      ai_summary: summaryResult.summary,
      ai_technical_keywords: summaryResult.technicalKeywords,
      ai_excitement_hook: summaryResult.excitementHook,
      ai_summarized: true,
      ai_summarized_at: new Date().toISOString()
    };
    
    return {
      success: true,
      event: fullyEnhancedData,
      message: 'AI analysis completed!'
    };
  } catch (error) {
    console.error('AI summary generation error:', error);
    return {
      success: false,
      error: 'AI summary generation failed, but categorization is available',
      event: categorizedEventData
    };
  }
}

// Function to get AI-enhanced event data (legacy - now runs staged)
export async function enhanceEventWithAI(basicEventData: any) {
  try {
    console.log('🚀 Starting full AI enhancement for event:', basicEventData.title?.substring(0, 50) + '...');
    const enhancedData = await addAIAnalysis(basicEventData);
    
    return {
      success: true,
      event: enhancedData,
      message: 'AI analysis completed!'
    };
  } catch (error) {
    console.error('AI enhancement error:', error);
    return {
      success: false,
      error: 'AI analysis failed, but basic event data is available',
      event: basicEventData // Return basic data as fallback
    };
  }
}

// Universal import function for Luma, Humanitix, and Partiful
export async function importEventUniversal(eventUrl: string, forceUpdate: boolean = false) {
  try {
    // 1. Detect platform using the universal detector
    const platform = detectEventPlatform(eventUrl);
    
    if (platform === 'unknown') {
      return { 
        success: false, 
        error: 'Unsupported URL. Please provide a valid Luma, Humanitix, or Partiful event URL.' 
      };
    }

    // 2. Check if event already exists (only if not forcing update)
    if (!forceUpdate) {
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id, title')
        .eq('url', eventUrl)
        .single();

      if (existingEvent) {
        return {
          success: false,
          error: `Event "${existingEvent.title}" has already been imported.`
        };
      }
    }

    // 3. Use the universal scraper
    console.log(`🚀 Starting universal import for ${platform} platform...`);
    const scrapedResult = await scrapeEvent(eventUrl);
    
    if ('error' in scrapedResult) {
      const error = scrapedResult as ScrapingError;
      console.error('❌ Universal scraping failed:', error.userMessage);
      
      // TODO: Send notification to team if shouldNotifyTeam is true
      if (error.shouldNotifyTeam) {
        console.log('📧 Team notification needed for:', error);
      }
      
      return {
        success: false,
        error: error.userMessage
      };
    }
    
    const scrapedData = scrapedResult as ScrapedEventData;
    console.log('✅ Successfully scraped event from', platform);
    console.log('📊 Scraped data preview:', {
      title: scrapedData.title?.substring(0, 50) + '...',
      time: scrapedData.time,
      city: scrapedData.city,
      platform: scrapedData.platform
    });
    
    // 4. Create the base event data
    const baseEventData = {
      title: scrapedData.title,
      description: scrapedData.description,
      date: scrapedData.date,
      time: scrapedData.time,
      location: scrapedData.location,
      city: scrapedData.city,
      categories: scrapedData.categories,
      organizer: scrapedData.organizer,
      url: eventUrl,
      imported_at: new Date().toISOString(),
      platform: scrapedData.platform,
      // Platform identification - use existing fields
      luma_id: platform === 'luma' ? extractLumaEventId(eventUrl) : null,
      eventbrite_id: null, // Not supported in universal scraper yet
      // Default AI values
      ai_event_type: 'Other',
      ai_event_types: ['Other'],
      ai_interest_areas: [],
      ai_categorized: false,
      ai_summary: scrapedData.description || scrapedData.title || '',
      ai_technical_keywords: [],
      ai_excitement_hook: 'Join us for this exciting event',
      ai_summarized: false
    };
    
    // 5. Add AI analysis
    const enhancedEventData = await addAIAnalysis(baseEventData);
    
    return { 
      success: true, 
      event: enhancedEventData,
      message: `Event details imported successfully from ${platform.charAt(0).toUpperCase() + platform.slice(1)}. Please review and save.`
    };

  } catch (error) {
    console.error('Universal import error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to import event. Please try again.' 
    };
  }
}

// Note: No need for platform-specific ID extraction functions
// We use the existing 'platform' field to identify the source platform
// and the 'url' field contains the original event URL
// This approach is much simpler and scales better

// Main import function that handles both platforms (legacy - now uses universal)
export async function importEvent(eventUrl: string, forceUpdate: boolean = false) {
  // First try the universal scraper for supported platforms
  const universalPlatform = detectEventPlatform(eventUrl);
  if (universalPlatform !== 'unknown') {
    return await importEventUniversal(eventUrl, forceUpdate);
  }

  // Fallback to legacy platform detection for Eventbrite
  try {
    // 1. Detect platform and validate URL
    const platform = detectPlatformLegacy(eventUrl);
    if (!platform) {
      return { 
        success: false, 
        error: 'Unsupported URL. Please provide a valid Luma, Humanitix, Partiful, or Eventbrite URL.' 
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

    // 3. Check if event already exists in our database (only if not forcing update)
    if (!forceUpdate) {
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
    console.log('🔍 Attempting to save event data:', {
      title: eventData.title,
      platform: eventData.platform,
      ai_event_types: eventData.ai_event_types,
      fields: Object.keys(eventData)
    });

    // Remove platform-specific fields that might be too large
    const { 
      luma_data, 
      eventbrite_data, 
      ...eventToSave 
    } = eventData;
    
    // Ensure ai_event_types is always a valid array (never null)
    if (!eventToSave.ai_event_types || !Array.isArray(eventToSave.ai_event_types)) {
      console.log('⚠️  ai_event_types was null/invalid, creating from ai_event_type:', eventToSave.ai_event_type);
      eventToSave.ai_event_types = eventToSave.ai_event_type ? [eventToSave.ai_event_type] : ['Other'];
    }
    
    // Log the final ai_event_types value
    console.log('✅ Final ai_event_types value:', eventToSave.ai_event_types);
    
    // Log the cleaned data structure
    console.log('💾 Data being sent to Supabase (filtered):', Object.keys(eventToSave));
    
    const { data, error } = await supabase
      .from('events')
      .insert([eventToSave])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return { success: false, error: error.message };
    }

    console.log('✅ Event saved successfully:', data);

    // Server-side revalidation to refresh pages and any tag-based caches
    try {
      revalidatePath('/');
      // If other routes read events server-side, add them here as needed
      // revalidatePath('/events');
      // Revalidate tag if using fetch cache tagging elsewhere
      // revalidateTag('events');
    } catch (e) {
      console.warn('Revalidation failed (non-fatal):', e);
    }
    return { success: true, event: data };
  } catch (error) {
    console.error('❌ Unexpected save error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save event' 
    };
  }
} 