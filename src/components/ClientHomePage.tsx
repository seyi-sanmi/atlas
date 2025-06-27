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
import Hero from "./hero";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Simple cache to avoid repeated queries
  const [cachedEvents, setCachedEvents] = useState<Event[]>(initialEvents);
  const [lastCacheTime, setLastCacheTime] = useState<number>(Date.now());

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

  const handleEventSelect = (event: Event) => {
    console.log("Selected event:", event);
    setSelectedEvent(event);
  };

  const handleEventImported = async () => {
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
      <Header onEventImported={handleEventImported} />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        events={events}
        onEventSelect={handleEventSelect}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl sm:flex">
          <div className=" min-h-screen lg:w-2/3">
            <div className="p-2 sm:p-8 sm:pt-4">
              <EventsList
                events={events}
                onEventSelect={handleEventSelect}
                selectedEvent={selectedEvent}
                loading={isLoadingEvents}
              />
            </div>
          </div>

          <div className="hidden lg:block lg:w-1/3 mt-20">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <EventFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Filter Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#D45E3C] hover:to-[#AE3813] text-primary-text p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm border border-white/10">
              <SlidersHorizontal className="w-6 h-6" />
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
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
