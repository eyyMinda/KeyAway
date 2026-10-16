import { randomUUID } from "node:crypto";
import { db } from "@/src/lib/db/postgres";
import {
  isSessionEntry,
  SESSION_IDLE_MS,
  SESSION_ID_RE,
  SESSION_MAX_EVENTS,
  SESSION_MAX_MS,
  type SessionEntry
} from "@/src/lib/analytics/sessionConstants";
import { classifySessionReferrer } from "@/src/lib/analytics/sessionEntry";
import { SECOND_MS } from "@/src/lib/time";

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

const NEAR_DUPLICATE_MS = 90 * SECOND_MS;

function clean(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t ? t : undefined;
}

/** Client clocks can be wrong; a future timestamp is clamped to now. */
function eventTime(createdAt: string | undefined, now: number): string {
  const ts = createdAt ? new Date(createdAt).getTime() : NaN;
  return new Date(Number.isFinite(ts) && ts <= now ? ts : now).toISOString();
}

function toRow(event: SessionEventInput, now: number) {
  return {
    id: randomUUID(),
    event: event.event,
    createdAt: eventTime(event.createdAt, now),
    path: clean(event.path),
    programSlug: clean(event.programSlug),
    notFound: event.notFound === true,
    key: clean(event.key),
    label: clean(event.label),
    social: clean(event.social),
    activationUrl: clean(event.activationUrl),
    programFlow: clean(event.programFlow),
    listedVersion: clean(event.listedVersion),
    triedVersionFit: clean(event.triedVersionFit),
    triedVersion: clean(event.triedVersion),
    sourceId: clean(event.sourceId)
  };
}

/**
 * Append events onto the visitor's open visit (30m idle, 2h max, 100 events), or start one.
 * Referrer/entry are written only when the visit is created. One `analytics.append_session` call.
 */
export async function appendTrackingSession(
  input: AppendTrackingSessionInput
): Promise<{ sessionId: string; rotated: boolean }> {
  const events = input.events.filter(e => e.event?.trim()).slice(0, 30);
  if (!events.length || !input.visitorHash) {
    return { sessionId: input.sessionId ?? "", rotated: false };
  }

  const now = Date.now();
  const requestedId = input.sessionId && SESSION_ID_RE.test(input.sessionId) ? input.sessionId.toLowerCase() : null;
  const landingPath = clean(input.landingPath) ?? clean(events.find(e => e.path)?.path);
  const entry: SessionEntry = isSessionEntry(input.entry) ? input.entry : classifySessionReferrer(input.referrer).entry;
  const referrer =
    entry === "external" ? classifySessionReferrer(input.referrer).referrer ?? clean(input.referrer) : undefined;

  const session = {
    userAgent: clean(input.userAgent),
    country: clean(input.country),
    city: clean(input.city),
    entry,
    referrer,
    landingPath,
    utmSource: clean(input.utm_source),
    utmMedium: clean(input.utm_medium),
    utmCampaign: clean(input.utm_campaign)
  };

  const sql = db();
  const [result] = await sql<Array<{ sessionId: string; rotated: boolean }>>`
    select session_id, rotated
    from analytics.append_session(
      ${input.visitorHash},
      ${requestedId}::uuid,
      ${sql.json(session)},
      ${sql.json(events.map(e => toRow(e, now)))},
      ${`${SESSION_IDLE_MS} milliseconds`}::interval,
      ${`${SESSION_MAX_MS} milliseconds`}::interval,
      ${SESSION_MAX_EVENTS},
      ${`${NEAR_DUPLICATE_MS} milliseconds`}::interval
    )
  `;
  return { sessionId: result.sessionId, rotated: result.rotated };
}
