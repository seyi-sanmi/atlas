import { supabase } from './supabase'

interface EventView {
  event_id: string
  event_title: string
  event_categories: string[]
  viewed_at: string
}

interface EventClick {
  event_id: string
  event_title: string
  event_categories: string[]
  clicked_at: string
}

interface CommunityInterest {
  community_name: string
  interest_level: 'low' | 'medium' | 'high'
  interacted_at: string
}

/**
 * Track when a user views an event (for personalization)
 */
export async function trackEventView(eventId: string, eventTitle: string, categories: string[] = []) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Only track for authenticated users

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('event_views')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const currentViews = profile.event_views || []
    
    // Check if event was already viewed recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const recentView = currentViews.find((view: EventView) => 
      view.event_id === eventId && view.viewed_at > oneHourAgo
    )

    if (recentView) return // Don't track duplicate views within an hour

    // Add new view
    const newView: EventView = {
      event_id: eventId,
      event_title: eventTitle,
      event_categories: categories,
      viewed_at: new Date().toISOString()
    }

    // Keep only the last 100 views
    const updatedViews = [...currentViews, newView].slice(-100)

    // Update profile
    await supabase
      .from('profiles')
      .update({ 
        event_views: updatedViews,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', user.id)

  } catch (error) {
    console.error('Error tracking event view:', error)
  }
}

/**
 * Track when a user clicks into an event (shows stronger interest)
 */
export async function trackEventClick(eventId: string, eventTitle: string, categories: string[] = []) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('event_clicks, preferred_categories')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const currentClicks = profile.event_clicks || []
    const currentPreferred = profile.preferred_categories || []

    // Add new click
    const newClick: EventClick = {
      event_id: eventId,
      event_title: eventTitle,
      event_categories: categories,
      clicked_at: new Date().toISOString()
    }

    // Keep only the last 50 clicks
    const updatedClicks = [...currentClicks, newClick].slice(-50)

    // Update preferred categories based on clicks
    const updatedPreferred = updatePreferredCategories(currentPreferred, categories)

    // Update profile
    await supabase
      .from('profiles')
      .update({ 
        event_clicks: updatedClicks,
        preferred_categories: updatedPreferred,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', user.id)

  } catch (error) {
    console.error('Error tracking event click:', error)
  }
}

/**
 * Track community interests
 */
export async function trackCommunityInterest(communityName: string, interestLevel: 'low' | 'medium' | 'high' = 'medium') {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('community_interests')
      .eq('id', user.id)
      .single()

    if (!profile) return

    const currentInterests = profile.community_interests || []

    // Check if community interest already exists
    const existingIndex = currentInterests.findIndex((interest: CommunityInterest) => 
      interest.community_name === communityName
    )

    const newInterest: CommunityInterest = {
      community_name: communityName,
      interest_level: interestLevel,
      interacted_at: new Date().toISOString()
    }

    let updatedInterests
    if (existingIndex >= 0) {
      // Update existing interest
      updatedInterests = [...currentInterests]
      updatedInterests[existingIndex] = newInterest
    } else {
      // Add new interest
      updatedInterests = [...currentInterests, newInterest]
    }

    // Update profile
    await supabase
      .from('profiles')
      .update({ 
        community_interests: updatedInterests,
        last_activity_at: new Date().toISOString()
      })
      .eq('id', user.id)

  } catch (error) {
    console.error('Error tracking community interest:', error)
  }
}

/**
 * Get user's event preferences for personalization
 */
export async function getUserPreferences() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('preferred_categories, event_clicks, community_interests, research_interests')
      .eq('id', user.id)
      .single()

    if (!profile) return null

    // Analyze recent clicks for trending interests
    const recentClicks = profile.event_clicks?.slice(-20) || []
    const trendingCategories = analyzeTrendingCategories(recentClicks)

    return {
      preferredCategories: profile.preferred_categories || [],
      researchInterests: profile.research_interests || [],
      communityInterests: profile.community_interests || [],
      trendingCategories,
      recentClicks: recentClicks.length
    }

  } catch (error) {
    console.error('Error getting user preferences:', error)
    return null
  }
}

/**
 * Update preferred categories based on user clicks
 */
function updatePreferredCategories(currentPreferred: string[], newCategories: string[]): string[] {
  const categoryCount: Record<string, number> = {}
  
  // Count existing preferences
  currentPreferred.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })
  
  // Add new categories
  newCategories.forEach(cat => {
    categoryCount[cat] = (categoryCount[cat] || 0) + 1
  })
  
  // Return top 10 categories
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([cat]) => cat)
}

/**
 * Analyze trending categories from recent clicks
 */
function analyzeTrendingCategories(recentClicks: EventClick[]): string[] {
  const categoryCount: Record<string, number> = {}
  
  recentClicks.forEach(click => {
    click.event_categories.forEach(category => {
      categoryCount[category] = (categoryCount[category] || 0) + 1
    })
  })
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([cat]) => cat)
}

/**
 * Update user profile with additional information
 */
export async function updateUserProfile(updates: {
  full_name?: string
  organization?: string
  job_title?: string
  location?: string
  linkedin_url?: string
  research_interests?: string[]
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) throw error

    return { success: true }

  } catch (error) {
    console.error('Error updating user profile:', error)
    return { error: 'Failed to update profile' }
  }
} 