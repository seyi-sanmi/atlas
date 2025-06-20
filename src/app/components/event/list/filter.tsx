"use client";

import { useState, useEffect } from "react";
import { getUniqueLocations, getUniqueCategories } from "@/lib/events";

interface EventFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedDate?: Date | null;
  onDateChange: (date: Date | null) => void;
  refreshTrigger?: number; // Optional prop to trigger refresh of filter options
}

export default function EventFilter({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
  selectedDate,
  onDateChange,
  refreshTrigger,
}: EventFilterProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [locations, setLocations] = useState<string[]>(["All Locations"]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Static event types
  const staticEventTypes = [
    "Hackathon",
    "Workshop", 
    "Conference",
    "Meetup",
    "Webinar",
  ];

  // Load dynamic filter options (locations only)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);
        const uniqueLocations = await getUniqueLocations();
        
        setLocations(["All Locations", ...uniqueLocations]);
        setEventTypes(staticEventTypes);
      } catch (error) {
        console.error('Failed to load filter options:', error);
        // Fallback to static data if API fails
        setLocations(["All Locations", "London", "Remote"]);
        setEventTypes(staticEventTypes);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, [refreshTrigger]);

  const toggleLocation = (location: string) => {
    if (location === "All Locations") {
      onLocationChange("");
      setSelectedLocations([]);
    } else {
      onLocationChange(location);
      setSelectedLocations([location]);
    }
  };

  const toggleEventType = (eventType: string) => {
    if (selectedEventTypes.includes(eventType)) {
      setSelectedEventTypes([]);
      onCategoryChange("");
    } else {
      setSelectedEventTypes([eventType]);
      onCategoryChange(eventType);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

    // Add day headers
    dayNames.forEach((day) => {
      days.push(
        <div
          key={day}
          className="text-center text-white/40 text-sm font-medium p-2 "
        >
          {day}
        </div>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const calendarDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isSelected = selectedDate && 
        calendarDate.getFullYear() === selectedDate.getFullYear() &&
        calendarDate.getMonth() === selectedDate.getMonth() &&
        calendarDate.getDate() === selectedDate.getDate();
      
      days.push(
        <button
          key={day}
          onClick={() => {
            const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            setSelectedCalendarDay(day);
            onDateChange(newSelectedDate);
          }}
          className={`font-sans p-1.5 px-1 cursor-pointer text-center rounded-sm hover:bg-white/20 transition-colors ${
            isSelected ? "bg-white/10 text-white" : "text-gray-300"
          }`}
        >
          {day}
        </button>
      );
    }

    // Add days from next month to fill the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
      days.push(
        <div key={`next-${day}`} className="p-2 text-center text-white/30">
          {day}
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <div
      //   style={{ backgroundColor: "#1E1E25" }}
      className="p-6 pt-0 text-white"
    >
      <div className="max-w-md mx-auto space-y-3 font-sans">
        {/* Active Filters Indicator */}
        {(searchQuery || selectedLocation || selectedCategory || selectedDate) && (
          <div className="bg-white/5 rounded-sm p-3 mb-4">
            <h4 className="text-sm font-medium text-white/80 mb-2">Active Filters:</h4>
            <div className="flex flex-wrap gap-1 text-xs">
              {searchQuery && (
                <span className="bg-[#AE3813] text-white px-2 py-1 rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedLocation && (
                <span className="bg-[#AE3813] text-white px-2 py-1 rounded-full">
                  {selectedLocation}
                </span>
              )}
              {selectedCategory && (
                <span className="bg-[#AE3813] text-white px-2 py-1 rounded-full">
                  {selectedCategory}
                </span>
              )}
              {selectedDate && (
                <span className="bg-[#AE3813] text-white px-2 py-1 rounded-full">
                  {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        )}
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-xs border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-gray-500"
            id="search-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
            ⌘ K
          </div>
        </div>

        {/* Submit Event Button */}
        <button className="w-full bg-white/30 text-white/90 font-medium py-2.5 rounded-sm hover:bg-white hover:text-black transition-colors">
          Submit Event
        </button>

        {/* Calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-white/10 rounded-sm transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-medium font-display">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white/10 rounded-sm transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
          
          {/* Clear Date Filter */}
          {selectedDate && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setSelectedCalendarDay(null);
                  onDateChange(null);
                }}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Locations</h3>
          <div className="flex flex-wrap gap-2">
            {isLoadingFilters ? (
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <span className="text-sm">Loading locations...</span>
              </div>
            ) : (
              locations.map((location) => (
                <button
                  key={location}
                  onClick={() => toggleLocation(location)}
                  className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    (location === "All Locations" && !selectedLocation) || 
                    (location !== "All Locations" && selectedLocation === location)
                      ? "bg-white text-black"
                      : "bg-white/10 text-gray-300 hover:bg-white/30"
                  }`}
                >
                  {location}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Event Type */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Event Type</h3>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((eventType) => (
              <button
                key={eventType}
                onClick={() => toggleEventType(eventType)}
                className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === eventType
                    ? "bg-white text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                {eventType}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
