"use client";

import { Fragment } from "react";
import { ProgramCard } from "@/src/components/home";
import { GridAdCard } from "@/src/components/ads";
import { ProgramsGridProps } from "@/src/types/programs";
import SuggestKeyCTA from "./SuggestKeyCTA";
import BrowseAllCTA from "./BrowseAllCTA";

/** Gap pattern applied to `adEvery` so ads don't line up in the same column: n, n+1, n-1, n, n+1, … */
const AD_GAP_OFFSETS = [0, 1, -1] as const;

/** Indexes of the program cards an ad follows; never the last card. */
function getAdAfterIndexes(programCount: number, adEvery: number | undefined): Set<number> {
  const indexes = new Set<number>();
  if (!adEvery || adEvery < 2) return indexes;
  let shown = adEvery;
  for (let i = 1; shown < programCount; i++) {
    indexes.add(shown - 1);
    shown += adEvery + AD_GAP_OFFSETS[i % AD_GAP_OFFSETS.length];
  }
  return indexes;
}

export default function ProgramsGrid({
  programs,
  maxViews,
  maxDownloads,
  showBrowseAllCTA = false,
  limit,
  adEvery
}: ProgramsGridProps) {
  if (programs.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 lg:py-10">
        <div className="mb-3 text-5xl text-[#8f98a0] sm:mb-4 sm:text-6xl">🔍</div>
        <h3 className="mb-2 text-lg font-semibold text-[#c6d4df] sm:text-xl">No programs found</h3>
        <p className="text-sm text-[#8f98a0] sm:text-base">Try adjusting your search or filter criteria</p>
      </div>
    );
  }

  const displayedPrograms = limit ? programs.slice(0, limit) : programs;
  const adAfterIndexes = getAdAfterIndexes(displayedPrograms.length, adEvery);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {displayedPrograms.map((program, index) => (
        <Fragment key={program.slug.current}>
          <ProgramCard
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
          {adAfterIndexes.has(index) && <GridAdCard />}
        </Fragment>
      ))}

      <SuggestKeyCTA />
      {showBrowseAllCTA && <BrowseAllCTA />}
    </div>
  );
}
