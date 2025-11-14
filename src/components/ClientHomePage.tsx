"use client";
import Image from "next/image";
import { EventsList } from "./event/list";
import { Event } from "@/lib/supabase";
import { getAllEvents, searchAndFilterEvents } from "@/lib/events";
import { useState, useEffect, useRef } from "react";
import { Header } from "./event/header";
import EventFilter from "./event/list/filter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { SearchModal } from "@/components/SearchModal";
import { ImportEventModal } from "@/components/ImportEventModal";
import Hero from "./hero";
import { trackEventView, trackEventClick, trackEventDetailView } from "@/lib/event-tracking";
import { FeaturedEventCard } from "./event/list/featured-card";
import { Pause, Play } from "lucide-react";

interface ClientHomePageProps {
  initialEvents: Event[];
}

export function ClientHomePage({ initialEvents }: ClientHomePageProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedInterestAreas, setSelectedInterestAreas] = useState<string[]>(
    []
  );
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Simple cache to avoid repeated queries
  const [cachedEvents, setCachedEvents] = useState<Event[]>(initialEvents);
  const [lastCacheTime, setLastCacheTime] = useState<number>(Date.now());

  // filtered events
  const [featuredEventIndex, setFeaturedEventIndex] = useState(0);
const [isRotationPaused, setIsRotationPaused] = useState(false);

const featuredEvents = events.filter(
  (event) => event.is_starred || event.is_featured
);

useEffect(() => {
  if (featuredEvents.length <= 1 || isRotationPaused) return;

  const interval = setInterval(() => {
    setFeaturedEventIndex((prev) => (prev + 1) % featuredEvents.length);
  }, 30000); // 30 seconds

  return () => clearInterval(interval);
}, [featuredEvents.length, isRotationPaused]);

const currentFeaturedEvent = featuredEvents[featuredEventIndex];

  // Handle search and filtering (client-side filtering for better UX)
  useEffect(() => {
    const searchAndFilter = async () => {
      // Only show loading after 50ms delay to prevent flash for fast queries
      const loadingTimeout = setTimeout(() => {
        setIsLoadingEvents(true);
      }, 50);

      try {
        const filteredEvents = await searchAndFilterEvents({
          query: searchQuery,
          location: selectedLocation,
          category: selectedCategory,
          interestAreas: selectedInterestAreas,
          eventTypes: selectedEventTypes,
          date: selectedDate,
        });
        setEvents(filteredEvents);

        // Clear loading timeout if query was fast
        clearTimeout(loadingTimeout);
      } catch (error) {
        console.error("Failed to search events:", error);
        clearTimeout(loadingTimeout);
      } finally {
        setIsLoadingEvents(false);
      }
    };

    // If no filters are applied, use cached events
    if (
      !searchQuery &&
      !selectedLocation &&
      !selectedCategory &&
      selectedInterestAreas.length === 0 &&
      selectedEventTypes.length === 0 &&
      !selectedDate
    ) {
      setEvents(cachedEvents);
      return;
    }

    // Debounce only for search queries, make filters instant
    const debounceTime = searchQuery ? 150 : 0;
    const timeoutId = setTimeout(searchAndFilter, debounceTime);
    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    selectedLocation,
    selectedCategory,
    selectedInterestAreas,
    selectedEventTypes,
    selectedDate,
    cachedEvents,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Command+K search modal listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleEventSelect = async (event: Event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);

    // Track event detail view when user opens event details modal
    try {
      await trackEventDetailView(event);
    } catch (error) {
      console.error("Failed to track event detail view:", error);
    }
  };

  const handleEventClick = async (event: Event) => {
    // Track event click when user clicks "View Event" button  
    try {
      await trackEventClick(event);
    } catch (error) {
      console.error("Failed to track event click:", error);
    }
  };

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
  };

  const handleEventImported = async () => {
    // Close the import modal
    setIsImportModalOpen(false);

    // Clear cache and reload events
    setCachedEvents([]);
    setLastCacheTime(0);

    try {
      setIsLoadingEvents(true);
      const eventsData = await getAllEvents();
      setEvents(eventsData);
      setCachedEvents(eventsData);
      setLastCacheTime(Date.now());
    } catch (error) {
      console.error("Failed to reload events:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleTagClick = (tagType: "interest" | "eventType", value: string) => {
    if (tagType === "interest") {
      setSelectedInterestAreas((prev) => {
        if (prev.includes(value)) {
          return prev.filter((area) => area !== value);
        } else {
          return [...prev, value];
        }
      });
    } else if (tagType === "eventType") {
      setSelectedEventTypes((prev) => {
        if (prev.includes(value)) {
          return prev.filter((type) => type !== value);
        } else {
          return [...prev, value];
        }
      });
    }
  };

  const formatDateTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London",
      }),
      date: date.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Europe/London",
      }),
    };
  };

  const { time, date } = formatDateTime(currentTime);



  return (
    <>
      <Header
        onEventImported={handleEventImported}
        onOpenImportModal={handleOpenImportModal}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        events={events}
        onEventSelect={handleEventSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Import Event Modal */}
      <ImportEventModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onEventImported={handleEventImported}
      />

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main className="relative -mt-40 z-20">


  {/* Featured Event Section */}
  {currentFeaturedEvent && (
   <div className="flex justify-center mb-6 px-4">
  <div className="w-[350px] sm:w-full max-w-[1070px] lg:max-w-[1070px]">

            <FeaturedEventCard
        date={currentFeaturedEvent.date}
        event={currentFeaturedEvent}
        onClick={() => handleEventSelect(currentFeaturedEvent)}
        onEventClick={() => handleEventClick(currentFeaturedEvent)}
        isSelected={selectedEvent?.id === currentFeaturedEvent.id}
        eventIndex={featuredEventIndex}
        onPrevious={() => 
          setFeaturedEventIndex((prev) =>
            prev === 0 ? featuredEvents.length - 1 : prev - 1
          )
        }
        onNext={() =>
          setFeaturedEventIndex(
            (prev) => (prev + 1) % featuredEvents.length
          )
        }
        hasMultiple={featuredEvents.length > 1}
        onTagClick={handleTagClick}
        selectedInterestAreas={selectedInterestAreas}
        selectedEventTypes={selectedEventTypes}
      />

      {/* Rotation Controls */}
      {featuredEvents.length > 1 && (
        <div className="flex flex-col items-center gap-3 mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRotationPaused(!isRotationPaused)}
              className="p-2 rounded-full bg-primary-text/10 hover:bg-primary-text/20 transition-colors duration-200"
              aria-label={
                isRotationPaused ? "Resume rotation" : "Pause rotation"
              }
            >
              {isRotationPaused ? (
                <Play className="w-4 h-4 text-primary-text/70" />
              ) : (
                <Pause className="w-4 h-4 text-primary-text/70" />
              )}
            </button>
            <div className="flex gap-2">
              {featuredEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setFeaturedEventIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === featuredEventIndex
                      ? "bg-[#AE3813] scale-125"
                      : "bg-primary-text/30 hover:bg-primary-text/50"
                  }`}
                  aria-label={`Go to featured event ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  )}



        <div className="container mx-auto px-4 sm:px-4 max-w-6xl sm:flex">
      
          <div className=" min-h-screen lg:w-2/3">
        
            <div className="p-2 sm:p-8 sm:pt-4">
              <EventsList
                events={events}
                onEventSelect={handleEventSelect}
                onEventClick={handleEventClick}
                selectedEvent={selectedEvent}
                loading={isLoadingEvents}
                onTagClick={handleTagClick}
                selectedInterestAreas={selectedInterestAreas}
                selectedEventTypes={selectedEventTypes}
              />
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3 mt-20 custom-scrollbar">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <EventFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedInterestAreas={selectedInterestAreas}
                onInterestAreasChange={setSelectedInterestAreas}
                selectedEventTypes={selectedEventTypes}
                onEventTypesChange={setSelectedEventTypes}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onSubmitEvent={handleOpenImportModal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-secondary-bg/80 hover:bg-secondary-bg text-primary-text/70 hover:text-primary-text p-3 rounded-lg shadow-lg transition-all duration-300 backdrop-blur-sm border border-primary-border/30">
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[85vh] bg-primary-bg border-t border-gray-800"
          >
            <SheetHeader className="p-6 pb-4 border-b border-gray-800">
              <SheetTitle className="text-xl font-semibold text-primary-text">
                Filter Events
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <EventFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedInterestAreas={selectedInterestAreas}
                onInterestAreasChange={setSelectedInterestAreas}
                selectedEventTypes={selectedEventTypes}
                onEventTypesChange={setSelectedEventTypes}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                onSubmitEvent={handleOpenImportModal}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
