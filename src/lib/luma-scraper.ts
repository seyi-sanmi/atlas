import puppeteer from 'puppeteer';

export type SupportedPlatform = 'luma' | 'humanitix' | 'partiful' | 'unknown';

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

export interface ScrapingError {
  platform: SupportedPlatform;
  url: string;
  error: string;
  userMessage: string;
  shouldNotifyTeam: boolean;
}

export interface ScrapedEventData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  city_confidence?: number;
  needs_city_confirmation?: boolean;
  organizer: string;
  url: string;
  image_url?: string;
  categories: string[];
  platform: string;
}

/**
 * Detect the event platform from URL
 */
export function detectEventPlatform(url: string): SupportedPlatform {
  const normalizedUrl = url.toLowerCase();
  
  if (normalizedUrl.includes('lu.ma/') || normalizedUrl.includes('luma.com/')) {
    return 'luma';
  }
  
  if (normalizedUrl.includes('events.humanitix.com/') || normalizedUrl.includes('humanitix.com/events/')) {
    return 'humanitix';
  }
  
  if (normalizedUrl.includes('partiful.com/e/')) {
    return 'partiful';
  }
  
  return 'unknown';
}

/**
 * Simple HTTP fetch approach to get event data from JSON-LD
 * Works for Luma and Humanitix (both use structured data)
 */
async function fetchStructuredEventData(eventUrl: string, platform: SupportedPlatform): Promise<ScrapedEventData | null> {
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

    // Handle different platform-specific extraction methods
    if (platform === 'humanitix') {
      return await extractHumanitixData(html, eventUrl);
    } else {
      // Default Luma extraction
      return await extractLumaData(html, eventUrl);
    }

  } catch (error) {
    console.error('❌ HTTP fetch approach failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Extract Luma event data from HTML
 */
async function extractLumaData(html: string, eventUrl: string): Promise<ScrapedEventData | null> {
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
        return await parseJsonLdData(data, eventUrl, 'luma');
        }
      } catch (e) {
        continue;
      }
    }

    console.log('❌ No Event schema found in JSON-LD data');
    return null;
}

/**
 * Extract Humanitix event data from HTML
 */
async function extractHumanitixData(html: string, eventUrl: string): Promise<ScrapedEventData | null> {
  // First try JSON-LD script tags
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/g);
  
  if (jsonLdMatch) {
    for (const scriptMatch of jsonLdMatch) {
      try {
        const jsonContent = scriptMatch.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim();
        const data = JSON.parse(jsonContent);
        
        if (data['@type'] === 'Event') {
          console.log('✅ Found Humanitix Event JSON-LD data');
          return await parseJsonLdData(data, eventUrl, 'humanitix');
        }
      } catch (e) {
        continue;
      }
    }
  }

  // Try Humanitix-specific embedded JSON (like eventJsonSchema)
  const jsonSchemaMatch = html.match(/"eventJsonSchema":"([^"]+)"/);
  
  if (jsonSchemaMatch && jsonSchemaMatch[1]) {
    try {
      // Unescape the JSON string
      const jsonString = jsonSchemaMatch[1].replace(/\\"/g, '"');
      const data = JSON.parse(jsonString);
      
      if (data['@type'] === 'Event') {
        console.log('✅ Found Humanitix Event schema data');
        return await parseJsonLdData(data, eventUrl, 'humanitix');
      }
    } catch (e) {
      console.log('❌ Failed to parse Humanitix event schema');
    }
  }

  console.log('❌ No Humanitix Event data found');
  return null;
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

    throw new Error('No Event JSON-LD data found');

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

    throw new Error('No Event JSON-LD data found');

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
 * Scrape Partiful event data using browser automation
 */
async function scrapePartifulEvent(eventUrl: string): Promise<ScrapedEventData | null> {
  let browser;
  
  try {
    console.log('🎉 Starting Partiful event scraping...');
    
    // Try Playwright if available, fallback to Puppeteer
    let playwright;
    try {
      playwright = await import('playwright-core');
      browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });
    } catch (e) {
      console.log('❌ Playwright not available, trying Puppeteer...');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
      });
    }

    const page = await browser.newPage();
    
    // Handle both Playwright and Puppeteer user agent setting
    if ('setUserAgent' in page) {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    } else {
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });
    }
    
    console.log(`🎉 Navigating to Partiful: ${eventUrl}`);
    
    // Use any to avoid browser-specific typing issues
    await (page as any).goto(eventUrl, { 
      waitUntil: playwright ? 'networkidle' : 'networkidle2', 
      timeout: 30000 
    });

    // Extract data using DOM selectors
    const eventData = await (page as any).evaluate(() => {
      // Extract title
      const titleElement = document.querySelector('h1.EventPage_title__3tXXf, h1[class*="title"], h1');
      const title = titleElement?.textContent?.trim() || '';

      // Extract date and time
      const dateElement = document.querySelector('time.dtstart, time[datetime], [class*="date"], [class*="time"]');
      const dateText = dateElement?.textContent?.trim() || '';
      
      // Extract location
      const locationElements = document.querySelectorAll('[class*="location"], [class*="Location"]');
      let location = '';
      for (const el of locationElements) {
        const text = el.textContent?.trim();
        if (text && text.length > 3 && !text.includes('Get on the list')) {
          location = text;
          break;
        }
      }

      // Extract description - look for paragraphs or description containers
      const descriptionElements = document.querySelectorAll('p, [class*="description"], [class*="Description"], [class*="content"]');
      let description = '';
      for (const el of descriptionElements) {
        const text = el.textContent?.trim();
        if (text && text.length > 50 && (text.includes('partnership') || text.includes('join') || text.includes('event'))) {
          description = text;
          break;
        }
      }

      // Extract attendee count
      const attendeeElements = document.querySelectorAll('[class*="guest"], [class*="Guest"], [class*="list"]');
      let attendeeCount = '';
      for (const el of attendeeElements) {
        const text = el.textContent?.trim();
        if (text && /\d+/.test(text) && (text.includes('On The List') || text.includes('guest'))) {
          const match = text.match(/(\d+)/);
          if (match) attendeeCount = match[1];
          break;
        }
      }

      return {
        title,
        dateText,
        location,
        description,
        attendeeCount
      };
    });

    if (!eventData.title) {
      throw new Error('Could not extract event title from Partiful page');
    }

    // Parse date and time
    const { date, time } = parsePartifulDateTime(eventData.dateText);

    // Extract organizer from description
    const organizer = extractPartifulOrganizer(eventData.description);

    const result: ScrapedEventData = {
      title: eventData.title,
      description: eventData.description || 'Event details available on Partiful',
      date,
      time,
      location: eventData.location || 'Location available on Partiful',
      city: extractCityFromLocation(eventData.location),
      organizer,
      url: eventUrl,
      image_url: undefined,
      categories: inferCategories(eventData.title, eventData.description),
      platform: 'partiful-scraped'
    };

    console.log('✅ Successfully scraped Partiful event');
    return result;

  } catch (error) {
    console.error('❌ Partiful scraping failed:', error instanceof Error ? error.message : String(error));
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Parse Partiful date/time format
 */
function parsePartifulDateTime(dateText: string): { date: string; time: string } {
  if (!dateText) return { date: 'TBD', time: 'TBD' };

  // Handle formats like "Tuesday, Oct 7" and "5:00pm"
  const currentYear = new Date().getFullYear();
  
  // Extract time if present
  const timeMatch = dateText.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/);
  let time = timeMatch ? timeMatch[1] : 'TBD';

  // Extract date
  const dateMatch = dateText.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(\w+)\s*(\d{1,2})/i);
  
  if (dateMatch) {
    const [, , month, day] = dateMatch;
    const monthNum = getMonthNumber(month);
    if (monthNum) {
      // Format as YYYY-MM-DD
      const date = `${currentYear}-${monthNum.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
      return { date, time };
    }
  }

  return { date: 'TBD', time };
}

/**
 * Extract organizer from description
 */
function extractPartifulOrganizer(description: string): string {
  if (!description) return 'Organising Team';

  // Look for common patterns
  const patterns = [
    /In partnership with ([^,\.]+)/i,
    /hosted by ([^,\.]+)/i,
    /presented by ([^,\.]+)/i,
    /organized by ([^,\.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return 'Organising Team';
}

/**
 * Extract organizer from event description using AI
 */
async function extractOrganizerFromDescription(description: string, platform: string): Promise<string> {
  try {
    console.log('🤖 Attempting AI organizer extraction from description...');
    
    // Simple patterns to try first
    const patterns = [
      /(?:organized by|organised by|hosted by|presented by|brought to you by)\s+([^,\.\!\?]+)/i,
      /([A-Z]{2,4})\s+organizers?/i, // LSN organizers - check this first
      /([A-Z][A-Za-z\s&]+(?:Network|Foundation|Society|Association|Group|Community|Lab|Institute|University|College|Organization|Organisation))/g,
      /Join\s+(?:the\s+)?([A-Z][A-Za-z\s&]+(?:Network|Foundation|Society|Association|Group|Community|Lab|Institute|University|College))\s+(?:for|at|with)/i,
      /([A-Z][A-Za-z\s]+)\s+(?:is back|returns|presents|invites)/i,
    ];

    for (const pattern of patterns) {
      const matches = description.match(pattern);
      if (matches) {
        for (let i = 1; i < matches.length; i++) {
          const match = matches[i]?.trim();
          if (match && match.length > 2 && match.length < 50) {
            // Clean up the match
            let cleaned = match
              .replace(/\s+/g, ' ')
              .replace(/\.$/, '')
              .trim();
            
            // Special case: if we find LSN, try to expand it to the full name if it appears in the description
            if (cleaned === 'LSN' && description.toLowerCase().includes('london synbio network')) {
              cleaned = 'London SynBio Network';
            }
            
            if (cleaned && !cleaned.toLowerCase().includes('event') && !cleaned.toLowerCase().includes('this')) {
              console.log(`✅ Found organizer pattern: "${cleaned}"`);
              return cleaned;
            }
          }
        }
      }
    }

    // If patterns fail, try a more sophisticated approach
    // Look for capitalized words that might be organization names
    const words = description.split(/[\s,\.\!\?]+/);
    const potentialOrgs = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const word = words[i];
      const nextWord = words[i + 1];
      
      // Look for capitalized words followed by "Network", "Group", etc.
      if (word && word[0] === word[0].toUpperCase() && 
          nextWord && ['Network', 'Group', 'Society', 'Association', 'Community', 'Lab', 'Institute'].includes(nextWord)) {
        potentialOrgs.push(`${word} ${nextWord}`);
      }
    }

    if (potentialOrgs.length > 0) {
      console.log(`✅ Found potential organizer: "${potentialOrgs[0]}"`);
      return potentialOrgs[0];
    }

    console.log('❌ No organizer patterns found in description');
    return '';
    
  } catch (error) {
    console.error('❌ AI organizer extraction failed:', error);
    return '';
  }
}

/**
 * Extract city from location string
 */
function extractCityFromLocation(location: string): string {
  if (!location) return 'TBD';
  
  // Common city patterns
  const cityMatch = location.match(/(San Francisco|New York|Los Angeles|Chicago|Boston|Seattle|Austin|Denver|Portland|Miami|Atlanta|Dallas|Houston|Philadelphia|Phoenix|Detroit|Nashville|Las Vegas|Salt Lake City|Minneapolis|Cleveland|Pittsburgh|Baltimore|Washington)/i);
  
  if (cityMatch) {
    return cityMatch[1];
  }

  // Extract from "City, State" format
  const parts = location.split(',');
  if (parts.length >= 2) {
    return parts[0].trim();
  }

  return location;
}

/**
 * Infer categories from title and description
 */
function inferCategories(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const categories = ['Scraped'];

  if (text.includes('tech') || text.includes('startup') || text.includes('engineering')) {
    categories.push('Tech');
  }
  if (text.includes('network') || text.includes('meetup')) {
    categories.push('Networking');
  }
  if (text.includes('conference') || text.includes('summit')) {
    categories.push('Conference');
  }
  if (text.includes('workshop') || text.includes('training')) {
    categories.push('Workshop');
  }

  return categories;
}

/**
 * Get month number from month name
 */
function getMonthNumber(monthName: string): number | null {
  const months: Record<string, number> = {
    'jan': 1, 'january': 1,
    'feb': 2, 'february': 2,
    'mar': 3, 'march': 3,
    'apr': 4, 'april': 4,
    'may': 5,
    'jun': 6, 'june': 6,
    'jul': 7, 'july': 7,
    'aug': 8, 'august': 8,
    'sep': 9, 'september': 9, 'sept': 9,
    'oct': 10, 'october': 10,
    'nov': 11, 'november': 11,
    'dec': 12, 'december': 12
  };

  return months[monthName.toLowerCase()] || null;
}

/**
 * Main universal event scraping function
 */
export async function scrapeEvent(eventUrl: string): Promise<ScrapedEventData | ScrapingError> {
  const platform = detectEventPlatform(eventUrl);
  
  console.log(`🚀 Starting event scraping for ${platform} platform...`);

  // Handle unsupported platforms
  if (platform === 'unknown') {
    return {
      platform: 'unknown',
      url: eventUrl,
      error: 'Unsupported platform',
      userMessage: 'This event platform is not currently supported. Our team is working to add support for more platforms.',
      shouldNotifyTeam: true
    };
  }

  try {
    let result: ScrapedEventData | null = null;

    if (platform === 'partiful') {
      // Partiful requires browser automation
      result = await scrapePartifulEvent(eventUrl);
    } else {
      // Luma and Humanitix use structured data (JSON-LD)
      result = await fetchStructuredEventData(eventUrl, platform);
      
      if (!result) {
        // Try browser fallback for Luma/Humanitix
  console.log('📄 HTTP fetch failed, trying browser fallback...');
  result = await browserFallbackApproach(eventUrl);
      }
    }

  if (result) {
    return result;
  }

    // If we get here, all scraping methods failed
  throw new Error('Could not extract event data from the page');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Scraping failed for ${platform}:`, errorMessage);

    return {
      platform,
      url: eventUrl,
      error: errorMessage,
      userMessage: `Unable to extract event data from this ${platform} page. Our team has been notified and is looking into this issue.`,
      shouldNotifyTeam: true
    };
  }
}

/**
 * Legacy function name for backward compatibility
 */
export async function scrapeLumaEvent(eventUrl: string): Promise<ScrapedEventData | null> {
  const result = await scrapeEvent(eventUrl);
  
  if ('error' in result) {
    console.error('Scraping error:', result.userMessage);
    return null;
  }
  
  return result;
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
  
  // Special handling for UK address formats with postal codes
  // Pattern: "Street, Area, London SW7 2BU, UK"
  const ukAddressMatch = locationStr.match(/,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z]{1,2}\d{1,2}\s*\d?[A-Z]{2}/i);
  if (ukAddressMatch) {
    const potentialCity = ukAddressMatch[1];
    // Check if it's a known UK city
    for (const city of ukCities) {
      if (potentialCity.toLowerCase() === city.toLowerCase()) {
        return city;
      }
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
 * Extract city from event title using hybrid approach (rule-based + AI fallback)
 */
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

/**
 * Rule-based city extraction from event title (works without API)
 */
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
 * UK cities whitelist for validation (compact subset; can be expanded over time)
 */
const UK_CITIES_WHITELIST: string[] = [
  'London','Manchester','Birmingham','Leeds','Liverpool','Sheffield','Bristol','Glasgow','Edinburgh','Cardiff','Newcastle','Belfast','Nottingham','Southampton','Oxford','Cambridge','Brighton','Bath','York','Leicester','Coventry','Bradford','Wolverhampton','Plymouth','Derby','Reading','Newport','Preston','Sunderland','Norwich','Bournemouth','Southend','Swindon','Huddersfield','Middlesbrough','Blackpool','Bolton','Ipswich','Peterborough','Stockport','Gloucester','Exeter','Canterbury','Lancaster','Durham','Chelmsford','Chester','St Albans','Winchester','Worcester','Lincoln'
];

function isValidUKCity(city: string): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase();
  return UK_CITIES_WHITELIST.some(c => c.toLowerCase() === normalized);
}

/**
 * AI-first UK city inference from title + description with confidence.
 * Returns { city, confidence } where confidence ∈ [0,1].
 */
async function inferCityFromTitleAndDescriptionUK(title: string, description: string): Promise<{ city: string; confidence: number }> {
  if (!process.env.OPENAI_API_KEY) {
    return { city: 'TBD', confidence: 0 };
  }

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

      // Normalize result
      if (city.toLowerCase() === 'online') {
        return { city: 'Online', confidence: Math.max(confidence, 0.95) };
      }

      // Validate against UK whitelist
      if (!isValidUKCity(city)) {
        return { city: 'TBD', confidence: 0 };
      }

      return { city, confidence };
    } catch {
      return { city: 'TBD', confidence: 0 };
    }
  } catch (error) {
    console.error('AI combined UK city inference failed:', error);
    return { city: 'TBD', confidence: 0 };
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
async function parseJsonLdData(jsonLd: any, eventUrl: string, platform: string = 'luma'): Promise<ScrapedEventData> {
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
        } else if (address.streetAddress && !isPlaceholderLocation(address.streetAddress)) {
          // Try to extract city from street address (e.g., "Imperial College Rd, South Kensington, London SW7 2BU, UK")
          console.log('🔍 Trying to extract city from streetAddress:', address.streetAddress);
          const extractedCity = await extractCityFromString(address.streetAddress);
          if (extractedCity !== 'TBD') {
            city = extractedCity;
            console.log('✅ Found city in streetAddress:', city);
          } else {
            // If AI extraction fails, use simple parsing for UK addresses
            const ukCityMatch = address.streetAddress.match(/,\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z]{1,2}\d/);
            if (ukCityMatch) {
              city = ukCityMatch[1];
              console.log('✅ Found UK city in streetAddress via regex:', city);
            }
          }
        }
        
        // Only use addressRegion as a last resort and check if it's actually a city
        if (city === 'TBD' && address.addressRegion && !isPlaceholderLocation(address.addressRegion)) {
          // Don't use region names like "England", "Scotland", etc. as cities
          const regionName = address.addressRegion.toLowerCase();
          if (!['england', 'scotland', 'wales', 'northern ireland', 'uk', 'united kingdom', 'gb', 'great britain'].includes(regionName)) {
            city = address.addressRegion;
            console.log('✅ Found city in addressRegion:', city);
          } else {
            console.log('⚠️ Skipping addressRegion as it\'s a country/region, not a city:', address.addressRegion);
          }
        }
      }
      
      // If still no city found and location name is valid, try extracting from it
      if (city === 'TBD' && location !== 'TBD' && !isPlaceholderLocation(location)) {
        console.log('🔄 Trying to extract city from location name as fallback');
        city = await extractCityFromString(location);
      }
    }
  }
  
  // AI-first UK city inference from title + description with confidence threshold 0.90
  if (jsonLd.name || jsonLd.description) {
    const { city: inferredCity, confidence } = await inferCityFromTitleAndDescriptionUK(
      jsonLd.name || '',
      jsonLd.description || ''
    );
    if (inferredCity !== 'TBD' && confidence >= 0.9) {
      city = inferredCity;
      console.log(`✅ Accepted AI UK city inference: ${inferredCity} (conf ${confidence.toFixed(2)})`);
      // attach confidence flags
      var cityConfidence: number | undefined = confidence;
      var needsConfirmation: boolean | undefined = false;
    } else {
      console.log('⚠️ AI UK city inference below threshold or invalid; leaving city as is (may be TBD)');
      var cityConfidence: number | undefined = confidence || 0;
      var needsConfirmation: boolean | undefined = true;
    }
  }

  // Extract organizer(s)
  let organizer = '';
  if (jsonLd.organizer) {
    if (Array.isArray(jsonLd.organizer) && jsonLd.organizer.length > 0) {
      // Join all organizer names with commas
      const organizerNames = jsonLd.organizer
        .map((org: any) => org.name)
        .filter((name: string) => name && name.trim())
        .join(', ');
      organizer = organizerNames;
    } else if (jsonLd.organizer.name) {
      organizer = jsonLd.organizer.name;
    }
  }

  // If no organizer found in structured data, try AI extraction from description
  if (!organizer && jsonLd.description) {
    console.log('🤖 No organizer in structured data, trying AI extraction from description...');
    organizer = await extractOrganizerFromDescription(jsonLd.description, platform);
  }

  // Final fallback - generic organizer name
  if (!organizer) {
    organizer = 'Organising Team';
  }

  return {
    title: jsonLd.name || 'Untitled Event',
    description: jsonLd.description || '',
    date: startDate.toISOString().split('T')[0],
    time: timeString,
    location: location,
    city: city,
    city_confidence: typeof cityConfidence === 'number' ? cityConfidence : undefined,
    needs_city_confirmation: typeof needsConfirmation === 'boolean' ? needsConfirmation : undefined,
    organizer: organizer,
    url: eventUrl,
    image_url: Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image,
    categories: ['Scraped'],
    platform: `${platform}-scraped`
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