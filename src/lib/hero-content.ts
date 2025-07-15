import { supabase } from './supabase'
import { logAdminAction } from './admin'

export interface HeroContent {
  id: string
  type: 'research_area' | 'location'
  name: string
  image_url?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Get all hero content items
 */
export async function getAllHeroContent(): Promise<HeroContent[]> {
  const { data, error } = await supabase
    .from('hero_content')
    .select('*')
    .order('type')
    .order('display_order')

  if (error) {
    console.error('Error fetching hero content:', error)
    throw error
  }

  return data || []
}

/**
 * Get hero content by type
 */
export async function getHeroContentByType(type: 'research_area' | 'location'): Promise<HeroContent[]> {
  const { data, error } = await supabase
    .from('hero_content')
    .select('*')
    .eq('type', type)
    .order('display_order')

  if (error) {
    console.error('Error fetching hero content by type:', error)
    throw error
  }

  return data || []
}

/**
 * Create new hero content item
 */
export async function createHeroContent(content: {
  type: 'research_area' | 'location'
  name: string
  image_url?: string
  display_order?: number
  is_active?: boolean
}): Promise<HeroContent> {
  const { data, error } = await supabase
    .from('hero_content')
    .insert([{
      type: content.type,
      name: content.name,
      image_url: content.image_url,
      display_order: content.display_order || 0,
      is_active: content.is_active !== false
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating hero content:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('create_hero_content', {
    type: content.type,
    name: content.name
  })

  return data
}

/**
 * Update hero content item
 */
export async function updateHeroContent(id: string, updates: Partial<HeroContent>): Promise<HeroContent> {
  const { data, error } = await supabase
    .from('hero_content')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating hero content:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('update_hero_content', {
    id,
    updated_fields: Object.keys(updates)
  })

  return data
}

/**
 * Delete hero content item
 */
export async function deleteHeroContent(id: string): Promise<void> {
  const { error } = await supabase
    .from('hero_content')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting hero content:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('delete_hero_content', { id })
}

/**
 * Reorder hero content items
 */
export async function reorderHeroContent(items: { id: string, display_order: number }[]): Promise<void> {
  const updates = items.map(item => 
    supabase
      .from('hero_content')
      .update({ 
        display_order: item.display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
  )

  const results = await Promise.all(updates)
  
  const errors = results.filter(result => result.error)
  if (errors.length > 0) {
    console.error('Error reordering hero content:', errors)
    throw new Error('Failed to reorder some items')
  }

  // Log admin action
  await logAdminAction('reorder_hero_content', {
    items: items.map(item => ({ id: item.id, order: item.display_order }))
  })
}

/**
 * Toggle active status of hero content item
 */
export async function toggleHeroContentActive(id: string, isActive: boolean): Promise<HeroContent> {
  const { data, error } = await supabase
    .from('hero_content')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error toggling hero content active status:', error)
    throw error
  }

  // Log admin action
  await logAdminAction('toggle_hero_content_active', {
    id,
    is_active: isActive
  })

  return data
}

/**
 * Get active research areas for hero display
 */
export async function getActiveResearchAreas(): Promise<HeroContent[]> {
  const { data, error } = await supabase
    .from('hero_content')
    .select('*')
    .eq('type', 'research_area')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching active research areas:', error)
    throw error
  }

  return data || []
}

/**
 * Get active locations for hero display
 */
export async function getActiveLocations(): Promise<HeroContent[]> {
  const { data, error } = await supabase
    .from('hero_content')
    .select('*')
    .eq('type', 'location')
    .eq('is_active', true)
    .order('display_order')

  if (error) {
    console.error('Error fetching active locations:', error)
    throw error
  }

  return data || []
} 