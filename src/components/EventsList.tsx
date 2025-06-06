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
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: Event[] } = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const dateKey = date.toDateString();
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    // Sort groups by date and sort events within each group by time
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, eventsInDate]) => ({
        date,
        events: eventsInDate.sort((a, b) => {
          const timeA = a.time.split(' - ')[0];
          const timeB = b.time.split(' - ')[0];
          return timeA.localeCompare(timeB);
        })
      }));
  }, [events]);

  const formatDayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateFormatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    return { day, date: dateFormatted };
  };

  const shouldShowTime = (event: Event, index: number, events: Event[]) => {
    if (index === 0) return true;
    const previousEvent = events[index - 1];
    return event.time !== previousEvent.time;
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center my-12">
          <span className="transition-all animate-pulse opacity-100">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative grid grid-cols-1 gap-2 sm:gap-1">
        {groupedEvents.map(({ date, events: dateEvents }, groupIndex) => {
          const { day, date: formattedDate } = formatDayDate(date);
          
          return (
            <React.Fragment key={date}>
              {/* Sticky Date Header */}
              <div className="bg-white dark:bg-gray-900 sticky top-14 pt-0 z-20 mt-6 border-b border-gray-200 dark:border-gray-600 flex justify-between">
                <p className="py-2 sm:px-2 font-medium">{day}</p>
                <p className="py-2 sm:px-2 text-gray-600 dark:text-gray-400">{formattedDate}</p>
              </div>
              
              {/* Events for this date */}
              {dateEvents.map((event, eventIndex) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => onEventSelect(event)}
                  isSelected={selectedEvent?.id === event.id}
                  showTime={shouldShowTime(event, eventIndex, dateEvents)}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="w-full text-center my-12">
        <span className="text-gray-600 dark:text-gray-400">
          {events.length === 0 ? 'No events found' : 'end'}
        </span>
      </div>
    </div>
  );
}