"use client"
import React, { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  MoreHorizontal,
  Trash2,
  Edit,
  RefreshCw,
  Eye,
  ExternalLink,
  Calendar,
  MapPin,
  User,
  Clock,
  Tag,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { getEventsForAdmin, deleteEvent, bulkDeleteEvents, reScrapeEvent, EventWithAnalytics } from '@/lib/admin-events'

interface BulkDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  selectedCount: number
  confirmText: string
  setConfirmText: (text: string) => void
}

function BulkDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  selectedCount, 
  confirmText, 
  setConfirmText 
}: BulkDeleteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Delete {selectedCount} Event{selectedCount > 1 ? 's' : ''}
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          This action cannot be undone. This will permanently delete {selectedCount} event{selectedCount > 1 ? 's' : ''} from the database.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">DELETE</span> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Type DELETE"
          />
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmText !== 'DELETE'}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Delete {selectedCount} Event{selectedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventWithAnalytics[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventWithAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set())
  const [bulkDeleteModal, setBulkDeleteModal] = useState(false)
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Filter states
  const [platformFilter, setPlatformFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, platformFilter, categoryFilter])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const eventsData = await getEventsForAdmin()
      setEvents(eventsData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load events' })
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Platform filter
    if (platformFilter) {
      filtered = filtered.filter(event => event.platform === platformFilter)
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(event => 
        event.ai_event_type === categoryFilter || 
        event.categories?.includes(categoryFilter)
      )
    }

    setFilteredEvents(filtered)
  }

  const handleSelectEvent = (eventId: string, checked: boolean) => {
    const newSelected = new Set(selectedEvents)
    if (checked) {
      newSelected.add(eventId)
    } else {
      newSelected.delete(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEvents(new Set(filteredEvents.map(e => e.id)))
    } else {
      setSelectedEvents(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (bulkDeleteConfirmText !== 'DELETE') return

    try {
      setActionLoading('bulk-delete')
      await bulkDeleteEvents(Array.from(selectedEvents))
      setMessage({ type: 'success', text: `Successfully deleted ${selectedEvents.size} events` })
      setSelectedEvents(new Set())
      setBulkDeleteModal(false)
      setBulkDeleteConfirmText('')
      await loadEvents()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete events' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      setActionLoading(eventId)
      await deleteEvent(eventId)
      setMessage({ type: 'success', text: 'Event deleted successfully' })
      await loadEvents()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete event' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReScrapeEvent = async (eventId: string) => {
    try {
      setActionLoading(`rescrape-${eventId}`)
      await reScrapeEvent(eventId)
      setMessage({ type: 'success', text: 'Event re-scraped successfully' })
      await loadEvents()
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to re-scrape event' })
    } finally {
      setActionLoading(null)
    }
  }

  const uniquePlatforms = Array.from(new Set(events.map(e => e.platform).filter(Boolean)))
  const uniqueCategories = Array.from(new Set([
    ...events.map(e => e.ai_event_type).filter(Boolean),
    ...events.flatMap(e => e.categories || [])
  ]))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Event Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage events, re-scrape data, and view analytics
          </p>
        </div>
        
        {selectedEvents.size > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedEvents.size} selected
            </span>
            <button
              onClick={() => setBulkDeleteModal(true)}
              disabled={actionLoading === 'bulk-delete'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Platforms</option>
            {uniquePlatforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={filteredEvents.length > 0 && selectedEvents.size === filteredEvents.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Event</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Date & Time</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Location</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Analytics</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100">Platform</th>
                  <th className="w-24 px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={(e) => handleSelectEvent(event.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        {event.image_url && (
                          <img 
                            src={event.image_url} 
                            alt="" 
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {event.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {event.organizer}
                            </span>
                          </div>
                          {event.ai_event_type && (
                            <div className="flex items-center gap-1 mt-1">
                              <Tag className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {event.ai_event_type}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {event.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="truncate">{event.city}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {event.location}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {event.view_count || 0}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            {event.click_count || 0}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                        {event.platform || 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        {event.url && (
                          <button
                            onClick={() => handleReScrapeEvent(event.id)}
                            disabled={actionLoading === `rescrape-${event.id}`}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50"
                            title="Re-scrape event"
                          >
                            <RefreshCw className={`w-4 h-4 ${actionLoading === `rescrape-${event.id}` ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={actionLoading === event.id}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={bulkDeleteModal}
        onClose={() => {
          setBulkDeleteModal(false)
          setBulkDeleteConfirmText('')
        }}
        onConfirm={handleBulkDelete}
        selectedCount={selectedEvents.size}
        confirmText={bulkDeleteConfirmText}
        setConfirmText={setBulkDeleteConfirmText}
      />
    </div>
  )
} 