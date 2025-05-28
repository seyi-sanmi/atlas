import React, { useState, useEffect, useRef } from 'react';
import { EventCard } from './EventCard';
import { Event } from '../data/events';
import { groupEventsByDate } from '../utils/dateUtils';

interface EventsListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  selectedEventId?: string;
}

export function EventsList({
  events,
  onEventSelect,
  selectedEventId
}: EventsListProps) {
  const groupedEvents = groupEventsByDate(events);
  const [currentDate, setCurrentDate] = useState<{ dayName: string; fullDate: string } | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const headerHeight = 73; // Main header height
      const eventsTitleHeight = 72; // Events title section height (corrected)
      const offset = headerHeight + eventsTitleHeight + 50; // Add some buffer
      
      // Show sticky header after scrolling past 200px
      setShowStickyHeader(scrollY > 200);

      // Find which section we're currently in based on scroll position
      let currentSection = null;
      
      for (const [dateKey, group] of groupedEvents) {
        const sectionElement = sectionRefs.current[dateKey];
        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          const elementTop = rect.top + scrollY;
          const elementBottom = elementTop + rect.height;
          
          // Check if the current scroll position (with offset) is within this section
          if (scrollY + offset >= elementTop && scrollY + offset < elementBottom) {
            currentSection = {
              dayName: group.dayName,
              fullDate: group.fullDate
            };
            break;
          }
        }
      }

      // Update current date if we found a section and it's different
      if (currentSection && 
          (!currentDate || 
           currentDate.dayName !== currentSection.dayName || 
           currentDate.fullDate !== currentSection.fullDate)) {
        setCurrentDate(currentSection);
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll);
    
    // Initial call to set the date
    handleScroll();

    // Set initial date if we have events and no current date
    if (groupedEvents.length > 0 && !currentDate) {
      setCurrentDate({
        dayName: groupedEvents[0][1].dayName,
        fullDate: groupedEvents[0][1].fullDate
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [groupedEvents, currentDate]);

  return (
    <div className="relative">
      {/* Sticky Date Header - shows when scrolled past initial content */}
      {currentDate && showStickyHeader && (
        <div className="sticky top-[145px] z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 py-3 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium">{currentDate.dayName}</h2>
            <span className="text-gray-600 dark:text-gray-400">{currentDate.fullDate}</span>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {groupedEvents.map(([dateKey, {
          dayName,
          fullDate,
          events
        }], index) => (
          <div 
            key={dateKey}
            ref={el => sectionRefs.current[dateKey] = el}
            data-date-key={dateKey}
            className="scroll-mt-32"
          >
            {/* Visible date header */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
              <h2 className="text-xl font-medium">{dayName}</h2>
              <span className="text-gray-600 dark:text-gray-400">{fullDate}</span>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {events.map((event: Event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => onEventSelect(event)} 
                  isSelected={event.id === selectedEventId} 
                />
              ))}
            </div>
            {index < groupedEvents.length - 1 && <div className="mt-12 border-b border-gray-200 dark:border-gray-800" />}
          </div>
        ))}
      </div>
    </div>
  );
}