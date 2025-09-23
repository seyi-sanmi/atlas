"use client";

import { useState, useEffect } from "react";
import { FundingOpportunity } from "./index";

interface FundingFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedFunder: string;
  onFunderChange: (funder: string) => void;
  selectedFocusArea: string;
  onFocusAreaChange: (focusArea: string) => void;
  selectedAmountRange: string;
  onAmountRangeChange: (range: string) => void;
  selectedDate?: Date | null;
  onDateChange: (date: Date | null) => void;
  fundingOpportunities: FundingOpportunity[];
}

export default function FundingFilter({
  searchQuery,
  onSearchChange,
  selectedFunder,
  onFunderChange,
  selectedFocusArea,
  onFocusAreaChange,
  selectedAmountRange,
  onAmountRangeChange,
  selectedDate,
  onDateChange,
  fundingOpportunities,
}: FundingFilterProps) {
  const [selectedFunders, setSelectedFunders] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [selectedAmountRanges, setSelectedAmountRanges] = useState<string[]>(
    []
  );
  const [currentDate, setCurrentDate] = useState(new Date()); // Current date
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(
    null
  );
  const [funders, setFunders] = useState<string[]>(["All Funders"]);
  const [focusAreas, setFocusAreas] = useState<string[]>(["All Focus Areas"]);

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

  // Amount ranges for funding
  const amountRanges = [
    "All Amounts",
    "Under £10,000",
    "£10,000 - £50,000",
    "£50,000 - £100,000",
    "Over £100,000",
  ];

  // Extract unique funders and focus areas from funding opportunities
  useEffect(() => {
    const uniqueFunders = [
      ...new Set(fundingOpportunities.map((f) => f.funder)),
    ];
    const uniqueFocusAreas = [
      ...new Set(fundingOpportunities.map((f) => f.focusArea)),
    ];

    setFunders(["All Funders", ...uniqueFunders]);
    setFocusAreas(["All Focus Areas", ...uniqueFocusAreas]);
  }, [fundingOpportunities]);

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

  const toggleAmountRange = (range: string) => {
    if (range === "All Amounts") {
      setSelectedAmountRanges([]);
      onAmountRangeChange("");
    } else if (selectedAmountRanges.includes(range)) {
      setSelectedAmountRanges([]);
      onAmountRangeChange("");
    } else {
      setSelectedAmountRanges([range]);
      onAmountRangeChange(range);
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
              : "dark:text-gray-300 text-black/50"
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
    <div className="p-6 pt-0 text-primary-text">
      <div className="max-w-md mx-auto space-y-3 font-sans">
        {/* Active Filters Indicator */}
        {(searchQuery ||
          selectedFunder ||
          selectedFocusArea ||
          selectedAmountRange ||
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
            placeholder="Search funding opportunities..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white/5 backdrop-blur-xs border border-white/10 rounded-sm px-4 py-3 text-primary-text placeholder-gray-300 focus:outline-none focus:border-gray-500"
            id="search-input"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-text/40 text-sm">
            ⌘ K
          </div>
        </div>

        {/* Submit Funding Button */}
        <button className="w-full bg-white/30 text-primary-text/90 font-medium py-2.5 rounded-sm hover:bg-white hover:text-black transition-colors">
          Submit Funding Opportunity
        </button>

        {/* Calendar for Deadlines */}
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

          {selectedDate && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => {
                  setSelectedCalendarDay(null);
                  onDateChange(null);
                }}
                className="text-sm text-primary-text/60 hover:text-primary-text transition-colors"
              >
                Clear deadline filter
              </button>
            </div>
          )}
        </div>

        {/* Focus Areas */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Focus Area</h3>
          <div className="flex flex-wrap gap-2">
            {focusAreas.map((focusArea) => (
              <button
                key={focusArea}
                onClick={() => toggleFocusArea(focusArea)}
                className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  (focusArea === "All Focus Areas" &&
                    (!selectedFocusArea || selectedFocusArea === "")) ||
                  (focusArea !== "All Focus Areas" &&
                    selectedFocusArea === focusArea)
                    ? "bg-white text-black"
                    : "dark:bg-white/10 bg-black/5 dark:text-gray-300 text-black/50 hover:bg-white/20"
                }`}
              >
                {focusArea}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Amount Range</h3>
          <div className="flex flex-wrap gap-2">
            {amountRanges.map((range) => (
              <button
                key={range}
                onClick={() => toggleAmountRange(range)}
                className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  (range === "All Amounts" &&
                    (!selectedAmountRange || selectedAmountRange === "")) ||
                  (range !== "All Amounts" && selectedAmountRange === range)
                    ? "bg-white text-black"
                    : "dark:bg-white/10 bg-black/5 dark:text-gray-300 text-black/50 hover:bg-white/20"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Funders */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Funder</h3>
          <div className="flex flex-wrap gap-2">
            {funders.map((funder) => (
              <button
                key={funder}
                onClick={() => toggleFunder(funder)}
                className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  (funder === "All Funders" &&
                    (!selectedFunder || selectedFunder === "")) ||
                  (funder !== "All Funders" && selectedFunder === funder)
                    ? "bg-white text-black"
                    : "dark:bg-white/10 bg-black/5 dark:text-gray-300 text-black/50 hover:bg-white/30"
                }`}
              >
                {funder}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
