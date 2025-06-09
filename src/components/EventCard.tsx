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

  // Generate a random background color class for each event based on event ID
  const getRandomColorClass = (id: string) => {
    const colors = [
      'event-bg-red',
      'event-bg-blue',
      'event-bg-green',
      'event-bg-yellow',
      'event-bg-purple',
      'event-bg-pink',
      'event-bg-indigo',
      'event-bg-orange',
      'event-bg-teal',
      'event-bg-cyan'
    ];
    
    // Use event ID to get consistent color for each event
    const hash = id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  const colorClass = getRandomColorClass(event.id);

  return (
    <article
      className={`event-card group grid grid-cols-[3.2rem_1fr] sm:grid-cols-[3.9rem_1fr] transition-all cursor-pointer scroll-mt-36 ${
        isSelected ? '' : ''
      }`}
      onClick={onClick}
    >
      <div className="pb-1 sm:pr-4 sm:px-3 sm:pt-0.5">
        {showTime && (
          <p className="text-sm sm:text-base sm:text-right text-gray-600 dark:text-gray-400">
            {formatTime(event.time)}
          </p>
        )}
      </div>
      <div className={`w-full border-b transition-all pb-1 sm:pt-0.5 border-gray-200 dark:border-gray-600 ${
        isSelected ? 'sm:pb-4 border-b-2' : 'sm:pb-1'
      }`}>
        <div
          className={`relative overflow-hidden transition-colors ${
            isSelected 
              ? 'underline decoration-gray-400' 
              : ''
          }`}
        >
          <p className={`cursor-pointer event-hover-bg text-gray-600 dark:text-gray-400 ${colorClass} ${isSelected ? 'selected' : ''}`}>
            <ArrowRight className={`inline transition-all relative ${
              isSelected ? 'w-5 h-5 mr-1' : 'w-0'
            }`} />
            {event.title}
          </p>
        </div>
        
        {/* Event meta info - only show if not selected to keep list clean */}
        {!isSelected && (
          <div className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            <p>{event.organizer}</p>
            {event.location && <p>{event.location}</p>}
          </div>
        )}
      </div>
    </article>
  );
}