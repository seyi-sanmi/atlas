import React from "react";
import { Community } from "@/lib/supabase";
import {
  X,
  Globe,
  Linkedin,
  Users,
  Calendar,
  MapPin,
  Target,
  BookOpen,
  Info,
  Building,
} from "lucide-react";

interface CommunityDetailPaneProps {
  community: Community;
  onClose: () => void;
  showHeader?: boolean;
}

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | string[] | null | undefined;
}) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  const displayValue = Array.isArray(value) ? value.join(", ") : value;

  return (
    <div className="flex items-start gap-3 p-3 bg-secondary-bg/60 rounded-lg border border-white/5 hover:border-primary-accent/30 transition-colors duration-200">
      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary-accent/20 to-secondary-accent/20 rounded-full flex-shrink-0">
        <Icon className="w-4 h-4 text-primary-accent" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-primary-text/40 font-medium uppercase tracking-wide">
          {label}
        </span>
        <span className="font-sans text-sm text-primary-text/90">
          {displayValue}
        </span>
      </div>
    </div>
  );
};

const CommunityDetailPane: React.FC<CommunityDetailPaneProps> = ({
  community,
  onClose,
  showHeader = true,
}) => {
  return (
    <div className="h-full flex flex-col bg-secondary-bg">
      {/* Header */}
      {showHeader && (
        <div className="p-4 border-b border-primary-border flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-lg text-primary-text truncate">
            {community.name}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-primary-bg transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5 text-primary-text/80" />
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {community.purpose && (
          <div className="p-3 bg-secondary-bg/60 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-gradient-to-r from-primary-accent to-secondary-accent rounded-full"></div>
              <h4 className="font-semibold text-base text-primary-text">
                About this Community
              </h4>
            </div>
            <p className="font-sans text-primary-text/80 leading-relaxed text-sm">
              {community.purpose}
            </p>
          </div>
        )}

        <div className="grid gap-3">
          <DetailRow
            icon={Building}
            label="Community Type"
            value={community.community_type}
          />
          <DetailRow
            icon={Users}
            label="Community Size"
            value={community.size}
          />
          <DetailRow
            icon={MapPin}
            label="Location"
            value={community.location_names}
          />
          <DetailRow
            icon={Calendar}
            label="Meeting Frequency"
            value={community.meeting_frequency}
          />
          <DetailRow
            icon={BookOpen}
            label="Research Areas"
            value={community.research_area_names}
          />
          <DetailRow
            icon={Target}
            label="Target Audience"
            value={community.target_members}
          />
          <DetailRow
            icon={Info}
            label="Selection Process"
            value={community.members_selection}
          />
        </div>
      </div>

      {/* Footer with Links */}
      <div className="p-4 border-t border-primary-border flex items-center justify-end gap-2">
        {community.website && (
          <a
            href={community.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-primary-bg hover:bg-primary-accent/20 text-primary-text transition-colors"
          >
            <Globe className="w-4 h-4" />
            Website
          </a>
        )}
        {community.community_linkedin && (
          <a
            href={community.community_linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md bg-primary-bg hover:bg-primary-accent/20 text-primary-text transition-colors"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        )}
      </div>
    </div>
  );
};

export default CommunityDetailPane; 