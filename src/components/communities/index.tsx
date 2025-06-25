"use client";
import React, { useEffect, useMemo, useState } from "react";
import EventFilter from "../event/list/filter";
import { EventsList } from "../event/list";
import { Header } from "../event/header";
import { EventCard } from "../event/list/card";
import Hero from "../hero";
import { CommunityCard } from "./card";
import CommunitiesFilter from "./filter";
import { Community } from "@/lib/supabase";
import {
  getAllCommunities,
  searchAndFilterCommunities,
} from "@/lib/communities";
import PartnersHero from "../hero/partners";

// Interface for the CommunityCard component (legacy format)
interface LegacyCommunity {
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

// Props interface for the component
interface ClientCommunitiesPageProps {
  initialCommunities?: Community[];
}

// Function to map Supabase Community to Legacy Community format
const mapSupabaseCommunityToLegacy = (
  community: Community
): LegacyCommunity => {
  return {
    name: community.name,
    communityType: Array.isArray(community.community_type)
      ? community.community_type[0] || "Unknown"
      : community.community_type || "Unknown",
    geographicLocations: Array.isArray(community.location_names)
      ? community.location_names.join(", ")
      : community.location_names || "Unknown",
    academicAssociation: Array.isArray(community.academic_association)
      ? community.academic_association.join(", ")
      : community.academic_association,
    websiteUrl: community.website || "#",
    researchAreas: Array.isArray(community.research_area_names)
      ? community.research_area_names.join(", ")
      : community.research_area_names || "Unknown",
    contact: "Contact", // This field doesn't exist in the new schema
    communityLinkedIn: community.community_linkedin,
    size: community.size || "Unknown",
    contactEmail: "contact@example.com", // This field doesn't exist in the new schema
    contactLinkedIn: null, // This field doesn't exist in the new schema
    purpose: community.purpose || "No purpose specified",
    selectionProcessForMembers: community.members_selection || "Unknown",
    memberLocations: community.member_locations || "Unknown",
    communityTarget: community.target_members || "Unknown",
    memberCommunication: Array.isArray(community.member_communication)
      ? community.member_communication.join(", ")
      : community.member_communication || "Unknown",
    meetingFrequency: community.meeting_frequency || "Unknown",
    meetingLocation: community.meeting_location || "Unknown",
    leadershipChangeFrequency:
      community.leadership_change_frequency || "Unknown",
    communityInterestAreas: Array.isArray(community.community_interest_areas)
      ? community.community_interest_areas.join(", ")
      : community.community_interest_areas || "Unknown",
    communityInformation:
      community.community_information || "No additional information",
    secondaryCommunityContact: "Secondary Contact", // This field doesn't exist in the new schema
    secondaryContactEmail: "secondary@example.com", // This field doesn't exist in the new schema
    secondaryContactLinkedIn: null, // This field doesn't exist in the new schema
  };
};

function ClientCommunitiesPage({
  initialCommunities = [],
}: ClientCommunitiesPageProps) {
  const [selectedCommunity, setSelectedCommunity] =
    useState<LegacyCommunity | null>(null);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(initialCommunities.length === 0);
  const [communities, setCommunities] =
    useState<Community[]>(initialCommunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch communities on component mount only if we don't have initial data
  useEffect(() => {
    if (initialCommunities.length === 0) {
      const fetchCommunities = async () => {
        try {
          setLoading(true);
          const data = await getAllCommunities();
          setCommunities(data);
        } catch (error) {
          console.error("Error fetching communities:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchCommunities();
    }
  }, [initialCommunities.length]);

  // Fetch filtered communities when search/filter changes
  useEffect(() => {
    const fetchFilteredCommunities = async () => {
      try {
        setLoading(true);
        const data = await searchAndFilterCommunities({
          query: searchQuery,
          communityType: selectedCategory,
          location: selectedLocation,
        });
        setCommunities(data);
      } catch (error) {
        console.error("Error filtering communities:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only apply filters if any are set, otherwise use the default fetch
    if (searchQuery || selectedLocation || selectedCategory) {
      fetchFilteredCommunities();
    } else if (initialCommunities.length > 0) {
      // Reset to initial communities when filters are cleared
      setCommunities(initialCommunities);
      setLoading(false);
    }
  }, [searchQuery, selectedLocation, selectedCategory, initialCommunities]);

  const handleCommunitySelect = (community: LegacyCommunity) => {
    console.log("Selected community:", community);
    setSelectedCommunity(community);
  };

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Group communities by type
  const groupedCommunities = useMemo(() => {
    const groups: { [type: string]: LegacyCommunity[] } = {};

    communities.forEach((community) => {
      // Handle community_type as array (from Supabase) vs string (from static data)
      const types = Array.isArray(community.community_type)
        ? community.community_type
        : [community.community_type];

      types.forEach((type) => {
        if (!groups[type]) {
          groups[type] = [];
        }
        // Map to legacy format before adding to groups
        groups[type].push(mapSupabaseCommunityToLegacy(community));
      });
    });

    // Sort groups alphabetically and sort communities within each group by name
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, communities]) => ({
        type,
        communities: communities.sort((a, b) => a.name.localeCompare(b.name)),
      }));

    // Calculate global indices for each community to ensure color diversity
    let globalCommunityIndex = 0;
    return sortedGroups.map(({ type, communities }) => ({
      type,
      communities: communities.map((community) => ({
        ...community,
        globalIndex: globalCommunityIndex++,
      })),
    }));
  }, [communities]);

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <PartnersHero />

      {/* Main Content */}
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl ">
          {/* <div className="hidden lg:block lg:w-1/3 mt-20">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <CommunitiesFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedDate={null}
                onDateChange={() => {}}
              />
            </div>
          </div> */}
          <div className=" min-h-screen w-full">
            <div className="p-2 sm:p-8">
              <div className="w-full space-y-12">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="text-white/60 text-lg font-medium mb-2">
                      Loading communities...
                    </div>
                  </div>
                ) : (
                  groupedCommunities.map(({ type, communities }) => {
                    const isCollapsed = collapsedSections.has(type);

                    return (
                      <section key={type} className="">
                        <div className="data-atlas-overlay-nav mx-auto">
                          <div className="mx-auto atlas-overlay-notch bg-[#1E1E25] border-t border-b border-[#565558] border-l">
                            <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-white tracking-wide pl-1">
                              <svg
                                width="60"
                                height="42"
                                viewBox="0 0 60 42"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="atlas-overlay-notch-tail-right"
                                preserveAspectRatio="none"
                              >
                                <mask
                                  id="error_overlay_nav_mask0_2667_14687"
                                  maskUnits="userSpaceOnUse"
                                  x="0"
                                  y="-1"
                                  width="60"
                                  height="43"
                                  style={{ maskType: "alpha" }}
                                >
                                  <mask
                                    id="error_overlay_nav_path_1_outside_1_2667_14687"
                                    maskUnits="userSpaceOnUse"
                                    x="0"
                                    y="-1"
                                    width="60"
                                    height="43"
                                    fill="black"
                                  >
                                    <rect
                                      fill="white"
                                      y="-1"
                                      width="60"
                                      height="43"
                                    ></rect>
                                    <path d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"></path>
                                  </mask>
                                  <path
                                    d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"
                                    fill="white"
                                  ></path>
                                  <path
                                    d="M1 0V-1H0V0L1 0ZM1 41H0V42H1V41ZM34.8889 29.6498L33.9873 30.0823L34.8889 29.6498ZM26.111 11.3501L27.0127 10.9177L26.111 11.3501ZM1 1H8.0783V-1H1V1ZM60 40H1V42H60V40ZM2 41V0L0 0L0 41H2ZM25.2094 11.7826L33.9873 30.0823L35.7906 29.2174L27.0127 10.9177L25.2094 11.7826ZM52.9217 42H60V40H52.9217V42ZM33.9873 30.0823C37.4811 37.3661 44.8433 42 52.9217 42V40C45.6127 40 38.9517 35.8074 35.7906 29.2174L33.9873 30.0823ZM8.0783 1C15.3873 1 22.0483 5.19257 25.2094 11.7826L27.0127 10.9177C23.5188 3.6339 16.1567 -1 8.0783 -1V1Z"
                                    fill="black"
                                    mask="url(#error_overlay_nav_path_1_outside_1_2667_14687)"
                                  ></path>
                                </mask>
                                <g mask="url(#error_overlay_nav_mask0_2667_14687)">
                                  <mask
                                    id="error_overlay_nav_path_3_outside_2_2667_14687"
                                    maskUnits="userSpaceOnUse"
                                    x="-1"
                                    y="0.0244141"
                                    width="60"
                                    height="43"
                                    fill="black"
                                  >
                                    <rect
                                      fill="white"
                                      x="-1"
                                      y="0.0244141"
                                      width="60"
                                      height="43"
                                    ></rect>
                                    <path d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"></path>
                                  </mask>
                                  <path
                                    d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"
                                    fill="#1E1E25"
                                  ></path>
                                  <path
                                    d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                                    fill="#565558"
                                    mask="url(#error_overlay_nav_path_3_outside_2_2667_14687)"
                                  ></path>
                                </g>
                              </svg>
                              <div className="max-w-52 min-w-42 truncate">
                                {type}
                              </div>
                              <div className="w-1 h-1 bg-white/60 rounded-full" />
                              <span className="text-[12px] sm:text-base shrink-0 font-light text-white/60">
                                {communities.length}
                              </span>
                            </h2>

                            <svg
                              width="60"
                              height="42"
                              viewBox="0 0 60 42"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="atlas-overlay-notch-tail"
                              preserveAspectRatio="none"
                            >
                              <mask
                                id="error_overlay_nav_mask0_2667_14687"
                                maskUnits="userSpaceOnUse"
                                x="0"
                                y="-1"
                                width="60"
                                height="43"
                                style={{ maskType: "alpha" }}
                              >
                                <mask
                                  id="error_overlay_nav_path_1_outside_1_2667_14687"
                                  maskUnits="userSpaceOnUse"
                                  x="0"
                                  y="-1"
                                  width="60"
                                  height="43"
                                  fill="black"
                                >
                                  <rect
                                    fill="white"
                                    y="-1"
                                    width="60"
                                    height="43"
                                  ></rect>
                                  <path d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"></path>
                                </mask>
                                <path
                                  d="M1 0L8.0783 0C15.772 0 22.7836 4.41324 26.111 11.3501L34.8889 29.6498C38.2164 36.5868 45.228 41 52.9217 41H60H1L1 0Z"
                                  fill="white"
                                ></path>
                                <path
                                  d="M1 0V-1H0V0L1 0ZM1 41H0V42H1V41ZM34.8889 29.6498L33.9873 30.0823L34.8889 29.6498ZM26.111 11.3501L27.0127 10.9177L26.111 11.3501ZM1 1H8.0783V-1H1V1ZM60 40H1V42H60V40ZM2 41V0L0 0L0 41H2ZM25.2094 11.7826L33.9873 30.0823L35.7906 29.2174L27.0127 10.9177L25.2094 11.7826ZM52.9217 42H60V40H52.9217V42ZM33.9873 30.0823C37.4811 37.3661 44.8433 42 52.9217 42V40C45.6127 40 38.9517 35.8074 35.7906 29.2174L33.9873 30.0823ZM8.0783 1C15.3873 1 22.0483 5.19257 25.2094 11.7826L27.0127 10.9177C23.5188 3.6339 16.1567 -1 8.0783 -1V1Z"
                                  fill="black"
                                  mask="url(#error_overlay_nav_path_1_outside_1_2667_14687)"
                                ></path>
                              </mask>
                              <g mask="url(#error_overlay_nav_mask0_2667_14687)">
                                <mask
                                  id="error_overlay_nav_path_3_outside_2_2667_14687"
                                  maskUnits="userSpaceOnUse"
                                  x="-1"
                                  y="0.0244141"
                                  width="60"
                                  height="43"
                                  fill="black"
                                >
                                  <rect
                                    fill="white"
                                    x="-1"
                                    y="0.0244141"
                                    width="60"
                                    height="43"
                                  ></rect>
                                  <path d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"></path>
                                </mask>
                                <path
                                  d="M0 1.02441H7.0783C14.772 1.02441 21.7836 5.43765 25.111 12.3746L33.8889 30.6743C37.2164 37.6112 44.228 42.0244 51.9217 42.0244H59H0L0 1.02441Z"
                                  fill="#1E1E25"
                                ></path>
                                <path
                                  d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                                  fill="#565558"
                                  mask="url(#error_overlay_nav_path_3_outside_2_2667_14687)"
                                ></path>
                              </g>
                            </svg>
                          </div>
                        </div>

                        {/* Communities Grid */}
                        {!isCollapsed && (
                          <div className="divide-x divide-y divide-white/30 grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#1E1E25] border border-[#565558] rounded-lg overflow-hidden">
                            {communities.map((community, communityIndex) => (
                              <CommunityCard
                                key={community.name}
                                community={community}
                                onClick={() => handleCommunitySelect(community)}
                                isSelected={
                                  selectedCommunity?.name === community.name
                                }
                                isFirstInGroup={communityIndex === 0}
                                isLastInGroup={
                                  communityIndex === communities.length - 1
                                }
                                communityIndex={(community as any).globalIndex}
                              />
                            ))}
                          </div>
                        )}
                      </section>
                    );
                  })
                )}

                {groupedCommunities.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="text-white/60 text-lg font-medium mb-2">
                      No communities found
                    </div>
                    <div className="text-white/40 text-sm">
                      Check back later for new communities
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientCommunitiesPage;
