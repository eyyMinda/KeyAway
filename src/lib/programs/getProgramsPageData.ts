import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { programsListingProjection } from "@/src/lib/sanity/queries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { getFeaturedProgram } from "@/src/lib/sanity/sanityActions";
import { getBundleCountsByProgram, mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import type { FilterType, SortType } from "@/src/types/programs";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import {
  groqProgramsOrderClause,
  isStatsBasedProgramsSort,
  normalizeFilterType,
  normalizeSortType,
  sortPrograms
} from "@/src/lib/program/programUtils";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";

const PROGRAMS_PER_PAGE = 16;

export type ProgramsPageData = {
  programs: ProgramWithStats[];
  totalCount: number;
  totalKeys: number;
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  page: number;
  programsPerPage: number;
  storeRow: Awaited<ReturnType<typeof getCachedStoreDetailsDocument>>;
  featuredProgram: Awaited<ReturnType<typeof getFeaturedProgram>>;
};

async function fetchProgramsPageData(
  searchTerm: string,
  filter: FilterType,
  sortBy: SortType,
  page: number
): Promise<ProgramsPageData> {
  const startIdx = (page - 1) * PROGRAMS_PER_PAGE;
  const endIdx = startIdx + PROGRAMS_PER_PAGE - 1;
  const filterQuery =
    filter === "hasKeys" ? "count(cdKeys[]) > 0" : filter === "noKeys" ? "count(cdKeys[]) == 0" : "true";
  const searchFilter = searchTerm
    ? " && (title match $search || string::lower(pt::text(description)) match $search)"
    : "";
  const programsFilter = `*[_type == "program" && ${filterQuery}${searchFilter}]`;
  const countQuery = `count(${programsFilter})`;
  const keyCountQuery = `${programsFilter}{"keyCount": count(cdKeys[])}`;
  const statsSort = isStatsBasedProgramsSort(sortBy);
  const listQuery = statsSort
    ? `${programsFilter} {${programsListingProjection}}`
    : `${programsFilter} {${programsListingProjection}} ${groqProgramsOrderClause(sortBy)} [${startIdx}...${endIdx}]`;
  const queryParams = searchTerm ? { search: `*${searchTerm.toLowerCase()}*` } : {};

  const [totalCount, keyCountRows, rawPrograms, bundleCounts, storeRow, featuredProgram] = await Promise.all([
    client.fetch<number>(countQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<Array<{ keyCount?: number }>>(keyCountQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<ProgramWithStats[]>(listQuery, queryParams, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    getBundleCountsByProgram(),
    getCachedStoreDetailsDocument(),
    getFeaturedProgram()
  ]);

  const mergedAll = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[], bundleCounts);
  const pageSlice = statsSort ? sortPrograms(mergedAll, sortBy).slice(startIdx, endIdx + 1) : mergedAll;
  const programs = pageSlice.map(program => ({
    ...program,
    descriptionPlain: portableTextToPlainText(program.description)
  })) as ProgramWithStats[];

  const totalKeys = (keyCountRows ?? []).reduce((sum, row) => sum + (row.keyCount ?? 0), 0);

  return {
    programs,
    totalCount,
    totalKeys,
    searchTerm,
    filter,
    sortBy,
    page,
    programsPerPage: PROGRAMS_PER_PAGE,
    storeRow,
    featuredProgram
  };
}

export async function getProgramsPageData(
  rawSearch: string | undefined,
  rawFilter: string | undefined,
  rawSort: string | undefined,
  rawPage: string | undefined
): Promise<ProgramsPageData> {
  const searchTerm = (rawSearch || "").trim();
  const filter = normalizeFilterType(rawFilter);
  const sortBy = normalizeSortType(rawSort);
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);

  return unstable_cache(
    () => fetchProgramsPageData(searchTerm, filter, sortBy, page),
    ["programs-page", searchTerm, filter, sortBy, String(page)],
    { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_PROGRAM_LISTINGS] }
  )();
}
