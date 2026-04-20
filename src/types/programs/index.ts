import { ProgramWithStats } from "@/src/types/home";

export type { ProgramWithStats };

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
  showBrowseAllCTA?: boolean;
  limit?: number;
}
