// User data management for GDPR compliance
import { supabase } from './supabase'

export interface UserDataExport {
  user_info: {
    user_id?: string
    email?: string
    session_id?: string
  }
  interactions: Array<{
    event_id: string
    event_title: string
    research_areas: string[]
    interaction_type: string
    timestamp: string
    source_page: string
  }>
  research_interests: Array<{
    research_area: string
    interaction_count: number
    percentage: number
  }>
  newsletter_data?: {
    email: string
    subscribed_at: string
    source_page: string
  }
}

// Export all user data for GDPR compliance
export async function exportUserData(
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<UserDataExport | null> {
  try {
    // Get user interactions
    let interactionsQuery = supabase
      .from('user_event_interactions')
      .select('event_id, event_title, research_areas, interaction_type, timestamp, source_page')

    if (userId) {
      interactionsQuery = interactionsQuery.eq('user_id', userId)
    } else if (email) {
      interactionsQuery = interactionsQuery.eq('email', email)
    } else if (sessionId) {
      interactionsQuery = interactionsQuery.eq('session_id', sessionId)
    } else {
      return null
    }

    const { data: interactions, error: interactionsError } = await interactionsQuery

    if (interactionsError) {
      console.error('Error fetching interactions:', interactionsError)
      return null
    }

    // Get research interests
    const { data: researchInterests, error: interestsError } = await supabase
      .rpc('get_user_research_interests', {
        input_user_id: userId,
        input_email: email,
        input_session_id: sessionId
      })

    if (interestsError) {
      console.error('Error fetching research interests:', interestsError)
    }

    // Get newsletter data if email provided
    let newsletterData = null
    if (email) {
      const { data: newsletter } = await supabase
        .from('newsletter_subscribers')
        .select('email, subscribed_at, source_page')
        .eq('email', email)
        .single()
      
      newsletterData = newsletter
    }

    return {
      user_info: {
        user_id: userId,
        email,
        session_id: sessionId
      },
      interactions: interactions || [],
      research_interests: researchInterests || [],
      newsletter_data: newsletterData || undefined
    }
  } catch (error) {
    console.error('Error exporting user data:', error)
    return null
  }
}

// Delete all user data for GDPR compliance
export async function deleteUserData(
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const deletions = []

    // Delete interactions
    if (userId) {
      deletions.push(
        supabase
          .from('user_event_interactions')
          .delete()
          .eq('user_id', userId)
      )
    }
    
    if (email) {
      deletions.push(
        supabase
          .from('user_event_interactions')
          .delete()
          .eq('email', email)
      )
      
      // Delete newsletter subscription
      deletions.push(
        supabase
          .from('newsletter_subscribers')
          .delete()
          .eq('email', email)
      )
    }
    
    if (sessionId) {
      deletions.push(
        supabase
          .from('user_event_interactions')
          .delete()
          .eq('session_id', sessionId)
      )
    }

    await Promise.all(deletions)

    return { success: true }
  } catch (error) {
    console.error('Error deleting user data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Anonymize user data (alternative to deletion)
export async function anonymizeUserData(
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = []
    const anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`

    // Anonymize interactions
    if (userId) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ 
            user_id: null,
            email: null,
            session_id: anonymousId,
            ip_address: null,
            user_agent: 'anonymized'
          })
          .eq('user_id', userId)
      )
    }
    
    if (email) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ 
            email: null,
            session_id: anonymousId,
            ip_address: null,
            user_agent: 'anonymized'
          })
          .eq('email', email)
      )
    }
    
    if (sessionId) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ 
            session_id: anonymousId,
            ip_address: null,
            user_agent: 'anonymized'
          })
          .eq('session_id', sessionId)
      )
    }

    await Promise.all(updates)

    return { success: true }
  } catch (error) {
    console.error('Error anonymizing user data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get user's current consent status
export async function getUserConsentStatus(
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<boolean | null> {
  try {
    let query = supabase
      .from('user_event_interactions')
      .select('gdpr_consent')
      .limit(1)

    if (userId) {
      query = query.eq('user_id', userId)
    } else if (email) {
      query = query.eq('email', email)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    } else {
      return null
    }

    const { data } = await query
    return data && data.length > 0 ? data[0].gdpr_consent : null
  } catch (error) {
    console.error('Error getting consent status:', error)
    return null
  }
}

// Update user's consent status
export async function updateUserConsent(
  consent: boolean,
  userId?: string,
  email?: string,
  sessionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates = []

    if (userId) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ gdpr_consent: consent })
          .eq('user_id', userId)
      )
    }
    
    if (email) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ gdpr_consent: consent })
          .eq('email', email)
      )
      
      updates.push(
        supabase
          .from('newsletter_subscribers')
          .update({ gdpr_consent: consent })
          .eq('email', email)
      )
    }
    
    if (sessionId) {
      updates.push(
        supabase
          .from('user_event_interactions')
          .update({ gdpr_consent: consent })
          .eq('session_id', sessionId)
      )
    }

    await Promise.all(updates)

    return { success: true }
  } catch (error) {
    console.error('Error updating consent:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Admin function to clean up expired data
export async function cleanupExpiredData(): Promise<{ deleted: number; error?: string }> {
  try {
    const { error } = await supabase.rpc('cleanup_expired_tracking_data')
    
    if (error) {
      return { deleted: 0, error: error.message }
    }

    // Get count of deleted records (this is approximate since the function already ran)
    const { count } = await supabase
      .from('user_event_interactions')
      .select('*', { count: 'exact', head: true })
      .lt('data_retention_until', new Date().toISOString())

    return { deleted: count || 0 }
  } catch (error) {
    console.error('Error cleaning up expired data:', error)
    return { 
      deleted: 0, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
