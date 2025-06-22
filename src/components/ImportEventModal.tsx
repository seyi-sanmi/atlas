'use client'

import React, { useState } from 'react'
import { importEvent, saveImportedEvent } from '@/app/actions/import-event'
import { X, Download, Save, AlertCircle, CheckCircle } from 'lucide-react'

interface ImportEventModalProps {
  isOpen: boolean
  onClose: () => void
  onEventImported: () => void // Callback to refresh events list
}

export function ImportEventModal({ isOpen, onClose, onEventImported }: ImportEventModalProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter an event URL')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await importEvent(url.trim())
      
      if (result.success) {
        setPreview(result.event)
        setSuccess(result.message || 'Event imported successfully!')
      } else {
        setError(result.error || 'Failed to import event')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!preview) return

    setSaving(true)
    setError('')

    try {
      const result = await saveImportedEvent(preview)
      
      if (result.success) {
        setSuccess('Event saved successfully!')
        onEventImported() // Refresh the events list
        setTimeout(() => {
          onClose()
          resetForm()
        }, 1500)
      } else {
        setError(result.error || 'Failed to save event')
      }
    } catch (error) {
      setError('An unexpected error occurred while saving.')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setUrl('')
    setPreview(null)
    setError('')
    setSuccess('')
    setLoading(false)
    setSaving(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const updatePreview = (field: string, value: string | string[]) => {
    setPreview((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16">
      <div className="bg-[#1E1E25] border border-gray-800 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto mt-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Import Event</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 p-2 rounded-md"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label htmlFor="event-url" className="block text-sm font-medium text-white">
              Event URL
            </label>
            <p className="text-sm text-gray-400 mb-3">
              Supports Luma (lu.ma) and Eventbrite events
            </p>
            <div className="flex gap-3">
              <input
                id="event-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://lu.ma/your-event or https://www.eventbrite.com/e/..."
                className="flex-1 bg-white/5 border border-white/10 rounded-md px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#AE3813] focus:ring-1 focus:ring-[#AE3813]"
                disabled={loading || saving}
              />
              <button
                onClick={handleImport}
                disabled={loading || saving || !url.trim()}
                className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Import
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-green-400 text-sm">{success}</p>
                {preview?.platform === 'luma-scraped' && (
                  <p className="text-green-300 text-xs mt-1">
                    ✨ Data extracted using web scraping (API not available for this event)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Event Preview */}
          {preview && (
            <div className="space-y-4 p-4 bg-white/5 rounded-md border border-white/10">
              <h3 className="text-lg font-medium text-white mb-4">Review Event Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Event Name</label>
                  <input
                    type="text"
                    value={preview.title}
                    onChange={(e) => updatePreview('title', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#AE3813]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Date</label>
                  <input
                    type="date"
                    value={preview.date}
                    onChange={(e) => updatePreview('date', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#AE3813]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Time</label>
                  <input
                    type="text"
                    value={preview.time}
                    onChange={(e) => updatePreview('time', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#AE3813]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Location</label>
                  <input
                    type="text"
                    value={preview.location}
                    onChange={(e) => updatePreview('location', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#AE3813]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Category</label>
                  <select
                    value={preview.categories?.[0] || 'Imported'}
                    onChange={(e) => updatePreview('categories', [e.target.value])}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white focus:outline-none focus:border-[#AE3813]"
                  >
                    <option value="Imported">Imported</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference</option>
                    <option value="Networking">Networking</option>
                    <option value="Webinar">Webinar</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={preview.description}
                  onChange={(e) => updatePreview('description', e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#AE3813] resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={handleClose}
                  disabled={saving}
                  className="bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-medium transition-all duration-200 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Event
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 