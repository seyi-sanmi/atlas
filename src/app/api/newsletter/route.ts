import { NextRequest, NextResponse } from 'next/server'
import { newsletterService } from '@/lib/newsletter-service'

// POST /api/newsletter - Subscribe to newsletter
export async function POST(request: NextRequest) {
  try {
    const { email, tags, source, gdpr_consent } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await newsletterService.subscribe(email, {
      tags,
      source,
      gdpr_consent
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Successfully subscribed' })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Newsletter API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/newsletter - Unsubscribe from newsletter
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const result = await newsletterService.unsubscribe(email)

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Successfully unsubscribed' })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Newsletter unsubscribe API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/newsletter/stats - Get newsletter statistics (admin only)
export async function GET() {
  try {
    const stats = await newsletterService.getSubscriberStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Newsletter stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
