/**
 * @fileoverview Dashboard insight cards: where database traffic goes (pg_stat_statements), how far the analytics
 * rollup has got, and which user agents look like bots. A few small queries, cached for 10 minutes.
 */
import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db/postgres";

const CACHE_SECONDS = 600;
export const TAG_USAGE_INSIGHTS = "admin-usage-insights";
/** Average bytes a returned row costs on the wire; a rough factor for the egress estimate. */
const BYTES_PER_ROW_ESTIMATE = 80;
const TRAFFIC_DAYS = 14;

export type QueryTraffic = { query: string; calls: number; rows: number; rowsPerCall: number; estBytes: number };

export type DbTraffic = {
  available: boolean;
  since: string | null;
  totalRows: number;
  estBytes: number;
  top: QueryTraffic[];
};

export type RollupStatus = {
  rolledUntil: string | null;
  daysRolled: number;
  rawSince: string | null;
  rollupBytes: number;
};

export type UserAgentTraffic = {
  id: number;
  ua: string;
  isBot: boolean;
  sessions: number;
  onePage: number;
  homeOnly: number;
  visitors: number;
};

export type UsageInsights = {
  traffic: DbTraffic;
  /** Null when the rollup tables could not be read. */
  rollup: RollupStatus | null;
  /** Null when user agents could not be read (e.g. before the user_agents migration). */
  userAgents: UserAgentTraffic[] | null;
  trafficDays: number;
  /** Supabase dashboard page for this project (real egress lives there), when the pooler URL names it. */
  supabaseProjectUrl: string | null;
};

/** Pooler URLs log in as `postgres.<project ref>`. */
function supabaseProjectUrl(): string | null {
  try {
    const user = new URL(process.env.SUPABASE_DB_URL ?? "").username;
    const ref = user.startsWith("postgres.") ? user.slice("postgres.".length) : "";
    return /^[a-z0-9]{10,40}$/.test(ref) ? `https://supabase.com/dashboard/project/${ref}` : null;
  } catch {
    return null;
  }
}

/** Collapses whitespace and Postgres placeholders so a query reads as one line. */
const queryLabel = (query: string) => query.replace(/\s+/g, " ").trim().slice(0, 220);

async function loadTraffic(): Promise<DbTraffic> {
  const sql = db();
  try {
    const [info] = await sql<Array<{ since: string | null }>>`select stats_reset as since from pg_stat_statements_info`;
    const rows = await sql<Array<{ query: string; calls: number; rows: number }>>`
      select query, calls::int as calls, rows::int as rows
      from pg_stat_statements
      where query !~* 'pg_stat_statements|pg_catalog' and rows > 0
      order by rows desc
      limit 8
    `;
    const [total] = await sql<Array<{ rows: number }>>`
      select coalesce(sum(rows), 0)::float8 as rows from pg_stat_statements where query !~* 'pg_stat_statements'
    `;
    return {
      available: true,
      since: info?.since ?? null,
      totalRows: total.rows,
      estBytes: total.rows * BYTES_PER_ROW_ESTIMATE,
      top: rows.map(r => ({
        query: queryLabel(r.query),
        calls: r.calls,
        rows: r.rows,
        rowsPerCall: r.calls ? Math.round((r.rows / r.calls) * 10) / 10 : 0,
        estBytes: r.rows * BYTES_PER_ROW_ESTIMATE
      }))
    };
  } catch (err) {
    // pg_stat_statements may be missing or not readable by this role.
    console.error("[usageInsights] pg_stat_statements", err);
    return { available: false, since: null, totalRows: 0, estBytes: 0, top: [] };
  }
}

async function loadRollup(): Promise<RollupStatus> {
  const [row] = await db()<
    Array<{ rolledUntil: string | null; daysRolled: number; rawSince: string | null; rollupBytes: string }>
  >`
    select (select to_char(rolled_until, 'YYYY-MM-DD') from analytics.rollup_state where id) as rolled_until,
           (select count(distinct day)::int from analytics.daily_stats where metric = 'event') as days_rolled,
           (select min(created_at) from analytics.events where created_at >= (select rolled_until from analytics.rollup_state where id)) as raw_since,
           (pg_total_relation_size('analytics.daily_stats') + pg_total_relation_size('analytics.daily_sketches'))::text as rollup_bytes
  `;
  return {
    rolledUntil: row.rolledUntil && row.rolledUntil > "1970-01-01" ? row.rolledUntil : null,
    rawSince: row.rawSince ?? null,
    daysRolled: row.daysRolled ?? 0,
    rollupBytes: Number(row.rollupBytes) || 0
  };
}

/** User agents with the most sessions that never got past one page, recent days only. */
async function loadUserAgents(): Promise<UserAgentTraffic[]> {
  return db()<UserAgentTraffic[]>`
    select u.id, u.ua, u.is_bot,
           count(*)::int as sessions,
           count(*) filter (where s.event_count = 1)::int as one_page,
           count(*) filter (where s.event_count = 1 and s.landing_path = '/')::int as home_only,
           count(distinct s.visitor_hash)::int as visitors
    from analytics.sessions s
    join analytics.user_agents u on u.id = s.user_agent_id
    where s.started_at >= now() - make_interval(days => ${TRAFFIC_DAYS})
    group by u.id
    order by count(*) filter (where s.event_count = 1) desc
    limit 12
  `;
}

/** Logs and falls back, so one failing part (e.g. user_agents before its migration) leaves the others working. */
function orFallback<T>(label: string, fallback: T) {
  return (err: unknown): T => {
    console.error(`[usageInsights] ${label}`, err);
    return fallback;
  };
}

async function loadUsageInsights(): Promise<UsageInsights> {
  const [traffic, rollup, userAgents] = await Promise.all([
    loadTraffic(),
    loadRollup().catch(orFallback<RollupStatus | null>("rollup", null)),
    loadUserAgents().catch(orFallback<UserAgentTraffic[] | null>("user agents", null))
  ]);
  return { traffic, rollup, userAgents, trafficDays: TRAFFIC_DAYS, supabaseProjectUrl: supabaseProjectUrl() };
}

export const getCachedUsageInsights = unstable_cache(loadUsageInsights, ["admin-usage-insights"], {
  revalidate: CACHE_SECONDS,
  tags: [TAG_USAGE_INSIGHTS]
});

/** Flags or clears a user agent as a bot; tracking skips flagged ones. Returns false when the id is unknown. */
export async function setUserAgentBot(id: number, isBot: boolean): Promise<boolean> {
  const rows = await db()`
    update analytics.user_agents set is_bot = ${isBot}, marked_at = ${isBot ? new Date().toISOString() : null}
    where id = ${id}
    returning id
  `;
  return rows.length > 0;
}

/** Clears pg_stat_statements so the traffic card and egress projection start over (e.g. after fixing a heavy query). */
export async function resetQueryStats(): Promise<void> {
  await db()`select pg_stat_statements_reset()`;
}
