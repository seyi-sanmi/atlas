import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('API Key:', process.env.LUMA_API_KEY ? 'Present' : 'Missing');
    
    const res = await fetch("https://api.lu.ma/public/v1/calendar/list-events", {
      method: "GET",
      headers: {
        accept: "application/json",
        "x-luma-api-key": process.env.LUMA_API_KEY as string,
      },
    });

    if (!res.ok) {
      console.error('API Response not OK:', res.status, res.statusText);
      return NextResponse.json({ 
        error: "Failed to fetch data",
        status: res.status,
        statusText: res.statusText
      }, { status: 500 });
    }

    const data = await res.json();
    console.log('API Response:', data);
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Successfully fetched calendar events'
    });
    
  } catch (error) {
    console.error('Error in test-luma-simple:', error);
    return NextResponse.json({ 
      error: 'Failed to test Luma API',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 