/** @fileoverview Fetches merged tracking events for admin ranges, bundle program counts for homepage, visitor tag aggregates. */
import { client } from "@/src/sanity/lib/client";
import { trackingEventsWithRangeQuery, trackingEventBundlesQuery, bundleCountsQuery } from "@/src/lib/sanity/queries";
import { AnalyticsEventData } from "@/src/types";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface BundleCountsByProgram {
  page_viewed: number;
  download_click: number;
}

/** Fetches bundle event counts aggregated by programSlug. Cached via Next.js. */
export async function getBundleCountsByProgram(): Promise<Map<string, BundleCountsByProgram>> {
  const bundles = await client.fetch<{ events: Array<{ programSlug?: string; event?: string; notFound?: boolean }> }[]>(
    bundleCountsQuery,
    {},
    { next: { revalidate: 60, tags: ["bundle-counts"] } }
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
 * Fetches all events (singular + bundled) for a date range.
 * Skips bundle fetch when range is entirely within retention (since >= now - 7d).
 */
export async function fetchEventsForRange(since: string, until: string): Promise<AnalyticsEventData[]> {
  const now = Date.now();
  const retentionCutoff = new Date(now - RETENTION_MS).toISOString();
  const needBundles = since < retentionCutoff;

  const [singular, bundles] = await Promise.all([
    client.fetch(trackingEventsWithRangeQuery, { since, until }),
    needBundles ? client.fetch(trackingEventBundlesQuery, { since, until }) : Promise.resolve([])
  ]);

  const bundleEvents: AnalyticsEventData[] = (bundles as { _id: string; events: AnalyticsEventData[] }[]).flatMap(b =>
    (b.events || []).map((e, i) => ({
      ...e,
      _id: `${b._id}:${i}`
    }))
  );

  const merged = [...(singular as AnalyticsEventData[]), ...bundleEvents];
  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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
  const rows = await client.fetch<Array<{ visitTier?: string; isSpammer?: boolean }>>(
    `*[_type == "visitor" && lastActivityAt >= $since && lastActivityAt <= $until]{ visitTier, isSpammer }`,
    { since, until }
  );
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
