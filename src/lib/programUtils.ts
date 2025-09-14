import { Program } from "@/src/types";

export interface ProgramWithStats extends Program {
  viewCount: number;
  downloadCount: number;
  hasKeys: boolean;
  popularityScore: number;
  _createdAt: string;
}

/**
 * Calculate popularity score for a program
 * Formula: viewCount + (downloadCount * 3)
 * Downloads are weighted 3x more than views (equal to 3 views)
 */
export function calculatePopularityScore(viewCount: number, downloadCount: number): number {
  return viewCount + downloadCount * 3;
}

/**
 * Sort programs by popularity score (highest first)
 */
export function sortByPopularity(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => b.popularityScore - a.popularityScore);
}

/**
 * Sort programs by views (highest first)
 */
export function sortByViews(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => b.viewCount - a.viewCount);
}

/**
 * Sort programs by downloads (highest first)
 */
export function sortByDownloads(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => b.downloadCount - a.downloadCount);
}

/**
 * Sort programs by creation date (newest first)
 */
export function sortByLatest(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime());
}

/**
 * Sort programs by name (alphabetical)
 */
export function sortByName(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => a.title.localeCompare(b.title));
}

export type SortType = "popular" | "views" | "downloads" | "latest" | "name";

/**
 * Sort programs based on the specified sort type
 */
export function sortPrograms(programs: ProgramWithStats[], sortType: SortType): ProgramWithStats[] {
  switch (sortType) {
    case "popular":
      return sortByPopularity(programs);
    case "views":
      return sortByViews(programs);
    case "downloads":
      return sortByDownloads(programs);
    case "latest":
      return sortByLatest(programs);
    case "name":
      return sortByName(programs);
    default:
      return programs;
  }
}

/**
 * Filter programs by key availability
 */
export function filterProgramsByKeys(
  programs: ProgramWithStats[],
  filter: "all" | "hasKeys" | "noKeys"
): ProgramWithStats[] {
  switch (filter) {
    case "hasKeys":
      return programs.filter(program => program.hasKeys);
    case "noKeys":
      return programs.filter(program => !program.hasKeys);
    case "all":
    default:
      return programs;
  }
}

/**
 * Search programs by title and description
 */
export function searchPrograms(programs: ProgramWithStats[], searchTerm: string): ProgramWithStats[] {
  if (!searchTerm.trim()) return programs;

  const term = searchTerm.toLowerCase();
  return programs.filter(
    program => program.title.toLowerCase().includes(term) || program.description.toLowerCase().includes(term)
  );
}
