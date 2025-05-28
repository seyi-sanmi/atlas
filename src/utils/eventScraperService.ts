import { Event } from '../data/events';

interface ScrapedEvent {
  url: string;
  title?: string;
  name?: string;
  description?: string;
  location?: string;
  organizer?: string;
  presented_by?: string;
  hosts?: { name: string }[];
  date?: string;
  time?: string;
  categories?: string[];
  links?: string[];
  error?: string;
}

export async function scrapeEvent(url: string): Promise<Partial<Event>> {
  try {
    console.log('Making API request to scrape event:', url);
    
    // Make a request to our local API server
    const response = await fetch('http://localhost:3001/api/scrape-event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error: ${response.status}`);
    }

    const data: ScrapedEvent = await response.json();
    console.log('Received data from server:', data);
    console.log('Data received from server in eventScraperService.ts:', JSON.stringify(data, null, 2));
    
    if (data.error) {
      throw new Error(data.error);
    }

    // Map scraped data to our Event type, directly using the fields from the server
    // The server already formats these correctly in the expected format
    return {
      title: data.title || data.name || '',
      description: data.description || '',
      location: data.location || '',
      organizer: data.organizer || '',
      presented_by: data.presented_by || undefined,
      date: data.date || new Date().toISOString().split('T')[0],
      time: data.time || '00:00 - 00:00',
      categories: data.categories || ['Other'],
      links: data.links || [],
      url: url
    };
  } catch (error) {
    console.error('Failed to scrape event:', error);
    throw error;
  }
} 