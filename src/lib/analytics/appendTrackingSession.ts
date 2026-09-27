import { randomUUID } from "node:crypto";
import { client } from "@/src/sanity/lib/client";
import {
  isContributionEvent,
  isSessionEntry,
  SESSION_IDLE_MS,
  SESSION_ID_RE,
  SESSION_MAX_EVENTS,
  SESSION_MAX_MS,
  trackingSessionDocumentId,
  type SessionEntry
} from "@/src/lib/analytics/sessionConstants";
import { classifySessionReferrer } from "@/src/lib/analytics/sessionEntry";

export type SessionEventInput = {
  event: string;
  createdAt?: string;
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

export type AppendTrackingSessionInput = {
  sessionId?: string;
  visitorHash: string;
  userAgent?: string;
  country?: string;
  city?: string;
  entry?: string;
  referrer?: string;
  landingPath?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  events: SessionEventInput[];
};

type OpenSession = {
  _id: string;
  eventCount?: number;
  startedAt?: string;
  lastEventAt?: string;
};

function clean(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

function toRow(event: SessionEventInput) {
  const createdAt = event.createdAt && !Number.isNaN(new Date(event.createdAt).getTime())
    ? new Date(event.createdAt).toISOString()
    : new Date().toISOString();
  return {
    _key: randomUUID(),
    _type: "trackingSessionEvent",
    event: event.event,
    createdAt,
    ...(clean(event.path) ? { path: clean(event.path) } : {}),
    ...(clean(event.programSlug) ? { programSlug: clean(event.programSlug) } : {}),
    ...(event.notFound ? { notFound: true } : {}),
    ...(clean(event.key) ? { key: clean(event.key) } : {}),
    ...(clean(event.label) ? { label: clean(event.label) } : {}),
    ...(clean(event.social) ? { social: clean(event.social) } : {}),
    ...(clean(event.activationUrl) ? { activationUrl: clean(event.activationUrl) } : {}),
    ...(clean(event.programFlow) ? { programFlow: clean(event.programFlow) } : {}),
    ...(clean(event.listedVersion) ? { listedVersion: clean(event.listedVersion) } : {}),
    ...(clean(event.triedVersionFit) ? { triedVersionFit: clean(event.triedVersionFit) } : {}),
    ...(clean(event.triedVersion) ? { triedVersion: clean(event.triedVersion) } : {}),
    ...(clean(event.sourceId) ? { sourceId: clean(event.sourceId) } : {})
  };
}

function isClosed(doc: OpenSession, now: number): boolean {
  const last = doc.lastEventAt ? new Date(doc.lastEventAt).getTime() : 0;
  const started = doc.startedAt ? new Date(doc.startedAt).getTime() : 0;
  const count = doc.eventCount ?? 0;
  if (!Number.isFinite(last) || now - last > SESSION_IDLE_MS) return true;
  if (!Number.isFinite(started) || now - started > SESSION_MAX_MS) return true;
  return count >= SESSION_MAX_EVENTS;
}

async function findOpenSessionId(visitorHash: string, now: number): Promise<string | null> {
  const doc = await client.fetch<OpenSession | null>(
    `*[_type == "trackingSession" && visitorHash == $h && lastEventAt >= $cutoff && eventCount < $max] | order(lastEventAt desc)[0]{
      _id, eventCount, startedAt, lastEventAt
    }`,
    {
      h: visitorHash,
      cutoff: new Date(now - SESSION_IDLE_MS).toISOString(),
      max: SESSION_MAX_EVENTS
    }
  );
  if (!doc?._id || isClosed(doc, now)) return null;
  return doc._id;
}

/** Append events onto one visit document. Referrer/entry are written only when the document is created. */
export async function appendTrackingSession(
  input: AppendTrackingSessionInput
): Promise<{ sessionId: string; rotated: boolean }> {
  const events = input.events.filter(e => e.event?.trim()).slice(0, 30);
  if (!events.length || !input.visitorHash) {
    return { sessionId: input.sessionId ?? "", rotated: false };
  }

  const now = Date.now();
  const requestedId =
    input.sessionId && SESSION_ID_RE.test(input.sessionId) ? trackingSessionDocumentId(input.sessionId) : null;

  let docId = requestedId;
  let rotated = false;

  if (docId) {
    const existing = await client.fetch<OpenSession | null>(
      `*[_id == $id][0]{ _id, eventCount, startedAt, lastEventAt }`,
      { id: docId }
    );
    if (existing && isClosed(existing, now)) {
      docId = null;
      rotated = true;
    }
  }

  if (!docId) {
    docId = (await findOpenSessionId(input.visitorHash, now)) ?? trackingSessionDocumentId(randomUUID());
    if (requestedId) rotated = true;
  }

  const rows = events.map(toRow);
  const reportCount = rows.filter(r => r.event.startsWith("report_")).length;
  const contributionCount = rows.filter(r => isContributionEvent(r.event)).length;
  const lastEventAt = rows[rows.length - 1]?.createdAt ?? new Date(now).toISOString();
  const landingPath = clean(input.landingPath) ?? clean(events.find(e => e.path)?.path);
  const entry: SessionEntry = isSessionEntry(input.entry) ? input.entry : classifySessionReferrer(input.referrer).entry;
  const externalReferrer =
    entry === "external" ? classifySessionReferrer(input.referrer).referrer ?? clean(input.referrer) : undefined;

  const sessionId = docId.slice("trackingSession.".length);

  await client
    .transaction()
    .createIfNotExists({
      _id: docId,
      _type: "trackingSession",
      visitorHash: input.visitorHash,
      startedAt: rows[0]?.createdAt ?? lastEventAt,
      lastEventAt,
      entry,
      ...(externalReferrer ? { referrer: externalReferrer } : {}),
      ...(landingPath ? { landingPath } : {}),
      ...(clean(input.userAgent) ? { userAgent: clean(input.userAgent) } : {}),
      ...(clean(input.country) ? { country: clean(input.country) } : {}),
      ...(clean(input.city) ? { city: clean(input.city) } : {}),
      ...(clean(input.utm_source) ? { utm_source: clean(input.utm_source) } : {}),
      ...(clean(input.utm_medium) ? { utm_medium: clean(input.utm_medium) } : {}),
      ...(clean(input.utm_campaign) ? { utm_campaign: clean(input.utm_campaign) } : {}),
      eventCount: 0,
      reportCount: 0,
      contributionCount: 0,
      events: []
    })
    .patch(docId, p =>
      p
        .setIfMissing({ events: [] })
        .append("events", rows)
        .inc({ eventCount: rows.length, reportCount, contributionCount })
        .set({
          lastEventAt,
          ...(clean(input.country) ? {} : {}),
          ...(clean(input.city) ? {} : {})
        })
        .setIfMissing({
          ...(clean(input.country) ? { country: clean(input.country) } : {}),
          ...(clean(input.city) ? { city: clean(input.city) } : {}),
          ...(landingPath ? { landingPath } : {})
        })
    )
    .commit();

  return { sessionId, rotated };
}
