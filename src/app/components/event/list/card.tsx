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
// Temporarily disabled Sheet imports to fix compilation
// import {
//   Sheet,
//   SheetClose,
//   SheetContent,
//   SheetDescription,
//   SheetFooter,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected?: boolean;
  showTime?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  date: string; // ISO date string for the event
  eventIndex?: number; // Index position to prevent consecutive colors
}

// Light color palette for hero cards - BRIGHT RAINBOW & VIBRANT
const lightColors = [
  'ff6b6b', // bright red
  'ff8e53', // bright orange
  'ffdd59', // bright yellow  
  '32ff32', // bright lime green
  '4ecdc4', // bright teal
  '45b7d1', // bright blue
  '96ceb4', // bright mint
  'ffeaa7', // bright cream
  'fab1a0', // bright peach
  'fd79a8', // bright pink
  'a29bfe', // bright purple
  '6c5ce7', // bright violet
  '00b894', // bright emerald
  'fdcb6e', // bright gold
  'e84393', // bright magenta
  '00cec9', // bright cyan
  'ff1493', // bright deep pink
  '9370db', // bright medium purple
  '00ff7f', // bright spring green
  'ff4500', // bright orange red
  '1e90ff', // bright dodger blue
  'ffd700', // bright gold yellow
  'ff69b4', // bright hot pink
  '32cd32', // bright lime green
  '8a2be2', // bright blue violet
  'ff6347', // bright tomato
  '00ffff', // bright aqua
  'ff00ff', // bright fuchsia
  'adff2f', // bright green yellow
  'dc143c', // bright crimson
];

// Generate hero pattern with light colors, avoiding consecutive duplicates
const generateLightHeroPattern = (event: Event, eventIndex: number = 0) => {
  // Create a hash from event properties for consistent selection
  const hash = (event.title + event.date + (event.id || '')).split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use hash to select base color, but offset by index to avoid consecutive duplicates
  const baseColorIndex = Math.abs(hash) % lightColors.length;
  const offsetColorIndex = (baseColorIndex + eventIndex) % lightColors.length;
  
  const selectedColor = lightColors[offsetColorIndex];
  const seed = `${event.title}-${event.date}-light`;
  
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&backgroundColor=${selectedColor}&scale=120`;
};

export function EventCard({
  date,
  event,
  onClick,
  isSelected = false,
  showTime = true,
  isLastInGroup = false,
  isFirstInGroup = false,
  eventIndex = 0,
}: EventCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
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
    <div
      onClick={handleClick}
      className={`group relative bg-[#1E1E25] ${getRoundingClasses()} border border-[#565558] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${event.title}`}
    >
      {/* Hero Image Side - Always show with DiceBear patterns */}
      <div className="p-4 pb-4 pt-4 sm:pr-0 h-48 bg-[#1E1E25] w-full sm:w-2/5 sm:h-auto relative">
        <div className="rounded-lg overflow-hidden h-full">
          <div
            className={`w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative ${
              isSelected
                ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] -translate-y-1.5"
                : ""
            } ${isClicked ? "animate-ripple" : ""}`}
            style={{
              backgroundImage: `url("${generateLightHeroPattern(event, eventIndex)}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40 rounded-lg" />

            {/* Date overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
                  {new Date(date).getDate().toString().padStart(2, "0")}
                </div>
                <div className="text-base text-white/80 font-medium uppercase tracking-wider">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                  })}
                </div>
                <div className="text-sm text-white/60 font-medium">
                  {new Date(date).getFullYear()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="flex-1 p-6 pt-2 sm:pt-6 space-y-4 flex flex-col justify-between min-w-0">
        {/* Title */}
        <h3 className="font-display font-medium text-lg sm:text-2xl text-[#F5F5F7] tracking-tight leading-tight line-clamp-2">
          {event.title}
        </h3>

        {/* Meta Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-white/60">
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

        {/* Description Preview */}
        {event.description && (
          <p className="font-sans text-sm text-white/60 leading-relaxed line-clamp-2 transition-all duration-300">
            {event.description}
          </p>
        )}

        {/* Organizer */}
        <div className="flex items-center gap-2 text-white/60">
          <Users className="w-4 h-4" />
          <span className="font-sans text-sm truncate">
            {event.organizer}
          </span>
        </div>

        {/* View Details Link */}
        <div className="transition-opacity duration-300 pt-0">
          <a
            href="#"
            className="font-sans text-sm bg-gradient-to-r from-white/20 to-white/40 group-hover:from-[#AE3813] group-hover:to-[#D45E3C] bg-clip-text text-transparent hover:underline hover:decoration-2 hover:underline-offset-2 transition-all duration-150 hover:animate-underline-sweep"
            onClick={(e) => e.preventDefault()}
          >
            View Details
          </a>
        </div>
      </div>

      {/* Ripple Effect Overlay */}
      {isClicked && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#AE3813]/20 to-[#D45E3C]/20 animate-ripple-fade pointer-events-none" />
      )}
    </div>
  );
}
