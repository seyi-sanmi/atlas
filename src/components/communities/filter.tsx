"use client";

import { useState, useEffect } from "react";
import { getUniqueCommunityTypes, getUniqueCommunityLocations } from "@/lib/communities";

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
          getUniqueCommunityLocations()
        ]);

        setLocations(["All Locations", ...uniqueLocations.sort()]);
        setCommunityTypes(["All Types", ...uniqueCommunityTypes.sort()]);
        
        // For research areas, we'll use a basic set for now since we don't have a specific function
        // You could add a getUniqueResearchAreas function to the communities library if needed
        setResearchAreas(["All Areas", "Biotechnology", "AI", "Climate Tech", "Quantum Computing", "Sustainable Materials"]);
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

  return (
    <div className="p-6 pt-0 text-white">
      <div className="max-w-md mx-auto space-y-3 font-sans">
        {/* Active Filters Indicator */}
        {(searchQuery || selectedLocation || selectedCategory) && (
          <div className="bg-white/5 rounded-sm p-3 mb-4">
            <h4 className="text-sm font-medium text-white/80 mb-2">
              Active Filters:
            </h4>
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
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-xs border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-gray-500"
            id="search-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 text-sm">
            ⌘ K
          </div>
        </div>

        {/* Submit Community Button */}
        <button className="w-full bg-white/30 text-white/90 font-medium py-2.5 rounded-sm hover:bg-white hover:text-black transition-colors">
          Submit Community
        </button>

        {/* Map Embed */}
        <div className="space-y-4 mt-2">
          <h3 className="text-lg font-medium font-display">
            Community Locations
          </h3>
          <div className="relative rounded-sm overflow-hidden border border-white/10">
            <iframe
              style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
              width="100%"
              height="300"
              src="https://www.pampam.city/p/XiqWeDFwiAEME5CkC7CG"
              allowFullScreen
              className="rounded-sm"
            />
          </div>
        </div>

        {/* Geographic Locations */}
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
                    (location === "All Locations" &&
                      (!selectedLocation || selectedLocation === "")) ||
                    (location !== "All Locations" &&
                      selectedLocation === location)
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

        {/* Community Type */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Community Type</h3>
          <div className="flex flex-wrap gap-2">
            {isLoadingFilters ? (
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <span className="text-sm">Loading types...</span>
              </div>
            ) : (
              communityTypes.map((communityType) => (
                <button
                  key={communityType}
                  onClick={() => toggleCommunityType(communityType)}
                  className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    (communityType === "All Types" &&
                      (!selectedCategory || selectedCategory === "")) ||
                    (communityType !== "All Types" &&
                      selectedCategory === communityType)
                      ? "bg-white text-black"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {communityType}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Research Areas */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Research Areas</h3>
          <div className="flex flex-wrap gap-2">
            {isLoadingFilters ? (
              <div className="flex items-center gap-2 text-white/60">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <span className="text-sm">Loading areas...</span>
              </div>
            ) : (
              researchAreas.slice(0, 10).map((area) => (
                <button
                  key={area}
                  onClick={() => toggleResearchArea(area)}
                  className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                    (area === "All Areas" &&
                      selectedResearchAreas.length === 0) ||
                    (area !== "All Areas" &&
                      selectedResearchAreas.includes(area))
                      ? "bg-white text-black"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {area}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
