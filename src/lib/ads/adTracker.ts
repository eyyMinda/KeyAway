"use client";

/**
 * @fileoverview Ad performance counts, batched in memory and sent as one beacon per batch: when the tab is hidden
 * or closed, or 30 s after the first count. The server adds each batch onto daily counter rows (no per-event rows).
 */
import { shouldSkipClientPageView } from "@/src/lib/analytics/shouldSendPageView";
import type { AdMetric, AdUnitKind } from "@/src/lib/ads/adPlacements";

export type AdStatItem = { path: string; placement: string; unit: AdUnitKind } & Record<AdMetric, number>;

const ENDPOINT = "/api/v1/analytics/ads";
const FLUSH_DELAY_MS = 30_000;
const MAX_ITEMS = 60;

const pending = new Map<string, AdStatItem>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;
let skip: boolean | null = null;

function shouldSkip(): boolean {
  skip ??= window.location.hostname === "localhost" || shouldSkipClientPageView();
  return skip;
}

function flush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = null;
  if (pending.size === 0) return;
  const items = [...pending.values()].slice(0, MAX_ITEMS);
  pending.clear();
  const body = JSON.stringify({ items });
  const sent = navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }));
  if (!sent) {
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
      () => {}
    );
  }
}

function bindListeners(): void {
  if (listenersBound) return;
  listenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);
}

export function recordAdMetric(placement: string, unit: AdUnitKind, metric: AdMetric): void {
  if (typeof window === "undefined" || shouldSkip()) return;
  bindListeners();
  const path = window.location.pathname;
  const key = `${path}|${placement}|${unit}`;
  let item = pending.get(key);
  if (!item) {
    item = { path, placement, unit, loads: 0, fills: 0, views: 0, clicks: 0 };
    pending.set(key, item);
  }
  item[metric] += 1;
  flushTimer ??= setTimeout(flush, FLUSH_DELAY_MS);
}
