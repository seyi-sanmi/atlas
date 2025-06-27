import React, { useMemo, useState } from "react";
import { EventCard } from "./card";
import { Event } from "@/lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "next-themes";

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

  // Group events by date and calculate global indices for color diversity
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
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, eventsInDate]) => ({
        date,
        events: eventsInDate.sort((a, b) => {
          const timeA = a.time.split(" - ")[0];
          const timeB = b.time.split(" - ")[0];
          return timeA.localeCompare(timeB);
        }),
      }));

    // Calculate global indices for each event to ensure color diversity
    let globalEventIndex = 0;
    return sortedGroups.map(({ date, events: dateEvents }) => ({
      date,
      events: dateEvents.map((event) => ({
        ...event,
        globalIndex: globalEventIndex++,
      })),
    }));
  }, [events]);

  const formatDayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "2-digit",
      // year: "numeric",
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
          <span className="text-primary-text/60 font-medium">
            Loading events...
          </span>
        </div>
      </div>
    );
  }

  //
  const { theme } = useTheme();
  return (
    <div className="w-full space-y-12">
      {groupedEvents.map(({ date, events: dateEvents }) => {
        const formattedDate = formatDayDate(date);
        const isCollapsed = collapsedSections.has(date);

        return (
          <section key={date} className="">
            <div className="data-right-atlas-overlay-nav">
              <div className="atlas-right-overlay-notch bg-secondary-bg border-t border-b border-primary-border border-l">
                <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-primary-text tracking-wide pl-1">
                  {formattedDate}
                  <div className="w-1 h-1 dark:bg-white/60 bg-black/60 rounded-full" />
                  <span className="text-[12px] sm:text-base shrink-0 font-light text-primary-text/60">
                    {dateEvents.length} event
                    {dateEvents.length !== 1 ? "s" : ""}
                  </span>
                </h2>

                <svg
                  width="60"
                  height="42"
                  viewBox="0 0 60 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="atlas-right-overlay-notch-tail"
                  preserveAspectRatio="none"
                >
                  <mask
                    id="error_overlay_nav_mask0_2667_14687"
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="-1"
                    width="60"
                    height="43"
                    style={{ maskType: "alpha" }}
                  >
                    <mask
                      id="error_overlay_nav_path_1_outside_1_2667_14687"
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="-1"
                      width="60"
                      height="43"
                      fill="black"
                    >
                      <rect fill="white" y="-1" width="60" height="43"></rect>
                      <path d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"></path>
                    </mask>
                    <path
                      d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"
                      fill="white"
                    ></path>
                    <path
                      d="M1 0V-1H0V0L1 0ZM1 41H0V42H1V41ZM34.8889 29.6498L33.9873 30.0823L34.8889 29.6498ZM26.111 11.3501L27.0127 10.9177L26.111 11.3501ZM1 1H8.0783V-1H1V1ZM60 40H1V42H60V40ZM2 41V0L0 0L0 41H2ZM25.2094 11.7826L33.9873 30.0823L35.7906 29.2174L27.0127 10.9177L25.2094 11.7826ZM52.9217 42H60V40H52.9217V42ZM33.9873 30.0823C37.4811 37.3661 44.8433 42 52.9217 42V40C45.6127 40 38.9517 35.8074 35.7906 29.2174L33.9873 30.0823ZM8.0783 1C15.3873 1 22.0483 5.19257 25.2094 11.7826L27.0127 10.9177C23.5188 3.6339 16.1567 -1 8.0783 -1V1Z"
                      fill="black"
                      mask="url(#error_overlay_nav_path_1_outside_1_2667_14687)"
                    ></path>
                  </mask>
                  <g mask="url(#error_overlay_nav_mask0_2667_14687)">
                    <mask
                      id="error_overlay_nav_path_3_outside_2_2667_14687"
                      maskUnits="userSpaceOnUse"
                      x="-1"
                      y="0.0244141"
                      width="60"
                      height="43"
                      fill="black"
                    >
                      <rect
                        fill="white"
                        x="-1"
                        y="0.0244141"
                        width="60"
                        height="43"
                      ></rect>
                      <path d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"></path>
                    </mask>
                    <path
                      d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"
                      fill={theme == "dark" ? "#1E1E25" : "#ebebeb"}
                    ></path>
                    <path
                      d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                      fill={theme == "dark" ? "#565558" : "#E0E0E0"}
                      mask="url(#error_overlay_nav_path_3_outside_2_2667_14687)"
                    ></path>
                  </g>
                </svg>
              </div>
            </div>

            {/* Events Grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 gap-0">
                {dateEvents.map((event, eventIndex) => (
                  <EventCard
                    key={event.id}
                    date={date}
                    event={event}
                    onClick={() => onEventSelect(event)}
                    isSelected={selectedEvent?.id === event.id}
                    showTime={
                      eventIndex === 0 ||
                      event.time !== dateEvents[eventIndex - 1]?.time
                    }
                    isFirstInGroup={eventIndex === 0}
                    isLastInGroup={eventIndex === dateEvents.length - 1}
                    eventIndex={(event as any).globalIndex}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {groupedEvents.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="text-primary-text/60 text-lg font-medium mb-2">
            No events found
          </div>
          <div className="text-primary-text/40 text-sm">
            Check back later for new events
          </div>
        </div>
      )}
    </div>
  );
}
