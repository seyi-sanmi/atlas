import React, { useState } from "react";
import { Event } from "@/lib/supabase";
import {
  MapPin,
  Clock,
  Users,
  Star,
  ArrowRightCircle,
  ArrowRightIcon,
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
import { trackEventView, trackEventClick, trackEventDetailView } from "@/lib/event-tracking";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  onEventClick?: () => void; // New prop for tracking event clicks
  isSelected?: boolean;
  showTime?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  date: string; // ISO date string for the event
  eventIndex?: number; // Index position to prevent consecutive colors
  onTagClick?: (tagType: "interest" | "eventType", value: string) => void;
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

export function EventCard({
  date,
  event,
  onClick,
  onEventClick,
  isSelected = false,
  showTime = true,
  isLastInGroup = false,
  isFirstInGroup = false,
  eventIndex = 0,
  onTagClick,
  selectedInterestAreas = [],
  selectedEventTypes = [],
}: EventCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  // Helper function to safely parse ISO date string (YYYY-MM-DD)
  const parseEventDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const eventDate = parseEventDate(date);

  const handleClick = async () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    
    // Track event detail view
    await trackEventDetailView(event);
    
    onClick();
  };

  const getRoundingClasses = () => {
    if (isFirstInGroup && isLastInGroup) {
      return "rounded-lg rounded-tl-none";
    } else if (isFirstInGroup) {
      return "rounded-t-lg rounded-b-none rounded-tl-none";
    } else if (isLastInGroup) {
      return "rounded-b-lg rounded-t-none";
    } else {
      return "rounded-none border-t-0";
    }
  };

  const getImageRoundingClasses = () => {
    if (isFirstInGroup && isLastInGroup) {
      return "rounded-l-lg";
    } else if (isFirstInGroup) {
      return "rounded-tl-lg";
    } else if (isLastInGroup) {
      return "rounded-bl-lg";
    } else {
      return "";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          onClick={handleClick}
          className={`group relative bg-secondary-bg ${getRoundingClasses()} border border-primary-border transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[180px] `}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${event.title}`}
        >
          {/* Hero Image Side - Always show with DiceBear patterns */}
          <div className="p-3 pb-3 pt-3 sm:pr-0 h-40 bg-secondary-bg w-full sm:w-1/3 sm:h-auto relative">
            {/* Starred indicator */}
            {event.is_starred && (
              <div className="absolute top-[5px] -right-2 z-10">
                <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 p-1.5 rounded-full shadow-xl border-2 border-yellow-200/80 backdrop-blur-sm">
                  <Star className="w-[0.9rem] h-[0.9rem] text-yellow-800 fill-current drop-shadow-sm" />
                </div>
              </div>
            )}
            <div
              className={`rounded-lg overflow-hidden h-full p-[2px] ${
                event.is_starred
                  ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                  : ""
              }`}
            >
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
                <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg" />

                {/* Date overlay */}
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
          <div className="flex-1 p-4 pt-2 sm:pt-4 space-y-2.5 flex flex-col justify-between min-w-0">
            {/* Title */}
            <h3 className="font-display font-medium text-lg sm:text-2xl text-secondary-text tracking-tight leading-tight line-clamp-2 group-hover:text-[#AE3813] transition-colors duration-200 cursor-pointer">
              {event.title}
            </h3>

            {/* Meta Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-primary-text/60">
              {showTime && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="font-sans">{event.time}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="font-sans truncate">{event.location}</span>
              </div>
            </div>

            {/* Research Area Tags */}
            {event.ai_interest_areas && event.ai_interest_areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.ai_interest_areas.map((area) => {
                  const isSelected = selectedInterestAreas.includes(area);
                  return (
                    <button
                      key={area}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick?.("interest", area);
                      }}
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30"
                          : "bg-primary-text/10 text-primary-text/70 border-primary-text/20 hover:bg-primary-text/20 hover:border-[#AE3813]/30"
                      }`}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Description Preview */}
            {(event.ai_summary || event.description) && (
              <p className="font-sans text-sm text-primary-text/60 leading-relaxed line-clamp-3 transition-all duration-300">
                {event.ai_summary || event.description}
              </p>
            )}

            {/* Organizer */}
            <div className="flex items-center gap-2 text-primary-text/60">
              <Users className="w-4 h-4" />
              <span className="font-sans text-sm truncate">
                {event.organizer}
              </span>
            </div>

            {/* Event Type Tag */}
            {event.ai_event_type && (
              <div className="flex justify-start">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.("eventType", event.ai_event_type!);
                  }}
                  className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-sm border transition-all duration-200 cursor-pointer ${
                    selectedEventTypes.includes(event.ai_event_type!)
                      ? "bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30"
                      : "bg-primary-text/5 text-primary-text/60 border-primary-text/10 hover:bg-primary-text/10 hover:border-[#AE3813]/20"
                  }`}
                >
                  {event.ai_event_type}
                </button>
              </div>
            )}
          </div>

          {/* Ripple Effect Overlay */}
          {isClicked && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#AE3813]/20 to-[#D45E3C]/20 animate-ripple-fade pointer-events-none" />
          )}
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
                        <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg"></div>
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
                  <div className="mt-2 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                      <h4 className="font-semibold font-display text-secondary-text text-base">
                        About this Event
                      </h4>
                    </div>
                    {event.ai_summary && (
                      <div className="mb-4">
                        <p className="font-sans text-primary-text/90 leading-relaxed whitespace-pre-line text-sm font-medium">
                          {event.ai_summary}
                        </p>
                      </div>
                    )}
                    {event.description && event.description !== event.ai_summary && (
                      <div className="mt-4 pt-4 border-t border-primary-border/10">
                        <div className="mb-2 text-xs text-primary-text/50 uppercase tracking-wider font-medium">Full Description</div>
                        <p className="font-sans text-primary-text/70 leading-relaxed whitespace-pre-line text-sm">
                          {event.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Research Area Tags */}
                  {event.ai_interest_areas &&
                    event.ai_interest_areas.length > 0 && (
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
                              className="inline-block px-3 py-1.5 text-sm font-medium bg-white/10 dark:bg-white/10 text-primary-text/90 dark:text-primary-text/90 rounded-full border border-primary-border/90 dark:border-primary-border/90 hover:bg-white/20 dark:hover:bg-white/20 transition-colors duration-200"
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
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (event.url) {
                  // Track the event click with our new system
                  await trackEventClick(event);
                  
                  // Also call the existing callback if provided
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
