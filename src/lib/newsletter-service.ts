// Newsletter service with MailChimp/Beehive integration ready
import { supabase } from './supabase'
import { captureNewsletterEmail } from './event-tracking'

export interface NewsletterSubscriber {
  email: string
  source_page: string
  subscribed_at: string
  gdpr_consent: boolean
  mailchimp_id?: string
  beehive_id?: string
  tags?: string[]
  status: 'pending' | 'subscribed' | 'unsubscribed' | 'bounced'
}

export interface NewsletterProvider {
  name: 'mailchimp' | 'beehive' | 'local'
  subscribe: (email: string, tags?: string[], metadata?: any) => Promise<{ success: boolean; id?: string; error?: string }>
  unsubscribe: (email: string) => Promise<{ success: boolean; error?: string }>
  updateTags: (email: string, tags: string[]) => Promise<{ success: boolean; error?: string }>
}

// Current implementation (local database)
class LocalNewsletterProvider implements NewsletterProvider {
  name: 'local' = 'local'

  async subscribe(email: string, tags: string[] = [], metadata: any = {}): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Use our existing tracking system
      await captureNewsletterEmail(email, metadata.source_page || window.location.pathname)

      // Also store in newsletter_subscribers with additional metadata
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .upsert({
          email,
          source_page: metadata.source_page || window.location.pathname,
          gdpr_consent: metadata.gdpr_consent || false,
          tags,
          status: 'subscribed'
        }, {
          onConflict: 'email'
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, id: data.id }
    } catch (error) {
      console.error('Local newsletter subscription error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ status: 'unsubscribed' })
        .eq('email', email)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Local newsletter unsubscribe error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async updateTags(email: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ tags })
        .eq('email', email)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Local newsletter tag update error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// MailChimp provider (ready for future implementation)
class MailChimpProvider implements NewsletterProvider {
  name: 'mailchimp' = 'mailchimp'
  private apiKey: string
  private listId: string

  constructor(apiKey: string, listId: string) {
    this.apiKey = apiKey
    this.listId = listId
  }

  async subscribe(email: string, tags: string[] = [], metadata: any = {}): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // TODO: Implement MailChimp API call
      const response = await fetch(`/api/newsletter/mailchimp/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tags,
          metadata,
          listId: this.listId
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also store locally for our tracking
      await new LocalNewsletterProvider().subscribe(email, tags, {
        ...metadata,
        mailchimp_id: result.id
      })

      return { success: true, id: result.id }
    } catch (error) {
      console.error('MailChimp subscription error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement MailChimp unsubscribe
      const response = await fetch(`/api/newsletter/mailchimp/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, listId: this.listId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also update locally
      await new LocalNewsletterProvider().unsubscribe(email)

      return { success: true }
    } catch (error) {
      console.error('MailChimp unsubscribe error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async updateTags(email: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement MailChimp tag update
      const response = await fetch(`/api/newsletter/mailchimp/update-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tags, listId: this.listId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also update locally
      await new LocalNewsletterProvider().updateTags(email, tags)

      return { success: true }
    } catch (error) {
      console.error('MailChimp tag update error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Beehive provider (ready for future implementation)
class BeehiveProvider implements NewsletterProvider {
  name: 'beehive' = 'beehive'
  private apiKey: string
  private publicationId: string

  constructor(apiKey: string, publicationId: string) {
    this.apiKey = apiKey
    this.publicationId = publicationId
  }

  async subscribe(email: string, tags: string[] = [], metadata: any = {}): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // TODO: Implement Beehive API call
      const response = await fetch(`/api/newsletter/beehive/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tags,
          metadata,
          publicationId: this.publicationId
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also store locally for our tracking
      await new LocalNewsletterProvider().subscribe(email, tags, {
        ...metadata,
        beehive_id: result.id
      })

      return { success: true, id: result.id }
    } catch (error) {
      console.error('Beehive subscription error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement Beehive unsubscribe
      const response = await fetch(`/api/newsletter/beehive/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, publicationId: this.publicationId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also update locally
      await new LocalNewsletterProvider().unsubscribe(email)

      return { success: true }
    } catch (error) {
      console.error('Beehive unsubscribe error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async updateTags(email: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      // TODO: Implement Beehive tag update
      const response = await fetch(`/api/newsletter/beehive/update-tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tags, publicationId: this.publicationId })
      })

      const result = await response.json()
      
      if (!response.ok) {
        return { success: false, error: result.error }
      }

      // Also update locally
      await new LocalNewsletterProvider().updateTags(email, tags)

      return { success: true }
    } catch (error) {
      console.error('Beehive tag update error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Newsletter service factory
class NewsletterService {
  private provider: NewsletterProvider

  constructor(provider?: NewsletterProvider) {
    // Default to local provider, can be switched to MailChimp/Beehive later
    this.provider = provider || new LocalNewsletterProvider()
  }

  // Switch provider (for when you add MailChimp/Beehive)
  setProvider(provider: NewsletterProvider) {
    this.provider = provider
  }

  async subscribe(email: string, options: {
    tags?: string[]
    source?: string
    gdpr_consent?: boolean
  } = {}): Promise<{ success: boolean; error?: string }> {
    const metadata = {
      source_page: options.source || (typeof window !== 'undefined' ? window.location.pathname : ''),
      gdpr_consent: options.gdpr_consent || false,
      timestamp: new Date().toISOString()
    }

    return await this.provider.subscribe(email, options.tags, metadata)
  }

  async unsubscribe(email: string): Promise<{ success: boolean; error?: string }> {
    return await this.provider.unsubscribe(email)
  }

  async updateTags(email: string, tags: string[]): Promise<{ success: boolean; error?: string }> {
    return await this.provider.updateTags(email, tags)
  }

  // Get subscriber analytics
  async getSubscriberStats(): Promise<{
    total: number
    bySource: Record<string, number>
    byStatus: Record<string, number>
    recentSignups: number
  }> {
    try {
      const { data: subscribers } = await supabase
        .from('newsletter_subscribers')
        .select('source_page, status, subscribed_at')

      if (!subscribers) return { total: 0, bySource: {}, byStatus: {}, recentSignups: 0 }

      const stats = {
        total: subscribers.length,
        bySource: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        recentSignups: 0
      }

      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      subscribers.forEach(sub => {
        // Count by source
        stats.bySource[sub.source_page] = (stats.bySource[sub.source_page] || 0) + 1
        
        // Count by status
        stats.byStatus[sub.status] = (stats.byStatus[sub.status] || 0) + 1
        
        // Count recent signups
        if (new Date(sub.subscribed_at) > oneWeekAgo) {
          stats.recentSignups++
        }
      })

      return stats
    } catch (error) {
      console.error('Error getting subscriber stats:', error)
      return { total: 0, bySource: {}, byStatus: {}, recentSignups: 0 }
    }
  }
}

// Export singleton instance
export const newsletterService = new NewsletterService()

// Export providers for future configuration
export { MailChimpProvider, BeehiveProvider, LocalNewsletterProvider }

// Helper function to automatically tag subscribers based on their event interests
export async function tagSubscriberByInterests(email: string): Promise<void> {
  try {
    // Get user's research interests from tracking data
    const { data: interactions } = await supabase
      .from('user_event_interactions')
      .select('research_areas')
      .eq('email', email)

    if (!interactions || interactions.length === 0) return

    // Aggregate research areas
    const areaCount: Record<string, number> = {}
    interactions.forEach(interaction => {
      interaction.research_areas?.forEach((area: string) => {
        areaCount[area] = (areaCount[area] || 0) + 1
      })
    })

    // Get top 3 research areas as tags
    const topAreas = Object.entries(areaCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([area]) => area)

    if (topAreas.length > 0) {
      await newsletterService.updateTags(email, topAreas)
    }
  } catch (error) {
    console.error('Error tagging subscriber by interests:', error)
  }
}
