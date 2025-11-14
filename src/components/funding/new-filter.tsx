"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

interface FundingFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFunder: string;
  onFunderChange: (funder: string) => void;
  selectedFocusArea: string;
  onFocusAreaChange: (focusArea: string) => void;
  selectedAmountRange: string;
  onAmountRangeChange: (amountRange: string) => void;
  refreshTrigger?: number;
  onClearAll: () => void;
}

export default function NewFundingFilter({
  searchQuery,
  onSearchChange,
  selectedFunder,
  onFunderChange,
  selectedFocusArea,
  onFocusAreaChange,
  selectedAmountRange,
  onAmountRangeChange,
  refreshTrigger,
  onClearAll,
}: FundingFilterProps) {
  const [selectedFunders, setSelectedFunders] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedAmountRanges, setSelectedAmountRanges] = useState<string[]>(
    []
  );
  const [funders, setFunders] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [amountRanges, setAmountRanges] = useState<string[]>([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const fundersRef = useRef<HTMLDivElement>(null);
  const focusAreasRef = useRef<HTMLDivElement>(null);
  const amountRangesRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    searchQuery || selectedFunder || selectedFocusArea || selectedAmountRange;

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check for funders dropdown
      if (
        openDropdown === "funders" &&
        fundersRef.current &&
        !fundersRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
      // Check for focus areas dropdown
      else if (
        openDropdown === "focusAreas" &&
        focusAreasRef.current &&
        !focusAreasRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
      // Check for amount ranges dropdown
      else if (
        openDropdown === "amountRanges" &&
        amountRangesRef.current &&
        !amountRangesRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setIsLoadingFilters(true);

        // Set funding-specific filter options
        setFunders([
          "All Funders",
          "Innovate UK & The Social Tech Trust",
          "The Royal Society",
          "The Wellcome Trust",
          "National Heritage Fund",
          "The STEM Forward Foundation",
          "The Newton Society",
          "The Raspberry Pi Foundation",
        ]);

        setFocusAreas([
          "All Focus Areas",
          "Technology & Social Impact",
          "Scientific Research",
          "Heritage & Conservation",
          "Education & STEM",
        ]);

        setAmountRanges([
          "All Amounts",
          "Under £10k",
          "£10k - £50k",
          "£50k - £100k",
          "Over £100k",
        ]);
      } catch (error) {
        console.error("Failed to load filter options:", error);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFilterOptions();
  }, [refreshTrigger]);

  // Sync local state with parent props for funders
  useEffect(() => {
    if (selectedFunder && selectedFunder !== "All Funders") {
      setSelectedFunders([selectedFunder]);
    } else {
      setSelectedFunders([]);
    }
  }, [selectedFunder]);

  // Sync local state with parent props for focus areas
  useEffect(() => {
    if (selectedFocusArea && selectedFocusArea !== "All Focus Areas") {
      setSelectedFocusAreas([selectedFocusArea]);
    } else {
      setSelectedFocusAreas([]);
    }
  }, [selectedFocusArea]);

  // Sync local state with parent props for amount ranges
  useEffect(() => {
    if (selectedAmountRange && selectedAmountRange !== "All Amounts") {
      setSelectedAmountRanges([selectedAmountRange]);
    } else {
      setSelectedAmountRanges([]);
    }
  }, [selectedAmountRange]);

  const toggleFunder = (funder: string) => {
    if (funder === "All Funders") {
      onFunderChange("");
      setSelectedFunders([]);
    } else {
      onFunderChange(funder);
      setSelectedFunders([funder]);
    }
  };

  const toggleFocusArea = (focusArea: string) => {
    if (focusArea === "All Focus Areas") {
      setSelectedFocusAreas([]);
      onFocusAreaChange("");
    } else if (selectedFocusAreas.includes(focusArea)) {
      setSelectedFocusAreas([]);
      onFocusAreaChange("");
    } else {
      setSelectedFocusAreas([focusArea]);
      onFocusAreaChange(focusArea);
    }
  };

  const toggleAmountRange = (amountRange: string) => {
    if (amountRange === "All Amounts") {
      setSelectedAmountRanges([]);
      onAmountRangeChange("");
    } else if (selectedAmountRanges.includes(amountRange)) {
      setSelectedAmountRanges([]);
      onAmountRangeChange("");
    } else {
      setSelectedAmountRanges([amountRange]);
      onAmountRangeChange(amountRange);
    }
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  return (
    <div className=" text-primary-text">
      <div className="max-w-6xl mx-auto space-y-4 font-sans">
        {/* Main Filter Row */}
        <div className="flex flex-wrap gap-4 items-center justify-center mx-auto">
          {/* Search with Button */}
          <button className="flex space-x-1.5 items-center bg-white/20  backdrop-blur-xs text-primary-text/90 font-normal px-3.5 py-3 rounded-sm hover:bg-white hover:text-black transition-colors whitespace-nowrap">
            <Search size={18} />
            <span>Search</span>
          </button>

          {/* Funders Dropdown */}
          <div className="relative z-[9999999]" ref={fundersRef}>
            <button
              onClick={() => toggleDropdown("funders")}
              className="dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[140px] justify-between"
            >
              <span>{selectedFunder || "Funders"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "funders" ? "rotate-180" : ""
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
            {openDropdown === "funders" && (
              <div className="z-[9999999] absolute isolate top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-sm shadow-lg min-w-[280px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-primary-text/60">
                    <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading funders...
                  </div>
                ) : (
                  funders.map((funder) => (
                    <button
                      key={funder}
                      onClick={() => {
                        toggleFunder(funder);
                        setOpenDropdown(null);
                      }}
                      className={`w-full z-[9999999] text-left px-4 py-2 hover:dark:bg-white/10 bg-black/5 backdrop-blur-xs transition-colors ${
                        (funder === "All Funders" &&
                          (!selectedFunder || selectedFunder === "")) ||
                        (funder !== "All Funders" && selectedFunder === funder)
                          ? "bg-white/20 text-primary-text"
                          : "dark:text-gray-300 text-black/50"
                      }`}
                    >
                      {funder}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Focus Areas Dropdown */}
          <div className="relative z-[9999999]" ref={focusAreasRef}>
            <button
              onClick={() => toggleDropdown("focusAreas")}
              className="dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between"
            >
              <span>{selectedFocusArea || "Focus Area"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "focusAreas" ? "rotate-180" : ""
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
            {openDropdown === "focusAreas" && (
              <div className="absolute top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-sm shadow-lg z-[9999999] min-w-[220px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-primary-text/60">
                    <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading focus areas...
                  </div>
                ) : (
                  focusAreas.map((focusArea) => (
                    <button
                      key={focusArea}
                      onClick={() => toggleFocusArea(focusArea)}
                      className={`w-full text-left px-4 py-2 hover:dark:bg-white/10 bg-black/5 backdrop-blur-xs transition-colors ${
                        (focusArea === "All Focus Areas" &&
                          !selectedFocusArea) ||
                        selectedFocusAreas.includes(focusArea)
                          ? "bg-white/20 text-primary-text"
                          : "dark:text-gray-300 text-black/50"
                      }`}
                    >
                      {focusArea}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Amount Ranges Dropdown */}
          <div className="relative z-[9999999]" ref={amountRangesRef}>
            <button
              onClick={() => toggleDropdown("amountRanges")}
              className="dark:bg-white/10 bg-black/5 backdrop-blur-xs text-primary-text px-4 py-3 rounded-sm hover:bg-white/20 transition-colors flex items-center gap-2 whitespace-nowrap min-w-[160px] justify-between"
            >
              <span>{selectedAmountRange || "Amount Range"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  openDropdown === "amountRanges" ? "rotate-180" : ""
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
            {openDropdown === "amountRanges" && (
              <div className="absolute top-full left-0 mt-1 bg-secondary-bg border border-white/10 rounded-sm shadow-lg z-[9999999] min-w-[160px] max-h-60 overflow-y-auto">
                {isLoadingFilters ? (
                  <div className="p-3 text-center text-primary-text/60">
                    <div className="w-4 h-4 border-2 border-primary-border/90 border-t-white/60 rounded-full animate-spin mx-auto mb-2"></div>
                    Loading amount ranges...
                  </div>
                ) : (
                  amountRanges.map((amountRange) => (
                    <button
                      key={amountRange}
                      onClick={() => toggleAmountRange(amountRange)}
                      className={`w-full text-left px-4 py-2 hover:dark:bg-white/10 bg-black/5 backdrop-blur-xs transition-colors ${
                        (amountRange === "All Amounts" &&
                          !selectedAmountRange) ||
                        selectedAmountRanges.includes(amountRange)
                          ? "bg-white/20 text-primary-text"
                          : "dark:text-gray-300 text-black/50"
                      }`}
                    >
                      {amountRange}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        {/* Active Filters Indicator */}
        {(searchQuery ||
          selectedFunder ||
          selectedFocusArea ||
          selectedAmountRange) && (
          <div className=" rounded-sm p-0">
            <h4 className="text-sm font-medium text-primary-text/80 mb-2 flex justify-center items-center">
              Active Filters:
            </h4>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
              {searchQuery && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              {selectedFunder && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedFunder}
                </span>
              )}
              {selectedFocusArea && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedFocusArea}
                </span>
              )}
              {selectedAmountRange && (
                <span className="bg-[#AE3813] text-primary-text px-2 py-1 rounded-full">
                  {selectedAmountRange}
                </span>
              )}
            </div>
          </div>
        )}
        {hasActiveFilters && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onClearAll}
              className="text-sm text-primary-text/60 hover:text-primary-text transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
