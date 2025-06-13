import React, { useState } from "react";
import { Event } from "@/app/lib/event-data";
import { MapPin, Clock, Users, Star } from "lucide-react";

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected?: boolean;
  showTime?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
}

export function EventCard({
  event,
  onClick,
  isSelected = false,
  showTime = true,
  isLastInGroup = false,
  isFirstInGroup = false,
}: EventCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
    onClick();
  };

  const getRoundingClasses = () => {
    if (isFirstInGroup && isLastInGroup) {
      return "rounded-lg";
    } else if (isFirstInGroup) {
      return "rounded-t-lg rounded-b-none";
    } else if (isLastInGroup) {
      return "rounded-b-lg rounded-t-none";
    } else {
      return "rounded-none";
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
      className={`group relative bg-[#1E1E25] ${getRoundingClasses()} border border-white/30 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${event.title}`}
    >
      {/* Image Side - Top on mobile, Left 40% on desktop */}
      {event.image_url && (
        <div className="w-full h-48 sm:w-2/5 sm:h-auto relative m-4 mt-4 sm:mr-0 mb-2 sm:mb-4 rounded-lg overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className={`w-full h-full object-cover rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:rotate-2 ${
              isSelected
                ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] -translate-y-1.5"
                : ""
            } ${isClicked ? "animate-ripple" : ""}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent opacity-60" />
        </div>
      )}
      <div className="flex-1 p-6 pt-2 sm:pt-6 space-y-4 flex flex-col justify-between min-w-0">
        {/* Title */}
        <h3 className="font-display font-medium text-2xl text-[#F5F5F7] tracking-tight leading-tight line-clamp-2">
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
          <p
            className="font-sans text-sm text-white/60 leading-relaxed line-clamp-2  transition-all duration-300"
            // group-hover:line-clamp-4
          >
            {event.description}
          </p>
        )}

        {/* Organizer */}
        <div className="flex items-center gap-2 text-white/60">
          <Users className="w-4 h-4" />
          <span className="font-sans text-sm truncate">{event.organizer}</span>
        </div>

        {/* View Details Link */}
        <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pt-2">
          <a
            href="#"
            className="font-sans text-sm bg-gradient-to-r from-[#AE3813] to-[#D45E3C] bg-clip-text text-transparent hover:underline hover:decoration-2 hover:underline-offset-2 transition-all duration-150 hover:animate-underline-sweep"
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
