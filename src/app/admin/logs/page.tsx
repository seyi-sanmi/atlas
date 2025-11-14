"use client"
import React, { useState, useEffect } from 'react'
import {
  FileText,
  Search,
  Calendar,
  User,
  Activity,
  Filter,
  ChevronDown,
  AlertTriangle,
  Eye,
  Trash2,
  Edit,
  RefreshCw,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AdminLog {
  id: string
  admin_id: string
  admin_email: string
  action: string
  details: any
  created_at: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AdminLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [adminFilter, setAdminFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchQuery, actionFilter, adminFilter, dateFilter])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500) // Limit to recent 500 logs for performance

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Error loading admin logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogs = () => {
    let filtered = logs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.admin_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Action filter
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter)
    }

    // Admin filter
    if (adminFilter) {
      filtered = filtered.filter(log => log.admin_email === adminFilter)
    }

    // Date filter
    if (dateFilter) {
      const today = new Date()
      const cutoff = new Date()
      
      if (dateFilter === 'today') {
        cutoff.setHours(0, 0, 0, 0)
        filtered = filtered.filter(log => new Date(log.created_at) >= cutoff)
      } else if (dateFilter === 'week') {
        cutoff.setDate(today.getDate() - 7)
        filtered = filtered.filter(log => new Date(log.created_at) >= cutoff)
      } else if (dateFilter === 'month') {
        cutoff.setDate(today.getDate() - 30)
        filtered = filtered.filter(log => new Date(log.created_at) >= cutoff)
      }
    }

    setFilteredLogs(filtered)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('delete')) return <Trash2 className="w-4 h-4 text-red-500" />
    if (action.includes('create')) return <Plus className="w-4 h-4 text-green-500" />
    if (action.includes('update') || action.includes('edit')) return <Edit className="w-4 h-4 text-blue-500" />
    if (action.includes('rescrape')) return <RefreshCw className="w-4 h-4 text-purple-500" />
    if (action.includes('view')) return <Eye className="w-4 h-4 text-gray-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600 dark:text-red-400'
    if (action.includes('create')) return 'text-green-600 dark:text-green-400'
    if (action.includes('update') || action.includes('edit')) return 'text-blue-600 dark:text-blue-400'
    if (action.includes('rescrape')) return 'text-purple-600 dark:text-purple-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatDetails = (details: any) => {
    if (!details || typeof details !== 'object') return ''
    
    const entries = Object.entries(details)
    if (entries.length === 0) return ''
    
    return entries
      .slice(0, 3) // Show only first 3 details
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.length} items`
        }
        if (typeof value === 'string' && value.length > 30) {
          return `${key}: ${value.substring(0, 30)}...`
        }
        return `${key}: ${value}`
      })
      .join(', ')
  }

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))
  const uniqueAdmins = Array.from(new Set(logs.map(log => log.admin_email)))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track all admin actions and system changes
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Actions</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>{formatAction(action)}</option>
            ))}
          </select>
          
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Admins</option>
            {uniqueAdmins.map(admin => (
              <option key={admin} value={admin}>{admin}</option>
            ))}
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Showing {filteredLogs.length} of {logs.length} logs
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Admin</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Timestamp</th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className={`font-medium ${getActionColor(log.action)}`}>
                            {formatAction(log.action)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {log.admin_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {formatDetails(log.details)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                          className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                          title="View details"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${
                            expandedLog === log.id ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 bg-gray-50 dark:bg-gray-800">
                          <div className="border border-gray-200 dark:border-gray-600 rounded p-3">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              Action Details
                            </h4>
                            <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Total Actions</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{logs.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Active Admins</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{uniqueAdmins.length}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">Today's Actions</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {logs.filter(log => {
              const today = new Date()
              const logDate = new Date(log.created_at)
              return logDate.toDateString() === today.toDateString()
            }).length}
          </p>
        </div>
      </div>
    </div>
  )
} 