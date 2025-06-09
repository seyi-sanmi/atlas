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
        </div>
        
        <p className="max-w-lg text-gray-700 dark:text-gray-300 leading-relaxed">
          Find events from scientific communities around the UK
        </p>
      </div>
    </div>
  );
} 