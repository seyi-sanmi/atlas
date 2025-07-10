"use client";

import { useState, useEffect, useRef } from "react";
import { getUniqueLocations, getUniqueAIEventTypes, getUniqueAIInterestAreas } from "@/lib/events";
import { EVENT_TYPES } from "@/lib/event-categorizer";

interface EventFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedInterestAreas?: string[];
  onInterestAreasChange?: (areas: string[]) => void;
  selectedDate?: Date | null;
  onDateChange: (date: Date | null) => void;
  refreshTrigger?: number; // Optional prop to trigger refresh of filter options
  onSubmitEvent?: () => void; // Callback to open the import event modal
}

export default function EventFilter({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
  selectedInterestAreas = [],
  onInterestAreasChange,
  selectedDate,
  onDateChange,
  refreshTrigger,
  onSubmitEvent,
}: EventFilterProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    null
  );
  const [locations, setLocations] = useState<string[]>(["All Locations"]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [interestAreas, setInterestAreas] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const locationsRef = useRef<HTMLDivElement>(null);
  const eventTypesRef = useRef<HTMLDivElement>(null);
  const interestAreasRef = useRef<HTMLDivElement>(null);

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.getElementById(
          "search-input"
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown === "locations" &&
        locationsRef.current &&
        !locationsRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "eventTypes" &&
        eventTypesRef.current &&
        !eventTypesRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "interestAreas" &&
        interestAreasRef.current &&
        !interestAreasRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Load dynamic filter options (cities, AI event types, and interest areas)
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);
        
        // Load cities, AI event types, and AI interest areas
        const [uniqueCities, aiEventTypesFromDB, aiInterestAreasFromDB] = await Promise.all([
          getUniqueLocations(),
          getUniqueAIEventTypes(),
          getUniqueAIInterestAreas()
        ]);

        setLocations(["All Locations", ...uniqueCities]);
        
        // Use AI event types from database if available, fallback to predefined types
        const availableEventTypes = aiEventTypesFromDB.length > 0 
          ? aiEventTypesFromDB 
          : EVENT_TYPES.slice(); // Remove 'as const' constraint
          
        setEventTypes(["All Types", ...availableEventTypes]);
        setInterestAreas(aiInterestAreasFromDB);
      } catch (error) {
        console.error("Failed to load filter options:", error);
        // Fallback to static data if API fails
        setLocations(["All Locations", "London", "Glasgow", "Online"]);
        setEventTypes(["All Types", ...EVENT_TYPES.slice()]);
        setInterestAreas([]);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, [refreshTrigger]);

  // Sync local state with parent props for locations
  useEffect(() => {
    if (selectedLocation && selectedLocation !== "All Locations") {
      setSelectedLocations([selectedLocation]);
    } else {
      setSelectedLocations([]);
    }
  }, [selectedLocation]);

  // Sync local state with parent props for event types
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "All Types") {
      setSelectedEventTypes([selectedCategory]);
    } else {
      setSelectedEventTypes([]);
    }
  }, [selectedCategory]);

  // Sync local state with parent props for interest areas
  useEffect(() => {
    setSelectedResearchAreas(selectedInterestAreas || []);
  }, [selectedInterestAreas]);

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
    if (eventType === "All Types") {
      setSelectedEventTypes([]);
      onCategoryChange("");
    } else if (selectedEventTypes.includes(eventType)) {
      setSelectedEventTypes([]);
      onCategoryChange("");
    } else {
      setSelectedEventTypes([eventType]);
      onCategoryChange(eventType);
    }
  };

  const toggleInterestArea = (area: string) => {
    if (selectedResearchAreas.includes(area)) {
      const updatedAreas = selectedResearchAreas.filter(a => a !== area);
      setSelectedResearchAreas(updatedAreas);
      onInterestAreasChange?.(updatedAreas);
    } else {
      const updatedAreas = [...selectedResearchAreas, area];
      setSelectedResearchAreas(updatedAreas);
      onInterestAreasChange?.(updatedAreas);
    }
  };

  const toggleDropdown = (type: string) => {
    setOpenDropdown(type);
  };

  const clearInterestAreas = () => {
    setSelectedResearchAreas([]);
    onInterestAreasChange?.([]);
    setOpenDropdown(null);
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
          className="text-center text-primary-text/40 text-sm font-medium p-2 "
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
      const calendarDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const isSelected =
        selectedDate &&
        calendarDate.getFullYear() === selectedDate.getFullYear() &&
        calendarDate.getMonth() === selectedDate.getMonth() &&
        calendarDate.getDate() === selectedDate.getDate();

      days.push(
        <button
          key={day}
          onClick={() => {
            const newSelectedDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            );
            setSelectedCalendarDay(day);
            onDateChange(newSelectedDate);
          }}
          className={`font-sans p-1.5 px-1 cursor-pointer text-center rounded-sm hover:bg-white/20 transition-colors ${
            isSelected
              ? "bg-white/10 text-primary-text"
              : "dark:dark:text-gray-300 text-black/50"
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
        <div
          key={`next-${day}`}
          className="p-2 text-center text-primary-text/30"
        >
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
      className="p-6 pt-0 text-primary-text"
    >
      <div className="max-w-md mx-auto space-y-3 font-sans">
        {/* Active Filters Indicator */}
        {(searchQuery ||
          selectedLocation ||
          selectedCategory ||
          selectedResearchAreas.length > 0 ||
          selectedDate) && (
          <div className="bg-white/5 rounded-sm p-3 mb-4">
            <h4 className="text-sm font-medium text-primary-text/80 mb-2">
              Active Filters:
            </h4>
            <div className="flex flex-wrap gap-1 text-xs">
              {searchQuery && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedLocation && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedLocation}
                </span>
              )}
              {selectedCategory && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedCategory}
                </span>
              )}
              {selectedResearchAreas.map((area) => (
                <span
                  key={area}
                  className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full"
                >
                  {area}
                </span>
              ))}
              {selectedDate && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
            className="w-full dark:bg-white/5 bg-black/5 backdrop-blur-xs border dark:border-white/10 border-black/10 rounded-sm px-4 py-3 text-primary-text dark:placeholder-gray-300 placeholder-gray-600 focus:outline-none focus:border-gray-500"
            id="search-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-text/40 text-sm">
            ⌘ K
          </div>
        </div>

        {/* Submit Event Button */}
        <button 
          onClick={onSubmitEvent}
          className="w-full bg-white/30 text-primary-text/90 font-medium py-2.5 rounded-sm hover:bg-white hover:text-black transition-colors"
        >
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
                className="text-sm text-primary-text/60 hover:text-primary-text transition-colors"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>

        {/* Cities */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Cities</h3>
          <div className="flex flex-wrap gap-2">
            {isLoadingFilters ? (
              <div className="flex items-center gap-2 text-primary-text/60">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <span className="text-sm">Loading cities...</span>
              </div>
            ) : (
              locations.map((location) => (
                <button
                  key={location}
                  onClick={() => toggleLocation(location)}
                  className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    (location === "All Locations" &&
                      (!selectedLocation || selectedLocation === "")) ||
                    (location !== "All Locations" &&
                      selectedLocation === location)
                      ? "bg-white text-black"
                      : "bg-white/10 dark:text-gray-300 text-black/50 hover:bg-white/30"
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
                  (eventType === "All Types" &&
                    (!selectedCategory || selectedCategory === "")) ||
                  (eventType !== "All Types" && selectedCategory === eventType)
                    ? "bg-white text-black"
                    : "bg-white/10 dark:text-gray-300 text-black/50 hover:bg-white/20"
                }`}
              >
                {eventType}
              </button>
            ))}
          </div>
        </div>

        {/* Research Areas Dropdown */}
        <div className="relative" ref={interestAreasRef}>
          <button
            onClick={() => toggleDropdown("interestAreas")}
            className={`w-full bg-secondary-bg border text-primary-text/80 px-4 py-3 rounded-md hover:bg-white/5 transition-colors flex items-center justify-between ${
              selectedResearchAreas.length > 0 ? 'border-blue-500/50' : 'border-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              Research Area
              {selectedResearchAreas.length > 0 && (
                <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {selectedResearchAreas.length}
                </span>
              )}
            </span>
            <svg
              className="w-4 h-4 text-primary-text/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {openDropdown === "interestAreas" && (
            <div className="absolute top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-md shadow-lg w-full max-h-72 overflow-y-auto z-10 p-2">
              <div className="flex justify-between items-center p-2 border-b border-white/10 mb-2">
                <h4 className="font-semibold">Select Areas</h4>
                {selectedResearchAreas.length > 0 && (
                  <button 
                    onClick={clearInterestAreas}
                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {isLoadingFilters ? (
                <div className="p-4 text-center text-primary-text/60">
                  Loading...
                </div>
              ) : (
                interestAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleInterestArea(area)}
                    className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/10 transition-colors rounded-md flex items-center gap-3 ${
                      selectedResearchAreas.includes(area)
                        ? "text-blue-300"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-sm border-2 flex-shrink-0 ${
                        selectedResearchAreas.includes(area)
                          ? "bg-blue-500 border-blue-500"
                          : "border-white/20"
                      }`}
                    >
                      {selectedResearchAreas.includes(area) && (
                        <svg
                          className="w-full h-full text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span>{area}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Date Filter */}
        <div className="bg-secondary-bg border border-white/10 rounded-md p-4">
          <h3 className="text-lg font-medium font-display mb-2">Date</h3>
          <div className="flex items-center gap-2">
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
            <span className="text-lg font-medium font-display">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
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

          <div className="grid grid-cols-7 gap-1 mt-4">
            {renderCalendar()}
          </div>

          {selectedDate && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setSelectedCalendarDay(null);
                  onDateChange(null);
                }}
                className="text-sm text-primary-text/60 hover:text-primary-text transition-colors"
              >
                Clear date filter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
