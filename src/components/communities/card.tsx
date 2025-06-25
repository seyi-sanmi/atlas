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

interface Community {
  name: string;
  communityType: string;
  geographicLocations: string;
  academicAssociation: string | null;
  websiteUrl: string;
  researchAreas: string;
  contact: string;
  communityLinkedIn: string | null;
  size: string;
  contactEmail: string;
  contactLinkedIn: string | null;
  purpose: string;
  selectionProcessForMembers: string;
  memberLocations: string;
  communityTarget: string;
  memberCommunication: string;
  meetingFrequency: string;
  meetingLocation: string;
  leadershipChangeFrequency: string;
  communityInterestAreas: string;
  communityInformation: string;
  secondaryCommunityContact: string;
  secondaryContactEmail: string;
  secondaryContactLinkedIn: string | null;
}

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
  const hash = (
    community.name +
    community.communityType +
    (community.websiteUrl || "")
  )
    .split("")
    .reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

  // Use hash to select base color, but offset by index to avoid consecutive duplicates
  const baseColorIndex = Math.abs(hash) % lightColors.length;
  const offsetColorIndex =
    (baseColorIndex + communityIndex) % lightColors.length;

  const selectedColor = lightColors[offsetColorIndex];
  const seed = `${community.name}-${community.communityType}-light`;

  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    seed
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
      return "rounded-lg rounded-tl-none";
    } else if (isFirstInGroup) {
      return "rounded-t-lg rounded-b-none rounded-tl-lg";
    } else if (isLastInGroup) {
      return "rounded-b-lg rounded-t-none";
    } else {
      return "rounded-none border-t-0";
    }
  };

  // Generate community type initials for display
  const getTypeInitials = (type: string) => {
    return type
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          onClick={handleClick}
          className={`group relative transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${community.name}`}
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
                  backgroundImage: `url("${generateLightHeroPattern(
                    community,
                    communityIndex
                  )}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-black/40 rounded-lg" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-base sm:text-lg text-pretty font-bold text-white font-display tracking-tight px-2 text-center leading-tight">
                      {community.name}
                    </div>
                    <div className="text-xs mx-auto text-white/80 font-medium uppercase tracking-wider max-w-20 text-center mt-1">
                      {community.size}
                    </div>
                    <div className="text-xs text-white/60 font-medium">
                      Members
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="flex-1 p-6 pt-2 sm:pt-6 space-y-2 flex flex-col justify-between min-w-0">
            {/* <h3 className="font-display font-medium text-lg sm:text-2xl text-[#F5F5F7] tracking-tight leading-tight line-clamp-2">
              {community.name}
            </h3> */}

            {/* Meta Col */}
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <div className="flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                <span className="font-sans">{community.communityType}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span className="font-sans truncate">
                  {community.geographicLocations}
                </span>
              </div>
            </div>

            {/* Description Preview */}
            <p className="font-sans text-sm text-white/60 leading-relaxed line-clamp-2 transition-all duration-300">
              {community.purpose}
            </p>

            {/* Contact */}
            <div className="flex items-center gap-2 text-white/60">
              <Users className="w-4 h-4" />
              <span className="font-sans text-sm truncate">
                {community.contact}
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
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg">
        <div className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <SheetHeader>
              <SheetTitle>{community.name}</SheetTitle>
              
              {/* Community Type Subheader */}
              <div className="text-sm text-white/70 font-medium mt-1">
                {community.communityType}
              </div>
              
              {/* Academic Association Subheader (conditional) */}
              {community.academicAssociation && (
                <div className="text-sm text-white/60 font-medium mt-1">
                  {community.academicAssociation}
                </div>
              )}
              
              <div>
                <div className="flex flex-col gap-4 mt-2">
                  {/* Community Image */}
                  {/* <div className="w-full h-48 object-cover rounded-lg shadow-lg mb-2">
                    <div className="rounded-lg overflow-hidden h-full">
                      <div
                        className="w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] -translate-y-1.5"
                        style={{
                          backgroundImage: `url("${generateLightHeroPattern(
                            community,
                            communityIndex
                          )}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div className="absolute inset-0 bg-black/40 rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-white font-display tracking-tight px-2 text-center leading-tight">
                              {community.name}
                            </div>
                            <div className="text-xs text-white/80 font-medium uppercase tracking-wider mt-1">
                              {community.size}
                            </div>
                            <div className="text-xs text-white/60 font-medium">
                              Members
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Community Details Grid */}
                  <div className="grid gap-3">
                    {/* Meeting Info */}
                    <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Clock className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                          Meeting Frequency
                        </span>
                        <span className="font-sans text-sm text-white/90">
                          {community.meetingFrequency}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <MapPin className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                          Location
                        </span>
                        <span className="font-sans text-sm text-white/90">
                          {community.geographicLocations}
                        </span>
                      </div>
                    </div>

                    {/* Community Size */}
                    <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Users className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                          Community Size
                        </span>
                        <span className="font-sans text-sm text-white/90">
                          {community.size}
                        </span>
                      </div>
                    </div>

                    {/* Community LinkedIn */}
                    {community.communityLinkedIn && (
                      <div className="flex items-center gap-3 p-3 bg-[#1E1E25]/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                          <Globe className="w-4 h-4 text-[#D45E3C]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-white/40 font-medium uppercase tracking-wide">
                            LinkedIn
                          </span>
                          <a 
                            href={community.communityLinkedIn}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-sm text-[#D45E3C] hover:text-[#AE3813] transition-colors duration-200"
                          >
                            View LinkedIn Profile
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* About Section */}
                  <div className="mt-2 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                      <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                        About this Community
                      </h4>
                    </div>
                    <p className="font-sans text-white/80 leading-relaxed whitespace-pre-line text-sm">
                      {community.purpose}
                    </p>
                  </div>

                  {/* Selection Process */}
                  {community.selectionProcessForMembers && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          Selection Process
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.selectionProcessForMembers}
                      </p>
                    </div>
                  )}

                  {/* Who Can Join */}
                  {community.communityTarget && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          Who can join
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.communityTarget}
                      </p>
                    </div>
                  )}

                  {/* Member Locations */}
                  {community.memberLocations && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          Members are located in:
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.memberLocations}
                      </p>
                    </div>
                  )}

                  {/* Meeting Location */}
                  {community.meetingLocation && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          Meetings held
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.meetingLocation}
                      </p>
                    </div>
                  )}

                  {/* Research Areas */}
                  {community.researchAreas && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          Research Areas
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.researchAreas}
                      </p>
                    </div>
                  )}

                  {/* Community Information */}
                  {community.communityInformation && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-[#F5F5F7] text-base">
                          To learn more about this community:
                        </h4>
                      </div>
                      <p className="font-sans text-white/80 leading-relaxed text-sm">
                        {community.communityInformation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Fixed Footer */}
          <SheetFooter>
            <button
              className={`sm:px-4 px-4 pr-1 py-3 text-white font-medium font-sans rounded-md transition-all duration-200 flex items-center justify-between gap-2 ${
                community.websiteUrl || community.communityLinkedIn
                  ? "bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transform hover:scale-105 cursor-pointer"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const linkToOpen = community.websiteUrl || community.communityLinkedIn;
                if (linkToOpen) {
                  window.open(
                    linkToOpen,
                    "_blank",
                    "noopener,noreferrer"
                  );
                }
              }}
              disabled={!community.websiteUrl && !community.communityLinkedIn}
              title={
                community.websiteUrl
                  ? "Open community website"
                  : community.communityLinkedIn
                  ? "Open community LinkedIn"
                  : "No website or LinkedIn available"
              }
            >
              <span>
                {community.websiteUrl 
                  ? "Visit Website" 
                  : community.communityLinkedIn 
                  ? "Visit LinkedIn"
                  : "No Link Available"
                }
              </span>
              <ArrowRightIcon className="w-6 h-6 text-white" />
            </button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
