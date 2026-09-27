import { cache } from "react";
import { programDetailTag } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { programShareCountsQuery } from "@/src/lib/sanity/queries";
import { sumShareCountRows } from "@/src/lib/share/sumShareCountRows";
import type { ShareCounts } from "@/src/lib/share/buildSharePayload";

export type ProgramShareCounts = ShareCounts;

/** Aggregate share-click counts per network for a program from session events. */
export const getProgramShareCounts = cache(async (slug: string): Promise<ProgramShareCounts> => {
  const row = await client.fetch<{ live?: Array<Record<string, number>>; bundled?: Array<Record<string, number>> } | null>(
    programShareCountsQuery,
    { slug },
    { next: { tags: [programDetailTag(slug)] } }
  );
  return sumShareCountRows(row?.live, row?.bundled);
});
