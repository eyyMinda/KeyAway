import { client } from "@/src/sanity/lib/client";
import { isContributionEvent, type SessionEntry } from "@/src/lib/analytics/sessionConstants";
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

type RawSession = Omit<AdminSessionSummary, "id" | "eventCount" | "reportCount"> & {
  _id?: string;
  _key?: string;
  eventCount?: number;
  reportCount?: number;
  contributionCount?: number;
  events?: AdminSessionEvent[];
  userAgent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

function toSummary(raw: RawSession, id: string): AdminSessionSummary {
  return {
    id,
    visitorHash: raw.visitorHash,
    startedAt: raw.startedAt,
    lastEventAt: raw.lastEventAt,
    entry: raw.entry,
    referrer: raw.referrer,
    landingPath: raw.landingPath,
    country: raw.country,
    city: raw.city,
    eventCount: raw.eventCount ?? raw.events?.length ?? 0,
    reportCount: raw.reportCount ?? raw.events?.filter(e => e.event?.startsWith("report_")).length ?? 0,
    contributionCount:
      raw.contributionCount ??
      raw.events?.filter(e => (e.event ? isContributionEvent(e.event) : false)).length ??
      raw.reportCount ??
      0
  };
}

export async function listSessionsForRange(since: string, until: string): Promise<AdminSessionSummary[]> {
  const [live, bundles] = await Promise.all([
    client.fetch<RawSession[]>(
      `*[_type == "trackingSession" && lastEventAt >= $since && startedAt <= $until]{
        "id": _id,
        visitorHash, startedAt, lastEventAt, entry, referrer, landingPath, country, city, eventCount, reportCount, contributionCount
      }`,
      { since, until }
    ),
    client.fetch<Array<{ _id: string; sessions?: RawSession[] }>>(
      `*[_type == "trackingSessionBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{
        _id,
        "sessions": sessions[]{
          _key, visitorHash, startedAt, lastEventAt, entry, referrer, landingPath, country, city, eventCount, reportCount, contributionCount
        }
      }`,
      { since, until }
    )
  ]);

  const rows: AdminSessionSummary[] = [];
  for (const doc of live ?? []) {
    const id = (doc as { id?: string }).id;
    if (!id || !doc.startedAt) continue;
    rows.push(toSummary(doc, id));
  }
  for (const bundle of bundles ?? []) {
    for (const session of bundle.sessions ?? []) {
      if (!session.startedAt || !session.lastEventAt) continue;
      if (session.lastEventAt < since || session.startedAt > until) continue;
      const key = session._key ?? session.startedAt;
      rows.push(toSummary(session, `${bundle._id}::${key}`));
    }
  }

  return rows.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function readSessionDetail(id: string): Promise<AdminSessionDetail | null> {
  const splitAt = id.indexOf("::");
  if (splitAt === -1) {
    const doc = await client.fetch<RawSession | null>(
      `*[_type == "trackingSession" && _id == $id][0]{
        visitorHash, startedAt, lastEventAt, entry, referrer, landingPath, country, city,
        eventCount, reportCount, contributionCount, userAgent, utm_source, utm_medium, utm_campaign, events
      }`,
      { id }
    );
    if (!doc?.startedAt) return null;
    return { ...toSummary(doc, id), userAgent: doc.userAgent, utm_source: doc.utm_source, utm_medium: doc.utm_medium, utm_campaign: doc.utm_campaign, events: doc.events ?? [] };
  }

  const bundleId = id.slice(0, splitAt);
  const key = id.slice(splitAt + 2);
  const session = await client.fetch<RawSession | null>(
    `*[_type == "trackingSessionBundle" && _id == $bundleId][0].sessions[_key == $key][0]`,
    { bundleId, key }
  );
  if (!session?.startedAt) return null;
  return {
    ...toSummary(session, id),
    userAgent: session.userAgent,
    utm_source: session.utm_source,
    utm_medium: session.utm_medium,
    utm_campaign: session.utm_campaign,
    events: session.events ?? []
  };
}

type SessionWithEvents = AdminSessionSummary & { events?: AdminSessionEvent[] };

export async function listSessionsWithEvents(since: string, until: string): Promise<SessionWithEvents[]> {
  const [live, bundles] = await Promise.all([
    client.fetch<Array<RawSession & { id: string }>>(
      `*[_type == "trackingSession" && lastEventAt >= $since && startedAt <= $until]{
        "id": _id,
        visitorHash, startedAt, lastEventAt, entry, referrer, landingPath, country, city, eventCount, reportCount, contributionCount, events
      }`,
      { since, until }
    ),
    client.fetch<Array<{ _id: string; sessions?: RawSession[] }>>(
      `*[_type == "trackingSessionBundle" && timeRangeEnd >= $since && timeRangeStart <= $until]{
        _id,
        sessions
      }`,
      { since, until }
    )
  ]);

  const rows: SessionWithEvents[] = [];
  for (const doc of live ?? []) {
    if (!doc.id || !doc.startedAt) continue;
    rows.push({ ...toSummary(doc, doc.id), events: doc.events });
  }
  for (const bundle of bundles ?? []) {
    for (const session of bundle.sessions ?? []) {
      if (!session.startedAt || !session.lastEventAt) continue;
      if (session.lastEventAt < since || session.startedAt > until) continue;
      const id = `${bundle._id}::${session._key ?? session.startedAt}`;
      rows.push({ ...toSummary(session, id), events: session.events });
    }
  }
  return rows;
}

export function flattenSessionEvents(
  sessions: SessionWithEvents[],
  since: string,
  until: string
): Array<AnalyticsEventData & { sourceId?: string }> {
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  const out: Array<AnalyticsEventData & { sourceId?: string }> = [];
  for (const session of sessions) {
    for (const [index, event] of (session.events ?? []).entries()) {
      const ts = new Date(event.createdAt).getTime();
      if (!Number.isFinite(ts) || ts < sinceMs || ts > untilMs) continue;
      out.push({
        _id: `${session.id}:${index}`,
        event: event.event as AnalyticsEventData["event"],
        createdAt: event.createdAt,
        path: event.path,
        programSlug: event.programSlug,
        notFound: event.notFound,
        key: event.key,
        social: event.social,
        activationUrl: event.activationUrl,
        programFlow: event.programFlow,
        country: session.country,
        city: session.city,
        ipHash: session.visitorHash,
        sourceId: event.sourceId
      });
    }
  }
  return out;
}

export function buildSessionSourceTable(
  sessions: Array<{ entry?: string; referrer?: string; startedAt: string }>
): Array<{ key: string; value: number; label: string }> {
  const counts = new Map<string, number>();
  const add = (entry: string | undefined, referrer?: string) => {
    const label = sessionSourceLabel(entry, referrer);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  };

  for (const session of sessions) add(session.entry, session.referrer);

  return [...counts.entries()].map(([label, value]) => ({ key: label, value, label }));
}

export function isReportSessionEvent(event: string): boolean {
  return event.startsWith("report_");
}

export function sessionEntrySortKey(entry: SessionEntry | string | undefined): string {
  return sessionSourceLabel(entry);
}
