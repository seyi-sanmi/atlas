'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { updateUserProfile } from '@/lib/user-tracking'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Save, User, Building, MapPin, Briefcase, Linkedin, Mail, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  organization?: string
  job_title?: string
  location?: string
  linkedin_url?: string
  research_interests?: string[]
  preferred_categories?: string[]
  last_activity_at?: string
  onboarding_completed?: boolean
  created_at: string
  role?: string
  event_views?: any[]
  event_clicks?: any[]
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    job_title: '',
    location: '',
    linkedin_url: '',
    research_interests: [] as string[],
    preferred_categories: [] as string[]
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      setProfile(profile)
      setFormData({
        full_name: profile.full_name || '',
        organization: profile.organization || '',
        job_title: profile.job_title || '',
        location: profile.location || '',
        linkedin_url: profile.linkedin_url || '',
        research_interests: profile.research_interests || [],
        preferred_categories: profile.preferred_categories || []
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const result = await updateUserProfile(formData)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setSuccess(true)
      await loadProfile() // Reload to get updated data
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleArrayChange = (field: 'research_interests' | 'preferred_categories', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item)
    setFormData(prev => ({ ...prev, [field]: items }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-primary-text">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-text mb-4">Please sign in to view your profile</p>
          <Link
            href="/auth/signin"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-text/60 hover:text-primary-text transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to ATLAS
          </Link>
          <h1 className="text-3xl font-display font-medium text-primary-text">Profile Settings</h1>
          <p className="text-primary-text/60 mt-2">Manage your account information and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <span className="text-green-400">Profile updated successfully!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <span className="text-red-400">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-6 border-b border-primary-border">
                <h2 className="text-xl font-display font-medium text-primary-text">Personal Information</h2>
                <p className="text-primary-text/60 text-sm mt-1">Update your profile details</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-secondary-bg/30 border border-primary-border rounded-lg text-primary-text/60 cursor-not-allowed"
                    />
                    <p className="text-xs text-primary-text/40 mt-1">Email cannot be changed</p>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <Building className="w-4 h-4 inline mr-2" />
                      Organization
                    </label>
                    <input
                      type="text"
                      value={formData.organization}
                      onChange={(e) => handleInputChange('organization', e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                      placeholder="Your institution or company"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <Briefcase className="w-4 h-4 inline mr-2" />
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                      placeholder="Your role or position"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-text mb-2">
                      <Linkedin className="w-4 h-4 inline mr-2" />
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                      className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                {/* Research Interests */}
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Research Interests
                  </label>
                  <input
                    type="text"
                    value={formData.research_interests.join(', ')}
                    onChange={(e) => handleArrayChange('research_interests', e.target.value)}
                    className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                    placeholder="AI, Machine Learning, Neuroscience (comma-separated)"
                  />
                  <p className="text-xs text-primary-text/40 mt-1">Separate multiple interests with commas</p>
                </div>

                {/* Preferred Categories */}
                <div>
                  <label className="block text-sm font-medium text-primary-text mb-2">
                    Preferred Event Categories
                  </label>
                  <input
                    type="text"
                    value={formData.preferred_categories.join(', ')}
                    onChange={(e) => handleArrayChange('preferred_categories', e.target.value)}
                    className="w-full px-4 py-3 bg-secondary-bg/50 border border-primary-border rounded-lg text-primary-text placeholder-primary-text/40 focus:outline-none focus:border-[#AE3813] transition-colors"
                    placeholder="Lectures, Workshops, Conferences (comma-separated)"
                  />
                  <p className="text-xs text-primary-text/40 mt-1">Separate multiple categories with commas</p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium rounded-lg hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 disabled:opacity-50 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {!saving && <Save className="w-4 h-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
              <div className="px-6 py-6 border-b border-primary-border">
                <h3 className="text-lg font-display font-medium text-primary-text">Account Summary</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white rounded-full flex items-center justify-center text-lg font-medium mx-auto mb-4">
                    {profile?.full_name ? 
                      profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) :
                      user.email?.slice(0, 2).toUpperCase() || 'U'
                    }
                  </div>
                  <div className="text-center">
                    <h4 className="font-medium text-primary-text">
                      {profile?.full_name || user.email?.split('@')[0] || 'User'}
                    </h4>
                    <p className="text-sm text-primary-text/60">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-text/60">Member since</span>
                    <span className="text-primary-text">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-text/60">Role</span>
                    <span className="text-primary-text capitalize">{profile?.role || 'user'}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-text/60">Events viewed</span>
                    <span className="text-primary-text">
                      {Array.isArray(profile?.event_views) ? profile.event_views.length : 0}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-text/60">Events clicked</span>
                    <span className="text-primary-text">
                      {Array.isArray(profile?.event_clicks) ? profile.event_clicks.length : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 