"use client"
import React, { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  Building, 
  TrendingUp, 
  Clock,
  Eye,
  MousePointer,
  Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DashboardStats {
  total_users: number
  total_events: number
  active_research_areas: number
  active_locations: number
  events_this_week: number
  users_this_week: number
  upcoming_events: number
}

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<any>
  description?: string
}

function StatCard({ title, value, change, changeType, icon: Icon, description }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          </div>
        </div>
        {change && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            changeType === 'positive' 
              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              : changeType === 'negative'
              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}>
            {change}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardStats() {
      try {
        const { data, error } = await supabase
          .rpc('get_admin_dashboard_stats')

        if (error) throw error
        setStats(data?.[0] || null)
      } catch (err) {
        console.error('Error loading dashboard stats:', err)
        setError('Failed to load dashboard statistics')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-red-800 dark:text-red-200 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">
            {error || 'Unable to load dashboard statistics'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Overview of your ATLAS platform performance and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.total_users.toLocaleString()}
          change={stats.users_this_week > 0 ? `+${stats.users_this_week} this week` : undefined}
          changeType="positive"
          icon={Users}
          description="Registered platform users"
        />
        
        <StatCard
          title="Total Events"
          value={stats.total_events.toLocaleString()}
          change={stats.events_this_week > 0 ? `+${stats.events_this_week} this week` : undefined}
          changeType="positive"
          icon={Calendar}
          description="Events in the platform"
        />
        
        <StatCard
          title="Upcoming Events"
          value={stats.upcoming_events.toLocaleString()}
          icon={Clock}
          description="Events scheduled for future dates"
        />
        
        <StatCard
          title="Research Areas"
          value={stats.active_research_areas.toLocaleString()}
          icon={TrendingUp}
          description="Active research interest areas"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard
          title="Hero Locations"
          value={stats.active_locations.toLocaleString()}
          icon={Building}
          description="Cities featured in hero sections"
        />
        
        <StatCard
          title="Weekly Activity"
          value={`${stats.events_this_week + stats.users_this_week}`}
          icon={Activity}
          description="New events + new users this week"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/events"
            className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
          >
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Manage Events</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add, edit, or remove events</p>
            </div>
          </a>
          
          <a
            href="/admin/users"
            className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors"
          >
            <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">View Users</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Browse user profiles and activity</p>
            </div>
          </a>
          
          <a
            href="/admin/hero"
            className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors"
          >
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Hero Content</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Manage research areas and locations</p>
            </div>
          </a>
        </div>
      </div>

      {/* Note about analytics */}
      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Analytics Setup Needed</h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              To track page views and user engagement metrics, you'll need to set up analytics tracking. 
              Consider integrating Google Analytics, Vercel Analytics, or similar tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 