"use client";
import React, { useEffect, useMemo, useState } from "react";

import { EventsList } from "../event/list";
import { Header } from "../event/header";
import Hero from "../hero";
import { EventCard } from "./card";
import FundingFilter from "./filter";
import PartnersHero from "../hero/partners";
import NewFundingFilter from "./new-filter";
import { useTheme } from "next-themes";

export interface FundingOpportunity {
  name: string;
  description: string;
  funder: string;
  deadline: string; // ISO date string
  amount: number;
  focusArea: string;
  eligibility: string;
  applicationLink: string;
  is_starred: boolean;
}
const fundingOpportunities: FundingOpportunity[] = [
  {
    name: "Tech for Good Grant",
    description:
      "Supports the development and scaling of innovative technology solutions designed to address pressing social challenges.",
    funder: "Innovate UK & The Social Tech Trust",
    deadline: "2025-10-31T23:59:00Z",
    amount: 100000,
    focusArea: "Technology & Social Impact",
    eligibility:
      "UK-registered startups and SMEs with a clear social mission and a functioning prototype.",
    applicationLink: "https://example.com/apply/tech-for-good",
    is_starred: false,
  },
  {
    name: "Early-Career Scientist Catalyst Fund",
    description:
      "Seed funding for post-doctoral researchers in the physical sciences to launch novel, high-risk, high-reward research projects.",
    funder: "The Royal Society",
    deadline: "2026-01-31T23:59:00Z",
    amount: 20000,
    focusArea: "Scientific Research",
    eligibility:
      "Researchers within 5 years of their PhD award, affiliated with a UK university or recognised research institution.",
    applicationLink: "https://example.com/apply/scientist-catalyst",
    is_starred: true,
  },
  {
    name: "Medical Research Breakthrough Grant",
    description:
      "Funding for laboratory-based research projects with the potential for significant breakthroughs in medical science.",
    funder: "The Wellcome Trust",
    deadline: "2026-02-28T23:59:00Z",
    amount: 120000,
    focusArea: "Scientific Research",
    eligibility:
      "Established researchers with a PhD and a host institution in the UK.",
    applicationLink: "https://example.com/apply/medical-breakthrough",
    is_starred: false,
  },
  {
    name: "Heritage Restoration Initiative",
    description:
      "Capital grants for the urgent repair and restoration of listed historical buildings and structures of significant local or national importance.",
    funder: "National Heritage Fund",
    deadline: "2025-11-20T23:59:00Z",
    amount: 250000,
    focusArea: "Heritage & Conservation",
    eligibility:
      "Owners of Grade I or Grade II* listed buildings, or registered building preservation trusts.",
    applicationLink: "https://example.com/apply/heritage-restoration",
    is_starred: false,
  },
  {
    name: "Future Leaders in STEM Scholarship",
    description:
      "Scholarships for underrepresented students pursuing higher education in Science, Technology, Engineering, and Mathematics.",
    funder: "The STEM Forward Foundation",
    deadline: "2025-11-22T23:59:00Z",
    amount: 5000,
    focusArea: "Education & STEM",
    eligibility:
      "Final year A-Level students from households with an income below £30,000, holding an offer from a UK university for a STEM subject.",
    applicationLink: "https://example.com/apply/stem-leaders",
    is_starred: false,
  },
  {
    name: "STEM for All Ages",
    description:
      "Grants for community projects that make STEM subjects accessible and engaging for people of all ages, outside of formal education.",
    funder: "The Newton Society",
    deadline: "2025-11-25T23:59:00Z",
    amount: 45000,
    focusArea: "Education & STEM",
    eligibility: "Museums, libraries, and registered charities in the UK.",
    applicationLink: "https://example.com/apply/stem-for-all",
    is_starred: false,
  },
  {
    name: "Primary School Coding Clubs",
    description:
      "Funding to establish and run coding and robotics clubs for primary school children (ages 7-11).",
    funder: "The Raspberry Pi Foundation",
    deadline: "2025-11-15T23:59:00Z",
    amount: 15000,
    focusArea: "Education & STEM",
    eligibility: "UK primary schools and parent-teacher associations.",
    applicationLink: "https://example.com/apply/primary-coding",
    is_starred: false,
  },
];

function ClientFundingPage() {
  const [selectedFunding, setSelectedFunding] =
    useState<FundingOpportunity | null>(null);
  const [isLoadingFunding, setIsLoadingFunding] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFunder, setSelectedFunder] = useState("");
  const [selectedFocusArea, setSelectedFocusArea] = useState("");
  const [selectedAmountRange, setSelectedAmountRange] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Typewriter effect for city and background image

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleFundingSelect = (funding: FundingOpportunity) => {
    console.log("Selected funding:", funding);
    setSelectedFunding(funding);
  };

  // Filter funding opportunities based on selected filters
  const filteredFunding = useMemo(() => {
    let filtered = fundingOpportunities;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (funding) =>
          funding.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          funding.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          funding.funder.toLowerCase().includes(searchQuery.toLowerCase()) ||
          funding.focusArea.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Funder filter
    if (selectedFunder) {
      filtered = filtered.filter(
        (funding) => funding.funder === selectedFunder
      );
    }

    // Focus area filter
    if (selectedFocusArea) {
      filtered = filtered.filter(
        (funding) => funding.focusArea === selectedFocusArea
      );
    }

    // Amount range filter
    if (selectedAmountRange && selectedAmountRange !== "All Amounts") {
      filtered = filtered.filter((funding) => {
        const amount = funding.amount;
        switch (selectedAmountRange) {
          case "Under £10,000":
            return amount < 10000;
          case "£10,000 - £50,000":
            return amount >= 10000 && amount <= 50000;
          case "£50,000 - £100,000":
            return amount >= 50000 && amount <= 100000;
          case "Over £100,000":
            return amount > 100000;
          default:
            return true;
        }
      });
    }

    // Date filter (deadline)
    if (selectedDate) {
      filtered = filtered.filter((funding) => {
        const deadline = new Date(funding.deadline);
        return deadline.toDateString() === selectedDate.toDateString();
      });
    }

    return filtered;
  }, [
    searchQuery,
    selectedFunder,
    selectedFocusArea,
    selectedAmountRange,
    selectedDate,
  ]);

  // Group filtered funding opportunities by focusArea
  const groupedFunding = useMemo(() => {
    const groups: { [focusArea: string]: FundingOpportunity[] } = {};

    filteredFunding.forEach((funding) => {
      const focusArea = funding.focusArea;

      if (!groups[focusArea]) {
        groups[focusArea] = [];
      }
      groups[focusArea].push(funding);
    });

    // Sort groups alphabetically by focusArea and sort funding within each group by amount (highest first)
    const sortedGroups = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([focusArea, fundingInArea]) => ({
        focusArea,
        funding: fundingInArea.sort((a, b) => b.amount - a.amount),
      }));

    // Calculate global indices for each funding opportunity to ensure color diversity
    let globalFundingIndex = 0;
    return sortedGroups.map(({ focusArea, funding: areaFunding }) => ({
      focusArea,
      funding: areaFunding.map((funding) => ({
        ...funding,
        globalIndex: globalFundingIndex++,
      })),
    }));
  }, [filteredFunding]);

  const { theme } = useTheme();
  return (
    <div className="min-h-screen w-full bg-primary-bgtext-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <PartnersHero
        title="Funding Opportunities"
        showBackground={false}
        height="h-[45vh] sm:h-[52.5vh]"
      />

      {/* Main Content */}
      <main className="relative -mt-28 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl">
          <div className=" min-h-screen w-full">
            <NewFundingFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFunder={selectedFunder}
              onFunderChange={setSelectedFunder}
              selectedFocusArea={selectedFocusArea}
              onFocusAreaChange={setSelectedFocusArea}
              selectedAmountRange={selectedAmountRange}
              onAmountRangeChange={setSelectedAmountRange}
              // selectedDate={selectedDate}
              // onDateChange={setSelectedDate}
              // fundingOpportunities={fundingOpportunities}
            />
            <div className="p-2 sm:p-8 sm:pt-4">
              <div className="w-full space-y-12">
                {groupedFunding.map(({ focusArea, funding: areaFunding }) => {
                  return (
                    <section key={focusArea} className="">
                      <div className="data-atlas-overlay-nav mx-auto">
                        <div className="mx-auto atlas-overlay-notch bg-secondary-bg border-t border-b border-primary-border border-l justify-center">
                          <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-primary-text tracking-wide pl-1">
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
                                  fill={theme == "dark" ? "#1E1E25" : "#ebebeb"}
                                ></path>
                                <path
                                  d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                                  fill={theme == "dark" ? "#565558" : "#E0E0E0"}
                                  mask="url(#error_overlay_nav_path_3_outside_2_2667_14687)"
                                ></path>
                              </g>
                            </svg>
                            <div className="max-w-52 min-w-42 truncate">
                              {focusArea}
                            </div>
                            <div className="w-1 h-1 dark:bg-white/60 bg-black/60 rounded-full" />
                            <span className="text-[12px] sm:text-base shrink-0 font-light text-primary-text/60">
                              {areaFunding.length}
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
                                fill={theme == "dark" ? "#1E1E25" : "#ebebeb"}
                              ></path>
                              <path
                                d="M0 1.02441L0 0.0244141H-1V1.02441H0ZM0 42.0244H-1V43.0244H0L0 42.0244ZM33.8889 30.6743L32.9873 31.1068L33.8889 30.6743ZM25.111 12.3746L26.0127 11.9421L25.111 12.3746ZM0 2.02441H7.0783V0.0244141H0L0 2.02441ZM59 41.0244H0L0 43.0244H59V41.0244ZM1 42.0244L1 1.02441H-1L-1 42.0244H1ZM24.2094 12.8071L32.9873 31.1068L34.7906 30.2418L26.0127 11.9421L24.2094 12.8071ZM51.9217 43.0244H59V41.0244H51.9217V43.0244ZM32.9873 31.1068C36.4811 38.3905 43.8433 43.0244 51.9217 43.0244V41.0244C44.6127 41.0244 37.9517 36.8318 34.7906 30.2418L32.9873 31.1068ZM7.0783 2.02441C14.3873 2.02441 21.0483 6.21699 24.2094 12.8071L26.0127 11.9421C22.5188 4.65831 15.1567 0.0244141 7.0783 0.0244141V2.02441Z"
                                fill={theme == "dark" ? "#565558" : "#E0E0E0"}
                                mask="url(#error_overlay_nav_path_3_outside_2_2667_14687)"
                              ></path>
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Funding Grid */}
                      <div className="divide-x divide-y dark:divide-white/30 divide-primary-border grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-0 bg-secondary-bg border border-primary-border rounded-lg overflow-hidden">
                        {areaFunding.map((funding, fundingIndex) => (
                          <EventCard
                            key={funding.name}
                            focusArea={focusArea}
                            funding={funding}
                            onClick={() => handleFundingSelect(funding)}
                            isSelected={selectedFunding?.name === funding.name}
                            showAmount={
                              fundingIndex === 0 ||
                              funding.amount !==
                                areaFunding[fundingIndex - 1]?.amount
                            }
                            isFirstInGroup={fundingIndex === 0}
                            isLastInGroup={
                              fundingIndex === areaFunding.length - 1
                            }
                            fundingIndex={(funding as any).globalIndex}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}

                {groupedFunding.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <div className="text-primary-text/60 text-lg font-medium mb-2">
                      No funding opportunities found
                    </div>
                    <div className="text-primary-text/40 text-sm">
                      Try adjusting your filters or check back later for new
                      opportunities
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-full mt-20">
            {/* <FundingFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedFunder={selectedFunder}
              onFunderChange={setSelectedFunder}
              selectedFocusArea={selectedFocusArea}
              onFocusAreaChange={setSelectedFocusArea}
              selectedAmountRange={selectedAmountRange}
              onAmountRangeChange={setSelectedAmountRange}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              fundingOpportunities={fundingOpportunities}
            /> */}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClientFundingPage;
