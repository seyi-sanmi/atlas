import { MapPin } from "lucide-react";
import { Community } from "@/lib/supabase";

const BORDER_COLORS = [
  "#F56565", // Red
  "#48BB78", // Green
  "#4299E1", // Blue
  "#ED8936", // Orange
  "#9F7AEA", // Purple
  "#38B2AC", // Teal
  "#ECC94B", // Yellow
];

interface CommunityCardProps {
  community: Community;
  onClick: () => void;
  isSelected: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  communityIndex: number;
}

export const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onClick,
  isSelected,
  isFirstInGroup,
  isLastInGroup,
  communityIndex,
}) => {
  const borderColor = BORDER_COLORS[communityIndex % BORDER_COLORS.length];

  return (
    <div
      onClick={onClick}
      className={`data-atlas-card-item relative flex flex-col justify-between cursor-pointer bg-[#1E1E25] p-6 transition-all duration-300 ease-in-out group ${
        isFirstInGroup ? "rounded-t-lg" : ""
      } ${isLastInGroup ? "rounded-b-lg" : ""}`}
      style={{
        borderTop: isFirstInGroup ? `1px solid ${borderColor}` : "none",
        borderBottom: `1px solid ${borderColor}`,
        borderLeft: `1px solid ${borderColor}`,
        borderRight: `1px solid ${borderColor}`,
        marginTop: isFirstInGroup ? 0 : "-1px",
      }}
    >
      <div className="flex-grow">
        <h3 className="text-lg font-medium text-white mb-2">{community.name}</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {community.community_type?.map((type) => (
            <span
              key={type}
              className="px-2 py-1 text-xs font-medium text-orange-300 bg-orange-900/50 rounded-full"
            >
              {type}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-400 line-clamp-2 mb-4">
          {community.purpose}
        </p>
      </div>

      <div className="flex-shrink-0">
        <div className="flex items-center text-sm text-gray-500">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{community.location_names?.join(", ") || "N/A"}</span>
        </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-orange-500 ring-opacity-75 animate-pulse" />
      )}
    </div>
  );
}; 