import React from 'react';
import { Event } from '../data/events';
import { ArrowRight } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected?: boolean;
  showTime?: boolean;
}

export function EventCard({ event, onClick, isSelected = false, showTime = true }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [start] = timeStr.split(' - ');
    return start;
  };

  return (
    <article
      className={`group grid grid-cols-[3.2rem_1fr] sm:grid-cols-[3.9rem_1fr] transition-all cursor-pointer scroll-mt-36 ${
        isSelected ? '' : ''
      }`}
      onClick={onClick}
    >
      <div className="pb-2 sm:pr-4 sm:px-3 sm:pt-1">
        {showTime && (
          <p className="text-sm sm:text-base sm:text-right">
            {formatTime(event.time)}
          </p>
        )}
      </div>
      <div className={`w-full border-b transition-all pb-3 sm:pt-1 border-gray-200 dark:border-gray-600 ${
        isSelected ? 'sm:pb-8 border-b-2' : 'sm:pb-2'
      }`}>
        <div
          className={`hover:underline underline-offset-4 transition-colors ${
            isSelected 
              ? 'underline decoration-gray-400' 
              : 'hover:decoration-gray-400'
          }`}
        >
          <p className="cursor-pointer">
            <ArrowRight className={`inline transition-all relative ${
              isSelected ? 'w-5 h-5 mr-1' : 'w-0'
            }`} />
            {event.title}
          </p>
        </div>
        
        {/* Event meta info - only show if not selected to keep list clean */}
        {!isSelected && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            <p>{event.organizer}</p>
            {event.location && <p>{event.location}</p>}
          </div>
        )}
      </div>
    </article>
  );
}