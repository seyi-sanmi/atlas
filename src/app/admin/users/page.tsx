"use client"
import React, { useState, useEffect } from 'react'
import {
  Search,
  Users,
  Calendar,
  Eye,
  ExternalLink,
  Mail,
  Building,
  MapPin,
  Briefcase,
  Filter,
  ChevronDown,
  User
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  event_views_count?: number
  event_clicks_count?: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activityFilter, setActivityFilter] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, activityFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // Get users with their profiles using secure function
      const { data: profiles, error } = await supabase
        .rpc('get_admin_user_data')

      if (error) throw error

      // Data is already processed by the secure function
      const processedUsers = profiles?.map(profile => ({
        id: profile.id,
        email: profile.email || 'No email',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        organization: profile.organization,
        job_title: profile.job_title,
        location: profile.location,
        linkedin_url: profile.linkedin_url,
        research_interests: profile.research_interests || [],
        preferred_categories: profile.preferred_categories || [],
        last_activity_at: profile.last_activity_at,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.created_at,
        role: profile.role || 'user',
        event_views_count: profile.event_views_count || 0,
        event_clicks_count: profile.event_clicks_count || 0
      })) || []

      setUsers(processedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.organization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.location?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Activity filter
    if (activityFilter) {
      const now = new Date()
      const cutoff = new Date()
      
      if (activityFilter === 'active_7d') {
        cutoff.setDate(now.getDate() - 7)
        filtered = filtered.filter(user => 
          user.last_activity_at && new Date(user.last_activity_at) > cutoff
        )
      } else if (activityFilter === 'active_30d') {
        cutoff.setDate(now.getDate() - 30)
        filtered = filtered.filter(user => 
          user.last_activity_at && new Date(user.last_activity_at) > cutoff
        )
      } else if (activityFilter === 'inactive') {
        cutoff.setDate(now.getDate() - 30)
        filtered = filtered.filter(user => 
          !user.last_activity_at || new Date(user.last_activity_at) <= cutoff
        )
      }
    }

    setFilteredUsers(filtered)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const getActivityStatus = (lastActivity: string | undefined) => {
    if (!lastActivity) return { status: 'Never', color: 'text-gray-500' }
    
    const now = new Date()
    const activityDate = new Date(lastActivity)
    const diffDays = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return { status: 'Today', color: 'text-green-600' }
    if (diffDays <= 7) return { status: `${diffDays}d ago`, color: 'text-green-600' }
    if (diffDays <= 30) return { status: `${diffDays}d ago`, color: 'text-yellow-600' }
    return { status: `${diffDays}d ago`, color: 'text-red-600' }
  }

  const uniqueRoles = Array.from(new Set(users.map(u => u.role)))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View user profiles, activity, and account information
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Admin' : 'User'}
              </option>
            ))}
          </select>
          
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Activity</option>
            <option value="active_7d">Active (7 days)</option>
            <option value="active_30d">Active (30 days)</option>
            <option value="inactive">Inactive (30+ days)</option>
          </select>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Organization</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Activity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Engagement</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => {
                  const activity = getActivityStatus(user.last_activity_at)
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.full_name || 'No name'}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.location && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {user.location}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role || 'user')}`}>
                          {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {user.organization ? (
                          <div>
                            <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                              <Building className="w-3 h-3 text-gray-400" />
                              {user.organization}
                            </div>
                            {user.job_title && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <Briefcase className="w-3 h-3" />
                                {user.job_title}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">Not specified</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`text-sm ${activity.color}`}>
                          {activity.status}
                        </div>
                        {user.onboarding_completed ? (
                          <div className="text-xs text-green-600 dark:text-green-400">Onboarded</div>
                        ) : (
                          <div className="text-xs text-yellow-600 dark:text-yellow-400">Incomplete</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {user.event_views_count} views
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                              {user.event_clicks_count} clicks
                            </span>
                          </div>
                        </div>
                        {user.research_interests && user.research_interests.length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {user.research_interests.length} research interest{user.research_interests.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Total Users</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{users.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Active (7d)</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {users.filter(u => {
              if (!u.last_activity_at) return false
              const cutoff = new Date()
              cutoff.setDate(cutoff.getDate() - 7)
              return new Date(u.last_activity_at) > cutoff
            }).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">With Organizations</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {users.filter(u => u.organization).length}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Total Engagement</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {users.reduce((sum, u) => sum + (u.event_views_count || 0) + (u.event_clicks_count || 0), 0)}
          </p>
        </div>
      </div>
    </div>
  )
} 