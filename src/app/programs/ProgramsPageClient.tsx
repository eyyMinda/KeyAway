"use client";

import { useState, useMemo } from "react";
import { Program } from "@/src/types";
import ProgramCard from "@/src/components/home/ProgramCard";
import { FaFilter, FaSort, FaSearch } from "react-icons/fa";

interface ProgramWithStats extends Program {
  viewCount: number;
  downloadCount: number;
  hasKeys: boolean;
  popularityScore: number;
  _createdAt: string;
}

interface ProgramsPageClientProps {
  programs: ProgramWithStats[];
}

type FilterType = "all" | "hasKeys" | "noKeys";
type SortType = "popular" | "views" | "downloads" | "latest" | "name";

export default function ProgramsPageClient({ programs }: ProgramsPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const programsPerPage = 12;

  // Filter and sort programs
  const filteredAndSortedPrograms = useMemo(() => {
    let filtered = programs;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        program =>
          program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          program.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Key availability filter
    if (filter === "hasKeys") {
      filtered = filtered.filter(program => program.hasKeys);
    } else if (filter === "noKeys") {
      filtered = filtered.filter(program => !program.hasKeys);
    }

    // Sort programs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.popularityScore - a.popularityScore;
        case "views":
          return b.viewCount - a.viewCount;
        case "downloads":
          return b.downloadCount - a.downloadCount;
        case "latest":
          return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [programs, searchTerm, filter, sortBy]);

  // Find programs with highest stats for badges
  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPrograms.length / programsPerPage);
  const startIndex = (currentPage - 1) * programsPerPage;
  const endIndex = startIndex + programsPerPage;
  const currentPrograms = filteredAndSortedPrograms.slice(startIndex, endIndex);

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
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search programs..."
                value={searchTerm}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Key Availability Filter */}
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-500 w-4 h-4" />
              <select
                value={filter}
                onChange={e => handleFilterChange(e.target.value as FilterType)}
                className="px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="all">All Programs</option>
                <option value="hasKeys">With Keys</option>
                <option value="noKeys">Without Keys</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center space-x-2">
              <FaSort className="text-gray-500 w-4 h-4" />
              <select
                value={sortBy}
                onChange={e => handleSortChange(e.target.value as SortType)}
                className="px-4 py-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="popular">Most Popular</option>
                <option value="views">Most Viewed</option>
                <option value="downloads">Most Downloaded</option>
                <option value="latest">Latest Added</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedPrograms.length)} of{" "}
            {filteredAndSortedPrograms.length} programs
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      </div>

      {/* Programs Grid */}
      {currentPrograms.length > 0 ? (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {currentPrograms.map(program => (
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg ${
                      currentPage === page ? "bg-primary-600 text-white" : "border border-gray-300 hover:bg-gray-50"
                    }`}>
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaSearch className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Programs Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm
              ? `No programs match "${searchTerm}". Try adjusting your search terms.`
              : "No programs match your current filters. Try adjusting your filter options."}
          </p>
          <button
            onClick={() => {
              setSearchTerm("");
              setFilter("all");
              setSortBy("popular");
            }}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
