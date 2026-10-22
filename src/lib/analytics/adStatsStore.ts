/**
 * @fileoverview Ad performance counters in Supabase (`analytics.ad_stats_daily`, `analytics.ad_stats_paths`).
 * Each browser batch becomes two upserts that add onto existing rows, so storage grows with
 * days × placements and paths × placements, not with traffic.
 */
import { db } from "@/src/lib/db/postgres";
import { adPageFromPath } from "@/src/lib/ads/adPlacements";
import type { AdCounts, AdDailyRow, AdPathRow } from "@/src/lib/ads/adStatsView";

export type AdStatInput = { path: string; placement: string; unit: string } & AdCounts;

function addCounts(target: AdCounts, source: AdCounts) {
  target.loads += source.loads;
  target.fills += source.fills;
  target.views += source.views;
  target.clicks += source.clicks;
}

/** Merge duplicate keys first: one upsert statement may not touch the same row twice. */
function groupBy<K extends Record<string, string>>(
  items: AdStatInput[],
  key: (item: AdStatInput) => string,
  make: (item: AdStatInput) => K
) {
  const groups = new Map<string, K & AdCounts>();
  for (const item of items) {
    const k = key(item);
    const existing = groups.get(k);
    if (existing) addCounts(existing, item);
    else groups.set(k, { ...make(item), loads: item.loads, fills: item.fills, views: item.views, clicks: item.clicks });
  }
  return [...groups.values()];
}

export async function recordAdStats(items: AdStatInput[]): Promise<void> {
  if (items.length === 0) return;
  const day = new Date().toISOString().slice(0, 10);

  const daily = groupBy(
    items,
    i => `${adPageFromPath(i.path)}|${i.placement}|${i.unit}`,
    i => ({ page: adPageFromPath(i.path), placement: i.placement, unit: i.unit })
  );
  const paths = groupBy(
    items,
    i => `${i.path}|${i.placement}|${i.unit}`,
    i => ({ path: i.path, page: adPageFromPath(i.path), placement: i.placement, unit: i.unit })
  );

  const sql = db();
  await sql`
    insert into analytics.ad_stats_daily (day, page, placement, unit, loads, fills, views, clicks)
    select ${day}::date, x.page, x.placement, x.unit, x.loads, x.fills, x.views, x.clicks
    from jsonb_to_recordset(${sql.json(daily)}) as x(page text, placement text, unit text, loads int, fills int, views int, clicks int)
    on conflict (day, page, placement, unit) do update set
      loads  = analytics.ad_stats_daily.loads  + excluded.loads,
      fills  = analytics.ad_stats_daily.fills  + excluded.fills,
      views  = analytics.ad_stats_daily.views  + excluded.views,
      clicks = analytics.ad_stats_daily.clicks + excluded.clicks
  `;
  await sql`
    insert into analytics.ad_stats_paths (path, placement, unit, page, loads, fills, views, clicks)
    select x.path, x.placement, x.unit, x.page, x.loads, x.fills, x.views, x.clicks
    from jsonb_to_recordset(${sql.json(paths)}) as x(path text, placement text, unit text, page text, loads int, fills int, views int, clicks int)
    on conflict (path, placement, unit) do update set
      loads        = analytics.ad_stats_paths.loads  + excluded.loads,
      fills        = analytics.ad_stats_paths.fills  + excluded.fills,
      views        = analytics.ad_stats_paths.views  + excluded.views,
      clicks       = analytics.ad_stats_paths.clicks + excluded.clicks,
      last_seen_at = now()
  `;
}

/** Daily rows in [since, until] (dates, inclusive) plus the busiest paths of all time. */
export async function getAdStats(since: string, until: string): Promise<{ daily: AdDailyRow[]; paths: AdPathRow[] }> {
  const sql = db();
  const [daily, paths] = await Promise.all([
    sql<AdDailyRow[]>`
      select to_char(day, 'YYYY-MM-DD') as day, page, placement, unit, loads, fills, views, clicks
      from analytics.ad_stats_daily
      where day between ${since}::date and ${until}::date
      order by day
    `,
    sql<AdPathRow[]>`
      select path, page, placement, unit, loads, fills, views, clicks, last_seen_at
      from analytics.ad_stats_paths
      order by views desc
      limit 500
    `
  ]);
  return { daily: [...daily], paths: [...paths] };
}
