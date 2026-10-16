import { cache } from "react";
import { TAG_SITEMAP_URLS } from "@/src/lib/cache/cacheTags";
import { queryShareCounts } from "@/src/lib/share/queryShareCounts";
import type { ShareCounts } from "@/src/lib/share/buildSharePayload";

/** Aggregate share-click counts per network for a path from session events. */
export const getPageShareCounts = cache((path: string): Promise<ShareCounts> => queryShareCounts({ path }, TAG_SITEMAP_URLS));
