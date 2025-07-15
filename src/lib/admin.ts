import { supabase } from './supabase'

export type UserRole = 'user' | 'admin' | 'super_admin'

export interface AdminUser {
  id: string
  email: string
  full_name?: string
  role: UserRole
  created_at: string
  last_sign_in_at?: string
}

/**
 * Check if the current user has admin privileges
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role === 'admin' || profile?.role === 'super_admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if the current user is a super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return profile?.role === 'super_admin'
  } catch (error) {
    console.error('Error checking super admin status:', error)
    return false
  }
}

/**
 * Get admin user details
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      full_name: profile.full_name,
      role: profile.role,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    }
  } catch (error) {
    console.error('Error getting admin user:', error)
    return null
  }
}

/**
 * Middleware to require admin access
 */
export async function requireAdmin(): Promise<void> {
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    throw new Error('Admin access required')
  }
}

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(action: string, details?: any): Promise<void> {
  try {
    const adminUser = await getAdminUser()
    if (!adminUser) return

    await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action,
        details: details || {},
        created_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
} 