import React, { useState, useEffect, useRef } from "react";
import { Event } from "@/lib/supabase";
import {
  MapPin,
  Clock,
  Users,
  ArrowRightCircle,
  ArrowRightIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { addUtmParameters } from "@/lib/utils";

interface FeaturedEventCardProps {
  event: Event;
  onClick: () => void;
  onEventClick?: () => void;
  isSelected?: boolean;
  date: string;
  eventIndex?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  hasMultiple?: boolean;
  onTagClick?: (tagType: "interest" | "eventType", value: string) => void;
  selectedInterestAreas?: string[];
  selectedEventTypes?: string[];
  viewMode?: "list" | "grid";
}

const lightColors = [
  "ff6b6b","ff8e53","ffdd59","32ff32","4ecdc4","45b7d1","96ceb4",
  "ffeaa7","fab1a0","fd79a8","a29bfe","6c5ce7","00b894","fdcb6e",
  "e84393","00cec9","ff1493","9370db","00ff7f","ff4500","1e90ff",
  "ffd700","ff69b4","32cd32","8a2be2","ff6347","00ffff","ff00ff",
  "adff2f","dc143c",
];

const generateLightHeroPattern = (event: Event, eventIndex: number = 0) => {
  const hash = (event.title + event.date + (event.id || ""))
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
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
}: FeaturedEventCardProps) {
  const [isClicked, setIsClicked] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const parseEventDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const eventDate = parseEventDate(date);

  useEffect(() => {
    const el = tagContainerRef.current;
    if (el) setIsOverflowing(el.scrollWidth > el.clientWidth);
  }, [event.ai_interest_areas]);

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
          className={`group relative bg-secondary-bg rounded-lg border-1 border-primary-border transition-all duration-300 cursor-pointer flex flex-col sm:flex-row min-h-[250px] sm:min-h-[220px] hover:border-[#AE3813] hover:shadow-[0_12px_24px_rgba(0,0,0,0.3)] ${
            isSelected ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.3)]" : ""
          }`}
          tabIndex={0}
          role="button"
          aria-label={`View details for featured event: ${event.title}`}
        >
          {/* Carousel Navigation */}
          {hasMultiple && (
            <>
            <button
  onClick={(e) => { e.stopPropagation(); onPrevious?.(); }}
  className="absolute bottom-[-50px] left-4 z-20 p-2 bg-white dark:bg-[#35353B] rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:text-[#AE3813] dark:hover:text-[#AE3813] hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#AE3813]/50"
  aria-label="Previous featured event"
>
  <ChevronLeft className="w-6 h-6" />
</button>

<button
  onClick={(e) => { e.stopPropagation(); onNext?.(); }}
  className="absolute bottom-[-50px] right-4 z-20 p-2 bg-white dark:bg-[#35353B] rounded-full shadow-md text-gray-600 dark:text-gray-300 hover:text-[#AE3813] dark:hover:text-[#AE3813] hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#AE3813]/50"
  aria-label="Next featured event"
>
  <ChevronRight className="w-6 h-6" />
</button>

            </>
          )}

          {/* Hero Image */}
          <div className="top-feature-box p-3 pt-3 sm:pr-0 pb-3 bg-secondary-bg w-full sm:w-1/3 flex-shrink-0">
            <div className="featured-badge absolute top-2 left-2 z-20">
              <div className="bg-white/95 dark:bg-secondary-bg/95 px-2 py-1 rounded-full border border-[#F3B83F]/60 backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-[#F3B83F]" />
                <span className="text-[#F3B83F] font-medium text-xs">Featured</span>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden h-[180px] sm:h-[220px] p-[3px] bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500">
              <div
                className={`w-full h-full rounded-lg relative transition-transform duration-300 ease-in-out group-hover:scale-105 ${
                  isClicked ? "animate-ripple" : ""
                }`}
                style={{
                  backgroundImage: `url("${generateLightHeroPattern(event, eventIndex)}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl sm:text-3xl font-bold text-white font-display tracking-tight">
                      {eventDate.getDate().toString().padStart(2, "0")}
                    </div>
                    <div className="sm:text-lg text-base text-white/80 font-medium uppercase tracking-wider">
                      {eventDate.toLocaleDateString("en-US", { month: "short" })}
                    </div>
                    <div className="sm:text-base text-sm text-white/60 font-medium">
                      {eventDate.getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between min-h-[180px] sm:min-h-[220px]">
            {/* Header */}
            <div className="space-y-4 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3
                  style={{ height: 52 }}
                  className="text-lg font-medium text-primary-text line-clamp-2 group-hover:text-[#AE3813] transition-colors duration-200 pr-8"
                >
                  {event.title}
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-primary-text/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {eventDate.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{event.city}</span>
                </div>
              </div>

              {/* Research Tags */}
             
                <div ref={tagContainerRef} className="flex gap-1.5 overflow-x-auto py-2 whitespace-nowrap pr-6 min-h-[36px] ">
                  {event.ai_interest_areas.slice(0, 4).map((area, idx) => {
                    const isSelected = selectedInterestAreas.includes(area); 
                    return (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); onTagClick?.("interest", area); }}
                        className={`text-xs px-2 py-1 rounded-full border flex-shrink-0 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30"
                            : "bg-primary-text/10 text-primary-text/70 border-primary-text/20 hover:bg-primary-text/20 hover:border-[#AE3813]/30"
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
                  {isOverflowing && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute right-0 top-0 bottom-0 w-8"
                      style={{ background: "linear-gradient(90deg, rgba(53,53,59,0) 0%, rgba(53,53,59,0.9) 100%)" }}
                    />
                  )}
                </div>


              {/* Description */}
              <p className="text-sm text-primary-text/70 line-clamp-2 leading-relaxed mt-2">
                {event.ai_summary || event.description}
              </p>
            </div>
          </div>
        </div>
      </SheetTrigger>

      {/* Sheet Content */}
      <SheetContent className="w-full sm:max-w-sm flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{event.title}</SheetTitle>

            {/* Event Hero in Sheet */}
            <div className="w-full h-48 sm:h-60 rounded-lg overflow-hidden mt-2">
              <div
                className="w-full h-full rounded-lg"
                style={{
                  backgroundImage: `url("${generateLightHeroPattern(event, eventIndex)}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg" />
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid gap-3 mt-4">
              <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                  <Clock className="w-4 h-4 text-[#D45E3C]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">Time</span>
                  <span className="font-sans text-sm text-primary-text/90">{event.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                  <MapPin className="w-4 h-4 text-[#D45E3C]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">Location</span>
                  <span className="font-sans text-sm text-primary-text/90">{event.location}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                  <Users className="w-4 h-4 text-[#D45E3C]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">Organizer</span>
                  <span className="font-sans text-sm text-primary-text/90">{event.organizer}</span>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

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
      </SheetContent>
    </Sheet>
  );
}
