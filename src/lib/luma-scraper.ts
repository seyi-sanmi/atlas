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
          return parseJsonLdData(data, eventUrl);
        }
      } catch (e) {
        continue;
      }
    }

    console.log('❌ No Event schema found in JSON-LD data');
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
      return parseJsonLdData(jsonLdData, eventUrl);
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
      return parseJsonLdData(jsonLdData, eventUrl);
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
 * Parse JSON-LD structured data into our event format
 */
function parseJsonLdData(jsonLd: any, eventUrl: string): ScrapedEventData {
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

  // Extract location and city
  let location = 'TBD';
  let city = 'TBD';
  
  if (jsonLd.location) {
    if (typeof jsonLd.location === 'string') {
      location = jsonLd.location;
      // Try to extract city from location string
      const parts = location.split(',').map((part: string) => part.trim());
      if (parts.length >= 2) {
        city = parts[parts.length - 2]; // Assume second-to-last part is city
      }
    } else if (jsonLd.location.name) {
      location = jsonLd.location.name;
      if (jsonLd.location.address) {
        const address = jsonLd.location.address;
        if (typeof address === 'string') {
          const parts = address.split(',').map((part: string) => part.trim());
          if (parts.length >= 2) {
            city = parts[parts.length - 2];
          }
        } else if (address.addressLocality) {
          city = address.addressLocality;
        }
      }
    }
  }

  // Extract organizer
  let organizer = 'Luma Event';
  if (jsonLd.organizer) {
    if (Array.isArray(jsonLd.organizer) && jsonLd.organizer.length > 0) {
      organizer = jsonLd.organizer[0].name || 'Luma Event';
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