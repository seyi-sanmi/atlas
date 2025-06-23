"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import EventFilter from "../event/list/filter";
import { EventsList } from "../event/list";
import { Header } from "../event/header";
import { EventCard } from "../event/list/card";
import Hero from "../hero";

export interface Event {
  id: string;
  title: string;
  date: string; // Format: "2025-06-15" for proper date sorting
  time: string;
  location: string;
  city: string; // City for location-based filtering
  description: string;
  categories: string[];
  organizer: string;
  presented_by?: string;
  isFeatured?: boolean;
  url?: string; // Optional URL to the original event page
  image_url?: string; // Optional URL to the event image
  links?: string[]; // Optional array of links extracted from the event page
}
export const events: Event[] = [
  {
    id: "1",
    title: "Summer Art Exhibition",
    date: "2025-06-15",
    time: "18:30 - 21:00",
    location: "Tate Modern, London",
    city: "London",
    description:
      "Explore contemporary art from emerging artists across London. This exhibition features paintings, sculptures, and digital art installations that explore themes of urban life.",
    categories: ["Art", "Exhibition"],
    organizer: "Tate Modern",
    url: "https://www.tate.org.uk/visit/tate-modern",
    image_url:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", // Art gallery
  },
  {
    id: "2",
    title: "London Tech Meetup",

    date: "2025-06-15",
    time: "10:00 - 18:00",
    location: "Old Street, London",
    city: "London",
    description:
      "Join us for an evening of tech talks, networking, and refreshments. We'll have speakers from leading tech companies discussing the latest trends in AI and machine learning.",
    categories: ["Tech", "Networking"],
    organizer: "London Tech Community",
    url: "https://www.meetup.com/london-tech-meetup",
    image_url:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&q=80", // Tech meetup
  },
  {
    id: "3",
    title: "Financial Markets Workshop",
    date: "2025-06-20",
    time: "09:00 - 17:00",
    location: "Canary Wharf, London",
    city: "London",
    description:
      "A full-day workshop on understanding financial markets, investment strategies, and economic trends. Perfect for finance professionals and enthusiasts alike.",
    categories: ["Finance", "Workshop"],
    organizer: "London Business School",
    image_url:
      "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80", // Finance/Canary Wharf
  },
  {
    id: "4",
    title: "London Jazz Festival",
    date: "2025-06-22",
    // Fixed multi-day event date
    time: "Various times",
    location: "South Bank, London",
    city: "London",
    description:
      "The annual jazz festival returns with performances from world-renowned jazz musicians and local talent. Enjoy four days of music across multiple venues (June 22-25).",
    categories: ["Music", "Festival"],
    organizer: "London Music Arts",
    image_url:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80", // Jazz music
  },
  {
    id: "5",
    title: "Sustainable Fashion Panel",
    date: "2025-06-27",
    time: "19:00 - 21:00",
    location: "Shoreditch, London",
    city: "London",
    description:
      "Join industry experts for a discussion on sustainable fashion practices, ethical sourcing, and the future of eco-friendly clothing production.",
    categories: ["Fashion", "Sustainability"],
    organizer: "Fashion Forward UK",
    image_url:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80", // Sustainable fashion
  },
  {
    id: "6",
    title: "London Food Market Tour",
    date: "2025-07-01",
    time: "11:00 - 14:00",
    location: "Borough Market",
    city: "London",
    description:
      "Discover the best of London's food scene with a guided tour through one of the city's oldest and most famous food markets. Includes tastings from various vendors.",
    categories: ["Food", "Tour"],
    organizer: "London Food Guides",
    image_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80", // Food market
  },
  {
    id: "7",
    title: "Web Development Bootcamp",
    date: "2025-07-03",
    // Fixed multi-day event date
    time: "09:00 - 17:00",
    location: "King's Cross, London",
    city: "London",
    description:
      "An intensive 5-day bootcamp covering front-end and back-end web development. Learn HTML, CSS, JavaScript, and modern frameworks from industry professionals (July 3-7).",
    categories: ["Tech", "Education"],
    organizer: "Code Academy London",
    image_url:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80", // Coding bootcamp
  },
  {
    id: "8",
    title: "Urban Photography Walk",
    date: "2025-07-09",
    time: "14:00 - 17:00",
    location: "South Bank, London",
    city: "London",
    description:
      "Capture London's iconic skyline and hidden corners on this guided photography walk. Suitable for all skill levels, bring your own camera or smartphone.",
    categories: ["Photography", "Outdoors"],
    organizer: "London Photography Club",
    image_url:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80", // Urban photography
  },
  {
    id: "9",
    title: "Startup Pitch Night",
    date: "2025-07-12",
    time: "18:00 - 21:00",
    location: "Liverpool Street",
    city: "London",
    description:
      "Watch London's most promising startups pitch their ideas to investors and industry experts. Networking opportunities and refreshments provided.",
    categories: ["Business", "Networking"],
    organizer: "London Startups",
    url: "https://www.eventbrite.com/e/startup-pitch-night-tickets",
    image_url:
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
  },
];

function ClientFundingPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Typewriter effect for city and background image

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleEventSelect = (event: Event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);
  };

  const formatDateTime = (date: Date) => {};

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

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl sm:flex">
          <div className=" min-h-screen lg:w-2/3">
            <div className="p-2 sm:p-8">
              <div className="w-full space-y-12">
                {groupedEvents.map(({ date, events: dateEvents }) => {
                  const formattedDate = formatDayDate(date);
                  const isCollapsed = collapsedSections.has(date);

                  return (
                    <section key={date} className="">
                      <div className="data-atlas-overlay-nav">
                        <div className="atlas-overlay-notch bg-[#1E1E25] border-t border-b border-[#565558] border-l">
                          <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-white tracking-wide pl-1">
                            {formattedDate}
                            <div className="w-1 h-1 bg-white/60 rounded-full" />
                            <span className="text-[12px] sm:text-base shrink-0 font-light text-white/60">
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
                            className="atlas-overlay-notch-tail"
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
                                <rect
                                  fill="white"
                                  y="-1"
                                  width="60"
                                  height="43"
                                ></rect>
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
                                fill="#1E1E25"
                              ></path>
                              <path
                                d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                                fill="#565558"
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
                              onClick={() => handleEventSelect(event)}
                              isSelected={selectedEvent?.id === event.id}
                              showTime={
                                eventIndex === 0 ||
                                event.time !== dateEvents[eventIndex - 1]?.time
                              }
                              isFirstInGroup={eventIndex === 0}
                              isLastInGroup={
                                eventIndex === dateEvents.length - 1
                              }
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
                    <div className="text-white/60 text-lg font-medium mb-2">
                      No events found
                    </div>
                    <div className="text-white/40 text-sm">
                      Check back later for new events
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3 mt-20">
            {/* <EventFilter  /> */}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientFundingPage;
