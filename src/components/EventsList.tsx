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
    const combinedFormat = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: '2-digit' 
    });
    return combinedFormat;
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
      <div className="relative grid grid-cols-1 gap-1 sm:gap-0.5">
        {groupedEvents.map(({ date, events: dateEvents }) => {
          const formattedDate = formatDayDate(date);
          
          return (
            <div key={date} className="relative">
              {/* Sticky Date Header */}
              <div 
                className="sticky pt-0 z-20 mt-4 flex items-center justify-start bg-slate-200 dark:bg-slate-800"
                style={{ top: 'var(--header-height)' }}
              >
                <p className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200 text-sm">{formattedDate}</p>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}