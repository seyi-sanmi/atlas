"use client";
import React, { useEffect, useState } from "react";
import { CommunityCard } from "./card";
import CommunitiesFilter from "./filter";
import { Community } from "@/lib/supabase";
import {
  getAllCommunities,
  searchAndFilterCommunities,
} from "@/lib/communities";
import PartnersHero from "../hero/partners";
import { useTheme } from "next-themes";
import { Header } from "../event/header";
import CommunityDetailPane from "./detail-pane";

// Randomized research areas list - stable across renders
const RESEARCH_AREAS = [
  "Biotech & Synthetic Biology",
  "Genetics & Genomics",
  "Healthcare & Medicine",
  "Longevity & Aging",
  "Biosecurity & Biodefense",
  "Neuroscience",
  "Materials Science",
  "Quantum Computing",
  "Robotics",
  "Nanotechnology",
  "Space & Astronomy",
  "Neurotechnology",
  "Climate & Atmospheric Science",
  "Renewable Energy",
  "Deep Tech",
  "Ocean & Marine Science",
  "Conservation Biology",
  "Agriculture & Food Systems",
  "Environmental Health",
  "Artificial Intelligence",
  "Machine Learning",
  "Bioinformatics",
  "Chemoinformatics",
  "High-Performance Computing",
  "Data Analytics",
  "Natural Language Processing",
  "Biochemistry",
  "Chemistry",
  "Physics",
  "Biology",
  "Mathematics",
  "Photonics",
  "Computer Vision",
]
  .sort(() => Math.random() - 0.5)
  .map((name) => ({ name }));

interface ClientCommunitiesPageProps {
  initialCommunities?: Community[];
}

function ClientCommunitiesPage({
  initialCommunities = [],
}: ClientCommunitiesPageProps) {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  );
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(initialCommunities.length === 0);
  const [communities, setCommunities] =
    useState<Community[]>(initialCommunities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>(
    []
  );

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
          researchAreas: selectedResearchAreas,
        });
        setCommunities(data);
      } catch (error) {
        console.error("Error filtering communities:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only apply filters if any are set, otherwise use the default fetch
    if (
      searchQuery ||
      selectedLocation ||
      selectedCategory ||
      selectedResearchAreas.length > 0
    ) {
      fetchFilteredCommunities();
    } else {
      // Reset to initial communities when filters are cleared
      setCommunities(initialCommunities);
    }
  }, [
    searchQuery,
    selectedLocation,
    selectedCategory,
    selectedResearchAreas,
    initialCommunities,
  ]);

  const handleCommunitySelect = (community: Community) => {
    setSelectedCommunity(community);
  };

  const handleCloseDetailPane = () => {
    setSelectedCommunity(null);
  };

  const { theme } = useTheme();
  return (
    <div className="min-h-screen w-full bg-primary-bg text-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <PartnersHero
        title="Science Communities"
        showBackground={false}
        height="h-[40vh] sm:h-[45vh]"
        typewriterItems={RESEARCH_AREAS}
      />

      {/* Main Content */}
      <main className="relative -mt-48 z-10">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl ">
          {/* Sticky Filter Bar - Only sticky when reached */}
          <div className="sticky top-[var(--header-height)] z-20 bg-primary-bg/95 backdrop-blur-sm py-4 mt-20 border-b border-primary-border/30">
            <CommunitiesFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedResearchAreas={selectedResearchAreas}
              onResearchAreasChange={setSelectedResearchAreas}
              selectedDate={null}
              onDateChange={() => {}}
            />
          </div>
          
          {/* Conditional Layout: Both views sticky below filter */}
          <div className="transition-all duration-700 ease-in-out">
            {!selectedCommunity ? (
              /* Grid View - Sticky below filter bar */
              <div className="sticky top-[calc(var(--header-height)+var(--filter-height))] bg-secondary-bg border border-primary-border rounded-lg overflow-hidden mt-4 h-[var(--content-height)] animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <div className="p-4 sm:p-6 overflow-y-auto h-full">
                  <div className="w-full">
                    {loading ? (
                      <div className="text-center py-16">
                        <div className="text-primary-text/60 text-lg font-medium mb-2">
                          Loading communities...
                        </div>
                      </div>
                    ) : communities.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {communities.map((community, communityIndex) => (
                          <CommunityCard
                            key={community.name || communityIndex}
                            community={community}
                            onClick={() => handleCommunitySelect(community)}
                            isSelected={false}
                            communityIndex={communityIndex}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-primary-text/60 text-lg font-medium mb-2">
                          No communities found
                        </div>
                        <div className="text-primary-text/40 text-sm">
                          Check back later for new communities or clear your filters.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Split-Pane View - Also sticky below filter bar */
              <div className="sticky top-[calc(var(--header-height)+var(--filter-height))] grid md:grid-cols-[1fr_1fr] gap-0 bg-secondary-bg border border-primary-border rounded-lg overflow-hidden mt-4 h-[var(--content-height)] animate-in fade-in-0 slide-in-from-right-6 duration-500">
                {/* Left Pane: Communities List */}
                <div className="overflow-y-auto">
                  <div className="py-2 pl-2 sm:pt-4 sm:pb-8 sm:pl-8">
                    {/* Tab Content */}
                    <div className="w-full">
                      {loading ? (
                        <div className="text-center py-16">
                          <div className="text-primary-text/60 text-lg font-medium mb-2">
                            Loading communities...
                          </div>
                        </div>
                      ) : communities.length > 0 ? (
                        <div className="space-y-0 divide-y dark:divide-white/30 divide-primary-border">
                          {communities.map((community, communityIndex) => (
                            <CommunityCard
                              key={community.name || communityIndex}
                              community={community}
                              onClick={() => handleCommunitySelect(community)}
                              isSelected={
                                selectedCommunity?.name === community.name
                              }
                              communityIndex={communityIndex}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-primary-text/60 text-lg font-medium mb-2">
                            No communities found
                          </div>
                          <div className="text-primary-text/40 text-sm">
                            Check back later for new communities or clear your
                            filters.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Pane: Community Details - Sticky within container */}
                <div className="hidden md:block h-[var(--content-height)] border-l border-primary-border bg-secondary-bg overflow-hidden">
                  <CommunityDetailPane
                    community={selectedCommunity}
                    onClose={handleCloseDetailPane}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientCommunitiesPage;
