// Event tracking system for user analytics and research area profiling
import { supabase } from './supabase'
import { Event } from './supabase'

// Types for tracking
export interface EventInteraction {
  user_id?: string
  email?: string
  session_id?: string
  event_id: string // This will be UUID string from Event.id
  event_title: string
  research_areas: string[]
  interaction_type: 'view' | 'click_external' | 'detail_view' | 'share'
  source_page: string
  external_url?: string
  gdpr_consent?: boolean
}

export interface UserResearchInterests {
  research_area: string
  interaction_count: number
  percentage: number
  total_interactions: number
}

export interface EventEngagementStats {
  total_views: number
  total_clicks: number
  unique_users: number
  unique_emails: number
  unique_sessions: number
  click_through_rate: number
}

// Cookie management for session tracking
const SESSION_COOKIE_NAME = 'atlas_session_id'
const COOKIE_EXPIRY_DAYS = 365

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  // Try to get existing session ID from cookie
  const existingSession = getCookie(SESSION_COOKIE_NAME)
  if (existingSession) return existingSession
  
  // Create new session ID
  const sessionId = generateSessionId()
  setCookie(SESSION_COOKIE_NAME, sessionId, COOKIE_EXPIRY_DAYS)
  return sessionId
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

// Get current user info for tracking
async function getCurrentUserInfo(): Promise<{
  user_id?: string
  email?: string
  session_id: string
}> {
  const { data: { user } } = await supabase.auth.getUser()
  const session_id = getOrCreateSessionId()
  
  if (user) {
    return {
      user_id: user.id,
      email: user.email,
      session_id
    }
  }
  
  // Check if email was captured for newsletter (stored in localStorage temporarily)
  const capturedEmail = typeof window !== 'undefined' ? localStorage.getItem('newsletter_email') : null
  
  return {
    email: capturedEmail || undefined,
    session_id
  }
}

// Main tracking function
export async function trackEventInteraction(
  event: Event,
  interactionType: EventInteraction['interaction_type'],
  sourcePage: string,
  externalUrl?: string
): Promise<void> {
  try {
    const userInfo = await getCurrentUserInfo()
    
    const interaction: Partial<EventInteraction> = {
      ...userInfo,
      event_id: event.id,
      event_title: event.title,
      research_areas: event.ai_interest_areas || [],
      interaction_type: interactionType,
      source_page: sourcePage,
      external_url: externalUrl,
      gdpr_consent: getGDPRConsent() // We'll implement this
    }

    const { error } = await supabase
      .from('user_event_interactions')
      .insert([interaction])

    if (error) {
      console.error('Error tracking event interaction:', error)
      // Don't throw - tracking failures shouldn't break user experience
    }
  } catch (error) {
    console.error('Event tracking error:', error)
  }
}

// Specific tracking functions for different interactions
export async function trackEventView(event: Event, sourcePage: string = window.location.pathname): Promise<void> {
  await trackEventInteraction(event, 'view', sourcePage)
}

export async function trackEventClick(event: Event, sourcePage: string = window.location.pathname): Promise<void> {
  await trackEventInteraction(event, 'click_external', sourcePage, event.url)
}

export async function trackEventDetailView(event: Event, sourcePage: string = window.location.pathname): Promise<void> {
  await trackEventInteraction(event, 'detail_view', sourcePage)
}

export async function trackEventShare(event: Event, sourcePage: string = window.location.pathname): Promise<void> {
  await trackEventInteraction(event, 'share', sourcePage)
}

// Newsletter email capture
export async function captureNewsletterEmail(email: string, sourcePage: string): Promise<void> {
  try {
    const session_id = getOrCreateSessionId()
    
    // Store in newsletter_subscribers table
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email,
        session_id,
        source_page: sourcePage,
        gdpr_consent: getGDPRConsent()
      }, {
        onConflict: 'email'
      })

    if (error) {
      console.error('Error capturing newsletter email:', error)
    } else {
      // Store temporarily in localStorage for current session tracking
      if (typeof window !== 'undefined') {
        localStorage.setItem('newsletter_email', email)
      }
    }
  } catch (error) {
    console.error('Newsletter capture error:', error)
  }
}

// Get user's research area interests
export async function getUserResearchInterests(
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<UserResearchInterests[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_research_interests', {
        input_user_id: userId,
        input_email: email,
        input_session_id: sessionId
      })

    if (error) {
      console.error('Error getting research interests:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Research interests error:', error)
    return []
  }
}

// Get event engagement statistics (admin function)
export async function getEventEngagementStats(eventId: string): Promise<EventEngagementStats | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_event_engagement_stats', {
        input_event_id: eventId
      })

    if (error) {
      console.error('Error getting event stats:', error)
      return null
    }

    return data?.[0] || null
  } catch (error) {
    console.error('Event stats error:', error)
    return null
  }
}

// GDPR consent management
export function setGDPRConsent(consent: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gdpr_consent', consent.toString())
  }
}

export function getGDPRConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('gdpr_consent') === 'true'
}

// Link session data to user account when they sign up
export async function linkSessionToUser(userId: string): Promise<void> {
  try {
    const session_id = getOrCreateSessionId()
    const email = typeof window !== 'undefined' ? localStorage.getItem('newsletter_email') : null
    
    // Update existing interactions to link to the new user account
    const updates = []
    
    // Link session-based interactions
    if (session_id) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ user_id: userId })
          .eq('session_id', session_id)
          .is('user_id', null)
      )
    }
    
    // Link email-based interactions
    if (email) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ user_id: userId })
          .eq('email', email)
          .is('user_id', null)
      )
      
      // Update newsletter subscriber record
      updates.push(
        supabase
          .from('newsletter_subscribers')
          .update({ 
            converted_to_user_id: userId, 
            converted_at: new Date().toISOString() 
          })
          .eq('email', email)
      )
    }
    
    await Promise.all(updates)
    
    // Clear temporary email storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('newsletter_email')
    }
  } catch (error) {
    console.error('Error linking session to user:', error)
  }
}

// Admin functions for analytics
export async function getTopEvents(limit: number = 10): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_admin_event_popularity')

    if (error) {
      console.error('Error getting top events:', error)
      return []
    }

    // Apply limit client-side since RPC doesn't support limit parameter
    return (data || []).slice(0, limit)
  } catch (error) {
    console.error('Top events error:', error)
    return []
  }
}

export async function getUserEngagementSummary(limit: number = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_admin_user_engagement_summary')

    if (error) {
      console.error('Error getting user engagement:', error)
      return []
    }

    // Apply limit client-side since RPC doesn't support limit parameter
    return (data || []).slice(0, limit)
  } catch (error) {
    console.error('User engagement error:', error)
    return []
  }
}

// Utility to create tracking URL for external links
export function createTrackingUrl(event: Event, originalUrl: string): string {
  // This could be enhanced to use your own redirect service for more detailed tracking
  // For now, we'll track the click and then redirect
  return originalUrl
}
