'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getAdminUser } from '@/lib/admin'

export function SessionDebug() {
  const { user, session, loading } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [adminUser, setAdminUser] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
      loadAdminUser()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Profile error:', error)
        setProfile({ error: error.message })
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile load error:', error)
      setProfile({ error: 'Failed to load profile' })
    } finally {
      setProfileLoading(false)
    }
  }

  const loadAdminUser = async () => {
    if (!user) return
    setAdminLoading(true)
    try {
      const admin = await getAdminUser()
      setAdminUser(admin)
    } catch (error) {
      console.error('Admin check error:', error)
      setAdminUser({ error: 'Failed to check admin status' })
    } finally {
      setAdminLoading(false)
    }
  }

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Session refresh error:', error)
      } else {
        console.log('Session refreshed:', data)
        window.location.reload()
      }
    } catch (error) {
      console.error('Session refresh failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <h3 className="font-bold text-yellow-800">Session Debug - Loading...</h3>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-100 border border-gray-400 rounded space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Session Debug Info</h3>
        <button
          onClick={refreshSession}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
        >
          Refresh Session
        </button>
      </div>

      {/* Auth State */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">Auth State:</h4>
        <div className="text-sm space-y-1">
          <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          <div><strong>User exists:</strong> {user ? 'Yes' : 'No'}</div>
          <div><strong>Session exists:</strong> {session ? 'Yes' : 'No'}</div>
          {user && (
            <>
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Email:</strong> {user.email}</div>
              <div><strong>Created:</strong> {user.created_at}</div>
              <div><strong>Last sign in:</strong> {user.last_sign_in_at || 'Never'}</div>
            </>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">Profile Info:</h4>
        {profileLoading ? (
          <div className="text-sm text-gray-600">Loading profile...</div>
        ) : profile?.error ? (
          <div className="text-sm text-red-600">Error: {profile.error}</div>
        ) : profile ? (
          <div className="text-sm space-y-1">
            <div><strong>ID:</strong> {profile.id}</div>
            <div><strong>Full Name:</strong> {profile.full_name || 'Not set'}</div>
            <div><strong>Role:</strong> {profile.role || 'Not set'}</div>
            <div><strong>Organization:</strong> {profile.organization || 'Not set'}</div>
            <div><strong>Created:</strong> {profile.created_at}</div>
            <div><strong>Updated:</strong> {profile.updated_at}</div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No profile found</div>
        )}
      </div>

      {/* Admin Check */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold mb-2">Admin Check:</h4>
        {adminLoading ? (
          <div className="text-sm text-gray-600">Checking admin status...</div>
        ) : adminUser?.error ? (
          <div className="text-sm text-red-600">Error: {adminUser.error}</div>
        ) : adminUser ? (
          <div className="text-sm space-y-1">
            <div><strong>Is Admin:</strong> Yes</div>
            <div><strong>Role:</strong> {adminUser.role}</div>
            <div><strong>Email:</strong> {adminUser.email}</div>
            <div><strong>Full Name:</strong> {adminUser.full_name || 'Not set'}</div>
          </div>
        ) : (
          <div className="text-sm text-red-600">Not an admin</div>
        )}
      </div>

      {/* Session Details */}
      {session && (
        <div className="bg-white p-3 rounded border">
          <h4 className="font-semibold mb-2">Session Details:</h4>
          <div className="text-sm space-y-1">
            <div><strong>Access Token:</strong> {session.access_token ? 'Present' : 'Missing'}</div>
            <div><strong>Refresh Token:</strong> {session.refresh_token ? 'Present' : 'Missing'}</div>
            <div><strong>Expires At:</strong> {session.expires_at}</div>
            <div><strong>Token Type:</strong> {session.token_type}</div>
          </div>
        </div>
      )}
    </div>
  )
} 