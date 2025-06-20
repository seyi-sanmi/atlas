import React, { useState } from "react";
import { Event } from "@/app/lib/event-data";
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

interface EventCardProps {
  event: Event;
  onClick: () => void;
  isSelected?: boolean;
  showTime?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  date: string; // ISO date string for the event
}

export function EventCard({
  date,
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
          className={`group relative bg-[#1E1E25] ${getRoundingClasses()} border border-[#565558] transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${event.title}`}
        >
          {/* Image Side - Top on mobile, Left 40% on desktop */}
          {event.image_url && (
            <div className="p-4 pb-4 pt-4 sm:pr-0 h-48 bg-[#1E1E25] w-full sm:w-2/5 sm:h-auto relative">
              <div className=" rounded-lg overflow-hidden h-full">
                <div
                  className={`w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110  relative ${
                    isSelected
                      ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] -translate-y-1.5"
                      : ""
                  } ${isClicked ? "animate-ripple" : ""}`}
                  style={{
                    backgroundImage: `url(https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                      event.title
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Blur overlay */}
                  {/* backdrop-blur-[2px] */}
                  <div className="absolute inset-0  bg-black/40 rounded-lg" />

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
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E25] via-transparent to-transparent opacity-60" />
              </div>
            </div>
          )}
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
              <p className="font-sans text-sm text-white/60 leading-relaxed line-clamp-2  transition-all duration-300">
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
            {/* sm:opacity-0 group-hover:opacity-100 */}
            <div className=" transition-opacity duration-300 pt-0">
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
      </SheetTrigger>
      <SheetContent className=" w-full bg-[#18181C] text-white border-white/5 p-2">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl font-display text-[#F5F5F7] pt-0">
            {event.title}
          </SheetTitle>
          <div>
            <div className="flex flex-col gap-4 mt-2">
              {/* Image */}
              {/* {event.image_url && (
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg border border-[#AE3813]/40 shadow-lg mb-2"
                />
              )} */}

              {event.image_url && (
                <div className="w-full h-48 object-cover rounded-lg  shadow-lg mb-2">
                  <div className=" rounded-lg overflow-hidden h-full">
                    <div
                      className={`w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110  relative ${
                        isSelected
                          ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] -translate-y-1.5"
                          : ""
                      } ${isClicked ? "animate-ripple" : ""}`}
                      style={{
                        backgroundImage: `url(https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                          event.title
                        )})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    >
                      {/* Blur overlay */}
                      {/* backdrop-blur-[2px] */}
                      <div className="absolute inset-0  bg-black/40 rounded-lg" />

                      {/* Date overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
                            {new Date(date)
                              .getDate()
                              .toString()
                              .padStart(2, "0")}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1E25] via-transparent to-transparent opacity-60" />
                  </div>
                </div>
              )}
              {/* Meta */}
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                    <Clock className="w-4 h-4 text-[#D45E3C]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                      Time
                    </span>
                    <span className="font-sans text-sm text-white/90">
                      {event.time}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                    <MapPin className="w-4 h-4 text-[#D45E3C]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                      Location
                    </span>
                    <span className="font-sans text-sm text-white/90">
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                    <Users className="w-4 h-4 text-[#D45E3C]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                      Organizer
                    </span>
                    <span className="font-sans text-sm text-white/90">
                      {event.organizer}
                    </span>
                  </div>
                </div>
              </div>
              {/* Description */}
              {event.description && (
                <div className="mt-2 rounded-lg ">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                    <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                      About this Event
                    </h4>
                  </div>
                  <p className="font-sans text-white/80 leading-relaxed whitespace-pre-line text-sm">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetHeader>
        <SheetFooter className="mt-auto">
          <SheetClose asChild>
            <button className="sm:px-4 px-4 pr-1 py-3 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] text-white font-medium font-sans rounded-md hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transition-all duration-200 transform hover:scale-105 flex items-center justify-between gap-2">
              <span>View Event</span>
              <ArrowRightIcon className="w-6 h-6 text-white" />
            </button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
