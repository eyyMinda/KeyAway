import type { PromotionThemeId } from "@/src/lib/promotions/promotionThemes";
import { AnalyticsEventData } from "@/src/types";

export const ADMIN_EVENTS_LIST_CACHE_TTL_MS = 120_000;

const PRUNE_AT = 50;

function cacheKey(since: string, until: string): string {
  return `${since}|${until}`;
}

export type AnalyticsTimelineBucket = "hour" | "day" | "week";

/** How a bucket splits: visitors by tier, views by page type, actions by type, promotion clicks by placement. */
export type TimelineDimension = "tier" | "page" | "action" | "promo";

/** Activity per time bucket (zero-filled). `actions` = every non-page-view click event. */
export type AnalyticsTimeline = {
  bucket: AnalyticsTimelineBucket;
  points: Array<{
    t: string;
    visitors: number;
    views: number;
    actions: number;
    breakdown: Record<TimelineDimension, Record<string, number>>;
  }>;
  /** Unique visitors per tier across the whole range (one visitor spans many buckets). */
  tierTotals: Record<string, number>;
};

/** The running promotion, or the latest ended one, measured across its whole run. */
export type PromotionCampaignSummary = {
  title: string;
  theme?: PromotionThemeId;
  startsAt: string;
  endsAt: string;
  live: boolean;
  /** Everyone active on the site during the campaign, and so shown the promotion. */
  reached: number;
  /** Reached visitors who clicked a promotion button. Each counts once as a success. */
  converted: number;
  clicks: number;
};

export type PromotionClickSummary = {
  clicks: number;
  visitors: number;
  placements: Array<{ key: string; clicks: number; visitors: number }>;
  pages: Array<{ path: string; clicks: number }>;
  campaign: PromotionCampaignSummary | null;
};

export type AnalyticsSummaryCachePayload = {
  totalEvents: number;
  uniqueVisitors: number;
  uniqueCountries: number;
  /** Sessions started in range. */
  sessions: number;
  totals: Record<string, number>;
  timeline: AnalyticsTimeline;
  promotions: PromotionClickSummary;
  programTable: Array<{ key: string; value: number; label: string }>;
  socialTable: Array<{ key: string; value: number; label: string }>;
  pathTable: Array<{ key: string; value: number; label: string }>;
  countryTable: Array<{ key: string; value: number; label: string }>;
  referrerTable: Array<{ key: string; value: number; label: string; referrerParam?: string }>;
  recentEvents: AnalyticsEventData[];
};

type SummaryCacheEntry = {
  data: AnalyticsSummaryCachePayload;
  expiresAt: number;
  cachedAt: string;
};

const summaryStore = new Map<string, SummaryCacheEntry>();

export type AnalyticsSummaryCacheResult = {
  data: AnalyticsSummaryCachePayload;
  cacheHit: boolean;
  cachedAt: string | null;
};

/** Cached analytics dashboard payload (~120s), keyed by since|until. */
export function getCachedAnalyticsSummary(
  since: string,
  until: string,
  options?: { bypass?: boolean }
): AnalyticsSummaryCacheResult | null {
  if (options?.bypass) return null;
  const key = cacheKey(since, until);
  const hit = summaryStore.get(key);
  const now = Date.now();
  if (hit && hit.expiresAt > now) {
    return { data: hit.data, cacheHit: true, cachedAt: hit.cachedAt };
  }
  return null;
}

export function setCachedAnalyticsSummary(
  since: string,
  until: string,
  data: AnalyticsSummaryCachePayload
): string {
  const now = Date.now();
  const cachedAt = new Date().toISOString();
  summaryStore.set(cacheKey(since, until), {
    data,
    expiresAt: now + ADMIN_EVENTS_LIST_CACHE_TTL_MS,
    cachedAt
  });
  pruneSummaryExpired(now);
  return cachedAt;
}

function pruneSummaryExpired(now: number): void {
  if (summaryStore.size <= PRUNE_AT) return;
  for (const [k, v] of summaryStore) {
    if (v.expiresAt <= now) summaryStore.delete(k);
  }
}

