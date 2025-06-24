"use client";
import React, { useEffect, useMemo, useState } from "react";
import EventFilter from "../event/list/filter";
import { EventsList } from "../event/list";
import { Header } from "../event/header";
import { EventCard } from "../event/list/card";
import Hero from "../hero";
import { CommunityCard } from "./card";
import CommunitiesFilter from "./filter";

export interface Community {
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

const atlasCommunitiesImport: Community[] = [
  {
    name: "BioTech Founders Syndicate",
    communityType: "Founder & Investor Network",
    geographicLocations: "Boston, MA & San Francisco, CA",
    academicAssociation: "MIT & Stanford Alumni Association",
    websiteUrl: "https://biotechfounders.co",
    researchAreas:
      "Gene Editing (CRISPR), Synthetic Biology, Personalized Medicine",
    contact: "Chloe Chen",
    communityLinkedIn:
      "https://linkedin.com/company/biotech-founders-syndicate",
    size: "50-100",
    contactEmail: "chloe@biotechfounders.co",
    contactLinkedIn: "https://linkedin.com/in/chloechen-bfs",
    purpose:
      "To connect early-stage biotech entrepreneurs with mentors, collaborators, and seed funding opportunities.",
    selectionProcessForMembers: "Invitation-only",
    memberLocations: "Primarily United States",
    communityTarget:
      "Founders, angel investors, and venture capitalists in the biotech space.",
    memberCommunication: "Signal Group, Monthly Pitch Events",
    meetingFrequency: "Monthly (alternating coasts)",
    meetingLocation: "Hybrid (In-person in Boston/SF and Virtual)",
    leadershipChangeFrequency: "Ad-hoc",
    communityInterestAreas:
      "FDA Approval Pathways, Intellectual Property Law, Lab Automation",
    communityInformation:
      "A highly curated, private community focused on commercializing breakthrough biological research.",
    secondaryCommunityContact: "Markus Weber",
    secondaryContactEmail: "markus@biotechfounders.co",
    secondaryContactLinkedIn: "https://linkedin.com/in/markusweber-bfs",
  },
  {
    name: "Ethical AI Governance Forum",
    communityType: "Policy & Advocacy Group",
    geographicLocations: "Brussels, Washington D.C., Online",
    academicAssociation: "None",
    websiteUrl: "https://ethical-ai-gov.org",
    researchAreas: "AI Regulation, Algorithmic Bias, Data Privacy, AI Safety",
    contact: "Prof. David Ibrahim",
    communityLinkedIn: null,
    size: "100-250",
    contactEmail: "d.ibrahim@eagf.org",
    contactLinkedIn: "https://linkedin.com/in/prof-david-ibrahim",
    purpose:
      "To develop and advocate for policy frameworks that ensure artificial intelligence is developed and deployed safely and ethically.",
    selectionProcessForMembers:
      "Application-based with a focus on professional experience in law, policy, or computer science.",
    memberLocations: "Global",
    communityTarget:
      "Policymakers, legal scholars, ethicists, and senior AI researchers.",
    memberCommunication: "Mailing List, Members-only Portal, Quarterly Reports",
    meetingFrequency: "Bi-monthly roundtables",
    meetingLocation: "Virtual",
    leadershipChangeFrequency: "Annually (elected board)",
    communityInterestAreas:
      "International Law, Human Rights, Corporate Social Responsibility",
    communityInformation:
      "Partners with several NGOs and governmental bodies to provide expert testimony and reports.",
    secondaryCommunityContact: "Ananya Sharma",
    secondaryContactEmail: "a.sharma@eagf.org",
    secondaryContactLinkedIn: "https://linkedin.com/in/ananya-sharma-policy",
  },
  {
    name: "Sustainable Materials Collective",
    communityType: "Academic Collaboration",
    geographicLocations: "Freiburg, Germany",
    academicAssociation: "University of Freiburg & Fraunhofer Institute",
    websiteUrl: "https://susmat.org",
    researchAreas:
      "Biodegradable Polymers, Green Chemistry, Circular Economy Models",
    contact: "Dr. Eva Klein",
    communityLinkedIn: "https://linkedin.com/company/susmat-collective",
    size: "100-250",
    contactEmail: "eva.klein@susmat.org",
    contactLinkedIn: "https://linkedin.com/in/evaklein-susmat",
    purpose:
      "To bridge the gap between academic research in sustainable materials and industrial application.",
    selectionProcessForMembers:
      "Open application, reviewed quarterly by a membership board.",
    memberLocations: "Primarily Europe",
    communityTarget:
      "Material scientists, chemical engineers, corporate R&D leaders.",
    memberCommunication: "Monthly research digest, Slack channel for members.",
    meetingFrequency: "Annual conference, quarterly webinars.",
    meetingLocation: "Freiburg, Germany (Annual), Virtual (Webinars)",
    leadershipChangeFrequency: "Every 4 years",
    communityInterestAreas:
      "Material Lifecycle Analysis, Sustainable Packaging, Carbon Capture Tech",
    communityInformation:
      "Hosts an annual 'Material of the Year' innovation prize.",
    secondaryCommunityContact: "Jonas Schmidt",
    secondaryContactEmail: "jonas.schmidt@susmat.org",
    secondaryContactLinkedIn: "https://linkedin.com/in/jonasschmidt-susmat",
  },
  {
    name: "Open Source Gaming Guild",
    communityType: "Developer Network",
    geographicLocations: "Global (Online)",
    academicAssociation: null,
    websiteUrl: "https://osgg.io",
    researchAreas:
      "Open Source Game Engines (Godot, Bevy), Procedural Content Generation, Networked Physics",
    contact: "Alex 'Pixel' Chen",
    communityLinkedIn: null,
    size: "500-1000",
    contactEmail: "contact@osgg.io",
    contactLinkedIn: null,
    purpose:
      "A collaborative space for developers to build, share, and improve open-source games and tools.",
    selectionProcessForMembers: "Open registration via GitHub account.",
    memberLocations: "Global",
    communityTarget:
      "Indie game developers, hobbyists, students, and advocates for open-source software.",
    memberCommunication: "Discord Server, Forums, Weekly 'Show & Tell' stream.",
    meetingFrequency: "Weekly project check-ins, monthly game jams.",
    meetingLocation: "Discord & Twitch",
    leadershipChangeFrequency: "Community-based via contribution metrics.",
    communityInterestAreas:
      "Pixel Art & Animation, Chiptune Music, Game Design Theory",
    communityInformation:
      "Maintains a curated list of open-source game development resources and actively contributes to several engine projects.",
    secondaryCommunityContact: "Maria 'Render' Garcia",
    secondaryContactEmail: "maria.g@osgg.io",
    secondaryContactLinkedIn: "https://linkedin.com/in/mariagarcia-gamedev",
  },

  {
    name: "Climate Tech Catalysts",
    communityType: "Founder & Investor Network",
    geographicLocations: "New York, NY & London, UK",
    academicAssociation: "Columbia University & Imperial College London",
    websiteUrl: "https://climatetechcatalysts.com",
    researchAreas:
      "Carbon Capture, Grid-scale Energy Storage, Sustainable Agriculture",
    contact: "Ben Carter",
    communityLinkedIn: "https://linkedin.com/company/climate-tech-catalysts",
    size: "100-250",
    contactEmail: "ben.carter@ctcatalysts.com",
    contactLinkedIn: "https://linkedin.com/in/bencarter-ctc",
    purpose:
      "To fund and support startups developing technologies to combat climate change.",
    selectionProcessForMembers:
      "Referral and application with a focus on deep-tech solutions.",
    memberLocations: "North America, Europe",
    communityTarget: "Climate tech founders, VCs, and policy experts.",
    memberCommunication: "Quarterly deal flow reports, private member portal.",
    meetingFrequency: "Bi-monthly demo days.",
    meetingLocation: "Hybrid (NYC/London & Virtual)",
    leadershipChangeFrequency: "Every 2 years (Board election)",
    communityInterestAreas:
      "Carbon Markets, Renewable Energy Policy, ESG Investing",
    communityInformation:
      "Our portfolio companies have collectively removed over 1 million tons of CO2 from the atmosphere.",
    secondaryCommunityContact: "Sophia Rodriguez",
    secondaryContactEmail: "sophia.r@ctcatalysts.com",
    secondaryContactLinkedIn: "https://linkedin.com/in/sophiarodriguez-ctc",
  },
  {
    name: "Quantum Innovators Network",
    communityType: "Academic Research",
    geographicLocations: "Global (Online)",
    academicAssociation: "Caltech & CERN Collaboration",
    websiteUrl: "https://quantum-innovators.org",
    researchAreas: "Quantum Computing, Quantum Cryptography, Quantum Sensing",
    contact: "Dr. Alistair Finch",
    communityLinkedIn: "https://linkedin.com/company/quantum-innovators-net",
    size: "250-500",
    contactEmail: "alistair.finch@quantum-innovators.org",
    contactLinkedIn: "https://linkedin.com/in/alistairfinch-qi",
    purpose:
      "To accelerate the development of quantum technologies by fostering collaboration between academia and industry.",
    selectionProcessForMembers:
      "Referral by an existing member, followed by a committee review.",
    memberLocations: "North America, Europe, East Asia",
    communityTarget:
      "Postdoctoral researchers, industry scientists, and quantum startup founders.",
    memberCommunication:
      "Private Discord Server, Bi-weekly Newsletter, Annual Symposium",
    meetingFrequency: "Monthly virtual talks, quarterly project showcases.",
    meetingLocation: "Virtual (Zoom & Discord)",
    leadershipChangeFrequency: "Every 3 years",
    communityInterestAreas:
      "Venture Capital in Deep Tech, High-Performance Computing, AI for Physics",
    communityInformation:
      "Founded in 2021, the network has active research groups working on open-source quantum algorithms.",
    secondaryCommunityContact: "Dr. Lena Petrova",
    secondaryContactEmail: "lena.petrova@quantum-innovators.org",
    secondaryContactLinkedIn: "https://linkedin.com/in/lenapetrova-qi",
  },
  {
    name: "Longevity Science Nexus",
    communityType: "Academic Research",
    geographicLocations: "La Jolla, CA & Online",
    academicAssociation: "Salk Institute for Biological Studies",
    websiteUrl: "https://longevitynexus.org",
    researchAreas: "Cellular Senescence, Epigenetic Reprogramming, Geroscience",
    contact: "Dr. Kenji Tanaka",
    communityLinkedIn: "https://linkedin.com/company/longevity-science-nexus",
    size: "50-100",
    contactEmail: "kenji.tanaka@lsnexus.org",
    contactLinkedIn: "https://linkedin.com/in/kenjitanaka-lsn",
    purpose:
      "To advance fundamental research into the mechanisms of aging and develop interventions for age-related diseases.",
    selectionProcessForMembers:
      "Invitation based on publication record and research focus.",
    memberLocations: "Global",
    communityTarget:
      "Principal investigators, geriatricians, and bio-pharma researchers.",
    memberCommunication: "Private forum, monthly journal club.",
    meetingFrequency: "Annual workshop, bi-monthly seminars.",
    meetingLocation: "Salk Institute (Annual), Virtual (Seminars)",
    leadershipChangeFrequency: "Every 5 years",
    communityInterestAreas:
      "Clinical Trials for Anti-aging, Bioinformatics, Metabolomics",
    communityInformation:
      "A collaborative initiative to pool data and resources for tackling the complex biology of aging.",
    secondaryCommunityContact: "Dr. Emily Vance",
    secondaryContactEmail: "emily.vance@lsnexus.org",
    secondaryContactLinkedIn: "https://linkedin.com/in/emilyvance-lsn",
  },
];

function ClientCommunitiesPage() {
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null
  );
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleCommunitySelect = (community: Community) => {
    console.log("Selected community:", community);
    setSelectedCommunity(community);
  };

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Group communities by type
  const groupedCommunities = useMemo(() => {
    const groups: { [type: string]: Community[] } = {};

    atlasCommunitiesImport.forEach((community) => {
      const type = community.communityType;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(community);
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
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#131318] text-gray-100 font-sans">
      <Header />

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main className="relative -mt-40 z-20">
        <div className="container mx-auto px-2 sm:px-4 max-w-6xl sm:flex">
          <div className="hidden lg:block lg:w-1/3 mt-20">
            <div className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
              <CommunitiesFilter
                searchQuery={""}
                onSearchChange={() => {}}
                selectedLocation={""}
                onLocationChange={() => {}}
                selectedCategory={""}
                onCategoryChange={() => {}}
                selectedDate={null}
                onDateChange={() => {}}
              />
            </div>
          </div>
          <div className=" min-h-screen lg:w-2/3">
            <div className="p-2 sm:p-8">
              <div className="w-full space-y-12">
                {groupedCommunities.map(({ type, communities }) => {
                  const isCollapsed = collapsedSections.has(type);

                  return (
                    <section key={type} className="">
                      <div className="data-atlas-overlay-nav">
                        <div className="atlas-overlay-notch bg-[#1E1E25] border-t border-b border-[#565558] border-l">
                          <h2 className="flex items-center gap-3 text-[12px] text-balance sm:text-base font-normal text-white tracking-wide pl-1">
                            <div className="max-w-56 min-w-42 truncate">
                              {type}
                            </div>
                            <div className="w-1 h-1 bg-white/60 rounded-full" />
                            <span className="text-[12px] sm:text-base shrink-0 font-light text-white/60">
                              {communities.length}
                              {/* communit
                              {communities.length !== 1 ? "ies" : "y"} */}
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
                        <div className="grid grid-cols-1 gap-0">
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
                })}

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
