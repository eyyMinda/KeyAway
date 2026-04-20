"use client";

import { useState, useMemo } from "react";
import { ProgramsFilter, ProgramsGrid } from "@/src/components/programs";
import Pagination from "@/src/components/ui/Pagination";
import { ProgramsPageClientProps, FilterType, SortType } from "@/src/types/programs";
import { sortPrograms, filterProgramsByKeys, searchPrograms } from "@/src/lib/program/programUtils";

export default function ProgramsPageClient({ programs }: ProgramsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 16;

  const filteredAndSortedPrograms = useMemo(() => {
    let filtered = searchPrograms(programs, searchTerm);
    filtered = filterProgramsByKeys(filtered, filter);
    filtered = sortPrograms(filtered, sortBy);
    return filtered;
  }, [programs, searchTerm, filter, sortBy]);

  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  const totalPages = Math.ceil(filteredAndSortedPrograms.length / programsPerPage);
  const startIndex = (currentPage - 1) * programsPerPage;
  const endIndex = startIndex + programsPerPage;
  const paginatedPrograms = filteredAndSortedPrograms.slice(startIndex, endIndex);

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
    <div id="programs-grid" className="max-w-360 mx-auto bg-gray-100 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      <ProgramsFilter
        searchTerm={searchTerm}
        filter={filter}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

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

      <ProgramsGrid programs={paginatedPrograms} maxViews={maxViews} maxDownloads={maxDownloads} />

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
  );
}
