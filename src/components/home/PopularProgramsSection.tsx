"use client";

import { FaFire } from "react-icons/fa";
import { ProgramsGrid } from "@/src/components/programs";
import { PopularProgramsSectionProps } from "@/src/types/home";
import { sortByPopularity } from "@/src/lib/program/programUtils";

export default function PopularProgramsSection({ programs }: PopularProgramsSectionProps) {
  // Sort programs by popularity score (highest first)
  const sortedPrograms = sortByPopularity(programs);

  // Find programs with highest stats for badges
  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  return (
    <section id="popular-programs" className="bg-[#0f1923] py-10 sm:py-12">
      <div className="mx-auto w-full max-w-360 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-12">
          <div className="section-label mb-4 gap-2">
            <FaFire className="h-4 w-4 shrink-0 text-[#c6d4df]" aria-hidden />
            <span>Most Popular Programs</span>
          </div>
          <h2 className="section-title mb-3">
            Most Popular <span className="text-gradient-pro">Programs</span>
          </h2>
          <p className="max-w-2xl px-2 text-base text-[#8f98a0] sm:text-lg">
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
