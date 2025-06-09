import React, { useMemo } from 'react';
import { Event } from '../data/events';
import { EventCard } from './EventCard';

interface EventsListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  selectedEvent: Event | null;
  loading?: boolean;
}

export function EventsList({ events, onEventSelect, selectedEvent, loading = false }: EventsListProps) {
  // Sort events by date and time
  const sortedEvents = useMemo(() => {
    return events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      // If same date, sort by time
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  }, [events]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center my-12">
          <span className="transition-all animate-pulse opacity-100">Loading events...</span>
        </div>
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center my-12">
          <p className="text-gray-500 dark:text-gray-400">No events found matching your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6">
      {/* Grid layout for cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onClick={() => onEventSelect(event)}
            isSelected={selectedEvent?.id === event.id}
            showTime={true}
          />
        ))}
      </div>
    </div>
  );
}