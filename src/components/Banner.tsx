import React from 'react';
import { Plus } from 'lucide-react';

interface BannerProps {
  onAddEvent?: () => void;
}

export function Banner({ onAddEvent }: BannerProps) {
  return (
    <div className="sm:px-2 pt-6 pb-8 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-medium">ATLAS Events</h1>
          <h2 className="text-lg text-gray-600 dark:text-gray-400 uppercase tracking-wider mt-1">UK</h2>
        </div>
        
        <p className="max-w-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Find events from leading scientific communities and institutions around UK
        </p>
        
        <div className="w-full flex flex-wrap gap-3 pt-2">
          <button
            onClick={onAddEvent}
            className="flex items-center gap-2 text-sm hover:underline underline-offset-4 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-md hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Event</span>
          </button>
        </div>
      </div>
    </div>
  );
} 