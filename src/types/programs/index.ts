import { ProgramWithStats } from "@/src/types/home";

export interface ProgramsPageClientProps {
  programs: ProgramWithStats[];
}

export type FilterType = "all" | "hasKeys" | "noKeys";
export type SortType = "popular" | "views" | "downloads" | "latest" | "name";

export interface ProgramsFilterProps {
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  onSearchChange: (searchTerm: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onSortChange: (sortBy: SortType) => void;
}

export interface ProgramsGridProps {
  programs: ProgramWithStats[];
  maxViews: number;
  maxDownloads: number;
}

export interface ProgramsPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
