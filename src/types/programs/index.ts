import { ProgramWithStats } from "@/src/types/home";

export type { ProgramWithStats };

export interface ProgramsPageClientProps {
  programs: ProgramWithStats[];
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  currentPage: number;
  totalPrograms: number;
  programsPerPage: number;
}

export type FilterType = "all" | "hasKeys" | "noKeys";
export type SortType = "popular" | "views" | "downloads" | "latest" | "oldest" | "name" | "nameDesc";
export type PlatformFilterType = "all" | "windows" | "mac";

export type ProgramCategoryOption = {
  _id: string;
  title: string;
  slug: string;
};

export interface ProgramsFilterProps {
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  category: string;
  platform: PlatformFilterType;
  categories: ProgramCategoryOption[];
  onSearchChange: (searchTerm: string) => void;
  /** Fire search immediately (e.g. Enter) instead of waiting for debounce. */
  onSearchCommit?: () => void;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sortBy: SortType) => void;
  onCategoryChange: (categorySlug: string) => void;
  onPlatformChange: (platform: PlatformFilterType) => void;
}

export interface ProgramsGridProps {
  programs: ProgramWithStats[];
  maxViews: number;
  maxDownloads: number;
  showBrowseAllCTA?: boolean;
  limit?: number;
}
