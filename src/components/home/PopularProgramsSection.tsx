"use client";

import { FaFire } from "react-icons/fa";
import { ProgramsGrid } from "@/src/components/programs";
import { PopularProgramsSectionProps } from "@/src/types/home";
import { sortByPopularity } from "@/src/lib/programUtils";

export default function PopularProgramsSection({ programs }: PopularProgramsSectionProps) {
  // Sort programs by popularity score (highest first)
  const sortedPrograms = sortByPopularity(programs);

  // Find programs with highest stats for badges
  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  return (
    <section id="popular-programs" className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <FaFire className="w-4 h-4" />
            <span>Most Popular</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Most Popular Programs
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-2">
            Discover the most popular software programs based on page views, downloads, and verified, working CD keys
          </p>
        </div>

        {/* Programs Grid with CTAs */}
        <ProgramsGrid
          programs={sortedPrograms}
          maxViews={maxViews}
          maxDownloads={maxDownloads}
          showBrowseAllCTA={true}
          limit={8}
        />
      </div>
    </section>
  );
}
