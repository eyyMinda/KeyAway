import { cache } from "react";
import { TAG_SITEMAP_URLS } from "@/src/lib/cache/cacheTags";
import { client } from "@/src/sanity/lib/client";
import { pageShareCountsQuery } from "@/src/lib/sanity/queries";
import { sumShareCountRows } from "@/src/lib/share/sumShareCountRows";
import type { ShareCounts } from "@/src/lib/share/buildSharePayload";

/** Aggregate share-click counts per network for a path from session events. */
export const getPageShareCounts = cache(async (path: string): Promise<ShareCounts> => {
  const row = await client.fetch<{ live?: Array<Record<string, number>>; bundled?: Array<Record<string, number>> } | null>(
    pageShareCountsQuery,
    { path },
    { next: { tags: [TAG_SITEMAP_URLS] } }
  );
  return sumShareCountRows(row?.live, row?.bundled);
});
