/**
 * @fileoverview Daily analytics rollups (`analytics.daily_stats`, `analytics.daily_sketches`). Raw sessions/events are
 * kept for `RAW_RETENTION_DAYS`; older days live on as per-day counts and distinct-visitor sketches, so totals and
 * top lists stay the same after pruning. Readers split a range into rolled days and the raw remainder.
 */
import { db } from "@/src/lib/db/postgres";
import { RAW_RETENTION_DAYS } from "@/src/lib/analytics/sessionConstants";
import { DAY_MS } from "@/src/lib/time";

/** Separates entry and referrer in `source` keys (matches `chr(31)` in the migration). */
const SOURCE_SEPARATOR = "\u001f";

export type RollupWindow = {
  /** Rolled days in range, `from` inclusive and `to` exclusive (YYYY-MM-DD), or null when the range is all raw. */
  rolled: { from: string; to: string } | null;
  /** Raw rows count from here (the later of `since` and the first day not rolled). */
  rawSince: string;
};

const utcDay = (iso: string | number) => new Date(iso).toISOString().slice(0, 10);

/** First day still kept raw (every earlier day is in the rollups). */
export async function getRolledUntil(): Promise<string | null> {
  try {
    const [row] = await db()<Array<{ rolledUntil: string }>>`
      select to_char(rolled_until, 'YYYY-MM-DD') as rolled_until from analytics.rollup_state where id
    `;
    // Nothing is rolled until the first run moves past the epoch default.
    return row && row.rolledUntil > "1970-01-01" ? row.rolledUntil : null;
  } catch (err) {
    // Before the rollup migration runs, everything is raw.
    console.error("[getRolledUntil]", err);
    return null;
  }
}

/** The UTC midnight nearest to `iso`: a rolled day counts when the range covers at least half of it. */
const nearestDay = (iso: string) => utcDay(Date.parse(iso) + DAY_MS / 2);

/** Whole UTC days a range counts from daily rollups: `from` inclusive, `to` exclusive. */
export function rollupDays(since: string, until: string): { from: string; to: string } {
  return { from: nearestDay(since), to: nearestDay(until) };
}

/** Which part of `since`..`until` comes from the rollups (whole UTC days) and where raw rows take over. */
export function rollupWindow(since: string, until: string, rolledUntil: string | null): RollupWindow {
  if (!rolledUntil) return { rolled: null, rawSince: since };
  const rawStart = `${rolledUntil}T00:00:00.000Z`;
  const rawSince = since > rawStart ? since : rawStart;
  const days = rollupDays(since, until);
  const to = [rolledUntil, days.to].sort()[0];
  return { rolled: days.from < to ? { from: days.from, to } : null, rawSince };
}

export async function getRollupWindow(since: string, until: string): Promise<RollupWindow> {
  return rollupWindow(since, until, await getRolledUntil());
}

/** Summed per metric and key over the rolled days. */
export async function sumDailyStats(metrics: string[], range: { from: string; to: string }) {
  const sql = db();
  const rows = await sql<Array<{ metric: string; key: string; n: number }>>`
    select metric, key, sum(n)::int as n
    from analytics.daily_stats
    where metric in ${sql(metrics)} and day >= ${range.from} and day < ${range.to}
    group by metric, key
  `;
  const out = new Map<string, Map<string, number>>(metrics.map(m => [m, new Map()]));
  for (const row of rows) out.get(row.metric)?.set(row.key, row.n);
  return out;
}

/** `source` rollup keys back into the entry/referrer pair the sessions table stores. */
export function decodeSourceKey(key: string): { entry: string | null; referrer: string | null } {
  const [entry = "", referrer = ""] = key.split(SOURCE_SEPARATOR);
  return { entry: entry || null, referrer: referrer || null };
}

export type RollupRunResult = { days: number; events: number; sessions: number; visitors: number; rolledUntil: string | null };

/**
 * Rolls up every day older than the raw window (one transaction per day, oldest first) and prunes one-time visitors.
 * Stops early when `budgetMs` runs out; the next run continues where this one stopped.
 */
export async function runAnalyticsRollup(budgetMs: number): Promise<RollupRunResult> {
  const sql = db();
  const started = Date.now();
  const result: RollupRunResult = { days: 0, events: 0, sessions: 0, visitors: 0, rolledUntil: null };

  while (Date.now() - started < budgetMs) {
    const [row] = await sql<Array<{ result: { events: number; sessions: number } | null }>>`
      select analytics.rollup_next_day(${RAW_RETENTION_DAYS}) as result
    `;
    if (!row?.result) break;
    result.days++;
    result.events += row.result.events;
    result.sessions += row.result.sessions;
  }

  const [pruned] = await sql<Array<{ n: number }>>`select analytics.prune_visitors(${RAW_RETENTION_DAYS}) as n`;
  result.visitors = pruned?.n ?? 0;
  result.rolledUntil = await getRolledUntil();
  return result;
}
