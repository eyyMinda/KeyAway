import { AnalyticsEventData } from "@/src/types";

export const ADMIN_EVENTS_LIST_CACHE_TTL_MS = 120_000;

const PRUNE_AT = 50;

function cacheKey(since: string, until: string): string {
  return `${since}|${until}`;
}

export type AnalyticsSummaryCachePayload = {
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

