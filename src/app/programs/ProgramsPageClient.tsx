"use client";

import { useState, useMemo } from "react";
import {
  ProgramsFilter,
  ProgramsGrid,
  ContributeSection,
  WhyUseSection,
  ProgramsHero
} from "@/src/components/programs";
import FeaturedProgramSection from "@/src/components/home/FeaturedProgramSection";
import Pagination from "@/src/components/ui/Pagination";
import { ProgramsPageClientProps, FilterType, SortType } from "@/src/types/programs";
import { sortPrograms, filterProgramsByKeys, searchPrograms } from "@/src/lib/program/programUtils";
import { Program } from "@/src/types";
import { FacebookGroupButton } from "@/src/components/social";

interface ExtendedProgramsPageClientProps extends ProgramsPageClientProps {
  featuredProgram:
    | (Program & {
        totalKeys: number;
        workingKeys: number;
        viewCount: number;
        downloadCount: number;
      })
    | null;
}

export default function ProgramsPageClient({ programs, featuredProgram, socialData }: ExtendedProgramsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 16;

  // Filter and sort programs
  const filteredAndSortedPrograms = useMemo(() => {
    let filtered = searchPrograms(programs, searchTerm);
    filtered = filterProgramsByKeys(filtered, filter);
    filtered = sortPrograms(filtered, sortBy);
    return filtered;
  }, [programs, searchTerm, filter, sortBy]);

  // Find programs with highest stats for badges
  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPrograms.length / programsPerPage);
  const startIndex = (currentPage - 1) * programsPerPage;
  const endIndex = startIndex + programsPerPage;
  const paginatedPrograms = filteredAndSortedPrograms.slice(startIndex, endIndex);

  // Reset page when filters change
  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: SortType) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchTerm(newSearch);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Hero Section */}
      <ProgramsHero
        totalCount={programs.length}
        totalKeys={programs.reduce((sum, p) => sum + (p.cdKeys?.length || 0), 0)}
      />

      {/* Facebook Group Button */}
      <section className="py-8 bg-linear-to-b from-gray-50 to-gray-100">
        <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <FacebookGroupButton socialData={socialData} variant="outline" className="text-base" />
        </div>
      </section>
      <div id="programs-grid" className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        {/* Filters and Search */}
        <ProgramsFilter
          searchTerm={searchTerm}
          filter={filter}
          sortBy={sortBy}
          onSearchChange={handleSearchChange}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />

        {/* Results Count */}
        <div className="mb-4 sm:mb-6">
          {filteredAndSortedPrograms.length === 0 ? (
            <p className="text-sm sm:text-base text-gray-600">No results</p>
          ) : (
            <p className="text-sm sm:text-base text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPrograms.length)} of{" "}
              {filteredAndSortedPrograms.length} programs
            </p>
          )}
        </div>

        {/* Programs Grid */}
        <ProgramsGrid programs={paginatedPrograms} maxViews={maxViews} maxDownloads={maxDownloads} />

        {/* Pagination */}
        {filteredAndSortedPrograms.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedPrograms.length}
            itemsPerPage={programsPerPage}
            onPageChange={setCurrentPage}
            variant="detailed"
            showInfo={false}
            className="mt-8 sm:mt-10 lg:mt-12"
          />
        )}
      </div>

      {/* Additional Sections */}
      <ContributeSection />
      <FeaturedProgramSection program={featuredProgram} />
      <WhyUseSection />
    </>
  );
}
