import React, { useMemo, useState } from "react";
import { EventCard } from "./card";
import { Event } from "@/app/lib/event-data";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EventsListProps {
  events: Event[];
  onEventSelect: (event: Event) => void;
  selectedEvent: Event | null;
  loading?: boolean;
}

export function EventsList({
  events,
  onEventSelect,
  selectedEvent,
  loading = false,
}: EventsListProps) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: Event[] } = {};

    events.forEach((event) => {
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
          const timeA = a.time.split(" - ")[0];
          const timeB = b.time.split(" - ")[0];
          return timeA.localeCompare(timeB);
        }),
      }));
  }, [events]);

  const formatDayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  };

  const toggleSection = (dateKey: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(dateKey)) {
      newCollapsed.delete(dateKey);
    } else {
      newCollapsed.add(dateKey);
    }
    setCollapsedSections(newCollapsed);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#AE3813] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <span className="text-white/60 font-medium">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-12">
      {groupedEvents.map(({ date, events: dateEvents }) => {
        const formattedDate = formatDayDate(date);
        const isCollapsed = collapsedSections.has(date);

        return (
          <section key={date} className="">
            {/* Date Header */}
            <div
              className={`bg-white/10 backdrop-blur-md rounded-xl ${
                isCollapsed ? "" : "rounded-b-none"
              } px-6 py-3 border border-white/20 w-fit mx-auto`}
            >
              <h2 className="flex items-center gap-3 text-sm text-balance sm:text-base font-normal text-white tracking-wide">
                {formattedDate}
                <div className="w-1 h-1 bg-white/60 rounded-full" />
                <span className="text-sm sm:text-base shrink-0 font-light text-white/60">
                  {dateEvents.length} event{dateEvents.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => toggleSection(date)}
                  className="cursor-pointer p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
                  aria-label={isCollapsed ? "Expand events" : "Collapse events"}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-white/60" />
                  )}
                </button>
              </h2>
            </div>

            {/* Events Masonry Grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 gap-0">
                {dateEvents.map((event, eventIndex) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => onEventSelect(event)}
                    isSelected={selectedEvent?.id === event.id}
                    showTime={
                      eventIndex === 0 ||
                      event.time !== dateEvents[eventIndex - 1]?.time
                    }
                    isFirstInGroup={eventIndex === 0}
                    isLastInGroup={eventIndex === dateEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {groupedEvents.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-white/60 text-lg font-medium mb-2">
            No events found
          </div>
          <div className="text-white/40 text-sm">
            Check back later for new events
          </div>
        </div>
      )}
    </div>
  );
}
