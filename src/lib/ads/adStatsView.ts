/** @fileoverview Pure helpers that turn ad counter rows into the admin Ads page's totals, timelines and rankings. */
import {
  AD_PAGES,
  AD_UNIT_LABELS,
  describeAdPlacement,
  type AdMetric,
  type AdPage,
  type AdUnitKind
} from "@/src/lib/ads/adPlacements";

export type AdCounts = Record<AdMetric, number>;
export type AdDailyRow = { day: string; page: AdPage; placement: string; unit: string } & AdCounts;
export type AdPathRow = { path: string; page: AdPage; placement: string; unit: string; lastSeenAt: string } & AdCounts;
export type AdDayPoint = { day: string } & AdCounts;

export type AdPlacementSummary = {
  key: string;
  page: AdPage;
  placement: string;
  unit: string;
  label: string;
  unitLabel: string;
  order: number;
  totals: AdCounts;
  timeline: AdDayPoint[];
};

export type AdPageSummary = { page: AdPage; label: string; totals: AdCounts; timeline: AdDayPoint[]; placements: number };
export type AdPathSummary = { path: string; totals: AdCounts; placements: AdPlacementSummary[] };

export const zeroCounts = (): AdCounts => ({ loads: 0, fills: 0, views: 0, clicks: 0 });

function add(target: AdCounts, row: AdCounts): AdCounts {
  target.loads += row.loads;
  target.fills += row.fills;
  target.views += row.views;
  target.clicks += row.clicks;
  return target;
}

export function sumCounts(rows: AdCounts[]): AdCounts {
  return rows.reduce(add, zeroCounts());
}

/** Clicks per view, 0–1. */
export const clickRate = (c: AdCounts) => (c.views ? c.clicks / c.views : 0);
/** Ads that rendered per load, 0–1 (the rest were blocked or unfilled). */
export const fillRate = (c: AdCounts) => (c.loads ? c.fills / c.loads : 0);

export const pageLabel = (page: AdPage) => AD_PAGES.find(p => p.id === page)?.label ?? page;
const unitLabel = (unit: string) => AD_UNIT_LABELS[unit as AdUnitKind] ?? unit;

/** Every date from `since` to `until` (YYYY-MM-DD, inclusive, UTC). */
export function dayRange(since: string, until: string): string[] {
  const days: string[] = [];
  const end = new Date(`${until}T00:00:00Z`).getTime();
  for (let t = new Date(`${since}T00:00:00Z`).getTime(); t <= end && days.length < 1000; t += 86_400_000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

export function buildTimeline(rows: AdDailyRow[], days: string[]): AdDayPoint[] {
  const byDay = new Map(days.map(day => [day, { day, ...zeroCounts() }]));
  for (const row of rows) {
    const point = byDay.get(row.day);
    if (point) add(point, row);
  }
  return [...byDay.values()];
}

export function summarizePlacements(rows: AdDailyRow[], days: string[]): AdPlacementSummary[] {
  const groups = new Map<string, AdDailyRow[]>();
  for (const row of rows) {
    const key = `${row.page}|${row.placement}|${row.unit}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.entries()].map(([key, group]) => {
    const { page, placement, unit } = group[0];
    const { label, order } = describeAdPlacement(page, placement);
    return {
      key,
      page,
      placement,
      unit,
      label,
      unitLabel: unitLabel(unit),
      order,
      totals: sumCounts(group),
      timeline: buildTimeline(group, days)
    };
  });
}

export function summarizePages(rows: AdDailyRow[], days: string[]): AdPageSummary[] {
  return AD_PAGES.map(({ id, label }) => {
    const pageRows = rows.filter(r => r.page === id);
    return {
      page: id,
      label,
      totals: sumCounts(pageRows),
      timeline: buildTimeline(pageRows, days),
      placements: new Set(pageRows.map(r => `${r.placement}|${r.unit}`)).size
    };
  });
}

/** All-time totals per concrete path of one page type, busiest first. */
export function summarizePaths(rows: AdPathRow[], page: AdPage): AdPathSummary[] {
  const groups = new Map<string, AdPathRow[]>();
  for (const row of rows) {
    if (row.page !== page) continue;
    groups.set(row.path, [...(groups.get(row.path) ?? []), row]);
  }
  return [...groups.entries()]
    .map(([path, group]) => ({
      path,
      totals: sumCounts(group),
      placements: group
        .map(row => {
          const { label, order } = describeAdPlacement(row.page, row.placement);
          return {
            key: `${row.placement}|${row.unit}`,
            page: row.page,
            placement: row.placement,
            unit: row.unit,
            label,
            unitLabel: unitLabel(row.unit),
            order,
            totals: { loads: row.loads, fills: row.fills, views: row.views, clicks: row.clicks },
            timeline: []
          };
        })
        .sort((a, b) => a.order - b.order)
    }))
    .sort((a, b) => b.totals.views - a.totals.views);
}

export const percent = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;
