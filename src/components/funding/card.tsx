import React, { useState } from "react";
import {
  MapPin,
  Clock,
  Users,
  Star,
  ArrowRightCircle,
  ArrowRightIcon,
  DollarSign,
  CalendarDays,
  Building,
  Target,
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

interface FundingOpportunity {
  name: string;
  description: string;
  funder: string;
  deadline: string;
  amount: number;
  focusArea: string;
  eligibility: string;
  applicationLink: string;
  is_starred: boolean;
}

interface EventCardProps {
  funding: FundingOpportunity;
  onClick: () => void;
  isSelected?: boolean;
  showAmount?: boolean;
  isLastInGroup?: boolean;
  isFirstInGroup?: boolean;
  focusArea: string; // Focus area for the funding
  fundingIndex?: number; // Index position to prevent consecutive colors
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
  funding: FundingOpportunity,
  fundingIndex: number = 0
) => {
  // Create a hash from funding properties for consistent selection
  const hash = (funding.name + funding.deadline + funding.funder)
    .split("")
    .reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);

  // Use hash to select base color, but offset by index to avoid consecutive duplicates
  const baseColorIndex = Math.abs(hash) % lightColors.length;
  const offsetColorIndex = (baseColorIndex + fundingIndex) % lightColors.length;

  const selectedColor = lightColors[offsetColorIndex];
  const seed = `${funding.name}-${funding.deadline}-light`;

  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=${selectedColor}&scale=120`;
};

export function EventCard({
  focusArea,
  funding,
  onClick,
  isSelected = false,
  showAmount = true,
  isLastInGroup = false,
  isFirstInGroup = false,
  fundingIndex = 0,
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

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div
          onClick={handleClick}
          className={`group relative transition-all duration-300 cursor-pointer overflow-hidden flex flex-col sm:flex-row min-h-[200px] animate-pulse-scale `}
          tabIndex={0}
          role="button"
          aria-label={`View details for ${funding.name}`}
        >
          {/* Hero Image Side - Always show with DiceBear patterns */}
          {/* <div className="p-4 pb-4 pt-4 sm:pr-0 h-48 bg-secondary-bg w-full sm:w-2/5 sm:h-auto relative">
            <div className="rounded-lg overflow-hidden h-full">
              <div
                className={`w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative ${
                  isSelected
                    ? "border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] "
                    : ""
                } ${isClicked ? "animate-ripple" : ""}`}
                style={{
                  backgroundImage: `url("${generateLightHeroPattern(
                    funding,
                    fundingIndex
                  )}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="text-2xl sm:text-3xl font-bold text-primary-text font-display tracking-tight mb-1">
                      {focusArea.split(" ")[0]}
                    </div>
                    <div className="text-base text-primary-text/80 font-medium uppercase tracking-wider">
                      {focusArea.split(" ").slice(1).join(" ")}
                    </div>
                    <div className="text-sm text-primary-text/60 font-medium mt-2">
                      {funding.amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          {/* Starred indicator */}

          {/* Content Side */}
          <div className="flex-1 p-6 pt-2 sm:pt-6 space-y-4 flex flex-col justify-between min-w-0">
            {/* Title */}

            <h3 className="font-display font-medium text-lg sm:text-2xl text-secondary-text tracking-tight leading-tight line-clamp-2">
              <span>{funding.name}</span>

              {funding.is_starred && (
                <span className="inline-block -mb-1.5 ml-[4px] w-fit bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 p-1.5 rounded-full shadow-xl border-2 border-yellow-200/80 backdrop-blur-sm">
                  <Star className="w-3 h-3 text-yellow-800 fill-current drop-shadow-sm" />
                </span>
              )}
            </h3>

            {/* Meta Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-primary-text/60">
              {showAmount && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-sans font-medium">
                    {/* {formatAmount(funding.amount)} */}
                    {funding.amount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                <span className="font-sans truncate">
                  {getDaysUntilDeadline(funding.deadline)} days left
                </span>
              </div>
            </div>

            {/* Description Preview */}
            {funding.description && (
              <p className="font-sans text-sm text-primary-text/60 leading-relaxed line-clamp-2 transition-all duration-300">
                {funding.description}
              </p>
            )}

            {/* Focus Area & Funder */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary-text/60">
                <Target className="w-4 h-4" />
                <span className="font-sans text-sm truncate">
                  {funding.focusArea}
                </span>
              </div>
              <div className="flex items-center gap-2 text-primary-text/60">
                <Building className="w-4 h-4" />
                <span className="font-sans text-sm truncate">
                  {funding.funder}
                </span>
              </div>
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

      <SheetContent className="w-full sm:max-w-sm">
        <div className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <SheetHeader>
              <SheetTitle>{funding.name}</SheetTitle>
              <div>
                <div className="flex flex-col gap-4 mt-2">
                  {/* Funding Image */}
                  <div className="w-full h-48 object-cover rounded-lg shadow-lg mb-2">
                    <div className="rounded-lg overflow-hidden h-full">
                      <div
                        className="w-full h-full rounded-lg group-hover:border-[#AE3813] group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.4)] focus:outline-none focus:border-[#AE3813] focus:border-2 transition-transform duration-300 ease-in-out group-hover:scale-110 relative border-[#AE3813] shadow-[0_12px_24px_rgba(0,0,0,0.4)] "
                        style={{
                          backgroundImage: `url("${generateLightHeroPattern(
                            funding,
                            fundingIndex
                          )}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center center",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <div className="absolute inset-0 dark:bg-black/40 bg-black/10 rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center px-4">
                            <div className="text-2xl sm:text-3xl font-bold text-primary-text font-display tracking-tight mb-1">
                              {focusArea.split(" ")[0]}
                            </div>
                            <div className="text-base text-primary-text/80 font-medium uppercase tracking-wider">
                              {focusArea.split(" ").slice(1).join(" ")}
                            </div>
                            <div className="text-sm text-primary-text/60 font-medium mt-2">
                              {formatAmount(funding.amount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Funding Details Grid */}
                  <div className="grid gap-3">
                    {/* Amount */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <DollarSign className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Amount
                        </span>
                        <span className="font-sans text-sm text-primary-text/90 font-semibold">
                          {formatAmount(funding.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <CalendarDays className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Deadline
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {new Date(funding.deadline).toLocaleDateString(
                            "en-GB"
                          )}{" "}
                          ({getDaysUntilDeadline(funding.deadline)} days)
                        </span>
                      </div>
                    </div>

                    {/* Focus Area */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Target className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Focus Area
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {funding.focusArea}
                        </span>
                      </div>
                    </div>

                    {/* Funder */}
                    <div className="flex items-center gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-[#D45E3C]/30 transition-colors duration-200">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-[#AE3813]/20 to-[#D45E3C]/20 rounded-full">
                        <Building className="w-4 h-4 text-[#D45E3C]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
                          Funder
                        </span>
                        <span className="font-sans text-sm text-primary-text/90">
                          {funding.funder}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  {funding.description && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-secondary-text text-base">
                          About this Funding
                        </h4>
                      </div>
                      <p className="font-sans text-primary-text/80 leading-relaxed whitespace-pre-line text-sm">
                        {funding.description}
                      </p>
                    </div>
                  )}

                  {/* Eligibility Section */}
                  {funding.eligibility && (
                    <div className="mt-2 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-[#AE3813] to-[#D45E3C] rounded-full"></div>
                        <h4 className="font-semibold font-display text-secondary-text text-base">
                          Eligibility
                        </h4>
                      </div>
                      <p className="font-sans text-primary-text/80 leading-relaxed whitespace-pre-line text-sm">
                        {funding.eligibility}
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
              className={`  sm:px-4 px-4 pr-1 py-3 dark:text-primary-text text-white font-medium font-sans rounded-md transition-all duration-200 flex items-center justify-between gap-2 ${
                funding.applicationLink
                  ? "bg-gradient-to-r from-[#AE3813] to-[#D45E3C] hover:from-[#AE3813]/80 hover:to-[#D45E3C]/80 transform hover:scale-105 cursor-pointer"
                  : "bg-gray-600 cursor-not-allowed opacity-50"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (funding.applicationLink) {
                  const urlWithUtm = addUtmParameters(funding.applicationLink);
                  window.open(urlWithUtm, "_blank", "noopener,noreferrer");
                }
              }}
              disabled={!funding.applicationLink}
              title={
                funding.applicationLink
                  ? "Open application page"
                  : "No application URL available"
              }
            >
              <span>
                {funding.applicationLink ? "Apply Now" : "No URL Available"}
              </span>
              <ArrowRightIcon className="w-6 h-6 dark:text-primary-text text-white" />
            </button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export default EventCard;
