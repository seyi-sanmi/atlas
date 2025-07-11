import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  Star,
  ArrowRightCircle,
  ArrowRightIcon,
  Globe,
  Building,
  Mail,
} from "lucide-react";
import { Community } from "@/lib/supabase";

interface CommunityCardProps {
  community: Community;
  onClick: () => void;
  isSelected?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  communityIndex?: number;
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
const generateLightHeroPattern = (
  community: Community,
  communityIndex: number = 0
) => {
  // Create a hash from community properties for consistent selection
  const seed = community.name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Use hash to select base color, but offset by index to avoid consecutive duplicates
  const baseColorIndex = Math.abs(seed) % lightColors.length;
  const offsetColorIndex = (baseColorIndex + communityIndex) % lightColors.length;

  const selectedColor = lightColors[offsetColorIndex];
  const seedString = `${community.name}-community-light`;

  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    seedString
  )}&backgroundColor=${selectedColor}&scale=120`;
};

export function CommunityCard({
  community,
  onClick,
  isSelected = false,
  isLastInGroup = false,
  isFirstInGroup = false,
  communityIndex = 0,
}: CommunityCardProps) {
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
      return "rounded-t-lg";
    } else if (isLastInGroup) {
      return "rounded-b-lg";
    }
    return "";
  };

  // Generate community type initials for display
  const getTypeInitials = (type: string) => {
    return type
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={handleClick}
      className={` group relative transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${community.name}`}
    >
      {/* Hero Image Side - Always show with DiceBear patterns */}
      <div className="z-0 p-4 pb-4 pt-4 sm:pr-0 h-48 bg-secondary-bg w-full sm:w-2/5 sm:h-auto relative">
        {/* Starred indicator */}
        {!community.starred_on_website && (
          <div className="absolute top-[5px] -right-2 z-10">
            <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 p-1.5 rounded-full shadow-xl border-2 border-yellow-200/80 backdrop-blur-sm">
              <Star className="w-[0.9rem] h-[0.9rem] text-yellow-800 fill-current drop-shadow-sm" />
            </div>
          </div>
        )}

        <div
          className={`rounded-lg overflow-hidden h-full p-[2px] ${
            !community.starred_on_website
              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
              : ""
          }`}
        >
          {" "}
          <div
            className={`z-0 w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative ${
              isSelected
                ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] "
                : ""
            } ${isClicked ? "animate-ripple" : ""}`}
            style={{
              backgroundImage: `url("${generateLightHeroPattern(
                community,
                communityIndex
              )}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="absolute inset-0 dark:bg-black/40 bg-white/40 rounded-lg" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-base sm:text-lg text-pretty font-bold text-primary-text font-display tracking-tight px-2 text-center leading-tight">
                  {community.name}
                </div>
                <div className="text-xs mx-auto text-primary-text/80 font-medium uppercase tracking-wider max-w-20 text-center mt-1">
                  {community.size}
                </div>
                <div className="text-xs text-primary-text/60 font-medium">
                  Members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="flex-1 p-6 pt-2 sm:pt-6 space-y-2 flex flex-col justify-between min-w-0">
        {/* Meta Col */}
        <div className="flex flex-col gap-2 text-sm text-primary-text/60">
          <div className="flex items-center gap-1.5">
            <Building className="w-4 h-4" />
            <span className="font-sans">{community.community_type?.join(", ")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            <span className="font-sans truncate">
              {community.location_names?.join(", ")}
            </span>
          </div>
        </div>

        {/* Description Preview */}
        <p className="font-sans text-sm text-primary-text/60 leading-relaxed line-clamp-2 transition-all duration-300">
          {community.purpose}
        </p>

        {/* Contact */}
        <div className="flex items-center gap-2 text-primary-text/60">
          <Users className="w-4 h-4" />
          <span className="font-sans text-sm truncate">
            {community.target_members}
          </span>
        </div>

        {/* View Details Link */}
        <div className="transition-opacity duration-300 pt-0">
          <div className="font-sans text-sm bg-gradient-to-r from-white/20 to-white/40 group-hover:from-[#AE3813] group-hover:to-[#D45E3C] bg-clip-text text-transparent hover:underline hover:decoration-2 hover:underline-offset-2 transition-all duration-150 hover:animate-underline-sweep cursor-pointer">
            View Details →
          </div>
        </div>
      </div>

      {/* Ripple Effect Overlay */}
      {isClicked && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#AE3813]/20 to-[#D45E3C]/20 animate-ripple-fade pointer-events-none" />
      )}
    </div>
  );
}
