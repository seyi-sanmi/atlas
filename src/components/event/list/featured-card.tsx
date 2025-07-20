import React, { useState } from "react";
import { Event } from "@/lib/supabase";
import {
  MapPin,
  Clock,
  Users,
  Star,
  ArrowRightCircle,
  ArrowRightIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { addUtmParameters } from "@/lib/utils";

interface FeaturedEventCardProps {
  event: Event;
  onClick: () => void;
  onEventClick?: () => void; // New prop for tracking event clicks
  isSelected?: boolean;
  date: string;
  eventIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  hasMultiple?: boolean;
  onTagClick?: (tagType: 'interest' | 'eventType', value: string) => void;
  selectedInterestAreas?: string[];
  selectedEventTypes?: string[];
}

// Light color palette for hero cards - BRIGHT RAINBOW & VIBRANT
const lightColors = [
  "ff6b6b", // bright red
  "ff8e53", // bright orange
  "ffdd59", // bright yellow
  "32ff32", // bright lime green
  "4ecdc4", // bright teal
  "45b7d1", // bright blue
  "96ceb4", // bright mint
  "ffeaa7", // bright cream
  "fab1a0", // bright peach
  "fd79a8", // bright pink
  "a29bfe", // bright purple
  "6c5ce7", // bright violet
  "00b894", // bright emerald
  "fdcb6e", // bright gold
  "e84393", // bright magenta
  "00cec9", // bright cyan
  "ff1493", // bright deep pink
  "9370db", // bright medium purple
  "00ff7f", // bright spring green
  "ff4500", // bright orange red
  "1e90ff", // bright dodger blue
  "ffd700", // bright gold yellow
  "ff69b4", // bright hot pink
  "32cd32", // bright lime green
  "8a2be2", // bright blue violet
  "ff6347", // bright tomato
  "00ffff", // bright aqua
  "ff00ff", // bright fuchsia
  "adff2f", // bright green yellow
  "dc143c", // bright crimson
];

// Generate hero pattern with light colors, avoiding consecutive duplicates
const generateLightHeroPattern = (event: Event, eventIndex: number = 0) => {
  // Create a hash from event properties for consistent selection
  const hash = (event.title + event.date + (event.id || ""))
    .split("")
    .reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

  // Use hash to select base color, but offset by index to avoid consecutive duplicates
  const baseColorIndex = Math.abs(hash) % lightColors.length;
  const offsetColorIndex = (baseColorIndex + eventIndex) % lightColors.length;

  const selectedColor = lightColors[offsetColorIndex];
  const seed = `${event.title}-${event.date}-light`;

  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=${selectedColor}&scale=120`;
};

export function FeaturedEventCard({
  date,
  event,
  onClick,
  onEventClick,
  isSelected = false,
  eventIndex = 0,
  onPrevious,
  onNext,
  hasMultiple = false,
  onTagClick,
  selectedInterestAreas = [],
  selectedEventTypes = [],
}: FeaturedEventCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  // Helper function to safely parse ISO date string (YYYY-MM-DD)
  const parseEventDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const eventDate = parseEventDate(date);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          onClick={handleClick}
          className={`group relative bg-secondary-bg rounded-lg border-2 border-primary-border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] hover:border-[#AE3813] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] ${
            isSelected ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.3)]" : ""
          }`}
          tabIndex={0}
          role="button"
          aria-label={`View details for featured event: ${event.title}`}
        >


          {/* Carousel Navigation - Improved positioning and contrast */}
          {hasMultiple && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious?.();
                }}
                className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 p-1 text-gray-600 dark:text-gray-300 hover:text-[#AE3813] dark:hover:text-[#AE3813] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#AE3813]/50 group"
                aria-label="Previous featured event"
              >
                <ChevronLeft className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext?.();
                }}
                className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 p-1 text-gray-600 dark:text-gray-300 hover:text-[#AE3813] dark:hover:text-[#AE3813] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#AE3813]/50 group"
                aria-label="Next featured event"
              >
                <ChevronRight className="w-6 h-6 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5" />
              </button>
            </>
          )}

          {/* Hero Image Side - Using same logic as normal event card */}
          <div className="p-3 pt-3 sm:pr-0 pb-3 h-46 bg-secondary-bg w-full sm:w-1/3 relative">
            {/* Featured Badge - Positioned on the image */}
            <div className="absolute top-2 left-2 z-20">
              <div className="bg-white/95 dark:bg-secondary-bg/95 px-2 py-1 rounded-full border border-[#AE3813]/60 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-[#AE3813]" />
                <span className="text-[#AE3813] font-medium text-xs">Featured</span>
              </div>
            </div>
            
            <div className="rounded-lg overflow-hidden h-full p-[3px] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
              <div
                className={`w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative ${
                  isSelected
                    ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] "
                    : ""
                } ${isClicked ? "animate-ripple" : ""}`}
                style={{
                  backgroundImage: `url("${generateLightHeroPattern(
                    event,
                    eventIndex
                  )}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 dark:bg-black/40 bg-white/40 rounded-lg" />

                {/* Date overlay - same as normal event card */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-bold text-white font-display tracking-tight">
                      {eventDate.getDate().toString().padStart(2, "0")}
                    </div>
                    <div className="text-lg text-white/80 font-medium uppercase tracking-wider">
                      {eventDate.toLocaleDateString("en-US", {
                        month: "short",
                      })}
                    </div>
                    <div className="text-base text-white/60 font-medium">
                      {eventDate.getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-medium text-primary-text line-clamp-2 group-hover:text-[#AE3813] transition-colors duration-200 pr-8">
                  {event.title}
                </h3>
                <ArrowRightCircle className="w-4 h-4 text-primary-text/40 group-hover:text-[#AE3813] group-hover:scale-110 transition-all duration-200 flex-shrink-0 mt-1" />
              </div>

              {/* Time and Location - Moved directly under title */}
              <div className="flex items-center gap-4 text-sm text-primary-text/60">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.city}</span>
                </div>
              </div>
            </div>

            {/* Research Area Tags - Force single line for featured cards */}
            {event.ai_interest_areas && event.ai_interest_areas.length > 0 && (
              <div className="flex gap-1.5 overflow-hidden py-2">
                {event.ai_interest_areas.slice(0, 4).map((area, index) => {
                  const isSelected = selectedInterestAreas.includes(area);
                  return (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick?.('interest', area);
                      }}
                      className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30'
                          : 'bg-primary-text/10 text-primary-text/70 border-primary-text/20 hover:bg-primary-text/20 hover:border-[#AE3813]/30'
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
                {event.ai_interest_areas.length > 4 && (
                  <span className="text-xs text-primary-text/50 px-2 py-1 flex-shrink-0">
                    +{event.ai_interest_areas.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2 py-2">
              <p className="text-sm text-primary-text/70 line-clamp-2 leading-relaxed">
                {event.ai_summary || event.description}
              </p>
            </div>


          </div>
        </div>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-sm">
        <div className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <SheetHeader>
              <SheetTitle>{event.title}</SheetTitle>
              <div>
                <div className="flex flex-col gap-4 mt-2">
                  {/* Event Image */}
                  <div className="w-full h-48 object-cover rounded-lg shadow-lg mb-2">
                    <div className="rounded-lg overflow-hidden h-full">
                      <div
                        className="w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] "
                        style={{
                          backgroundImage: `url("${generateLightHeroPattern(
                            event,
                            eventIndex
                          )}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div className="absolute inset-0 dark:bg-black/40 bg-white/40 rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
                              {eventDate.getDate()}
                            </div>
                            <div className="text-base text-white/80 font-medium uppercase tracking-wider">
                              {eventDate.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                            <div className="text-sm text-white/60 font-medium">
                              {eventDate.getFullYear()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Event Details Grid */}
                  <div className="grid gap-3">
                    {/* Time */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Clock className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Time
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {event.time}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <MapPin className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Location
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {event.location}
                        </span>
                      </div>
                    </div>

                    {/* Organizer */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Users className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Organizer
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {event.organizer}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  {event.description && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-secondary-text text-base">
                          About this Event
                        </h4>
                      </div>
                      <p className="font-sans text-primary-text/80 leading-relaxed whitespace-pre-line text-sm">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {/* Research Area Tags */}
                  {event.ai_interest_areas && event.ai_interest_areas.length > 0 && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-secondary-text text-base">
                          Research Areas
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.ai_interest_areas.map((area) => (
                          <span
                            key={area}
                            className="inline-block px-3 py-1.5 text-sm font-medium bg-white/10 dark:bg-white/10 text-primary-text/90 dark:text-primary-text/90 rounded-full border border-white/20 dark:border-white/20 hover:bg-white/20 dark:hover:bg-white/20 transition-colors duration-200"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Fixed Footer */}
          <SheetFooter>
            <button
              className={`sm:px-4 px-4 pr-1 py-3 text-primary-text font-medium font-sans rounded-md transition-all duration-200 flex items-center justify-between gap-2 ${
                event.url
                  ? "bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transform hover:scale-105 cursor-pointer"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (event.url) {
                  // Track the event click
                  onEventClick?.();
                  
                  const urlWithUtm = addUtmParameters(event.url);
                  window.open(urlWithUtm, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!event.url}
              title={event.url ? "Open event page" : "No event URL available"}
            >
              <span>{event.url ? "View Event" : "No URL Available"}</span>
              <ArrowRightIcon className="w-6 h-6 text-primary-text" />
            </button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
} 