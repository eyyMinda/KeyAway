import { mergeTrackingEventsForRange } from "@/src/lib/analytics/mergeTrackingEventsForRange";
import { AnalyticsEventData } from "@/src/types";

export const ADMIN_EVENTS_LIST_CACHE_TTL_MS = 120_000;

type CacheEntry = {
  events: AnalyticsEventData[];
  expiresAt: number;
  cachedAt: string;
};

const store = new Map<string, CacheEntry>();
const PRUNE_AT = 50;

function cacheKey(since: string, until: string): string {
  return `${since}|${until}`;
}

function pruneExpired(now = Date.now()): void {
  if (store.size <= PRUNE_AT) return;
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

export type MergedEventsCacheResult = {
  events: AnalyticsEventData[];
  cacheHit: boolean;
  cachedAt: string | null;
};

/**
 * Returns merged slim events for since/until, cached ~120s per range key.
 * bypass=true skips read and refreshes the entry (admin refresh button).
 */
export async function getMergedEventsForAdmin(
  since: string,
  until: string,
  options?: { bypass?: boolean }
): Promise<MergedEventsCacheResult> {
  const key = cacheKey(since, until);
  const now = Date.now();

  if (!options?.bypass) {
    const hit = store.get(key);
    if (hit && hit.expiresAt > now) {
      return { events: hit.events, cacheHit: true, cachedAt: hit.cachedAt };
    }
  }

  const events = await mergeTrackingEventsForRange(since, until);
  const cachedAt = new Date().toISOString();
  store.set(key, {
    events,
    expiresAt: now + ADMIN_EVENTS_LIST_CACHE_TTL_MS,
    cachedAt
  });
  pruneExpired(now);

  return { events, cacheHit: false, cachedAt };
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

/** Invalidate a range after bulk PATCH (optional). */
export function invalidateMergedEventsCache(since?: string, until?: string): void {
  if (since && until) {
    const key = cacheKey(since, until);
    store.delete(key);
    summaryStore.delete(key);
    return;
  }
  store.clear();
  summaryStore.clear();
}
