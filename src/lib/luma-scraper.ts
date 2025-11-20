import puppeteer from 'puppeteer';



export interface LumaEventData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  location?: {
    name: string;
    address?: string;
  };
  organizer?: {
    name: string;
  }[];
  url: string;
  image?: string;
  offers?: {
    name: string;
    price?: string;
  }[];
}

export interface ScrapedEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  organizer: string;
  url: string;
  image_url?: string;
  categories: string[];
  platform: string;
}

/**
 * Simple HTTP fetch approach to get Luma event data
 * This works in serverless environments without browser dependencies
 */
async function fetchLumaEventData(eventUrl: string): Promise<ScrapedEventData | null> {
  try {
    console.log('🌐 Attempting HTTP fetch approach...');
    
    const response = await fetch(eventUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      console.log(`❌ HTTP fetch failed with status: ${response.status}`);
      return null;
    }

    const html = await response.text();
    console.log('✅ Successfully fetched HTML content');

    // Extract JSON-LD data from HTML
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g);
    
    if (!jsonLdMatch) {
      console.log('❌ No JSON-LD script tags found in HTML');
      return null;
    }

    // Try to find Event schema
    for (const scriptMatch of jsonLdMatch) {
      try {
        const jsonContent = scriptMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'Event') {
          console.log('✅ Found Event JSON-LD data via HTTP fetch');
          return await parseJsonLdData(data, eventUrl);
        }
      } catch (e) {
        continue;
      }
    }

    console.log('❌ No Event schema found in JSON-LD data');
    
    // Fallback: Try to extract basic info from HTML for private events
    try {
      const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || html.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';
      
      if (title && title.length > 0) {
        console.log('⚠️ Extracting basic info from HTML for private event');
        // Extract city from HTML
        const cityMatch = html.match(/(London|Manchester|Birmingham|Bristol|Cambridge|Oxford|Edinburgh|Glasgow|Liverpool|Leeds|Sheffield|Newcastle|Cardiff|Belfast|Brighton|Bath|York|Nottingham|Leicester|Coventry|Reading|Southampton|Portsmouth|Plymouth|Norwich|Bournemouth|Swindon|Milton Keynes|Peterborough|Ipswich|Blackpool|Northampton|Luton|Exeter|Slough|Colchester|Gloucester|Watford|Canterbury|Stoke|Worcester)/i);
        const city = cityMatch ? cityMatch[1] : 'TBD';
        
        return {
          title: title,
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: 'TBD',
          location: 'Register to see address',
          city: city,
          organizer: '',
          url: eventUrl,
          categories: ['Scraped'],
          platform: 'luma'
        };
      }
    } catch (htmlError) {
      console.log('⚠️ HTML extraction fallback also failed');
    }
    
    return null;

  } catch (error) {
    console.error('❌ HTTP fetch approach failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Fallback browser approach using Playwright (more reliable than Puppeteer in serverless)
 */
async function browserFallbackApproach(eventUrl: string): Promise<ScrapedEventData | null> {
  let browser;
  
  try {
    console.log('🎭 Attempting Playwright fallback...');
    
    // Try Playwright if available
    let playwright;
    try {
      playwright = await import('playwright-core');
      console.log('📦 Playwright available, launching browser...');
    } catch (e) {
      console.log('❌ Playwright not available, trying Puppeteer...');
      return await puppeteerFallback(eventUrl);
    }

    // Use Playwright chromium
    browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Set user agent
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    console.log(`🎭 Navigating to: ${eventUrl}`);
    await page.goto(eventUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // Extract JSON-LD data
    const jsonLdData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '');
          if (data['@type'] === 'Event') {
            return data;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    });

    if (jsonLdData) {
      console.log('✅ Found JSON-LD data via Playwright');
      return await parseJsonLdData(jsonLdData, eventUrl);
    }

    // Fallback: Try to extract data from DOM for private events
    console.log('⚠️ No JSON-LD found, attempting DOM extraction for private event...');
    const domData = await page.evaluate(() => {
      // Extract title
      const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]') || document.querySelector('title');
      const title = titleEl?.textContent?.trim() || '';

      // Extract description - look for common description containers
      const descSelectors = [
        '[class*="description"]',
        '[class*="about"]',
        'section p',
        'main p'
      ];
      let description = '';
      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.length > 50) {
          description = el.textContent.trim();
          break;
        }
      }

      // Extract location hint
      const locationEl = document.querySelector('[class*="location"]') || 
                        document.querySelector('[class*="address"]') ||
                        document.querySelector('address');
      const location = locationEl?.textContent?.trim() || '';

      // Extract city from location or page
      const cityMatch = document.body.textContent?.match(/(London|Manchester|Birmingham|Bristol|Cambridge|Oxford|Edinburgh|Glasgow|Liverpool|Leeds|Sheffield|Newcastle|Cardiff|Belfast|Brighton|Bath|York|Nottingham|Leicester|Coventry|Reading|Southampton|Portsmouth|Plymouth|Norwich|Bournemouth|Swindon|Milton Keynes|Peterborough|Ipswich|Blackpool|Northampton|Luton|Exeter|Slough|Colchester|Gloucester|Watford|Canterbury|Stoke|Worcester|York|Ipswich|Cambridge|Oxford|Bath|Brighton|Hastings|Eastbourne|Maidstone|Guildford|Woking|Reigate|Dorking|Sevenoaks|Tunbridge Wells|Tonbridge|Ashford|Dartford|Gravesend|Rochester|Chatham|Gillingham|Sittingbourne|Faversham|Whitstable|Herne Bay|Margate|Ramsgate|Broadstairs|Deal|Dover|Folkestone|Hythe|New Romney|Lydd|Rye|Hastings|Bexhill|Eastbourne|Seaford|Newhaven|Peacehaven|Saltdean|Rottingdean|Ovingdean|Brighton|Hove|Portslade|Shoreham|Lancing|Worthing|Littlehampton|Bognor Regis|Selsey|Chichester|Midhurst|Petersfield|Alton|Farnham|Godalming|Haslemere|Cranleigh|Dorking|Reigate|Redhill|Horley|Crawley|Horsham|Haywards Heath|Burgess Hill|Hassocks|Hurstpierpoint|Steyning|Shoreham|Lancing|Worthing|Littlehampton|Bognor Regis|Selsey|Chichester|Midhurst|Petersfield|Alton|Farnham|Godalming|Haslemere|Cranleigh|Dorking|Reigate|Redhill|Horley|Crawley|Horsham|Haywards Heath|Burgess Hill|Hassocks|Hurstpierpoint|Steyning)/i);
      const city = cityMatch ? cityMatch[1] : '';

      return { title, description, location, city };
    });

    if (domData && domData.title) {
      console.log('✅ Extracted data from DOM for private event');
      return {
        title: domData.title,
        description: domData.description || '',
        date: new Date().toISOString().split('T')[0], // Default to today if not found
        time: 'TBD',
        location: domData.location || 'Register to see address',
        city: domData.city || 'TBD',
        organizer: '',
        url: eventUrl,
        categories: ['Scraped'],
        platform: 'luma'
      };
    }

    throw new Error('No Event JSON-LD data found and DOM extraction failed');

  } catch (error) {
    console.error('❌ Playwright fallback failed:', error instanceof Error ? error.message : String(error));
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Puppeteer fallback (for local development)
 */
async function puppeteerFallback(eventUrl: string): Promise<ScrapedEventData | null> {
  let browser;
  
  try {
    console.log('🕷️ Using Puppeteer fallback...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`🕷️ Navigating to: ${eventUrl}`);
    await page.goto(eventUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract JSON-LD data
    const jsonLdData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent || '');
          if (data['@type'] === 'Event') {
            return data;
          }
        } catch (e) {
          continue;
        }
      }
      return null;
    });

    if (jsonLdData) {
      console.log('✅ Found JSON-LD data via Puppeteer');
      return await parseJsonLdData(jsonLdData, eventUrl);
    }

    // Fallback: Try to extract data from DOM for private events
    console.log('⚠️ No JSON-LD found, attempting DOM extraction for private event...');
    const domData = await page.evaluate(() => {
      // Extract title
      const titleEl = document.querySelector('h1') || document.querySelector('[class*="title"]') || document.querySelector('title');
      const title = titleEl?.textContent?.trim() || '';

      // Extract description - look for common description containers
      const descSelectors = [
        '[class*="description"]',
        '[class*="about"]',
        'section p',
        'main p'
      ];
      let description = '';
      for (const selector of descSelectors) {
        const el = document.querySelector(selector);
        if (el && el.textContent && el.textContent.length > 50) {
          description = el.textContent.trim();
          break;
        }
      }

      // Extract location hint
      const locationEl = document.querySelector('[class*="location"]') || 
                        document.querySelector('[class*="address"]') ||
                        document.querySelector('address');
      const location = locationEl?.textContent?.trim() || '';

      // Extract city from location or page
      const cityMatch = document.body.textContent?.match(/(London|Manchester|Birmingham|Bristol|Cambridge|Oxford|Edinburgh|Glasgow|Liverpool|Leeds|Sheffield|Newcastle|Cardiff|Belfast|Brighton|Bath|York|Nottingham|Leicester|Coventry|Reading|Southampton|Portsmouth|Plymouth|Norwich|Bournemouth|Swindon|Milton Keynes|Peterborough|Ipswich|Blackpool|Northampton|Luton|Exeter|Slough|Colchester|Gloucester|Watford|Canterbury|Stoke|Worcester)/i);
      const city = cityMatch ? cityMatch[1] : '';

      return { title, description, location, city };
    });

    if (domData && domData.title) {
      console.log('✅ Extracted data from DOM for private event');
      return {
        title: domData.title,
        description: domData.description || '',
        date: new Date().toISOString().split('T')[0], // Default to today if not found
        time: 'TBD',
        location: domData.location || 'Register to see address',
        city: domData.city || 'TBD',
        organizer: '',
        url: eventUrl,
        categories: ['Scraped'],
        platform: 'luma'
      };
    }

    throw new Error('No Event JSON-LD data found and DOM extraction failed');

  } catch (error) {
    console.error('❌ Puppeteer fallback failed:', error instanceof Error ? error.message : String(error));
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Main scraping function with multiple fallback strategies
 */
export async function scrapeLumaEvent(eventUrl: string): Promise<ScrapedEventData | null> {
  console.log('🚀 Starting Luma event scraping with hybrid approach...');
  
  // Strategy 1: Simple HTTP fetch (fastest, works in serverless)
  let result = await fetchLumaEventData(eventUrl);
  if (result) {
    return result;
  }

  // Strategy 2: Browser fallback (Playwright or Puppeteer)
  console.log('📄 HTTP fetch failed, trying browser fallback...');
  result = await browserFallbackApproach(eventUrl);
  if (result) {
    return result;
  }

  console.error('💥 All scraping strategies failed');
  throw new Error('Could not extract event data from the page');
}

/**
 * Check if a location string is placeholder text
 */
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

/**
 * Extract city from a location string with hybrid approach
 */
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

/**
 * Rule-based city extraction (fast and cheap)
 */
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

/**
 * AI-powered city extraction (for complex cases)
 */
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

/**
 * Extract city from event description using AI
 */
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

/**
 * Extract location information from event description using AI
 */
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

/**
 * Parse JSON-LD structured data into our event format
 */
async function parseJsonLdData(jsonLd: any, eventUrl: string): Promise<ScrapedEventData> {
  const startDate = new Date(jsonLd.startDate);
  const endDate = jsonLd.endDate ? new Date(jsonLd.endDate) : null;

  // Extract time range - preserve original timezone
  let timeString = 'TBD';
  if (jsonLd.startDate) {
    // Parse the time in the event's original timezone
    const startTime = startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'Europe/London' // Use UK timezone for UK events
    });
    
    if (endDate) {
      const endTime = endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: 'Europe/London' // Use UK timezone for UK events
      });
      timeString = `${startTime} - ${endTime}`;
    } else {
      timeString = startTime;
    }
  }

  // Extract location and city with comprehensive JSON-LD analysis
  let location = 'TBD';
  let city = 'TBD';
  
  console.log('🔍 Analyzing JSON-LD location data:', JSON.stringify(jsonLd.location, null, 2));
  
  // Comprehensive location data extraction from JSON-LD
  if (jsonLd.location) {
    // Handle string location
    if (typeof jsonLd.location === 'string') {
      location = jsonLd.location;
      console.log('📍 Found string location:', location);
      
      // Check if it's a valid location (not placeholder text)
      if (!isPlaceholderLocation(location)) {
        city = await extractCityFromString(location);
      } else {
        console.log('⚠️ Location is placeholder text, skipping string extraction');
      }
    } 
    // Handle object location with detailed address structure
    else if (typeof jsonLd.location === 'object') {
      // Set location name
      if (jsonLd.location.name) {
        location = jsonLd.location.name;
        console.log('📍 Found location name:', location);
        
        // Try to extract city from location name if it's not placeholder
        if (!isPlaceholderLocation(location)) {
          city = await extractCityFromString(location);
        }
      }
      
      // Check address object for city information
      if (jsonLd.location.address && typeof jsonLd.location.address === 'object') {
        const address = jsonLd.location.address;
        console.log('📍 Found address object:', JSON.stringify(address, null, 2));
        
        // Try multiple address fields in order of preference
        if (address.addressLocality && !isPlaceholderLocation(address.addressLocality)) {
          city = address.addressLocality;
          console.log('✅ Found city in addressLocality:', city);
        } else if (address.city && !isPlaceholderLocation(address.city)) {
          city = address.city;
          console.log('✅ Found city in city field:', city);
        } else if (address.addressRegion && !isPlaceholderLocation(address.addressRegion)) {
          city = address.addressRegion;
          console.log('✅ Found city in addressRegion:', city);
        } else if (address.addressCountry && !isPlaceholderLocation(address.addressCountry)) {
          // Sometimes country is used when city is not available
          console.log('⚠️ Only country found in address:', address.addressCountry);
        }
      }
      
      // If still no city found and location name is valid, try extracting from it
      if (city === 'TBD' && location !== 'TBD' && !isPlaceholderLocation(location)) {
        console.log('🔄 Trying to extract city from location name as fallback');
        city = await extractCityFromString(location);
      }
    }
  }
  
  // If still no city found, check if description contains "TBD" or similar
  if (city === 'TBD' && jsonLd.description) {
    console.log('🔍 No valid city found in JSON-LD, checking description...');
    
    // Check if description contains location information that's not TBD
    if (!jsonLd.description.toLowerCase().includes('tbd') && 
        !jsonLd.description.toLowerCase().includes('to be determined') &&
        !jsonLd.description.toLowerCase().includes('to be announced')) {
      console.log('📝 Description doesn\'t contain TBD, extracting city from description...');
      city = await extractCityFromDescription(jsonLd.description);
      
      // If we found a city in the description, also try to extract a better location
      if (city !== 'TBD') {
        console.log('📍 Found city in description, extracting location info...');
        const locationInfo = await extractLocationFromDescription(jsonLd.description);
        if (locationInfo && locationInfo !== 'TBD') {
          location = locationInfo;
          console.log('✅ Updated location from description:', location);
        }
      }
    } else {
      console.log('⚠️ Description contains TBD, keeping city as TBD');
    }
  }

  // Extract organizer(s)
  let organizer = 'Luma Event';
  if (jsonLd.organizer) {
    if (Array.isArray(jsonLd.organizer) && jsonLd.organizer.length > 0) {
      // Join all organizer names with commas
      const organizerNames = jsonLd.organizer
        .map((org: any) => org.name)
        .filter((name: string) => name && name.trim())
        .join(', ');
      organizer = organizerNames || 'Luma Event';
    } else if (jsonLd.organizer.name) {
      organizer = jsonLd.organizer.name;
    }
  }

  return {
    title: jsonLd.name || 'Untitled Event',
    description: jsonLd.description || '',
    date: startDate.toISOString().split('T')[0],
    time: timeString,
    location: location,
    city: city,
    organizer: organizer,
    url: eventUrl,
    image_url: Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image,
    categories: ['Scraped'],
    platform: 'luma-scraped'
  };
}

/**
 * Test function to validate the scraper
 */
export async function testLumaScraper(eventUrl: string) {
  try {
    console.log('Testing Luma scraper with URL:', eventUrl);
    const result = await scrapeLumaEvent(eventUrl);
    console.log('Scraping result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
} 