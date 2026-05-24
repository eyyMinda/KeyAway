/** @fileoverview Fetches merged tracking events for admin ranges, bundle program counts for homepage, visitor tag aggregates. */
import { enrichEventsWithVisitorMeta } from "@/src/lib/analytics/enrichEventsWithVisitorMeta";
import { mergeTrackingEventsForRange } from "@/src/lib/analytics/mergeTrackingEventsForRange";
import { TAG_BUNDLE_COUNTS } from "@/src/lib/cache/cacheTags";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { client } from "@/src/sanity/lib/client";
import { bundleCountsQuery, visitorTagAggregatesQuery } from "@/src/lib/sanity/queries";
import { AnalyticsEventData } from "@/src/types";

export interface BundleCountsByProgram {
  page_viewed: number;
  download_click: number;
}

/** Fetches bundle event counts aggregated by programSlug. Cached via Next.js. */
export async function getBundleCountsByProgram(): Promise<Map<string, BundleCountsByProgram>> {
  const bundles = await client.fetch<{ events: Array<{ programSlug?: string; event?: string; notFound?: boolean }> }[]>(
    bundleCountsQuery,
    {},
    { next: { revalidate: PUBLIC_ISR_REVALIDATE_SECONDS, tags: [TAG_BUNDLE_COUNTS] } }
  );
  const map = new Map<string, BundleCountsByProgram>();
  for (const b of bundles || []) {
    for (const e of b.events || []) {
      const slug = e.programSlug;
      if (!slug || !e.event) continue;
      const curr = map.get(slug) ?? { page_viewed: 0, download_click: 0 };
      if (e.event === "page_viewed" && !e.notFound) curr.page_viewed++;
      else if (e.event === "download_click") curr.download_click++;
      map.set(slug, curr);
    }
  }
  return map;
}

/** Merges singular counts with bundle counts for programs. Preserves all other fields. */
export function mergeProgramStats<
  T extends { slug?: { current?: string }; viewCount?: number; downloadCount?: number; popularityScore?: number }
>(programs: T[], bundleCounts: Map<string, BundleCountsByProgram>): T[] {
  return programs.map(p => {
    const slug = p.slug?.current;
    const bc = slug ? bundleCounts.get(slug) : undefined;
    const v = (p.viewCount ?? 0) + (bc?.page_viewed ?? 0);
    const d = (p.downloadCount ?? 0) + (bc?.download_click ?? 0);
    const score = v + d * 3;
    return { ...p, viewCount: v, downloadCount: d, popularityScore: score } as T;
  });
}

/** Merges stats for a single program. */
export function mergeSingleProgramStats(
  program: { viewCount?: number; downloadCount?: number },
  slug: string | undefined,
  bundleCounts: Map<string, BundleCountsByProgram>
) {
  const bc = slug ? bundleCounts.get(slug) : undefined;
  const viewCount = (program.viewCount ?? 0) + (bc?.page_viewed ?? 0);
  const downloadCount = (program.downloadCount ?? 0) + (bc?.download_click ?? 0);
  return { viewCount, downloadCount };
}

/**
 * Fetches all events (singular + bundled) for a date range with visitor meta.
 * Prefer paginated admin API for large ranges.
 */
export async function fetchEventsForRange(since: string, until: string): Promise<AnalyticsEventData[]> {
  const merged = await mergeTrackingEventsForRange(since, until);
  const enriched = await enrichEventsWithVisitorMeta(merged as unknown as Array<Record<string, unknown>>);
  return enriched as unknown as AnalyticsEventData[];
}

export interface AdminEventsPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  countsByEvent: Record<string, number>;
  cacheHit?: boolean;
  cachedAt?: string | null;
}

export interface AdminEventsPageResult {
  data: AnalyticsEventData[];
  meta: AdminEventsPageMeta;
}

export type FetchAdminEventsPageParams = {
  since: string;
  until: string;
  event?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  refresh?: boolean;
};

/** Paginated admin events list (server merge, cache, enrich page slice only). */
export async function fetchAdminEventsPage(
  params: FetchAdminEventsPageParams
): Promise<AdminEventsPageResult> {
  const sp = new URLSearchParams();
  sp.set("since", params.since);
  sp.set("until", params.until);
  if (params.event && params.event !== "all") sp.set("event", params.event);
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.sort) sp.set("sort", params.sort);
  if (params.order) sp.set("order", params.order);
  if (params.refresh) sp.set("refresh", "true");

  const res = await fetch(`/api/v1/admin/events?${sp.toString()}`);
  const json = (await res.json()) as { data?: AnalyticsEventData[]; meta?: AdminEventsPageMeta };
  if (!res.ok) throw new Error("Failed to fetch events");
  return {
    data: json.data ?? [],
    meta: json.meta ?? {
      page: 1,
      limit: 25,
      total: 0,
      totalPages: 1,
      hasMore: false,
      countsByEvent: {}
    }
  };
}

/** Admin UI: load range via server route (token + batched visitor lookup). */
export async function fetchEventsForRangeFromAdminApi(
  since: string,
  until: string
): Promise<AnalyticsEventData[]> {
  const res = await fetch(
    `/api/v1/admin/analytics/events?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`
  );
  const json = (await res.json()) as { data?: AnalyticsEventData[] };
  if (!res.ok) throw new Error("Failed to fetch events");
  return json.data ?? [];
}

export interface AnalyticsSummaryData {
  totalEvents: number;
  uniqueVisitors: number;
  uniqueCountries: number;
  totals: Record<string, number>;
  eventChart: Array<{ name: string; value: number; color: string }>;
  programTable: Array<{ key: string; value: number; label: string }>;
  socialTable: Array<{ key: string; value: number; label: string }>;
  pathTable: Array<{ key: string; value: number; label: string }>;
  countryTable: Array<{ key: string; value: number; label: string }>;
  referrerTable: Array<{ key: string; value: number; label: string; referrerParam?: string }>;
  recentEvents: AnalyticsEventData[];
}

/** Server-side analytics aggregates for dashboard (no full event array to client). */
export async function fetchAnalyticsSummary(
  since: string,
  until: string,
  options?: { refresh?: boolean }
): Promise<AnalyticsSummaryData> {
  const sp = new URLSearchParams({ since, until });
  if (options?.refresh) sp.set("refresh", "true");
  const res = await fetch(`/api/v1/admin/analytics/summary?${sp.toString()}`);
  const json = (await res.json()) as { data?: AnalyticsSummaryData };
  if (!res.ok) throw new Error("Failed to fetch analytics summary");
  return (
    json.data ?? {
      totalEvents: 0,
      uniqueVisitors: 0,
      uniqueCountries: 0,
      totals: {},
      eventChart: [],
      programTable: [],
      socialTable: [],
      pathTable: [],
      countryTable: [],
      referrerTable: [],
      recentEvents: []
    }
  );
}

export interface VisitorTagAggregateRow {
  key: string;
  label: string;
  value: number;
}

/** Visitors with `lastActivityAt` in range; tier and flagged-spammer counts (display order is by count in the table component). */
export async function fetchVisitorTagAggregatesForRange(
  since: string,
  until: string
): Promise<VisitorTagAggregateRow[]> {
  const { singular, bundled } = await client.fetch<{
    singular?: Array<{ visitTier?: string; isSpammer?: boolean }>;
    bundled?: Array<{ visitTier?: string; isSpammer?: boolean }>;
  }>(visitorTagAggregatesQuery, { since, until });
  const rows = [...(singular ?? []), ...(bundled ?? [])];
  const tierOrder = ["new", "returning", "regular", "star"] as const;
  const tierCounts = new Map<string, number>();
  let spammers = 0;
  for (const r of rows ?? []) {
    const tier = (r.visitTier || "new").toLowerCase();
    tierCounts.set(tier, (tierCounts.get(tier) || 0) + 1);
    if (r.isSpammer === true) spammers++;
  }
  const out: VisitorTagAggregateRow[] = tierOrder.map(t => ({
    key: t,
    label: t.charAt(0).toUpperCase() + t.slice(1),
    value: tierCounts.get(t) ?? 0
  }));
  const extraTiers = [...tierCounts.keys()].filter(t => !tierOrder.includes(t as (typeof tierOrder)[number]));
  for (const t of extraTiers.sort()) {
    out.push({ key: t, label: t, value: tierCounts.get(t) ?? 0 });
  }
  out.push({ key: "spammer", label: "Spammers (flagged)", value: spammers });
  return out;
}
