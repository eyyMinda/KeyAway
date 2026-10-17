/** @fileoverview Admin dashboard fetch helpers (browser) and program stat merging; program stats live on program docs (cron rollup). */
import { calculatePopularityScore } from "@/src/lib/program/programUtils";
import type { VisitorTagAggregateRow } from "@/src/lib/visitors/visitorStore";
import type { AnalyticsSummaryCachePayload } from "@/src/lib/api/adminEventsListCache";

export type { VisitorTagAggregateRow };

/** Ensures view/download/popularity fields are numeric (already merged on program by cron). */
export function mergeProgramStats<
  T extends { slug?: { current?: string }; viewCount?: number; downloadCount?: number; popularityScore?: number }
>(programs: T[]): T[] {
  return programs.map(p => {
    const viewCount = p.viewCount ?? 0;
    const downloadCount = p.downloadCount ?? 0;
    const popularityScore = p.popularityScore ?? calculatePopularityScore(viewCount, downloadCount);
    return { ...p, viewCount, downloadCount, popularityScore } as T;
  });
}

/** Merges stats for a single program (fields already on document). */
export function mergeSingleProgramStats(program: { viewCount?: number; downloadCount?: number }) {
  const viewCount = program.viewCount ?? 0;
  const downloadCount = program.downloadCount ?? 0;
  return { viewCount, downloadCount };
}

export type AnalyticsSummaryData = AnalyticsSummaryCachePayload;

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
      sessions: 0,
      totals: {},
      timeline: { bucket: "day", points: [] },
      programTable: [],
      socialTable: [],
      pathTable: [],
      countryTable: [],
      referrerTable: [],
      recentEvents: []
    }
  );
}

/** Visitors with `lastActivityAt` in range; tier and flagged-spammer counts (display order is by count in the table component). */
export async function fetchVisitorTagAggregatesForRange(
  since: string,
  until: string
): Promise<VisitorTagAggregateRow[]> {
  const sp = new URLSearchParams({ since, until });
  const res = await fetch(`/api/v1/admin/analytics/visitor-tiers?${sp.toString()}`);
  const json = (await res.json()) as { data?: VisitorTagAggregateRow[] };
  if (!res.ok) throw new Error("Failed to fetch visitor tiers");
  return json.data ?? [];
}
