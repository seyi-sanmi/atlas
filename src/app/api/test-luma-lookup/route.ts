import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method with {"eventUrl": "your-luma-url"}' 
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.LUMA_API_KEY || 'secret-AiIhGpdHuIDmNYRFrzgRZTtAU';
  
  try {
    const { eventUrl } = await request.json();
    
    if (!eventUrl) {
      return NextResponse.json({ 
        error: 'eventUrl is required' 
      }, { status: 400 });
    }

    console.log('Testing lookup with URL:', eventUrl);

    // Try different potential endpoints for lookup
    const endpoints = [
      // Original POST approach (might be wrong)
      {
        url: 'https://api.lu.ma/public/v1/calendar/lookup-event',
        method: 'POST',
        body: JSON.stringify({ event_url: eventUrl })
      },
      // Try GET approach since docs show it as GET
      {
        url: `https://api.lu.ma/public/v1/calendar/lookup-event?event_url=${encodeURIComponent(eventUrl)}`,
        method: 'GET',
        body: null
      },
      // Try extracting event ID and using direct event API
      {
        url: `https://api.lu.ma/public/v1/event/${extractEventId(eventUrl)}`,
        method: 'GET', 
        body: null
      }
    ];

    const results = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying ${endpoint.method} ${endpoint.url}`);
        
        const headers: any = {
          'accept': 'application/json',
          'x-luma-api-key': apiKey,
        };

        if (endpoint.body) {
          headers['content-type'] = 'application/json';
        }

        const lookupResponse = await fetch(endpoint.url, {
          method: endpoint.method,
          headers,
          body: endpoint.body
        });

        const responseText = await lookupResponse.text();
        
        results.push({
          endpoint: `${endpoint.method} ${endpoint.url}`,
          status: lookupResponse.status,
          statusText: lookupResponse.statusText,
          headers: Object.fromEntries(lookupResponse.headers.entries()),
          response: responseText
        });

        // If we get a successful response, parse and return it
        if (lookupResponse.ok) {
          try {
            const jsonData = JSON.parse(responseText);
            return NextResponse.json({
              success: true,
              lookupData: jsonData,
              endpoint: `${endpoint.method} ${endpoint.url}`,
              message: 'Successfully looked up event'
            });
          } catch (parseError) {
            // Response was OK but not JSON, continue to next endpoint
            continue;
          }
        }
      } catch (endpointError) {
        results.push({
          endpoint: `${endpoint.method} ${endpoint.url}`,
          error: endpointError instanceof Error ? endpointError.message : String(endpointError)
        });
      }
    }
    
    return NextResponse.json({
      error: 'All lookup approaches failed',
      attempts: results,
      message: 'None of the API endpoints worked. This event might not be accessible via API.'
    }, { status: 500 });
    
  } catch (error) {
    console.error('Error testing Luma lookup:', error);
    return NextResponse.json({ 
      error: 'Failed to test Luma lookup',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

function extractEventId(eventUrl: string): string {
  try {
    const url = new URL(eventUrl);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    return pathSegments[0] || 'unknown';
  } catch {
    return 'unknown';
  }
} 