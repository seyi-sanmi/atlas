import puppeteer from 'puppeteer';

// Serverless-friendly imports
let chromium: any;
let puppeteerCore: any;

// Dynamically import serverless dependencies in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

if (isProduction) {
  try {
    chromium = require('@sparticuz/chromium');
    puppeteerCore = require('puppeteer-core');
    console.log('📦 Using serverless Puppeteer packages');
  } catch (error) {
    console.log('⚠️ Serverless packages not available, falling back to regular puppeteer');
  }
}

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
 * Scrapes event data from a Luma event page
 */
export async function scrapeLumaEvent(eventUrl: string): Promise<ScrapedEventData | null> {
  let browser;
  
  try {
    // Enhanced browser configuration for serverless environments
    const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    console.log('🌍 Environment detection:', {
      isVercel: !!isVercel,
      isDevelopment,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV
    });

    // Enhanced args for serverless/production environments
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ];

    // Add Vercel-specific args
    if (isVercel) {
      browserArgs.push(
        '--single-process',
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      );
    }

    const browserConfig = {
      headless: true,
      args: browserArgs,
      ...(isVercel ? {
        executablePath: '/usr/bin/chromium-browser',
        // Fallback for different Vercel configurations
        ...(process.env.CHROME_EXECUTABLE_PATH && {
          executablePath: process.env.CHROME_EXECUTABLE_PATH
        })
      } : {})
    };

    console.log('🚀 Browser config:', {
      headless: browserConfig.headless,
      argsCount: browserConfig.args.length,
      executablePath: browserConfig.executablePath || 'default'
    });

    // Launch browser with optimized settings
    if (isProduction && chromium && puppeteerCore) {
      // Use serverless-friendly version
      console.log('🌐 Using serverless chromium...');
      browser = await puppeteerCore.launch({
        ...browserConfig,
        executablePath: await chromium.executablePath(),
        args: [...browserConfig.args, ...chromium.args]
      });
    } else {
      // Use regular puppeteer for development
      console.log('💻 Using regular puppeteer...');
      browser = await puppeteer.launch(browserConfig);
    }

    const page = await browser.newPage();
    
    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set viewport
    await page.setViewport({ width: 1366, height: 768 });

    console.log(`Navigating to: ${eventUrl}`);
    
    // Navigate to the event page
    await page.goto(eventUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for the page to load completely
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract JSON-LD structured data (primary method)
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
      console.log('Found JSON-LD data:', jsonLdData);
      return parseJsonLdData(jsonLdData, eventUrl);
    }

    // Fallback: Extract data from page elements
    console.log('JSON-LD not found, trying DOM extraction...');
    const domData = await extractFromDOM(page);
    
    if (domData) {
      return {
        title: domData.title || 'Untitled Event',
        description: domData.description || '',
        date: domData.date || new Date().toISOString().split('T')[0],
        time: domData.time || 'TBD',
        location: domData.location || 'TBD',
        city: domData.city || 'TBD',
        organizer: domData.organizer || 'Luma Event',
        categories: domData.categories || ['Scraped'],
        url: eventUrl,
        platform: 'luma-scraped'
      };
    }

    throw new Error('Could not extract event data from the page');

  } catch (error) {
    console.error('Error scraping Luma event:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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
 * Fallback DOM extraction when JSON-LD is not available
 */
async function extractFromDOM(page: any): Promise<Partial<ScrapedEventData> | null> {
  try {
    const domData = await page.evaluate(() => {
      // Try to extract basic information from DOM
      const title = document.querySelector('h1')?.textContent?.trim() || 
                   document.querySelector('[data-testid="event-title"]')?.textContent?.trim() ||
                   document.title;

      const description = document.querySelector('[data-testid="event-description"]')?.textContent?.trim() ||
                         document.querySelector('.event-description')?.textContent?.trim() ||
                         document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                         '';

      // Look for date/time information
      const dateElement = document.querySelector('[data-testid="event-date"]') ||
                         document.querySelector('.event-date') ||
                         document.querySelector('[class*="date"]');
      
      const timeElement = document.querySelector('[data-testid="event-time"]') ||
                         document.querySelector('.event-time') ||
                         document.querySelector('[class*="time"]');

      // Look for location information
      const locationElement = document.querySelector('[data-testid="event-location"]') ||
                             document.querySelector('.event-location') ||
                             document.querySelector('[class*="location"]');

      return {
        title: title || 'Untitled Event',
        description: description,
        date: dateElement?.textContent?.trim() || 'TBD',
        time: timeElement?.textContent?.trim() || 'TBD',
        location: locationElement?.textContent?.trim() || 'TBD'
      };
    });

    // Process the extracted date if it's in a readable format
    let processedDate = new Date().toISOString().split('T')[0]; // Default to today
    if (domData.date && domData.date !== 'TBD') {
      try {
        const parsed = new Date(domData.date);
        if (!isNaN(parsed.getTime())) {
          processedDate = parsed.toISOString().split('T')[0];
        }
      } catch (e) {
        // Keep default date
      }
    }

    return {
      title: domData.title,
      description: domData.description,
      date: processedDate,
      time: domData.time,
      location: domData.location,
      city: 'TBD', // Hard to extract from DOM without more context
      organizer: 'Luma Event',
      categories: ['Scraped']
    };

  } catch (error) {
    console.error('Error extracting from DOM:', error);
    return null;
  }
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