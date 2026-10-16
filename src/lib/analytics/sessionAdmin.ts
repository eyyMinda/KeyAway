/** @fileoverview Admin reads over `analytics.sessions` / `analytics.events`: session list, detail, dashboard summary. */
import { db } from "@/src/lib/db/postgres";
import type { AnalyticsSummaryCachePayload } from "@/src/lib/api/adminEventsListCache";
import {
  transformCountryData,
  transformEventData,
  transformPathActivityTable,
  transformProgramData,
  transformSocialData
} from "@/src/lib/analytics/analyticsUtils";
import { SESSION_ID_RE } from "@/src/lib/analytics/sessionConstants";
import { sessionSourceLabel } from "@/src/lib/analytics/sessionEntry";
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
}): Promise<{ rows: Array<AdminSessionSummary & VisitorMeta>; total: number; countsByEntry: Record<string, number> }> {
  const sql = db();
  const inRange = sql`s.last_event_at >= ${opts.since} and s.started_at <= ${opts.until}`;
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
/** Contributions have their own admin pages; the event charts show visit/click signals only. */
const CHART_EXCLUDED = ["comment", "comment_reply", "key_suggestion", "contact"];

/** Dashboard aggregates for a range in three queries. Key report events are excluded (own overview). */
export async function buildAnalyticsSummary(since: string, until: string): Promise<AnalyticsSummaryCachePayload> {
  const sql = db();
  const [[agg], recent, sources] = await Promise.all([
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
        where e.created_at >= ${since} and e.created_at <= ${until} and e.event not like 'report\\_%'
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
          select social, count(*) as n from ev where event = 'social_click' and social is not null group by social) t) as by_social,
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
      where started_at >= ${since} and started_at <= ${until}
      group by entry, referrer
    `
  ]);

  const toMap = (m: CountMap | null) => new Map(Object.entries(m ?? {}));
  const totals = toMap(agg.totals);
  const chartTotals = new Map(totals);
  for (const e of CHART_EXCLUDED) chartTotals.delete(e);
  const byCountry = toMap(agg.byCountry);

  return {
    totalEvents: agg.totalEvents,
    uniqueVisitors: agg.uniqueVisitors,
    uniqueCountries: byCountry.size,
    totals: Object.fromEntries(totals),
    eventChart: transformEventData(chartTotals),
    programTable: transformProgramData(toMap(agg.byProgram)),
    socialTable: transformSocialData(toMap(agg.bySocial)),
    pathTable: transformPathActivityTable(toMap(agg.byPath), agg.notFound),
    countryTable: transformCountryData(byCountry),
    referrerTable: buildSessionSourceTable(
      sources.map(s => ({ entry: s.entry ?? undefined, referrer: s.referrer ?? undefined, count: s.count }))
    ),
    recentEvents: recent.map(r => compact(r)) as unknown as AnalyticsEventData[]
  };
}
