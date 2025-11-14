import React, { useState, useRef, useEffect } from "react";
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
  onTagClick?: (tagType: "communityType" | "location", value: string) => void;
  selectedCommunityTypes?: string[];
  selectedLocations?: string[];
}

// AutoResizeText component that automatically reduces font size to fit content
interface AutoResizeTextProps {
  text: string;
  className?: string;
  minFontSize?: number;
  maxFontSize?: number;
  maxLines?: number;
}

const AutoResizeText: React.FC<AutoResizeTextProps> = ({
  text,
  className = "",
  minFontSize = 10,
  maxFontSize = 16,
  maxLines = 2,
}) => {
  const textRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const resizeText = () => {
      if (!textRef.current) return;

      const element = textRef.current;
      const parent = element.parentElement;
      if (!parent) return;

      // Only apply autoresize if text is over 65 characters
      if (text.length <= 65) {
        setFontSize(maxFontSize);
        return;
      }

      // Reset to max font size
      setFontSize(maxFontSize);

      // Check if text overflows
      const checkOverflow = () => {
        const currentFontSize = parseFloat(getComputedStyle(element).fontSize);

        // Check if text overflows vertically (for line-clamp)
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        const maxHeight = lineHeight * maxLines;

        if (
          element.scrollHeight > maxHeight ||
          element.scrollWidth > element.clientWidth
        ) {
          if (currentFontSize > minFontSize) {
            setFontSize(currentFontSize - 0.5);
            return false; // Not done yet
          }
        }
        return true; // Done
      };

      // Gradually reduce font size until text fits
      const interval = setInterval(() => {
        if (checkOverflow()) {
          clearInterval(interval);
        }
      }, 5);

      // Cleanup
      return () => clearInterval(interval);
    };

    // Initial resize with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(resizeText, 10);

    // Resize on window resize
    const handleResize = () => {
      clearTimeout(timeoutId);
      setTimeout(resizeText, 10);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [text, maxFontSize, minFontSize, maxLines]);

  return (
    <div
      ref={textRef}
      className={`${className} overflow-hidden`}
      style={{
        fontSize: `${fontSize}px`,
        display: "-webkit-box",
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {text}
    </div>
  );
};

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
  const offsetColorIndex =
    (baseColorIndex + communityIndex) % lightColors.length;

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
  onTagClick,
  selectedCommunityTypes = [],
  selectedLocations = [],
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
      className={` group relative transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[180px] sm:min-h-[200px] animate-pulse-scale `}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${community.name}`}
    >
      {/* Hero Image Side - Always show with DiceBear patterns */}
      <div className="z-0 p-3 sm:p-4 pb-3 sm:pb-4 pt-3 sm:pt-4 sm:pr-0 h-40 sm:h-48 bg-secondary-bg w-full sm:w-2/5 sm:h-auto relative">
        {/* Starred indicator */}
        {community.starred_on_website && (
          <div className="absolute top-2 -right-1 sm:top-[5px] sm:-right-2 z-10">
            <div className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 p-1 sm:p-1.5 rounded-full shadow-xl border-2 border-yellow-200/80 backdrop-blur-sm">
              <Star className="w-[0.8rem] sm:w-[0.9rem] h-[0.8rem] sm:h-[0.9rem] text-yellow-800 fill-current drop-shadow-sm" />
            </div>
          </div>
        )}

        <div
          className={`rounded-lg overflow-hidden h-full p-[2px] ${
            community.starred_on_website
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
            <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AutoResizeText
                  text={community.name}
                  className="text-white text-pretty font-bold dark:text-primary-text font-display tracking-tight px-2 text-center leading-tight"
                  minFontSize={10}
                  maxFontSize={16}
                  maxLines={3}
                />
                <div className="text-xs mx-auto text-white dark:text-primary-text/80 font-medium uppercase tracking-wider max-w-20 text-center mt-1">
                  {community.size}
                </div>
                <div className="text-[10px] sm:text-xs text-white dark:text-primary-text/60 font-medium">
                  Members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Side */}
      <div className="flex-1 p-4 sm:p-6 pt-2 sm:pt-6 space-y-2 sm:space-y-3 flex flex-col justify-between min-w-0">
        {/* Interactive Tags with Visual Grouping */}
        <div className="flex flex-col gap-3">
          {/* Community Type Tags */}
          {community.community_type && community.community_type.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#AE3813]" />
                <span className="text-xs font-medium text-primary-text/60 uppercase tracking-wide">
                  Community Type
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {community.community_type.map((type) => {
                  const isSelected = selectedCommunityTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTagClick?.("communityType", type);
                      }}
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30"
                          : "bg-white/10 dark:bg-white/10 text-primary-text/80 dark:text-primary-text/80 border-primary-border/90 dark:border-primary-border/90 hover:bg-white/20 dark:hover:bg-white/20 hover:border-[#AE3813]/30"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* About Community Section */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#AE3813]" />
              <span className="text-xs font-medium text-primary-text/60 uppercase tracking-wide">
                About Community
              </span>
            </div>

            {/* Description Preview - Exactly 3 lines */}
            <p className="font-sans text-sm text-primary-text/60 leading-relaxed line-clamp-3 transition-all duration-300">
              {community.purpose}
            </p>

            {/* Location Tags - Under About Community */}
            {community.location_names &&
              community.location_names.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {community.location_names.map((location) => {
                    const isSelected = selectedLocations.includes(location);
                    return (
                      <button
                        key={location}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTagClick?.("location", location);
                        }}
                        className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-[#AE3813]/20 text-[#AE3813] border-[#AE3813]/40 hover:bg-[#AE3813]/30"
                            : "bg-white/10 dark:bg-white/10 text-primary-text/80 dark:text-primary-text/80 border-primary-border/90 dark:border-primary-border/90 hover:bg-white/20 dark:hover:bg-white/20 hover:border-[#AE3813]/30"
                        }`}
                      >
                        {location}
                      </button>
                    );
                  })}
                </div>
              )}
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
