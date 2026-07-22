import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { programsListingProjection } from "@/src/lib/sanity/queries";
import { mergeProgramStats } from "@/src/lib/analytics/eventsApi";
import type { ProgramWithStats } from "@/src/types/home";
import type { FilterType, PlatformFilterType, SortType } from "@/src/types/programs";
import type { ProgramCategoryOption } from "@/src/types/programs";
import { portableTextToPlainText } from "@/src/lib/portableText/toPlainText";
import {
  groqProgramsOrderClause,
  normalizeCategoryFilter,
  normalizeFilterType,
  normalizePlatformFilter,
  normalizeSortType
} from "@/src/lib/program/programUtils";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";

export const PROGRAMS_PER_PAGE = 16;

export type ProgramsListData = {
  programs: ProgramWithStats[];
  totalCount: number;
  totalKeys: number;
  searchTerm: string;
  filter: FilterType;
  sortBy: SortType;
  category: string;
  platform: PlatformFilterType;
  page: number;
  programsPerPage: number;
};

export type ProgramsHeroTotals = {
  totalCount: number;
  totalKeys: number;
};

async function fetchProgramsHeroTotals(): Promise<ProgramsHeroTotals> {
  const [totalCount, keyCountRows] = await Promise.all([
    client.fetch<number>(`count(*[_type == "program"])`, {}, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<Array<{ keyCount?: number }>>(
      `*[_type == "program"]{"keyCount": count(cdKeys[])}`,
      {},
      { next: { tags: [TAG_PROGRAM_LISTINGS] } }
    )
  ]);
  const totalKeys = (keyCountRows ?? []).reduce((sum, row) => sum + (row.keyCount ?? 0), 0);
  return { totalCount: totalCount ?? 0, totalKeys };
}

export const getCachedProgramsHeroTotals = unstable_cache(fetchProgramsHeroTotals, ["programs-hero-totals"], {
  revalidate: PUBLIC_ISR_REVALIDATE_SECONDS,
  tags: [TAG_PROGRAM_LISTINGS]
});

async function fetchProgramCategoryOptions(): Promise<ProgramCategoryOption[]> {
  const rows = await client.fetch<Array<{ _id: string; title?: string; slug?: string }>>(
    `*[_type == "programCategory"] | order(title asc) { _id, title, "slug": slug.current }`,
    {},
    { next: { tags: [TAG_PROGRAM_LISTINGS] } }
  );
  return (rows ?? [])
    .filter(r => r._id && r.title?.trim() && r.slug?.trim())
    .map(r => ({ _id: r._id, title: r.title!.trim(), slug: r.slug!.trim() }));
}

export const getCachedProgramCategoryOptions = unstable_cache(fetchProgramCategoryOptions, ["program-category-options"], {
  revalidate: PUBLIC_ISR_REVALIDATE_SECONDS,
  tags: [TAG_PROGRAM_LISTINGS]
});

function buildProgramsFilterGroq(
  filter: FilterType,
  searchTerm: string,
  category: string,
  platform: PlatformFilterType
): { filterExpr: string; params: Record<string, unknown> } {
  const keyFilter =
    filter === "hasKeys" ? "count(cdKeys[]) > 0" : filter === "noKeys" ? "count(cdKeys[]) == 0" : "true";
  const searchFilter = searchTerm
    ? " && (title match $search || string::lower(pt::text(description)) match $search)"
    : "";
  const categoryFilter =
    category !== "all" ? " && $categorySlug in categories[]->slug.current" : "";
  const platformFilter =
    platform !== "all" ? " && $platform in coalesce(platforms, [\"windows\"])" : "";

  const params: Record<string, unknown> = {};
  if (searchTerm) params.search = `*${searchTerm.toLowerCase()}*`;
  if (category !== "all") params.categorySlug = category;
  if (platform !== "all") params.platform = platform;

  return {
    filterExpr: `*[_type == "program" && ${keyFilter}${searchFilter}${categoryFilter}${platformFilter}]`,
    params
  };
}

async function fetchProgramsListData(
  searchTerm: string,
  filter: FilterType,
  sortBy: SortType,
  category: string,
  platform: PlatformFilterType,
  page: number
): Promise<ProgramsListData> {
  const startIdx = (page - 1) * PROGRAMS_PER_PAGE;
  const endIdx = startIdx + PROGRAMS_PER_PAGE - 1;
  const { filterExpr, params } = buildProgramsFilterGroq(filter, searchTerm, category, platform);
  const countQuery = `count(${filterExpr})`;
  const keyCountQuery = `${filterExpr}{"keyCount": count(cdKeys[])}`;
  const listQuery = `${filterExpr} {${programsListingProjection}} ${groqProgramsOrderClause(sortBy)} [${startIdx}...${endIdx}]`;

  const [totalCount, keyCountRows, rawPrograms] = await Promise.all([
    client.fetch<number>(countQuery, params, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<Array<{ keyCount?: number }>>(keyCountQuery, params, { next: { tags: [TAG_PROGRAM_LISTINGS] } }),
    client.fetch<ProgramWithStats[]>(listQuery, params, { next: { tags: [TAG_PROGRAM_LISTINGS] } })
  ]);

  const programs = mergeProgramStats((rawPrograms ?? []) as ProgramWithStats[]).map(program => ({
    ...program,
    descriptionPlain: portableTextToPlainText(program.description)
  })) as ProgramWithStats[];

  const totalKeys = (keyCountRows ?? []).reduce((sum, row) => sum + (row.keyCount ?? 0), 0);

  return {
    programs,
    totalCount: totalCount ?? 0,
    totalKeys,
    searchTerm,
    filter,
    sortBy,
    category,
    platform,
    page,
    programsPerPage: PROGRAMS_PER_PAGE
  };
}

export async function getProgramsListData(
  rawSearch: string | undefined,
  rawFilter: string | undefined,
  rawSort: string | undefined,
  rawPage: string | undefined,
  rawCategory?: string | undefined,
  rawPlatform?: string | undefined
): Promise<ProgramsListData> {
  const searchTerm = (rawSearch || "").trim();
  const filter = normalizeFilterType(rawFilter);
  const sortBy = normalizeSortType(rawSort);
  const category = normalizeCategoryFilter(rawCategory);
  const platform = normalizePlatformFilter(rawPlatform);
  const page = Math.max(1, Number.parseInt(rawPage || "1", 10) || 1);

  return unstable_cache(
    () => fetchProgramsListData(searchTerm, filter, sortBy, category, platform, page),
    ["programs-list-v3", searchTerm, filter, sortBy, category, platform, String(page)],
    { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_PROGRAM_LISTINGS] }
  )();
}

/** Top programs for JSON-LD on static /programs shell. */
export async function getCachedProgramsForJsonLd(limit = 20): Promise<ProgramWithStats[]> {
  return unstable_cache(
    async () => {
      const rows = await client.fetch<ProgramWithStats[]>(
        `*[_type == "program"] {${programsListingProjection}} | order(popularityScore desc) [0...$limit]`,
        { limit: limit - 1 },
        { next: { tags: [TAG_PROGRAM_LISTINGS] } }
      );
      return mergeProgramStats(rows ?? []);
    },
    ["programs-jsonld-v2", String(limit)],
    { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_PROGRAM_LISTINGS] }
  )();
}
