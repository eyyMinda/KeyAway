"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { trackInteraction } from "@/src/lib/analytics/trackInteraction";
import { INTERACTION_IDS, SECTIONS, SectionId } from "@/src/lib/analytics/interactionCatalog";

interface BrowseAllCTAProps {
  sectionId?: SectionId;
}

export default function BrowseAllCTA({ sectionId = SECTIONS.browse.allProgramsGrid }: BrowseAllCTAProps) {
  return (
    <Link
      href="/programs"
      onClick={() =>
        void trackInteraction({
          interactionId: INTERACTION_IDS.programsBrowseAll,
          sectionId
        })
      }
      className="group relative bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-xl sm:rounded-2xl p-6 transition-all duration-300 hover:shadow-xl cursor-pointer flex flex-col items-center justify-center min-h-[280px] text-center">
      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
        <FaArrowRight className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
        Browse All Programs
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        Explore our complete library of programs with advanced filters and search.
      </p>
      <div className="mt-4 text-xs font-semibold text-primary-900 group-hover:text-primary-950 uppercase tracking-wider">
        View All
      </div>
    </Link>
  );
}
