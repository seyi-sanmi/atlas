"use client"
import React from 'react'
import { Building, ExternalLink } from 'lucide-react'

export default function AdminCommunitiesPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage community data through the integrated Airtable interface
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Building className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200">Airtable Integration</h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
              Community data is managed through Airtable. Use the embedded interface below to add, edit, or remove communities. 
              Changes will be reflected on the website automatically.
            </p>
            <a 
              href="https://airtable.com/appsHJKmoFZDdVF7W/shrOMQxRmvrYwzS5z"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm mt-2 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </div>
        </div>
      </div>

      {/* Airtable Embed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="h-[600px] w-full">
          <iframe 
            className="airtable-embed w-full h-full"
            src="https://airtable.com/embed/appsHJKmoFZDdVF7W/shrOMQxRmvrYwzS5z?viewControls=on" 
            frameBorder="0" 
            style={{ background: 'transparent', border: 'none' }}
            title="Community Management - Airtable"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">How to manage communities:</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium">1.</span>
            Use the embedded Airtable above to add new communities or edit existing ones
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium">2.</span>
            Toggle the "starred_on_website" field to control which communities appear prominently on the website
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium">3.</span>
            Fill in research areas and location data to improve filtering and categorization
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-medium">4.</span>
            Changes are automatically synchronized with the website - no manual refresh needed
          </li>
        </ul>
      </div>
    </div>
  )
} 