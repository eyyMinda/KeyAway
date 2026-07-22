import { unstable_cache } from "next/cache";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { client } from "@/src/sanity/lib/client";
import { relatedProgramsCandidatesQuery } from "@/src/lib/sanity/queries";
import type { Program, ProgramCategoryRef, VendorRef } from "@/src/types/program";

const RELATED_LIMIT = 5;
const MAX_PER_VENDOR = 2;

export type RelatedProgramsAnchor = {
  slug: string;
  categories?: ProgramCategoryRef[];
  vendor?: VendorRef | null;
};

function categoryIdSet(categories: ProgramCategoryRef[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const cat of categories ?? []) {
    if (cat?._id) ids.add(cat._id);
  }
  return ids;
}

/** Rank candidates: shared categories desc, then popularityScore desc; cap 2 per vendor in top 5. */
export function rankRelatedPrograms(
  anchor: RelatedProgramsAnchor,
  candidates: Program[],
  limit = RELATED_LIMIT
): Program[] {
  const anchorSlug = anchor.slug;
  const anchorCats = categoryIdSet(anchor.categories);

  const ranked = candidates
    .filter(p => p.slug?.current && p.slug.current !== anchorSlug)
    .map(p => {
      const sharedCategoryCount = (p.categories ?? []).filter(c => anchorCats.has(c._id)).length;
      const popularityScore = p.popularityScore ?? 0;
      return { program: p, sharedCategoryCount, popularityScore };
    })
    .sort((a, b) => {
      if (b.sharedCategoryCount !== a.sharedCategoryCount) {
        return b.sharedCategoryCount - a.sharedCategoryCount;
      }
      return b.popularityScore - a.popularityScore;
    });

  const picked: Program[] = [];
  const vendorCounts = new Map<string, number>();

  for (const { program } of ranked) {
    if (picked.length >= limit) break;

    const vendorSlug = program.vendor?.slug;
    if (vendorSlug) {
      const count = vendorCounts.get(vendorSlug) ?? 0;
      if (count >= MAX_PER_VENDOR) continue;
      vendorCounts.set(vendorSlug, count + 1);
    }

    picked.push(program);
  }

  return picked;
}

async function fetchRelatedCandidates(slug: string): Promise<Program[]> {
  const rows = await client.fetch<Program[]>(
    relatedProgramsCandidatesQuery,
    { slug },
    { next: { tags: [TAG_PROGRAM_LISTINGS] } }
  );
  return rows ?? [];
}

function anchorCategoryCacheKey(categories: ProgramCategoryRef[] | undefined): string {
  const ids = (categories ?? []).map(c => c._id).filter(Boolean).sort();
  return ids.length > 0 ? ids.join(",") : "_none_";
}

function getCachedRankedRelatedPrograms(anchor: RelatedProgramsAnchor): Promise<Program[]> {
  const { slug } = anchor;
  const categoryKey = anchorCategoryCacheKey(anchor.categories);

  return unstable_cache(
    async () => {
      const candidates = await fetchRelatedCandidates(slug);
      return rankRelatedPrograms(anchor, candidates);
    },
    ["related-programs", slug, categoryKey],
    { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_PROGRAM_LISTINGS] }
  )();
}

/** Related programs for a program detail page (cached per slug). */
export async function getCachedRelatedProgramsForSlug(anchor: RelatedProgramsAnchor): Promise<Program[]> {
  return getCachedRankedRelatedPrograms(anchor);
}
