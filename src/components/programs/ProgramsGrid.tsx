"use client";

import { ProgramCard } from "@/src/components/home";
import { ProgramsGridProps } from "@/src/types/programs";
import SuggestKeyCTA from "./SuggestKeyCTA";
import BrowseAllCTA from "./BrowseAllCTA";

export default function ProgramsGrid({
  programs,
  maxViews,
  maxDownloads,
  showBrowseAllCTA = false,
  limit
}: ProgramsGridProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-10 sm:py-12">
        <div className="mb-3 text-5xl text-[#8f98a0] sm:mb-4 sm:text-6xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-[#c6d4df] sm:text-xl">No programs found</h3>
        <p className="text-sm text-[#8f98a0] sm:text-base">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  const displayedPrograms = limit ? programs.slice(0, limit) : programs;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {displayedPrograms.map(program => (
        <ProgramCard
          key={program.slug.current}
          program={program}
          stats={{
            viewCount: program.viewCount,
            downloadCount: program.downloadCount
          }}
          badges={{
            mostViewed: program.viewCount === maxViews && maxViews > 0,
            mostDownloaded: program.downloadCount === maxDownloads && maxDownloads > 0
          }}
          showStats={true}
        />
      ))}

      <SuggestKeyCTA />
      {showBrowseAllCTA && <BrowseAllCTA />}
    </div>
  );
}
