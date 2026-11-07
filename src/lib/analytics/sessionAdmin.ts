/** @fileoverview Admin reads over `analytics.sessions` / `analytics.events`: session list, detail, dashboard summary. */
import { db } from "@/src/lib/db/postgres";
import type {
  AnalyticsSummaryCachePayload,
  AnalyticsTimeline,
  AnalyticsTimelineBucket,
  PromotionCampaignSummary,
  PromotionClickSummary,
  TimelineDimension
} from "@/src/lib/api/adminEventsListCache";
import type { PromotionThemeId } from "@/src/lib/promotions/promotionThemes";
import { client } from "@/src/sanity/lib/client";
import {
  transformCountryData,
  transformPathActivityTable,
  transformProgramData,
  transformSocialData
} from "@/src/lib/analytics/analyticsUtils";
import { decodeSourceKey, getRolledUntil, rollupWindow, sumDailyStats } from "@/src/lib/analytics/rollupStore";
import { SESSION_ID_RE } from "@/src/lib/analytics/sessionConstants";
import { sessionSourceLabel } from "@/src/lib/analytics/sessionEntry";
import { DAY_MS, HOUR_MS } from "@/src/lib/time";
import type { AnalyticsEventData } from "@/src/types";

export type AdminSessionSummary = {
  id: string;
  visitorHash?: string;
  startedAt: string;
  lastEventAt: string;
  entry?: string;
  referrer?: string;
  landingPath?: string;
  country?: string;
  city?: string;
  eventCount: number;
  reportCount: number;
  contributionCount: number;
};

export type AdminSessionEvent = {
  event: string;
  createdAt: string;
  path?: string;
  programSlug?: string;
  notFound?: boolean;
  key?: string;
  label?: string;
  social?: string;
  activationUrl?: string;
  programFlow?: string;
  listedVersion?: string;
  triedVersionFit?: string;
  triedVersion?: string;
  sourceId?: string;
};

export type AdminSessionDetail = AdminSessionSummary & {
  userAgent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  events: AdminSessionEvent[];
};

type VisitorMeta = { visitTier?: string; visitorIsSpammer?: boolean };

type WithoutNull<T> = { [K in keyof T]: Exclude<T[K], null> };

/** Drop SQL nulls so payloads match the old optional-field shape. */
function compact<T extends Record<string, unknown>>(row: T): WithoutNull<T> {
  return Object.fromEntries(Object.entries(row).filter(([, v]) => v !== null)) as WithoutNull<T>;
}

/** Contribution sessions: any report, comment, suggestion or contact event. */
const CONTRIBUTIONS = "contributions";

export async function listSessionsPage(opts: {
  since: string;
  until: string;
  entry: string;
  page: number;
  limit: number;
  /** Visitor id / session id prefix, or part of the location, landing path or referrer. */
  q?: string;
}): Promise<{ rows: Array<AdminSessionSummary & VisitorMeta>; total: number; countsByEntry: Record<string, number> }> {
  const sql = db();
  const q = opts.q?.trim().toLowerCase().slice(0, 100) ?? "";
  // Escape LIKE wildcards so "_" or "%" in the query match literally.
  const like = q.replace(/[\\%_]/g, m => `\\${m}`);
  const search = q
    ? sql`and (
        s.visitor_hash like ${`${like}%`}
        or s.id::text like ${`${like}%`}
        or lower(coalesce(s.country, '') || ' ' || coalesce(s.city, '')) like ${`%${like}%`}
        or lower(coalesce(s.landing_path, '')) like ${`%${like}%`}
        or lower(coalesce(s.referrer, '')) like ${`%${like}%`}
      )`
    : sql``;
  const inRange = sql`s.last_event_at >= ${opts.since} and s.started_at <= ${opts.until} ${search}`;
  const entryFilter =
    opts.entry === "all"
      ? sql``
      : opts.entry === CONTRIBUTIONS
        ? sql`and (s.contribution_count > 0 or s.report_count > 0)`
        : sql`and coalesce(s.entry, 'direct') = ${opts.entry}`;

  const [counts, rows] = await Promise.all([
    sql<Array<{ entry: string; sessions: number; contributions: number }>>`
      select coalesce(s.entry, 'direct') as entry,
             count(*)::int as sessions,
             count(*) filter (where s.contribution_count > 0 or s.report_count > 0)::int as contributions
      from analytics.sessions s
      where ${inRange}
      group by 1
    `,
    sql<Array<AdminSessionSummary & { visitTier: string | null; visitorIsSpammer: boolean | null }>>`
      select s.id, s.visitor_hash, s.started_at, s.last_event_at, s.entry, s.referrer, s.landing_path, s.country, s.city,
             s.event_count, s.report_count, s.contribution_count,
             v.visit_tier, v.is_spammer as visitor_is_spammer
      from analytics.sessions s
      left join analytics.visitors v on v.visitor_hash = s.visitor_hash
      where ${inRange} ${entryFilter}
      order by s.started_at desc
      limit ${opts.limit} offset ${(opts.page - 1) * opts.limit}
    `
  ]);

  const countsByEntry: Record<string, number> = { all: 0, [CONTRIBUTIONS]: 0 };
  for (const c of counts) {
    countsByEntry[c.entry] = c.sessions;
    countsByEntry.all += c.sessions;
    countsByEntry[CONTRIBUTIONS] += c.contributions;
  }
  const total = opts.entry === "all" ? countsByEntry.all : (countsByEntry[opts.entry] ?? 0);

  return { rows: rows.map(r => compact({ ...r })), total, countsByEntry };
}

export async function readSessionDetail(id: string): Promise<(AdminSessionDetail & VisitorMeta) | null> {
  if (!SESSION_ID_RE.test(id)) return null;
  const sql = db();
  const [session] = await sql<Array<Record<string, unknown>>>`
    select s.id, s.visitor_hash, s.started_at, s.last_event_at, s.entry, s.referrer, s.landing_path, s.country, s.city,
           s.event_count, s.report_count, s.contribution_count, s.user_agent,
           s.utm_source, s.utm_medium, s.utm_campaign,
           v.visit_tier, v.is_spammer as visitor_is_spammer
    from analytics.sessions s
    left join analytics.visitors v on v.visitor_hash = s.visitor_hash
    where s.id = ${id}
  `;
  if (!session) return null;
  const { utmSource, utmMedium, utmCampaign, ...rest } = session;
  const events = await sql<AdminSessionEvent[]>`
    select event, created_at, path, program_slug, nullif(not_found, false) as not_found, key, label, social,
           activation_url, program_flow, listed_version, tried_version_fit, tried_version, source_id
    from analytics.events
    where session_id = ${id}
    order by created_at asc
  `;
  return {
    ...(compact({ ...rest, utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign }) as unknown as AdminSessionDetail & VisitorMeta),
    events: events.map(e => compact({ ...e }))
  };
}

/** Sessions started in range, grouped into the dashboard "source" table. */
export function buildSessionSourceTable(
  sessions: Array<{ entry?: string; referrer?: string; count?: number }>
): Array<{ key: string; value: number; label: string }> {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    const label = sessionSourceLabel(session.entry, session.referrer);
    counts.set(label, (counts.get(label) ?? 0) + (session.count ?? 1));
  }
  return [...counts.entries()].map(([label, value]) => ({ key: label, value, label }));
}

type CountMap = Record<string, number>;

const RECENT_LIMIT = 10;
/** Contributions have their own admin pages; the timeline shows visit/click signals only. */
const CHART_EXCLUDED = ["comment", "comment_reply", "key_suggestion", "contact"];

/** Before this, "all time" ranges start at the epoch; the timeline starts at the first real activity instead. */
const EPOCH_RANGE_CUTOFF = Date.parse("2001-01-01");

/** Stored on `social` for promotion buttons; the rest of the value is the placement. */
const PROMO_SOCIAL_PREFIX = "promo-";
const PROMO_SOCIAL_LIKE = `${PROMO_SOCIAL_PREFIX}%`;

/** Rolled-up timeline metrics (see `rollup_day` in the analytics rollups migration). */
const TIMELINE_METRICS = ["tl_visitors", "tl_views", "tl_actions", "tl_tier", "tl_page", "tl_action", "tl_promo"];

/** A few clients send bogus old dates; skip the earliest 0.1% of activity so the axis starts where it really does. */
async function firstActivityMs(rolledUntil: string | null, fallbackMs: number): Promise<number> {
  const sql = db();
  if (!rolledUntil) {
    const [row] = await sql<Array<{ first: string | null }>>`
      select percentile_disc(0.001) within group (order by created_at) as first from analytics.events
    `;
    return row?.first ? Date.parse(row.first) : fallbackMs;
  }
  const [row] = await sql<Array<{ first: string | null }>>`
    with days as (
      select day, sum(n) as n from analytics.daily_stats where metric = 'event' group by day
      union all
      select (created_at at time zone 'UTC')::date, count(*)
      from analytics.events
      where created_at >= ${`${rolledUntil}T00:00:00Z`} and event not like 'report\\_%'
      group by 1
    ), running as (
      select day, sum(n) over (order by day) as cum, sum(n) over () as total from days
    )
    select to_char(min(day), 'YYYY-MM-DD') as first from running where cum >= total * 0.001
  `;
  return row?.first ? Date.parse(`${row.first}T00:00:00Z`) : fallbackMs;
}

/** Monday 00:00 UTC after the week that holds `day`, matching Postgres `date_trunc('week', …)`. */
function weekEndAfter(day: string): string {
  const ms = Date.parse(`${day}T00:00:00Z`);
  const monday = ms - ((new Date(ms).getUTCDay() + 6) % 7) * DAY_MS;
  return new Date(monday + 7 * DAY_MS).toISOString();
}

/**
 * Visitors, page views and actions per hour (≤ 2 days), day (≤ 120 days) or week, zero-filled, with how each one
 * splits. Days older than the raw window come from the daily rollups; their distinct visitors per week and per tier
 * are merged from sketches, so those are estimates (~3%).
 */
async function buildTimeline(since: string, until: string, rolledUntil: string | null): Promise<AnalyticsTimeline> {
  const sql = db();
  const endMs = Math.min(Date.parse(until), Date.now());
  let startMs = Date.parse(since);
  if (startMs < EPOCH_RANGE_CUTOFF) startMs = await firstActivityMs(rolledUntil, endMs);
  if (!(endMs > startMs)) return { bucket: "day", points: [], tierTotals: {} };

  const end = new Date(endMs).toISOString();
  const { rolled, rawSince } = rollupWindow(new Date(startMs).toISOString(), end, rolledUntil);
  // A rolled first day the range covers less than half of is left out; start the axis after it, not on an empty bucket.
  if (rolled) startMs = Math.max(startMs, Date.parse(`${rolled.from}T00:00:00Z`));
  const start = new Date(startMs).toISOString();
  const spanHours = (endMs - startMs) / HOUR_MS;
  // Rolled days only have daily numbers, so a range that reaches them is never split by hour.
  const bucket: AnalyticsTimelineBucket =
    spanHours <= 48 && !rolled ? "hour" : spanHours <= 24 * 120 ? "day" : "week";

  const pointsQuery = sql<Array<Omit<AnalyticsTimeline["points"][number], "breakdown">>>`
    with buckets as (
      select generate_series(date_trunc(${bucket}, ${start}::timestamptz), ${end}::timestamptz, ${`1 ${bucket}`}::interval) as t
    ), ev as (
      select date_trunc(${bucket}, e.created_at) as t, e.event, s.visitor_hash
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      where e.created_at >= ${rawSince} and e.created_at <= ${end}
        and e.event not like 'report\\_%' and e.event not in ${sql(CHART_EXCLUDED)}
    )
    select b.t,
           count(distinct ev.visitor_hash)::int as visitors,
           count(ev.event) filter (where ev.event = 'page_viewed')::int as views,
           count(ev.event) filter (where ev.event <> 'page_viewed')::int as actions
    from buckets b
    left join ev on ev.t = b.t
    group by b.t
    order by b.t
  `;

  const breakdownQuery = sql<Array<{ t: string | null; dim: TimelineDimension | "tierTotal"; key: string; n: number }>>`
    with ev as materialized (
      select date_trunc(${bucket}, e.created_at) as t, e.event, e.social, s.visitor_hash,
             coalesce(v.visit_tier, 'new') as tier,
             case
               when e.event <> 'page_viewed' then null
               when e.path = '/' then 'home'
               when e.path = '/programs' then 'catalog'
               when e.path like '/program/%' then 'program'
               when e.path like '/vendors%' then 'vendor'
               else 'other'
             end as page_type
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      left join analytics.visitors v on v.visitor_hash = s.visitor_hash
      where e.created_at >= ${rawSince} and e.created_at <= ${end}
        and e.event not like 'report\\_%' and e.event not in ${sql(CHART_EXCLUDED)}
    )
    select t, 'tier' as dim, tier as key, count(distinct visitor_hash)::int as n from ev group by t, tier
    union all
    select null, 'tierTotal', tier, count(distinct visitor_hash)::int from ev group by tier
    union all
    select t, 'page', page_type, count(*)::int from ev where page_type is not null group by t, page_type
    union all
    select t, 'action', case when social like ${PROMO_SOCIAL_LIKE} then 'promo_click' else event end, count(*)::int
    from ev where event <> 'page_viewed' group by 1, 3
    union all
    select t, 'promo', substr(social, ${PROMO_SOCIAL_PREFIX.length + 1}), count(*)::int
    from ev where social like ${PROMO_SOCIAL_LIKE} group by 1, 3
  `;

  const [points, breakdownRows, rolledRows] = await Promise.all([
    pointsQuery,
    breakdownQuery,
    rolled ? rolledTimelineRows(bucket, rolled, rawSince, end) : null
  ]);

  const byBucket = new Map(
    points.map(p => [
      new Date(p.t).getTime(),
      { ...p, breakdown: { tier: {}, page: {}, action: {}, promo: {} } } as AnalyticsTimeline["points"][number]
    ])
  );
  let tierTotals: Record<string, number> = {};
  for (const row of breakdownRows) {
    if (row.dim === "tierTotal") tierTotals[row.key] = row.n;
    else if (row.t) {
      const point = byBucket.get(new Date(row.t).getTime());
      if (point) point.breakdown[row.dim][row.key] = row.n;
    }
  }

  if (rolledRows) {
    const add = (record: Record<string, number>, key: string, n: number) => (record[key] = (record[key] ?? 0) + n);
    for (const row of rolledRows.counts) {
      const point = byBucket.get(new Date(row.t).getTime());
      if (!point) continue;
      if (row.metric === "tl_views") point.views += row.n;
      else if (row.metric === "tl_actions") point.actions += row.n;
      else if (row.metric === "tl_page") add(point.breakdown.page, row.key, row.n);
      else if (row.metric === "tl_action") add(point.breakdown.action, row.key, row.n);
      else if (row.metric === "tl_promo") add(point.breakdown.promo, row.key, row.n);
      // A rolled day has no raw rows, so its exact daily distinct counts stand as they are.
      else if (bucket === "day" && row.metric === "tl_visitors") point.visitors = row.n;
      else if (bucket === "day" && row.metric === "tl_tier") point.breakdown.tier[row.key] = row.n;
    }
    for (const row of rolledRows.weeks) {
      const point = byBucket.get(new Date(row.t).getTime());
      if (!point) continue;
      if (row.metric === "tl_visitors") point.visitors = row.n;
      else point.breakdown.tier[row.key] = row.n;
    }
    tierTotals = rolledRows.tierTotals;
  }

  return { bucket, points: [...byBucket.values()], tierTotals };
}

type RolledTimelineRow = { t: string; metric: string; key: string; n: number };

/**
 * Timeline numbers for rolled days, per bucket. Distinct visitors per week, and per tier over the whole range, merge
 * the daily sketches with the raw rows they overlap (for weeks, only the week the raw window starts in).
 */
async function rolledTimelineRows(
  bucket: AnalyticsTimelineBucket,
  rolled: { from: string; to: string },
  rawSince: string,
  end: string
): Promise<{ counts: RolledTimelineRow[]; weeks: RolledTimelineRow[]; tierTotals: Record<string, number> }> {
  const sql = db();
  const rawEvents = (until: string) => sql`
    select date_trunc('week', e.created_at) as t, s.visitor_hash, coalesce(v.visit_tier, 'new') as tier
    from analytics.events e
    join analytics.sessions s on s.id = e.session_id
    left join analytics.visitors v on v.visitor_hash = s.visitor_hash
    where e.created_at >= ${rawSince} and e.created_at <= ${until}
      and e.event not like 'report\\_%' and e.event not in ${sql(CHART_EXCLUDED)}
  `;
  const lastRolledDay = new Date(Date.parse(`${rolled.to}T00:00:00Z`) - DAY_MS).toISOString().slice(0, 10);
  const boundaryEnd = [weekEndAfter(lastRolledDay), end].sort()[0];

  const [counts, weeks, tiers] = await Promise.all([
    sql<RolledTimelineRow[]>`
      select date_trunc(${bucket}, day::timestamp) at time zone 'UTC' as t, metric, key, sum(n)::int as n
      from analytics.daily_stats
      where metric in ${sql(TIMELINE_METRICS)} and day >= ${rolled.from} and day < ${rolled.to}
      group by 1, 2, 3
    `,
    bucket === "week"
      ? sql<RolledTimelineRow[]>`
          with raw as (${rawEvents(boundaryEnd)}), sketches as (
            select date_trunc('week', day::timestamp) at time zone 'UTC' as t, metric, key, regs
            from analytics.daily_sketches
            where metric in ('tl_visitors', 'tl_tier') and day >= ${rolled.from} and day < ${rolled.to}
            union all
            select t, 'tl_visitors', '', analytics.hll_sketch(array_agg(distinct visitor_hash)) from raw group by t
            union all
            select t, 'tl_tier', tier, analytics.hll_sketch(array_agg(distinct visitor_hash)) from raw group by t, tier
          )
          select t, metric, key, analytics.hll_count(analytics.hll_union(regs)) as n from sketches group by 1, 2, 3
        `
      : [],
    sql<Array<{ key: string; n: number }>>`
      with raw as (${rawEvents(end)})
      select key, analytics.hll_count(analytics.hll_union(regs)) as n
      from (
        select key, regs from analytics.daily_sketches
        where metric = 'tl_tier' and day >= ${rolled.from} and day < ${rolled.to}
        union all
        select tier, analytics.hll_sketch(array_agg(distinct visitor_hash)) from raw group by tier
      ) t
      group by key
    `
  ]);

  return { counts: [...counts], weeks: [...weeks], tierTotals: Object.fromEntries(tiers.map(r => [r.key, r.n])) };
}

/** Promotion button clicks by placement and page. Views of a promotion are not tracked, so there is no click rate. */
async function buildPromotionClicks(
  since: string,
  until: string,
  rolledUntil: string | null
): Promise<PromotionClickSummary> {
  const sql = db();
  const [[totals], placements, pages] = await Promise.all([
    sql<Array<{ clicks: number; visitors: number }>>`
      select count(*)::int as clicks, count(distinct s.visitor_hash)::int as visitors
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      where e.created_at >= ${since} and e.created_at <= ${until} and e.social like ${PROMO_SOCIAL_LIKE}
    `,
    sql<PromotionClickSummary["placements"]>`
      select substr(e.social, ${PROMO_SOCIAL_PREFIX.length + 1}) as key, count(*)::int as clicks,
             count(distinct s.visitor_hash)::int as visitors
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      where e.created_at >= ${since} and e.created_at <= ${until} and e.social like ${PROMO_SOCIAL_LIKE}
      group by 1
      order by clicks desc
    `,
    sql<PromotionClickSummary["pages"]>`
      select coalesce(e.path, '/') as path, count(*)::int as clicks
      from analytics.events e
      where e.created_at >= ${since} and e.created_at <= ${until} and e.social like ${PROMO_SOCIAL_LIKE}
      group by 1
      order by clicks desc
      limit 5
    `
  ]);
  return {
    clicks: totals.clicks,
    visitors: totals.visitors,
    placements: [...placements],
    pages: [...pages],
    campaign: await buildPromotionCampaign(rolledUntil)
  };
}

/** Whole-run numbers for the running promotion, else the latest ended one. Unaffected by the page's date filter. */
async function buildPromotionCampaign(rolledUntil: string | null): Promise<PromotionCampaignSummary | null> {
  try {
    const nowIso = new Date().toISOString();
    const promotion = await client.fetch<{ _id: string; title: string; theme?: PromotionThemeId; startsAt: string; endsAt: string } | null>(
      `*[_type == "sitePromotion" && enabled == true && startsAt <= $now] | order(endsAt desc)[0]{ _id, title, theme, startsAt, endsAt }`,
      { now: nowIso },
      { cache: "no-store" }
    );
    if (!promotion) return null;

    const { _id: campaignId, ...details } = promotion;
    const until = promotion.endsAt < nowIso ? promotion.endsAt : nowIso;
    const sql = db();
    // Clicks without a label predate campaign tracking; the date range attributes those.
    const [row] = await sql<Array<{ reached: number; converted: number; clicks: number }>>`
      with ev as (
        select e.created_at, s.visitor_hash,
               e.social like ${PROMO_SOCIAL_LIKE} and coalesce(e.label, ${campaignId}) = ${campaignId} as clicked
        from analytics.events e
        join analytics.sessions s on s.id = e.session_id
        where e.created_at >= ${promotion.startsAt} and e.created_at <= ${until}
      )
      select count(distinct visitor_hash)::int as reached,
             count(distinct visitor_hash) filter (where clicked)::int as converted,
             count(*) filter (where clicked)::int as clicks
      from ev
    `;

    // Promotion clicks are never pruned, but most of the audience is: past the raw window, merge the daily sketches.
    const { rolled, rawSince } = rollupWindow(promotion.startsAt, until, rolledUntil);
    if (rolled) {
      const [reach] = await sql<Array<{ n: number }>>`
        select analytics.hll_count(analytics.hll_union(regs)) as n
        from (
          select regs from analytics.daily_sketches
          where metric = 'visitors' and key = '' and day >= ${rolled.from} and day < ${rolled.to}
          union all
          select analytics.hll_sketch(array_agg(distinct s.visitor_hash))
          from analytics.events e
          join analytics.sessions s on s.id = e.session_id
          where e.created_at >= ${rawSince} and e.created_at <= ${until}
        ) t
      `;
      row.reached = Math.max(reach?.n ?? 0, row.converted);
    }
    return { ...details, live: promotion.endsAt > nowIso, ...row };
  } catch (err) {
    console.error("[buildPromotionCampaign]", err);
    return null;
  }
}

/** Summary metrics in the daily rollups (see `rollup_day` in the analytics rollups migration). */
const SUMMARY_METRICS = ["event", "not_found", "program", "path", "social", "country", "source"];

/** Unique visitors over rolled days plus the raw remainder, merged from sketches (an estimate, ~3%). */
async function rolledUniqueVisitors(rolled: { from: string; to: string }, rawSince: string, until: string) {
  const [row] = await db()<Array<{ n: number }>>`
    select analytics.hll_count(analytics.hll_union(regs)) as n
    from (
      select regs from analytics.daily_sketches
      where metric = 'visitors' and key = '' and day >= ${rolled.from} and day < ${rolled.to}
      union all
      select analytics.hll_sketch(array_agg(distinct s.visitor_hash))
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      where e.created_at >= ${rawSince} and e.created_at <= ${until} and e.event not like 'report\\_%'
    ) t
  `;
  return row?.n ?? 0;
}

/**
 * Dashboard aggregates for a range. Key report events are excluded (own overview). Days past the raw window come
 * from the daily rollups; unique visitors across them are an estimate.
 */
export async function buildAnalyticsSummary(since: string, until: string): Promise<AnalyticsSummaryCachePayload> {
  const sql = db();
  const rolledUntil = await getRolledUntil();
  const { rolled, rawSince } = rollupWindow(since, until, rolledUntil);
  const [[agg], recent, sources, timeline, promotions, rolledStats, rolledVisitors] = await Promise.all([
    sql<
      Array<{
        totalEvents: number;
        uniqueVisitors: number;
        notFound: number;
        totals: CountMap | null;
        byProgram: CountMap | null;
        bySocial: CountMap | null;
        byPath: CountMap | null;
        byCountry: CountMap | null;
      }>
    >`
      with ev as materialized (
        select e.event, e.program_slug, e.social, e.path, e.not_found, s.country, s.visitor_hash
        from analytics.events e
        join analytics.sessions s on s.id = e.session_id
        where e.created_at >= ${rawSince} and e.created_at <= ${until} and e.event not like 'report\\_%'
      )
      select
        (select count(*)::int from ev) as total_events,
        (select count(distinct visitor_hash)::int from ev) as unique_visitors,
        (select count(*)::int from ev where event = 'page_viewed' and not_found) as not_found,
        (select jsonb_object_agg(event, n) from (select event, count(*) as n from ev group by event) t) as totals,
        (select jsonb_object_agg(program_slug, n) from (
          select program_slug, count(*) as n from ev
          where program_slug is not null and not (event = 'page_viewed' and not_found)
          group by program_slug) t) as by_program,
        (select jsonb_object_agg(social, n) from (
          select social, count(*) as n from ev
          where event = 'social_click' and social is not null and social not like ${PROMO_SOCIAL_LIKE}
          group by social) t) as by_social,
        (select jsonb_object_agg(path, n) from (
          select path, count(*) as n from ev
          where path is not null and not (event = 'page_viewed' and not_found)
          group by path) t) as by_path,
        (select jsonb_object_agg(country, n) from (
          select country, count(*) as n from ev where country is not null group by country) t) as by_country
    `,
    sql<Array<Record<string, unknown>>>`
      select e.id as "_id", e.event, e.created_at, e.path, e.program_slug, nullif(e.not_found, false) as not_found,
             e.key, e.social, e.activation_url, e.program_flow, e.source_id,
             s.country, s.city, s.visitor_hash as ip_hash,
             v.visit_tier, v.is_spammer as visitor_is_spammer
      from analytics.events e
      join analytics.sessions s on s.id = e.session_id
      left join analytics.visitors v on v.visitor_hash = s.visitor_hash
      where e.created_at >= ${since} and e.created_at <= ${until} and e.event not like 'report\\_%'
      order by e.created_at desc
      limit ${RECENT_LIMIT}
    `,
    sql<Array<{ entry: string | null; referrer: string | null; count: number }>>`
      select entry, referrer, count(*)::int as count
      from analytics.sessions
      where started_at >= ${rawSince} and started_at <= ${until}
      group by entry, referrer
    `,
    buildTimeline(since, until, rolledUntil),
    buildPromotionClicks(since, until, rolledUntil),
    rolled ? sumDailyStats(SUMMARY_METRICS, rolled) : null,
    rolled ? rolledUniqueVisitors(rolled, rawSince, until) : null
  ]);

  const toMap = (m: CountMap | null, metric: string) => {
    const map = new Map(Object.entries(m ?? {}));
    for (const [key, n] of rolledStats?.get(metric) ?? []) map.set(key, (map.get(key) ?? 0) + n);
    return map;
  };
  const totals = toMap(agg.totals, "event");
  const byCountry = toMap(agg.byCountry, "country");
  const notFound = agg.notFound + (rolledStats?.get("not_found")?.get("") ?? 0);
  const allSources = [
    ...sources,
    ...[...(rolledStats?.get("source") ?? [])].map(([key, count]) => ({ ...decodeSourceKey(key), count }))
  ];

  return {
    totalEvents: [...totals.values()].reduce((n, v) => n + v, 0),
    uniqueVisitors: rolledVisitors ?? agg.uniqueVisitors,
    uniqueCountries: byCountry.size,
    sessions: allSources.reduce((n, s) => n + s.count, 0),
    totals: Object.fromEntries(totals),
    timeline,
    promotions,
    programTable: transformProgramData(toMap(agg.byProgram, "program")),
    socialTable: transformSocialData(toMap(agg.bySocial, "social")),
    pathTable: transformPathActivityTable(toMap(agg.byPath, "path"), notFound),
    countryTable: transformCountryData(byCountry),
    referrerTable: buildSessionSourceTable(
      allSources.map(s => ({ entry: s.entry ?? undefined, referrer: s.referrer ?? undefined, count: s.count }))
    ),
    recentEvents: recent.map(r => compact(r)) as unknown as AnalyticsEventData[]
  };
}
