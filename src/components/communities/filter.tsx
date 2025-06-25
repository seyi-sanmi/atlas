"use client";

import { useState, useEffect } from "react";
import {
  getUniqueCommunityTypes,
  getUniqueCommunityLocations,
} from "@/lib/communities";
import { Search } from "lucide-react";

interface CommunitiesFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
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
  selectedDate,
  onDateChange,
  refreshTrigger,
}: CommunitiesFilterProps) {
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCommunityTypes, setSelectedCommunityTypes] = useState<
    string[]
  >([]);
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>(
    []
  );
  const [locations, setLocations] = useState<string[]>([]);
  const [communityTypes, setCommunityTypes] = useState<string[]>([]);
  const [researchAreas, setResearchAreas] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Load filter options from Supabase
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);

        // Fetch unique community types and locations from Supabase
        const [uniqueCommunityTypes, uniqueLocations] = await Promise.all([
          getUniqueCommunityTypes(),
          getUniqueCommunityLocations(),
        ]);

        setLocations(["All Locations", ...uniqueLocations.sort()]);
        setCommunityTypes(["All Types", ...uniqueCommunityTypes.sort()]);

        // For research areas, we'll use a basic set for now since we don't have a specific function
        // You could add a getUniqueResearchAreas function to the communities library if needed
        setResearchAreas([
          "All Areas",
          "Biotechnology",
          "AI",
          "Climate Tech",
          "Quantum Computing",
          "Sustainable Materials",
        ]);
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
        setResearchAreas(["All Areas", "Biotechnology", "AI", "Climate Tech"]);
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
    if (area === "All Areas") {
      setSelectedResearchAreas([]);
    } else if (selectedResearchAreas.includes(area)) {
      setSelectedResearchAreas(selectedResearchAreas.filter((a) => a !== area));
    } else {
      setSelectedResearchAreas([...selectedResearchAreas, area]);
    }
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className=" text-white">
      <div className="max-w-6xl mx-auto space-y-4 font-sans">
        {/* Main Filter Row */}
        <div className="flex flex-wrap gap-4 items-center justify-center mx-auto">
          {/* Search with Button */}
          <button className="flex space-x-1.5 items-center bg-white/20  backdrop-blur-xs text-white/90 font-normal px-3.5 py-3 rounded-sm hover:bg-white hover:text-black transition-colors whitespace-nowrap">
            <Search size={18} />
            <span>Search</span>
          </button>

          {/* Locations Dropdown */}
          <div className="relative z-[9999999]">
            <button
              onClick={() => toggleDropdown("locations")}
              className="bg-white/10 backdrop-blur-xs text-white px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[140px] justify-between"
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
              <div className="z-[9999999] absolute isolate top-full left-0 mt-1 bg-[#1E1E25] border border-white/10 rounded-sm shadow-lg min-w-[220px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-white/60">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading locations...
                  </div>
                ) : (
                  locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => {
                        toggleLocation(location);
                        setOpenDropdown(null);
                      }}
                      className={`w-full z-[9999999] text-left px-4 py-2 hover:bg-white/10 backdrop-blur-xs transition-colors ${
                        (location === "All Locations" &&
                          (!selectedLocation || selectedLocation === "")) ||
                        (location !== "All Locations" &&
                          selectedLocation === location)
                          ? "bg-white/20 text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {location}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Community Type Dropdown */}
          <div className="relative z-[9999999]">
            <button
              onClick={() => toggleDropdown("types")}
              className="bg-white/10 backdrop-blur-xs text-white px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between"
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
              <div className="absolute top-full left-0 mt-1 bg-[#1E1E25] border border-white/10 rounded-sm shadow-lg z-[9999999] min-w-[260px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-white/60">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading types...
                  </div>
                ) : (
                  communityTypes.map((communityType) => (
                    <button
                      key={communityType}
                      onClick={() => {
                        toggleCommunityType(communityType);
                        setOpenDropdown(null);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 backdrop-blur-xs transition-colors ${
                        (communityType === "All Types" &&
                          (!selectedCategory || selectedCategory === "")) ||
                        (communityType !== "All Types" &&
                          selectedCategory === communityType)
                          ? "bg-white/20 text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {communityType}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Research Areas Dropdown */}
          <div className="relative z-[9999999]">
            <button
              onClick={() => toggleDropdown("research")}
              className="bg-white/10 backdrop-blur-xs text-white px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between"
            >
              <span>
                {selectedResearchAreas.length > 0
                  ? `Research (${selectedResearchAreas.length})`
                  : "Research Areas"}
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
              <div className="absolute top-full left-0 mt-1 bg-[#1E1E25] border border-white/10 rounded-sm shadow-lg z-[9999999] min-w-[200px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-white/60">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading areas...
                  </div>
                ) : (
                  researchAreas.map((area) => (
                    <button
                      key={area}
                      onClick={() => toggleResearchArea(area)}
                      className={`w-full text-left px-4 py-2 hover:bg-white/10 backdrop-blur-xs transition-colors ${
                        (area === "All Areas" &&
                          selectedResearchAreas.length === 0) ||
                        (area !== "All Areas" &&
                          selectedResearchAreas.includes(area))
                          ? "bg-white/20 text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {area}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {/* Active Filters Indicator */}
        {(searchQuery ||
          selectedLocation ||
          selectedCategory ||
          selectedResearchAreas.length > 0) && (
          <div className=" rounded-sm p-0">
            <h4 className="text-sm font-medium text-white/80 mb-2 flex justify-center items-center">
              Active Filters:
            </h4>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
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
              {selectedResearchAreas.map((area) => (
                <span
                  key={area}
                  className="bg-[#AE3813] text-white px-2 py-1 rounded-full"
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
