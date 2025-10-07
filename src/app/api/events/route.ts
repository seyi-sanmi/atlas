import { NextRequest, NextResponse } from 'next/server';
import { getAllEvents } from '@/lib/events';

// Cache for 5 minutes
export const revalidate = 300;

// Optional: Use edge runtime for faster responses
// export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const events = await getAllEvents(limit);
    
    return NextResponse.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    console.error('API Error fetching events:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

