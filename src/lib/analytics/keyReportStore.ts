/** @fileoverview `analytics.key_reports`: visitor reports on activation rows (working / expired / limit reached). */
import { unstable_cache } from "next/cache";
import { db } from "@/src/lib/db/postgres";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { TAG_HOMEPAGE_STATS, programDetailTag } from "@/src/lib/cache/cacheTags";
import type { KeyReportEvent } from "@/src/types";

export type VersionFitFields = { listedVersion?: string; triedVersionFit?: string; triedVersion?: string };

export type NewKeyReport = VersionFitFields & {
  eventType: KeyReportEvent;
  programSlug?: string;
  key?: string;
  label?: string;
  path?: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  city?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ipHash?: string;
};

export type OwnReport = {
  _id: string;
  eventType: KeyReportEvent;
  programSlug: string;
  key: string;
  label?: string;
  createdAt: string;
};

/** Renewing to "working" clears the version-fit fields; other events keep fields that were not sent. */
function versionFitUpdate(eventType: string, fields: VersionFitFields) {
  if (eventType === "report_key_working") {
    return { listed_version: null, tried_version_fit: null, tried_version: null };
  }
  return {
    ...(fields.listedVersion !== undefined ? { listed_version: fields.listedVersion } : {}),
    ...(fields.triedVersionFit !== undefined ? { tried_version_fit: fields.triedVersionFit } : {}),
    ...(fields.triedVersion !== undefined ? { tried_version: fields.triedVersion } : {})
  };
}

export async function createKeyReport(report: NewKeyReport): Promise<{ id: string }> {
  const [row] = await db()<Array<{ id: string }>>`
    insert into analytics.key_reports (
      event_type, program_slug, key, label, path, referrer, user_agent, country, city,
      utm_source, utm_medium, utm_campaign, ip_hash, listed_version, tried_version_fit, tried_version
    ) values (
      ${report.eventType}, ${report.programSlug ?? null}, ${report.key ?? null}, ${report.label ?? null},
      ${report.path ?? null}, ${report.referrer ?? null}, ${report.userAgent ?? null}, ${report.country ?? null},
      ${report.city ?? null}, ${report.utm_source ?? null}, ${report.utm_medium ?? null}, ${report.utm_campaign ?? null},
      ${report.ipHash ?? null}, ${report.listedVersion ?? null}, ${report.triedVersionFit ?? null},
      ${report.triedVersion ?? null}
    )
    returning id
  `;
  return row;
}

/** Newest report by this visitor on this program row, if any. */
export async function findOwnReport(ipHash: string, programSlug: string, key: string): Promise<OwnReport | null> {
  const [row] = await db()<Array<{ id: string; eventType: KeyReportEvent; programSlug: string; key: string; label: string | null; createdAt: string }>>`
    select id, event_type, program_slug, key, label, created_at
    from analytics.key_reports
    where ip_hash = ${ipHash} and program_slug = ${programSlug} and key = ${key}
    order by created_at desc
    limit 1
  `;
  if (!row) return null;
  return {
    _id: row.id,
    eventType: row.eventType,
    programSlug: row.programSlug,
    key: row.key,
    ...(row.label ? { label: row.label } : {}),
    createdAt: row.createdAt
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Visitor renews their own report. Returns null when the id is not theirs. */
export async function renewOwnReport(
  id: string,
  ipHash: string,
  eventType: KeyReportEvent,
  fields: VersionFitFields
): Promise<{ _id: string; eventType: KeyReportEvent } | null> {
  if (!UUID_RE.test(id)) return null;
  const sql = db();
  const set = { event_type: eventType, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...versionFitUpdate(eventType, fields) };
  const [row] = await sql<Array<{ id: string; eventType: KeyReportEvent }>>`
    update analytics.key_reports set ${sql(set)}
    where id = ${id} and ip_hash = ${ipHash}
    returning id, event_type
  `;
  return row ? { _id: row.id, eventType: row.eventType } : null;
}

export async function getKeyReportFit(id: string): Promise<{ eventType: KeyReportEvent; triedVersionFit?: string } | null> {
  if (!UUID_RE.test(id)) return null;
  const [row] = await db()<Array<{ eventType: KeyReportEvent; triedVersionFit: string | null }>>`
    select event_type, tried_version_fit from analytics.key_reports where id = ${id}
  `;
  return row ? { eventType: row.eventType, triedVersionFit: row.triedVersionFit ?? undefined } : null;
}

export type AdminKeyReportUpdate = {
  _id: string;
  eventType: KeyReportEvent;
  listedVersion?: string;
  triedVersionFit?: string;
  triedVersion?: string;
};

type AdminKeyReportUpdateRow = {
  id: string;
  eventType: KeyReportEvent;
  listedVersion: string | null;
  triedVersionFit: string | null;
  triedVersion: string | null;
};

const toAdminUpdate = (row: AdminKeyReportUpdateRow): AdminKeyReportUpdate => ({
  _id: row.id,
  eventType: row.eventType,
  listedVersion: row.listedVersion ?? undefined,
  triedVersionFit: row.triedVersionFit ?? undefined,
  triedVersion: row.triedVersion ?? undefined
});

/** Admin correction of event type and/or tried version. Keeps `created_at`: a correction is not a new report. */
export async function adminUpdateKeyReport(
  id: string,
  update: { eventType?: KeyReportEvent; triedVersion?: string }
): Promise<AdminKeyReportUpdate | null> {
  const sql = db();
  const set = {
    updated_at: new Date().toISOString(),
    ...(update.eventType ? { event_type: update.eventType, ...versionFitUpdate(update.eventType, {}) } : {}),
    ...(update.triedVersion ? { tried_version: update.triedVersion } : {})
  };
  const [row] = await sql<AdminKeyReportUpdateRow[]>`
    update analytics.key_reports set ${sql(set)} where id = ${id}
    returning id, event_type, listed_version, tried_version_fit, tried_version
  `;
  return row ? toAdminUpdate(row) : null;
}

/** Bulk correction of event type. Returns only the rows that changed so the admin list can patch them in place. */
export async function adminUpdateKeyReports(ids: string[], eventType: KeyReportEvent): Promise<AdminKeyReportUpdate[]> {
  const valid = ids.filter(id => UUID_RE.test(id));
  if (!valid.length) return [];
  const sql = db();
  const set = { updated_at: new Date().toISOString(), event_type: eventType, ...versionFitUpdate(eventType, {}) };
  const rows = await sql<AdminKeyReportUpdateRow[]>`
    update analytics.key_reports set ${sql(set)}
    where id in ${sql(valid)} and event_type <> ${eventType}
    returning id, event_type, listed_version, tried_version_fit, tried_version
  `;
  return rows.map(toAdminUpdate);
}

/** Admin key reports table (all reports, newest first), with only the columns the page shows. */
export async function listKeyReportsForAdmin(): Promise<Array<Record<string, unknown>>> {
  const rows = await db()<Array<Record<string, unknown>>>`
    select id, event_type, program_slug, referrer, country, city, ip_hash, created_at, key, label,
           listed_version, tried_version_fit, tried_version
    from analytics.key_reports
    order by created_at desc
  `;
  return rows.map(({ id, ...rest }) =>
    Object.fromEntries(Object.entries({ _id: id, ...rest }).filter(([, v]) => v !== null))
  );
}

/** Reports since a date, for the admin "keys needing attention" alerts. */
export async function listKeyReportsSince(since: string) {
  return db()<
    Array<{ eventType: string; programSlug: string; key: string | null; label: string | null; triedVersionFit: string | null; createdAt: string }>
  >`
    select event_type, program_slug, key, label, tried_version_fit, created_at
    from analytics.key_reports
    where created_at >= ${since}
  `;
}

export type ProgramKeyReportRow = { eventType: string; key: string; triedVersionFit?: string; triedVersion?: string };

/** Program page progress bars: slug-scoped rows, no PII. */
export async function listProgramKeyReportRows(programSlug: string): Promise<ProgramKeyReportRow[]> {
  const rows = await db()<Array<{ eventType: string; key: string; triedVersionFit: string | null; triedVersion: string | null }>>`
    select event_type, key, tried_version_fit, tried_version
    from analytics.key_reports
    where program_slug = ${programSlug} and key is not null
  `;
  return rows.map(r => ({
    eventType: r.eventType,
    key: r.key,
    ...(r.triedVersionFit ? { triedVersionFit: r.triedVersionFit } : {}),
    ...(r.triedVersion ? { triedVersion: r.triedVersion } : {})
  }));
}

/** Public pages render without analytics rather than fail; the fallback is not cached. */
function withFallback<T>(label: string, fallback: T) {
  return (err: unknown): T => {
    console.error(`[${label}]`, err);
    return fallback;
  };
}

/** Community rating input. "Other version" reports do not count against a key. */
export function getProgramKeyReportCounts(slug: string) {
  return unstable_cache(
    async () => {
      const [row] = await db()<Array<{ working: number; expired: number; limitReached: number }>>`
        select
          count(*) filter (where event_type = 'report_key_working')::int as working,
          count(*) filter (where event_type = 'report_key_expired' and tried_version_fit is distinct from 'other')::int as expired,
          count(*) filter (where event_type = 'report_key_limit_reached' and tried_version_fit is distinct from 'other')::int as limit_reached
        from analytics.key_reports
        where program_slug = ${slug}
      `;
      return row;
    },
    ["program-key-report-counts", slug],
    { tags: [programDetailTag(slug)], revalidate: PUBLIC_ISR_REVALIDATE_SECONDS }
  )().catch(withFallback("getProgramKeyReportCounts", { working: 0, expired: 0, limitReached: 0 }));
}

const cachedSiteReportStats = unstable_cache(
  async () => {
    const [row] = await db()<Array<{ totalReports: number; recentReports: number }>>`
      select count(*)::int as total_reports,
             count(*) filter (where created_at >= now() - interval '7 days')::int as recent_reports
      from analytics.key_reports
    `;
    return row;
  },
  ["site-report-stats"],
  { tags: [TAG_HOMEPAGE_STATS], revalidate: PUBLIC_ISR_REVALIDATE_SECONDS }
);

/** Homepage stats: all-time and last-7-days report totals. */
export function getSiteReportStats() {
  return cachedSiteReportStats().catch(withFallback("getSiteReportStats", { totalReports: 0, recentReports: 0 }));
}
