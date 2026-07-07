import { cache } from "react";
import { TAG_SITEMAP_URLS } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { pageShareCountsQuery } from "@/src/lib/sanity/queries";
import type { ShareCounts, ShareNetworkId } from "@/src/lib/share/buildSharePayload";

/** Aggregate share-click counts per network for a path (singular trackingEvent rows). */
export const getPageShareCounts = cache(async (path: string): Promise<ShareCounts> => {
  const row = await client.fetch<Record<string, number> | null>(
    pageShareCountsQuery,
    { path },
    { next: { tags: [TAG_SITEMAP_URLS] } }
  );
  if (!row) return {};

  const out: ShareCounts = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "number" && value > 0) {
      out[key as ShareNetworkId] = value;
    }
  }
  return out;
});
