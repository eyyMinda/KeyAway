"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ProgramsFilter, ProgramsGrid } from "@/src/components/programs";
import Pagination from "@/src/components/ui/Pagination";
import type { ProgramsListData } from "@/src/lib/programs/getProgramsPageData";
import { FilterType, SortType } from "@/src/types/programs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { scrollToSectionWithHeaderOffset } from "@/src/lib/dom/scrollToSection";
import { normalizeFilterType, normalizeSortType, normalizeCategoryFilter, normalizePlatformFilter } from "@/src/lib/program/programUtils";
import type { ProgramWithStats } from "@/src/types/home";
import type { PlatformFilterType, ProgramCategoryOption } from "@/src/types/programs";
import HomeVendorBrowse from "@/src/components/home/HomeVendorBrowse";
import type { VendorListItem } from "@/src/lib/vendors/getVendors";

const SEARCH_DEBOUNCE_MS = 400;
const EMPTY_PROGRAMS: ProgramWithStats[] = [];

function readListParams(searchParams: URLSearchParams) {
  return {
    searchTerm: (searchParams.get("search") || "").trim(),
    filter: normalizeFilterType(searchParams.get("filter") ?? undefined),
    sortBy: normalizeSortType(searchParams.get("sort") ?? undefined),
    category: normalizeCategoryFilter(searchParams.get("category")),
    platform: normalizePlatformFilter(searchParams.get("platform")),
    page: Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1)
  };
}

function listParamsKey(p: {
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  category: string;
  platform: PlatformFilterType;
  page: number;
}): string {
  return `${p.searchTerm}|${p.filter}|${p.sortBy}|${p.category}|${p.platform}|${p.page}`;
}

export default function ProgramsPageClient({
  initialListData,
  vendors = [],
  categoryOptions = []
}: {
  initialListData: ProgramsListData;
  vendors?: VendorListItem[];
  categoryOptions?: ProgramCategoryOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [listData, setListData] = useState<ProgramsListData | null>(initialListData);
  const [fetchError, setFetchError] = useState(false);

  const wasPending = useRef(false);
  const scrollAfterPaginationRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchGenRef = useRef(0);
  /** First effect run reuses server data when URL params match what was rendered. */
  const initialParamsKey = useRef(
    listParamsKey({
      searchTerm: initialListData.searchTerm,
      filter: initialListData.filter,
      sortBy: initialListData.sortBy,
      category: initialListData.category,
      platform: initialListData.platform,
      page: initialListData.page
    })
  );
  const skipInitialFetchRef = useRef(true);

  const params = readListParams(searchParams);
  const { searchTerm, filter, sortBy, category, platform, page } = params;
  const [localSearch, setLocalSearch] = useState(searchTerm);
  const localSearchRef = useRef(searchTerm);

  useEffect(() => {
    setLocalSearch(searchTerm);
    localSearchRef.current = searchTerm;
  }, [searchTerm]);

  const programs = listData?.programs ?? EMPTY_PROGRAMS;
  const totalPrograms = listData?.totalCount ?? 0;
  const programsPerPage = listData?.programsPerPage ?? 16;
  const currentPage = listData?.page ?? page;

  const loadList = useCallback(async (sp: URLSearchParams) => {
    const gen = ++fetchGenRef.current;
    setIsLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(`/api/v1/programs/list?${sp.toString()}`);
      const json = (await res.json()) as { data?: ProgramsListData };
      if (gen !== fetchGenRef.current) return;
      if (!res.ok || !json.data) {
        setFetchError(true);
        setListData(null);
        return;
      }
      setListData(json.data);
    } catch {
      if (gen === fetchGenRef.current) {
        setFetchError(true);
        setListData(null);
      }
    } finally {
      if (gen === fetchGenRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      if (listParamsKey(readListParams(searchParams)) === initialParamsKey.current) return;
    }
    void loadList(searchParams);
  }, [searchParams, loadList]);

  const clearSearchDebounce = () => {
    if (searchDebounceRef.current != null) {
      clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
  };

  useEffect(() => () => clearSearchDebounce(), []);

  useEffect(() => {
    if (wasPending.current && !isPending) {
      if (scrollAfterPaginationRef.current) {
        scrollToSectionWithHeaderOffset("#programs-grid");
        scrollAfterPaginationRef.current = false;
      }
    }
    wasPending.current = isPending;
  }, [isPending]);

  const maxViews = Math.max(...programs.map(p => p.viewCount), 0);
  const maxDownloads = Math.max(...programs.map(p => p.downloadCount), 0);
  const totalPages = Math.max(1, Math.ceil(totalPrograms / programsPerPage));
  const startIndex = totalPrograms === 0 ? 0 : (currentPage - 1) * programsPerPage + 1;
  const endIndex = Math.min(currentPage * programsPerPage, totalPrograms);
  const showLoading = isLoading && !listData;

  const resolveSearchForUrl = (updates: Partial<{ search: string }>): string => {
    if (updates.search !== undefined) return updates.search.trim();
    return localSearchRef.current.trim();
  };

  const updateQuery = (
    updates: Partial<{
      search: string;
      filter: FilterType;
      sort: SortType;
      category: string;
      platform: PlatformFilterType;
      page: number;
    }>
  ) => {
    const next = new URLSearchParams(searchParamsRef.current.toString());
    const nextSearch = resolveSearchForUrl(updates);
    const nextFilter = updates.filter ?? filter;
    const nextSort = updates.sort ?? sortBy;
    const nextCategory = updates.category ?? category;
    const nextPlatform = updates.platform ?? platform;
    const nextPage = updates.page ?? currentPage;

    if (nextSearch) next.set("search", nextSearch);
    else next.delete("search");
    if (nextFilter !== "all") next.set("filter", nextFilter);
    else next.delete("filter");
    if (nextSort !== "popular") next.set("sort", nextSort);
    else next.delete("sort");
    if (nextCategory !== "all") next.set("category", nextCategory);
    else next.delete("category");
    if (nextPlatform !== "all") next.set("platform", nextPlatform);
    else next.delete("platform");
    if (nextPage > 1) next.set("page", String(nextPage));
    else next.delete("page");

    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`, { scroll: false });
    });
  };

  const scheduleSearchUrlSync = () => {
    clearSearchDebounce();
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      const typed = localSearchRef.current.trim();
      const inUrl = (searchParamsRef.current.get("search") || "").trim();
      if (typed === inUrl) return;
      updateQuery({ search: localSearchRef.current, page: 1 });
    }, SEARCH_DEBOUNCE_MS);
  };

  const commitSearchNow = () => {
    clearSearchDebounce();
    const typed = localSearch.trim();
    const inUrl = (searchParamsRef.current.get("search") || "").trim();
    if (typed === inUrl) return;
    updateQuery({ search: localSearch, page: 1 });
  };

  const handleFilterChange = (newFilter: FilterType) => {
    clearSearchDebounce();
    updateQuery({ filter: newFilter, page: 1 });
  };

  const handleSortChange = (newSort: SortType) => {
    clearSearchDebounce();
    updateQuery({ sort: newSort, page: 1 });
  };

  const handleCategoryChange = (categorySlug: string) => {
    clearSearchDebounce();
    updateQuery({ category: normalizeCategoryFilter(categorySlug), page: 1 });
  };

  const handlePlatformChange = (newPlatform: PlatformFilterType) => {
    clearSearchDebounce();
    updateQuery({ platform: newPlatform, page: 1 });
  };

  const handleSearchInputChange = (value: string) => {
    localSearchRef.current = value;
    setLocalSearch(value);
    scheduleSearchUrlSync();
  };

  const handlePageChange = (nextPage: number) => {
    clearSearchDebounce();
    scrollAfterPaginationRef.current = true;
    updateQuery({ page: nextPage });
  };

  return (
    <div id="programs-grid" className="mx-auto max-w-360 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      {!fetchError && !showLoading && <HomeVendorBrowse vendors={vendors} position="top" />}

      <ProgramsFilter
        searchTerm={localSearch}
        filter={filter}
        sortBy={sortBy}
        category={category}
        platform={platform}
        categories={categoryOptions}
        onSearchChange={handleSearchInputChange}
        onSearchCommit={commitSearchNow}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        onCategoryChange={handleCategoryChange}
        onPlatformChange={handlePlatformChange}
      />

      <div className="mb-4 sm:mb-6">
        {fetchError ? (
          <p className="text-sm text-red-300 sm:text-base">Could not load programs. Try refreshing.</p>
        ) : showLoading ? (
          <p className="text-sm text-neutral-100 sm:text-base">Loading programs…</p>
        ) : totalPrograms === 0 ? (
          <p className="text-sm text-neutral-100 sm:text-base">No results</p>
        ) : (
          <p className="text-sm text-neutral-100 sm:text-base">
            Showing {startIndex}-{endIndex} of {totalPrograms} programs
          </p>
        )}
      </div>

      <h2 className="sr-only">All Giveaway Programs</h2>

      {!fetchError && (
        <ProgramsGrid
          programs={showLoading ? EMPTY_PROGRAMS : programs}
          maxViews={maxViews}
          maxDownloads={maxDownloads}
        />
      )}

      {totalPrograms > 0 && !fetchError && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalPrograms}
          itemsPerPage={programsPerPage}
          onPageChange={handlePageChange}
          variant="detailed"
          tone="light"
          showInfo={false}
          className={`mt-8 sm:mt-10 lg:mt-12 ${isPending || isLoading ? "opacity-70" : ""}`}
        />
      )}
    </div>
  );
}
