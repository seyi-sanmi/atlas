"use client";

import { useState } from "react";

export default function EventFilter() {
  const [selectedLocations, setSelectedLocations] = useState([
    "SF & Bay Area",
    "Remote",
  ]);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());

  const locations = [
    "All Locations",
    "SF & Bay Area",
    "New York City",
    "Boston",
    "Seattle",
    "London",
    "Remote",
  ];

  const eventTypes = [
    "Hackathon",
    "Workshop",
    "Conference",
    "Meetup",
    "Webinar",
  ];

  const toggleLocation = (location: string) => {
    if (location === "All Locations") {
      setSelectedLocations(
        selectedLocations.includes("All Locations") ? [] : ["All Locations"]
      );
    } else {
      setSelectedLocations((prev) => {
        const newSelected = prev.filter((loc) => loc !== "All Locations");
        return prev.includes(location)
          ? newSelected.filter((loc) => loc !== location)
          : [...newSelected, location];
      });
    }
  };

  const toggleEventType = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((type) => type !== eventType)
        : [...prev, eventType]
    );
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
      const isSelected = day === selectedDate;
      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(day)}
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
      className="min-h-screen p-6 pt-0 text-white"
    >
      <div className="max-w-md mx-auto space-y-3 font-sans">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search events..."
            className="w-full bg-white/5 backdrop-blur-xs border border-white/10 rounded-sm px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:border-gray-500"
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
        </div>

        {/* Locations */}
        <div className="space-y-3 pt-3">
          <h3 className="text-lg font-medium font-display">Locations</h3>
          <div className="flex flex-wrap gap-2">
            {locations.map((location) => (
              <button
                key={location}
                onClick={() => toggleLocation(location)}
                className={`cursor-pointer px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedLocations.includes(location)
                    ? "bg-white text-black"
                    : "bg-white/10 text-gray-300 hover:bg-white/30"
                }`}
              >
                {location}
              </button>
            ))}
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
                  selectedEventTypes.includes(eventType)
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
