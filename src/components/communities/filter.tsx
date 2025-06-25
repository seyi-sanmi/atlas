"use client";

import React, { useState, useEffect } from "react";
import { getUniqueCommunityTypes, getUniqueCommunityLocations } from "@/lib/communities";

interface CommunitiesFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedLocation: string;
  onLocationChange: (location: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CommunitiesFilter: React.FC<CommunitiesFilterProps> = ({
  searchQuery,
  onSearchChange,
  selectedLocation,
  onLocationChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [fetchedLocations, fetchedCategories] = await Promise.all([
          getUniqueCommunityLocations(),
          getUniqueCommunityTypes()
        ]);
        setLocations(fetchedLocations);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, []);

  return (
    <div className="bg-[#1E1E25] border border-[#565558] rounded-lg p-6 w-full max-w-sm font-sans">
      {/* Search Input */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-[#2a2a32] border border-[#565558] rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Location Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Location
        </label>
        <select
          className="w-full bg-[#2a2a32] border border-[#565558] rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          value={selectedLocation}
          onChange={(e) => onLocationChange(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <select
          className="w-full bg-[#2a2a32] border border-[#565558] rounded-md py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CommunitiesFilter;
