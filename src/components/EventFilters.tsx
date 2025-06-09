import React from 'react';
import { Search } from 'lucide-react';

interface EventFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  locations: string[];
  selectedLocations: string[];
  onLocationChange: (location: string) => void;
}

export function EventFilters({
  searchQuery,
  onSearchChange,
  locations,
  selectedLocations,
  onLocationChange,
}: EventFiltersProps) {
  return (
    <div className="p-4 sm:p-2 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search events"
          className="block w-full pl-10 pr-3 py-3 border-transparent rounded-lg bg-gray-100 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Location Filters */}
      <div className="flex flex-wrap gap-2">
        {locations.map((location) => {
          const isSelected = selectedLocations.includes(location);
          return (
            <button
              key={location}
              onClick={() => onLocationChange(location)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ease-in-out
                ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-200/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-gray-300/70 dark:hover:bg-gray-600/70'
                }
              `}
            >
              {location}
            </button>
          );
        })}
      </div>
    </div>
  );
} 