import { NextRequest, NextResponse } from 'next/server';
import { getAllCommunities } from '@/lib/communities';

// Cache for 5 minutes
export const revalidate = 300;

// Optional: Use edge runtime for faster responses
// export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const communities = await getAllCommunities(limit);
    
    return NextResponse.json({
      success: true,
      data: communities,
      count: communities.length,
    });
  } catch (error) {
    console.error('API Error fetching communities:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch communities',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

