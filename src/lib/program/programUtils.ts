import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import type { ProgramWithStats } from "@/src/types/home";
import type { FilterType, SortType } from "@/src/types/programs";

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

export function sortByNameDesc(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => b.title.localeCompare(a.title));
}

export function sortByOldest(programs: ProgramWithStats[]): ProgramWithStats[] {
  return [...programs].sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
}

/** GROQ `| order(...)` segment for server-side /programs pagination (raw document fields). */
export function groqProgramsOrderClause(sortType: SortType): string {
  const score =
    "coalesce(popularityScore, coalesce(viewCount, 0) + coalesce(downloadCount, 0) * 3)";
  switch (sortType) {
    case "popular":
      return `| order(${score} desc)`;
    case "views":
      return "| order(coalesce(viewCount, 0) desc)";
    case "downloads":
      return "| order(coalesce(downloadCount, 0) desc)";
    case "latest":
      return "| order(_createdAt desc)";
    case "oldest":
      return "| order(_createdAt asc)";
    case "name":
      return "| order(title asc)";
    case "nameDesc":
      return "| order(title desc)";
    default:
      return `| order(${score} desc)`;
  }
}

export function normalizeSortType(value?: string): SortType {
  switch (value) {
    case "views":
    case "downloads":
    case "latest":
    case "oldest":
    case "name":
    case "nameDesc":
    case "popular":
      return value;
    default:
      return "popular";
  }
}

export function normalizeFilterType(value?: string): FilterType {
  switch (value) {
    case "hasKeys":
    case "noKeys":
    case "all":
      return value;
    default:
      return "all";
  }
}

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
    case "nameDesc":
      return sortByNameDesc(programs);
    case "oldest":
      return sortByOldest(programs);
    default:
      return programs;
  }
}

/**
 * Filter programs by key availability
 */
export function filterProgramsByKeys(
  programs: ProgramWithStats[],
  filter: FilterType
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
  return programs.filter(program => {
    const desc = portableTextToPlainText(program.description).toLowerCase();
    return program.title.toLowerCase().includes(term) || desc.includes(term);
  });
}

/**
 * Convert kebab-case slug to proper title case
 */
export function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
