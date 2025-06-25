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
import { getAllCommunities, searchAndFilterCommunities } from "@/lib/communities";

function ClientCommunitiesPage() {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Initial load of all communities
  useEffect(() => {
    const loadCommunities = async () => {
      setIsLoadingCommunities(true);
      try {
        const data = await getAllCommunities();
        setCommunities(data);
      } catch (error) {
        console.error('Error loading communities:', error);
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    loadCommunities();
  }, []);

  // Handle filtering when criteria change
  useEffect(() => {
    // A simple debounce to avoid firing too many requests while typing
    const handler = setTimeout(() => {
      // Don't run filter on initial load
      if (isLoadingCommunities) return;

      const applyFilters = async () => {
        setIsFiltering(true);
        try {
          const filteredData = await searchAndFilterCommunities({
            query: searchQuery,
            communityType: selectedCategory,
            location: selectedLocation,
          });
          setCommunities(filteredData);
        } catch (error) {
          console.error('Error filtering communities:', error);
        } finally {
          setIsFiltering(false);
        }
      };
      
      applyFilters();

    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, selectedLocation, selectedCategory, isLoadingCommunities]);

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
  };

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Group communities by their primary type
  const groupedCommunities = useMemo(() => {
    const groups: { [type: string]: Community[] } = {};

    communities.forEach((community) => {
      // Use the first community type as the primary one for grouping
      const primaryType = community.community_type?.[0] || "Uncategorized";
      if (!groups[primaryType]) {
        groups[primaryType] = [];
      }
      groups[primaryType].push(community);
    });

    // Sort groups alphabetically and communities within each group by name
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, communities]) => ({
        type,
        communities: communities.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [communities]);

  if (isLoadingCommunities) {
    return (
      <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
        <Header />
        <Hero />
        <main className="relative -mt-40 z-20">
          <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/60">Loading communities...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />
      <Hero />
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl sm:flex">
          <div className="hidden lg:block lg:w-1/3 mt-20">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <CommunitiesFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          </div>
          <div className="min-h-screen lg:w-2/3">
            <div className="p-2 sm:p-8">
              {isFiltering && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <span className="ml-2 text-white/60">Filtering...</span>
                </div>
              )}
              
              <div className="w-full space-y-12">
                {!isFiltering && communities.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-white/60">No communities found matching your criteria.</p>
                  </div>
                ) : (
                  groupedCommunities.map(({ type, communities }) => (
                    <section key={type} className="">
                      <div className="data-atlas-overlay-nav">
                        <div className="atlas-overlay-notch bg-[#1E1E25] border-t border-b border-[#565558] border-l">
                          <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-white tracking-wide pl-1">
                            <div className="max-w-56 min-w-42 truncate">{type}</div>
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
                      <div className="grid grid-cols-1 gap-0">
                        {communities.map((community, communityIndex) => (
                          <CommunityCard
                            key={community.name}
                            community={community}
                            onClick={() => handleCommunitySelect(community)}
                            isSelected={selectedCommunity?.name === community.name}
                            isFirstInGroup={communityIndex === 0}
                            isLastInGroup={communityIndex === communities.length - 1}
                            communityIndex={communityIndex}
                          />
                        ))}
                      </div>
                    </section>
                  ))
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
