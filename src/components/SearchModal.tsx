import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Event } from "@/lib/supabase";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  onEventSelect: (event: Event) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchModal({
  isOpen,
  onClose,
  events,
  onEventSelect,
  searchQuery,
  onSearchChange,
}: SearchModalProps) {
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter events based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events.slice(0, 8)); // Show first 8 events when no query
    } else {
      const filtered = events
        .filter(
          (event) =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.categories.some((cat) =>
              cat.toLowerCase().includes(searchQuery.toLowerCase())
            )
        )
        .slice(0, 8); // Limit to 8 results
      setFilteredEvents(filtered);
    }
    setSelectedIndex(0);
  }, [searchQuery, events]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            Math.min(prev + 1, filteredEvents.length - 1)
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredEvents[selectedIndex]) {
            onEventSelect(filteredEvents[selectedIndex]);
            onClose();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredEvents, selectedIndex, onEventSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-secondary-bg border border-primary-border rounded-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-primary-border">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-primary-text placeholder-gray-400 outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="ml-3 p-1 hover:bg-white/10 rounded-sm transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Search Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={`px-4 py-3 cursor-pointer transition-colors border-l-2 ${
                  index === selectedIndex
                    ? "bg-[#AE3813]/20 border-[#AE3813]"
                    : "border-transparent hover:bg-white/5"
                }`}
                onClick={() => {
                  onEventSelect(event);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-primary-text font-medium truncate">
                      {event.title}
                    </h3>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{event.city}</span>
                      <span>•</span>
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{event.time}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 ml-4">
                    {event.categories.slice(0, 2).map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/10 dark:text-gray-300 text-black/50 text-xs rounded-full"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : searchQuery ? (
            <div className="px-4 py-8 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No events found for "{searchQuery}"</p>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Start typing to search events...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-primary-bgborder-t border-primary-border text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                Enter
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <span>{filteredEvents.length} results</span>
        </div>
      </div>
    </div>
  );
}
