import React from 'react';
import { Event } from '../data/events';

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected: boolean;
}

export function EventCard({
  event,
  onClick,
  isSelected
}: EventCardProps) {
  const {
    title,
    time,
    organizer,
    location
  } = event;
  
  return (
    <div 
      onClick={onClick} 
      className={`
        group flex items-center py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50
        cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
      `}
    >
      <span className="w-16 text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">
        {time.split(' - ')[0]}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base mb-0.5 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{organizer}</span>
          {location && (
            <>
              <span className="mx-1">•</span>
              <span>{location}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}