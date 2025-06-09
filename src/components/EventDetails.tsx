import React from 'react';
import { XIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon } from 'lucide-react';
import { Event } from '../data/events';

interface EventDetailsProps {
  event: Event;
  onClose: () => void;
  isModal?: boolean;
}

export function EventDetails({
  event,
  onClose,
  isModal = false
}: EventDetailsProps) {
  const {
    title,
    date,
    time,
    location,
    description,
    organizer,
    url,
    presented_by
  } = event;
  
  // Format the date for display (from ISO format to more readable format)
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch {
      return dateStr; // If date parsing fails, return the original string
    }
  };
  
  return (
    <div className={`h-full ${isModal ? '' : 'overflow-y-auto'}`}>
      {!isModal && (
        <div className="sticky top-[73px] bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-between items-center z-40">
          <h2 className="text-xl font-bold">Event Details</h2>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors group" 
            aria-label="Close details"
          >
            <XIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
          </button>
        </div>
      )}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        <div className="space-y-4 mb-8">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <CalendarIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{formatDate(date)}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <ClockIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <MapPinIcon className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>{location}</span>
          </div>
          <div className="flex items-start text-gray-600 dark:text-gray-400">
            <UserIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0" />
            <span>{organizer}</span>
          </div>
          {presented_by && (
            <div className="flex items-start text-gray-600 dark:text-gray-400">
              <UserIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0" /> 
              <span className="text-sm text-gray-500 dark:text-gray-500 mr-1">Presented by:</span>
              <span>{presented_by}</span>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">About this event</h3>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {description}
          </p>
        </div>
        
        {url && (
          <div className="mb-4">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View original event page
            </a>
          </div>
        )}

      </div>
    </div>
  );
}