"use client";

import { useEffect, useRef, useTransition } from "react";
import { ProgramsFilter, ProgramsGrid } from "@/src/components/programs";
import Pagination from "@/src/components/ui/Pagination";
import { ProgramsPageClientProps, FilterType, SortType } from "@/src/types/programs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";

export default function ProgramsPageClient({
  programs,
  searchTerm,
  filter,
  sortBy,
  currentPage,
  totalPrograms,
  programsPerPage
}: ProgramsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      scrollToSectionWithHeaderOffset("#programs-grid");
    }
    wasPending.current = isPending;
  }, [isPending]);

  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);
  const totalPages = Math.max(1, Math.ceil(totalPrograms / programsPerPage));
  const startIndex = totalPrograms === 0 ? 0 : (currentPage - 1) * programsPerPage + 1;
  const endIndex = Math.min(currentPage * programsPerPage, totalPrograms);

  const updateQuery = (updates: Partial<{ search: string; filter: FilterType; sort: SortType; page: number }>) => {
    const next = new URLSearchParams(searchParams.toString());
    const nextSearch = updates.search ?? searchTerm;
    const nextFilter = updates.filter ?? filter;
    const nextSort = updates.sort ?? sortBy;
    const nextPage = updates.page ?? currentPage;

    if (nextSearch) next.set("search", nextSearch);
    else next.delete("search");
    if (nextFilter !== "all") next.set("filter", nextFilter);
    else next.delete("filter");
    if (nextSort !== "popular") next.set("sort", nextSort);
    else next.delete("sort");
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    updateQuery({ filter: newFilter, page: 1 });
  };

  const handleSortChange = (newSort: SortType) => {
    updateQuery({ sort: newSort, page: 1 });
  };

  const handleSearchChange = (newSearch: string) => {
    updateQuery({ search: newSearch, page: 1 });
  };

  const handlePageChange = (page: number) => {
    updateQuery({ page });
  };

  return (
    <div id="programs-grid" className="mx-auto max-w-360 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <ProgramsFilter
        searchTerm={searchTerm}
        filter={filter}
        sortBy={sortBy}
        onSearchChange={handleSearchChange}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

      <div className="mb-4 sm:mb-6">
        {totalPrograms === 0 ? (
          <p className="text-sm text-[#8f98a0] sm:text-base">No results</p>
        ) : (
          <p className="text-sm text-[#8f98a0] sm:text-base">
            Showing {startIndex}-{endIndex} of {totalPrograms} programs
          </p>
        )}
      </div>

      <ProgramsGrid programs={programs} maxViews={maxViews} maxDownloads={maxDownloads} />

      {totalPrograms > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPrograms}
          itemsPerPage={programsPerPage}
          onPageChange={handlePageChange}
          variant="detailed"
          showInfo={false}
          className={`mt-8 sm:mt-10 lg:mt-12 ${isPending ? "opacity-70" : ""}`}
        />
      )}
    </div>
  );
}
