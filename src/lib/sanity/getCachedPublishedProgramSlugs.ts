/** @fileoverview Cached set of published program slugs (track API validation without per-hit Sanity fetch). */
import { unstable_cache } from "next/cache";
import { TAG_PROGRAM_LISTINGS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { client } from "@/src/sanity/lib/client";

async function fetchPublishedSlugSet(): Promise<Set<string>> {
  const slugs = await client.fetch<string[]>(
    `*[_type == "program" && defined(slug.current)].slug.current`,
    {},
    { next: { tags: [TAG_PROGRAM_LISTINGS] } }
  );
  return new Set((slugs ?? []).filter(Boolean));
}

export async function getCachedPublishedProgramSlugs(): Promise<Set<string>> {
  return unstable_cache(fetchPublishedSlugSet, ["published-program-slugs"], {
    revalidate: PUBLIC_ISR_REVALIDATE_SECONDS,
    tags: [TAG_PROGRAM_LISTINGS]
  })();
}

/** True if slug exists on a published program (uses cached slug inventory). */
export async function isProgramSlugPublishedCached(slug: string | undefined): Promise<boolean> {
  const s = slug?.trim();
  if (!s) return false;
  const set = await getCachedPublishedProgramSlugs();
  return set.has(s);
}
