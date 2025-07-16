import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.LUMA_API_KEY || 'secret-AiIhGpdHuIDmNYRFrzgRZTtAU';
  
  try {
    // First, let's get the list of events from the calendar
    const calendarsResponse = await fetch('https://api.lu.ma/public/v1/calendar/list-events', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-luma-api-key': apiKey,
      },
    });

    if (!calendarsResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to get calendars', 
        status: calendarsResponse.status,
        statusText: calendarsResponse.statusText
      }, { status: 500 });
    }

    const calendarsData = await calendarsResponse.json();
    
    return NextResponse.json({
      success: true,
      events: calendarsData.entries || calendarsData,
      message: 'Successfully retrieved events from calendar'
    });
    
  } catch (error) {
    console.error('Error testing Luma calendar:', error);
    return NextResponse.json({ 
      error: 'Failed to test Luma calendar',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 