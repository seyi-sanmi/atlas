"use client";

import { useState, useEffect, useRef } from "react";
import {
  getUniqueCommunityTypes,
  getUniqueCommunityLocations,
  getUniqueResearchAreas,
} from "@/lib/communities";
import { Search, X } from "lucide-react";

interface CommunitiesFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedResearchAreas: string[];
  onResearchAreasChange: (areas: string[]) => void;
  selectedDate?: Date | null;
  onDateChange: (date: Date | null) => void;
  refreshTrigger?: number;
}

export default function CommunitiesFilter({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
  selectedResearchAreas,
  onResearchAreasChange,
  selectedDate,
  onDateChange,
  refreshTrigger,
}: CommunitiesFilterProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCommunityTypes, setSelectedCommunityTypes] = useState<
    string[]
  >([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [communityTypes, setCommunityTypes] = useState<string[]>([]);
  const [researchAreas, setResearchAreas] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const locationsRef = useRef<HTMLDivElement>(null);
  const typesRef = useRef<HTMLDivElement>(null);
  const researchAreasRef = useRef<HTMLDivElement>(null);

  // Handle Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.getElementById(
          "communities-search-input"
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
        openDropdown === "types" &&
        typesRef.current &&
        !typesRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      } else if (
        openDropdown === "research" &&
        researchAreasRef.current &&
        !researchAreasRef.current.contains(event.target as Node)
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

  // Load filter options from Supabase
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);

        // Fetch unique community types, locations, and research areas from Supabase
        const [uniqueCommunityTypes, uniqueLocations, uniqueResearchAreas] = await Promise.all([
          getUniqueCommunityTypes(),
          getUniqueCommunityLocations(),
          getUniqueResearchAreas(),
        ]);

        setLocations(["All Locations", ...uniqueLocations.sort()]);
        setCommunityTypes(["All Types", ...uniqueCommunityTypes.sort()]);
        setResearchAreas(uniqueResearchAreas.sort());
      } catch (error) {
        console.error("Failed to load filter options:", error);
        // Fallback to basic options
        setLocations([
          "All Locations",
          "Boston, MA",
          "San Francisco, CA",
          "Online",
        ]);
        setCommunityTypes([
          "All Types",
          "Founder & Investor Network",
          "Academic Research",
        ]);
        setResearchAreas([
          "Biotechnology",
          "AI",
          "Climate Tech",
          "Quantum Computing",
        ]);
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

  // Sync local state with parent props for community types
  useEffect(() => {
    if (selectedCategory && selectedCategory !== "All Types") {
      setSelectedCommunityTypes([selectedCategory]);
    } else {
      setSelectedCommunityTypes([]);
    }
  }, [selectedCategory]);

  const toggleLocation = (location: string) => {
    if (location === "All Locations") {
      onLocationChange("");
      setSelectedLocations([]);
    } else {
      onLocationChange(location);
      setSelectedLocations([location]);
    }
  };

  const toggleCommunityType = (communityType: string) => {
    if (communityType === "All Types") {
      setSelectedCommunityTypes([]);
      onCategoryChange("");
    } else if (selectedCommunityTypes.includes(communityType)) {
      setSelectedCommunityTypes([]);
      onCategoryChange("");
    } else {
      setSelectedCommunityTypes([communityType]);
      onCategoryChange(communityType);
    }
  };

  const toggleResearchArea = (area: string) => {
    if (selectedResearchAreas.includes(area)) {
      onResearchAreasChange(selectedResearchAreas.filter(a => a !== area));
    } else {
      onResearchAreasChange([...selectedResearchAreas, area]);
    }
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const clearAllFilters = () => {
    onSearchChange("");
    onLocationChange("");
    onCategoryChange("");
    onResearchAreasChange([]);
    setSelectedLocations([]);
    setSelectedCommunityTypes([]);
  };

  return (
    <div className="text-primary-text">
      <div className="max-w-6xl mx-auto font-sans">
        {/* Search and Filters in Single Row */}
        <div className="flex flex-wrap gap-4 items-center justify-center mx-auto">
          {/* Search Input - Smaller */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-primary-text/60" />
            </div>
            <input
              id="communities-search-input"
              type="text"
              placeholder="Search communities..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-60 pl-9 pr-9 py-3 bg-white/10 backdrop-blur-sm text-primary-text placeholder-primary-text/60 border border-white/20 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#AE3813] focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-primary-text/60 hover:text-primary-text" />
              </button>
            )}
          </div>

          {/* Locations Dropdown */}
          <div className="relative z-[9999999]" ref={locationsRef}>
            <button
              onClick={() => toggleDropdown("locations")}
              className="dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[140px] justify-between"
            >
              <span>{selectedLocation || "Locations"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "locations" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openDropdown === "locations" && (
              <div className="z-[9999999] absolute isolate top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-sm shadow-lg min-w-[220px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-primary-text/60">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading locations...
                  </div>
                ) : (
                  locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => {
                        toggleLocation(location);
                      }}
                      className={`w-full z-[9999999] text-left px-4 py-2 hover:dark:bg-white/10 bg-black/5 backdrop-blur-xs transition-colors ${
                        (location === "All Locations" &&
                          (!selectedLocation || selectedLocation === "")) ||
                        (location !== "All Locations" &&
                          selectedLocation === location)
                          ? "bg-white/20 text-primary-text"
                          : "dark:text-gray-300 text-black/50"
                      }`}
                    >
                      {location}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Community Types Dropdown */}
          <div className="relative z-[9999999]" ref={typesRef}>
            <button
              onClick={() => toggleDropdown("types")}
              className="dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between"
            >
              <span>{selectedCategory || "Community Type"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "types" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openDropdown === "types" && (
              <div className="absolute top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-sm shadow-lg z-[9999999] min-w-[260px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-primary-text/60">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading types...
                  </div>
                ) : (
                  communityTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        toggleCommunityType(type);
                      }}
                      className={`w-full text-left px-4 py-2 hover:dark:bg-white/10 bg-black/5 backdrop-blur-xs transition-colors ${
                        (type === "All Types" && !selectedCategory) ||
                        (type !== "All Types" &&
                          selectedCategory === type)
                          ? "bg-white/20 text-primary-text"
                          : "dark:text-gray-300 text-black/50"
                      }`}
                    >
                      {type}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Research Areas Dropdown */}
          <div className="relative" ref={researchAreasRef}>
            <button
              onClick={() => toggleDropdown("research")}
              className={`dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between ${
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
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "research" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openDropdown === "research" && (
              <div className="absolute top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-md shadow-lg w-[300px] max-h-80 overflow-y-auto z-10 p-2">
                <div className="flex justify-between items-center p-2 border-b border-white/10 mb-2">
                  <h4 className="font-semibold">Filter by Research Area</h4>
                  {selectedResearchAreas.length > 0 && (
                    <button
                      onClick={() => onResearchAreasChange([])}
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
                  researchAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleResearchArea(area)}
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

          {/* Clear Filters Button */}
          {(searchQuery || selectedLocation || selectedCategory || selectedResearchAreas.length > 0) && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-primary-text/60 hover:text-primary-text underline"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Active Filters Indicator - Compact */}
        {(searchQuery || selectedLocation || selectedCategory || selectedResearchAreas.length > 0) && (
          <div className="mt-3 text-center">
            <div className="inline-flex flex-wrap gap-2 text-xs">
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
                  className="bg-blue-600 text-primary-text px-2 py-1 rounded-full"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
