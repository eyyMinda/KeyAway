import { cache } from "react";
import { programDetailTag } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { programShareCountsQuery } from "@/src/lib/sanity/queries";
import type { ShareCounts, ShareNetworkId } from "@/src/lib/share/buildSharePayload";

export type ProgramShareCounts = ShareCounts;

/** Aggregate share-click counts per network for a program (singular trackingEvent rows). */
export const getProgramShareCounts = cache(async (slug: string): Promise<ProgramShareCounts> => {
  const row = await client.fetch<Record<string, number> | null>(
    programShareCountsQuery,
    { slug },
    { next: { tags: [programDetailTag(slug)] } }
  );
  if (!row) return {};

  const out: ProgramShareCounts = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "number" && value > 0) {
      out[key as ShareNetworkId] = value;
    }
  }
  return out;
});
