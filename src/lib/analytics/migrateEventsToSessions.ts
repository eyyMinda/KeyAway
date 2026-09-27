import { createHash, randomUUID } from "node:crypto";
import { client } from "@/src/sanity/lib/client";
import { SESSION_BUNDLE_CAPACITY, SESSION_IDLE_MS, SESSION_MAX_EVENTS, SESSION_MAX_MS, isContributionEvent } from "@/src/lib/analytics/sessionConstants";
import { classifySessionReferrer } from "@/src/lib/analytics/sessionEntry";

const CHECKPOINT_ID = "analyticsMigration";
const BUDGET_MS = 40_000;
const LOCK_MS = 120_000;
const LIVE_MERGE_MS = 48 * 60 * 60 * 1000;
const WRITE_BYTES = 700_000;

const sanity = client.withConfig({ useCdn: false, timeout: 120_000 });

const EVENT_NAMES = [
  "page_viewed",
  "download_click",
  "copy_cdkey",
  "copy_pro_account",
  "click_activation_link",
  "affiliate_click",
  "social_click",
  "report_key_working",
  "report_key_expired",
  "report_key_limit_reached",
  "comment",
  "comment_reply",
  "key_suggestion",
  "contact"
] as const;

type SourceEvent = {
  sourceId: string;
  ipHash: string;
  createdAt: string;
  event: string;
  path?: string;
  programSlug?: string;
  referrer?: string;
  country?: string;
  city?: string;
  userAgent?: string;
  notFound?: boolean;
  key?: string;
  label?: string;
  social?: string;
  activationUrl?: string;
  programFlow?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  listedVersion?: string;
  triedVersionFit?: string;
  triedVersion?: string;
};

type Phase = "live" | "bundle" | "sweep" | "tail" | "contrib" | "done";

type Checkpoint = {
  phase: Phase;
  cursor: string;
  bundleId?: string;
  bundleCursor: string;
  sweepIndex: number;
  visitors: number;
  sessions: number;
  events: number;
  lockedAt?: string;
  deleteEventCursor: string;
  deleteBundleCursor: string;
  deleteEventsDone: boolean;
  deleteBundlesDone: boolean;
};

type Stats = { visitors: number; sessions: number; events: number; skipped: number };

type BundledSession = ReturnType<typeof toBundledSession>;

function clean(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function ts(value: string): number {
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : 0;
}

function isPhase(value: string | undefined): value is Phase {
  return (
    value === "live" ||
    value === "bundle" ||
    value === "sweep" ||
    value === "tail" ||
    value === "contrib" ||
    value === "done"
  );
}

async function readCheckpoint(): Promise<Checkpoint> {
  const doc = await sanity.fetch<Partial<Checkpoint> | null>(
    `*[_id == $id][0]{
      phase, cursor, bundleId, bundleCursor, sweepIndex, visitors, sessions, events, lockedAt,
      deleteEventCursor, deleteBundleCursor, deleteEventsDone, deleteBundlesDone
    }`,
    { id: CHECKPOINT_ID }
  );
  return {
    phase: isPhase(doc?.phase) ? doc.phase : "live",
    cursor: doc?.cursor ?? "",
    bundleId: doc?.bundleId,
    bundleCursor: doc?.bundleCursor ?? "",
    sweepIndex: doc?.sweepIndex ?? 0,
    visitors: doc?.visitors ?? 0,
    sessions: doc?.sessions ?? 0,
    events: doc?.events ?? 0,
    lockedAt: doc?.lockedAt,
    deleteEventCursor: doc?.deleteEventCursor ?? "",
    deleteBundleCursor: doc?.deleteBundleCursor ?? "",
    deleteEventsDone: doc?.deleteEventsDone === true,
    deleteBundlesDone: doc?.deleteBundlesDone === true
  };
}

async function writeCheckpoint(next: Checkpoint): Promise<void> {
  await sanity.createOrReplace({
    _id: CHECKPOINT_ID,
    _type: "analyticsMigration",
    phase: next.phase,
    cursor: next.cursor,
    bundleCursor: next.bundleCursor,
    sweepIndex: next.sweepIndex,
    visitors: next.visitors,
    sessions: next.sessions,
    events: next.events,
    deleteEventCursor: next.deleteEventCursor,
    deleteBundleCursor: next.deleteBundleCursor,
    deleteEventsDone: next.deleteEventsDone,
    deleteBundlesDone: next.deleteBundlesDone,
    ...(next.bundleId ? { bundleId: next.bundleId } : {}),
    ...(next.lockedAt ? { lockedAt: next.lockedAt } : {})
  });
}

function groupIntoSessions(events: SourceEvent[]) {
  const sorted = [...events].sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
  const groups: SourceEvent[][] = [];
  let current: SourceEvent[] = [];
  for (const event of sorted) {
    const when = ts(event.createdAt);
    const last = current.length ? ts(current[current.length - 1].createdAt) : 0;
    const start = current.length ? ts(current[0].createdAt) : 0;
    const split =
      !current.length ||
      when - last > SESSION_IDLE_MS ||
      when - start > SESSION_MAX_MS ||
      current.length >= SESSION_MAX_EVENTS;
    if (split && current.length) groups.push(current);
    if (split) current = [event];
    else current.push(event);
  }
  if (current.length) groups.push(current);
  return groups;
}

function toBundledSession(events: SourceEvent[]) {
  const landing = events.find(event => event.event === "page_viewed") ?? events[0];
  const classified = classifySessionReferrer(landing.referrer);
  const reportCount = events.filter(event => event.event.startsWith("report_")).length;
  const contributionCount = events.filter(event => isContributionEvent(event.event)).length;
  return {
    _key: randomUUID(),
    _type: "bundledTrackingSession",
    visitorHash: landing.ipHash,
    startedAt: events[0].createdAt,
    lastEventAt: events[events.length - 1].createdAt,
    entry: classified.entry,
    ...(classified.referrer ? { referrer: classified.referrer } : {}),
    ...(clean(landing.path) ? { landingPath: clean(landing.path) } : {}),
    ...(clean(landing.country) ? { country: clean(landing.country) } : {}),
    ...(clean(landing.city) ? { city: clean(landing.city) } : {}),
    ...(clean(landing.userAgent) ? { userAgent: clean(landing.userAgent) } : {}),
    ...(clean(landing.utm_source) ? { utm_source: clean(landing.utm_source) } : {}),
    ...(clean(landing.utm_medium) ? { utm_medium: clean(landing.utm_medium) } : {}),
    ...(clean(landing.utm_campaign) ? { utm_campaign: clean(landing.utm_campaign) } : {}),
    eventCount: events.length,
    reportCount,
    contributionCount,
    events: events.map(event => ({
      _key: randomUUID(),
      _type: "trackingSessionEvent",
      event: event.event,
      createdAt: event.createdAt,
      sourceId: event.sourceId,
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
      ...(clean(event.triedVersion) ? { triedVersion: clean(event.triedVersion) } : {})
    }))
  };
}

let copiedIds: Set<string> | null = null;
let contributionCache: { at: number; map: Map<string, SourceEvent[]> } | null = null;
let liveCache: { at: number; map: Map<string, SourceEvent[]> } | null = null;

function flattenIds(value: unknown, into: Set<string>) {
  if (typeof value === "string" && value) into.add(value);
  else if (Array.isArray(value)) {
    for (const item of value) flattenIds(item, into);
  }
}

async function ensureCopiedIds(): Promise<Set<string>> {
  if (copiedIds) return copiedIds;
  const set = new Set<string>();
  const bundleIds =
    (await sanity.fetch<string[]>(`*[_type == "trackingSessionBundle" && origin == "migration"]._id`)) ?? [];
  for (const id of bundleIds) {
    const sourceIds = await sanity.fetch<unknown>(`*[_id == $id][0].sessions[].events[].sourceId`, { id });
    flattenIds(sourceIds, set);
  }
  copiedIds = set;
  return set;
}

function remember(sessions: BundledSession[], seen: Set<string>) {
  for (const session of sessions) {
    for (const event of session.events) {
      if (event.sourceId) seen.add(event.sourceId);
    }
  }
}

function mapAnalytics(
  sourceId: string,
  visitorHash: string,
  event: Record<string, unknown>
): SourceEvent | null {
  if (!clean(event.event as string) || !clean(event.createdAt as string) || !visitorHash) return null;
  return {
    sourceId,
    ipHash: visitorHash,
    createdAt: String(event.createdAt),
    event: String(event.event),
    path: clean(event.path),
    programSlug: clean(event.programSlug),
    referrer: clean(event.referrer),
    country: clean(event.country),
    city: clean(event.city),
    userAgent: clean(event.userAgent),
    notFound: event.notFound === true,
    key: clean(event.key),
    social: clean(event.social),
    activationUrl: clean(event.activationUrl),
    programFlow: clean(event.programFlow),
    utm_source: clean(event.utm_source),
    utm_medium: clean(event.utm_medium),
    utm_campaign: clean(event.utm_campaign)
  };
}

function pushRow(map: Map<string, SourceEvent[]>, row: SourceEvent | null) {
  if (!row?.ipHash) return;
  const list = map.get(row.ipHash);
  if (list) list.push(row);
  else map.set(row.ipHash, [row]);
}

async function loadContributionMap(): Promise<Map<string, SourceEvent[]>> {
  if (contributionCache && Date.now() - contributionCache.at < 10 * 60_000) return contributionCache.map;
  const [reports, suggestions, contacts, programs] = await Promise.all([
    sanity.fetch<Array<Record<string, unknown>>>(
      `*[_type == "keyReport" && defined(ipHash)]{
        _id, eventType, createdAt, path, programSlug, referrer, country, city, key, label,
        listedVersion, triedVersionFit, triedVersion, ipHash
      }`
    ),
    sanity.fetch<Array<Record<string, unknown>>>(
      `*[_type == "keySuggestion" && defined(ipHash)]{ _id, createdAt, programName, ipHash }`
    ),
    sanity.fetch<Array<Record<string, unknown>>>(
      `*[_type == "contactMessage" && defined(ipHash)]{ _id, createdAt, title, ipHash }`
    ),
    sanity.fetch<
      Array<{
        _id: string;
        slug?: string;
        comments?: Array<Record<string, unknown>>;
        replies?: Array<Record<string, unknown>>;
      }>
    >(
      `*[_type == "program" && count(programComments) > 0]{
        _id,
        "slug": slug.current,
        "comments": programComments[defined(ipHash)]{ _key, body, createdAt, ipHash },
        "replies": programComments[].replies[defined(ipHash)]{ _key, body, createdAt, ipHash }
      }`
    )
  ]);

  const map = new Map<string, SourceEvent[]>();
  for (const report of reports ?? []) {
    const event = clean(report.eventType as string);
    const hash = clean(report.ipHash as string);
    if (!event || !hash || !clean(report.createdAt as string)) continue;
    pushRow(map, {
      sourceId: `keyReport:${report._id}`,
      ipHash: hash,
      createdAt: String(report.createdAt),
      event,
      path: clean(report.path),
      programSlug: clean(report.programSlug),
      referrer: clean(report.referrer),
      country: clean(report.country),
      city: clean(report.city),
      key: clean(report.key),
      label: clean(report.label),
      listedVersion: clean(report.listedVersion),
      triedVersionFit: clean(report.triedVersionFit),
      triedVersion: clean(report.triedVersion)
    });
  }
  for (const suggestion of suggestions ?? []) {
    const hash = clean(suggestion.ipHash as string);
    if (!hash || !clean(suggestion.createdAt as string)) continue;
    pushRow(map, {
      sourceId: `keySuggestion:${suggestion._id}`,
      ipHash: hash,
      createdAt: String(suggestion.createdAt),
      event: "key_suggestion",
      label: clean(suggestion.programName),
      path: "/contact"
    });
  }
  for (const message of contacts ?? []) {
    const hash = clean(message.ipHash as string);
    if (!hash || !clean(message.createdAt as string)) continue;
    pushRow(map, {
      sourceId: `contact:${message._id}`,
      ipHash: hash,
      createdAt: String(message.createdAt),
      event: "contact",
      label: clean(message.title),
      path: "/contact"
    });
  }
  for (const program of programs ?? []) {
    for (const comment of program.comments ?? []) {
      const hash = clean(comment.ipHash as string);
      if (!hash || !clean(comment.createdAt as string) || !clean(comment._key)) continue;
      pushRow(map, {
        sourceId: `comment:${program._id}:${comment._key}`,
        ipHash: hash,
        createdAt: String(comment.createdAt),
        event: "comment",
        programSlug: program.slug,
        path: program.slug ? `/program/${program.slug}` : undefined,
        label: clean(comment.body)?.slice(0, 140)
      });
    }
    for (const reply of program.replies ?? []) {
      const hash = clean(reply.ipHash as string);
      if (!hash || !clean(reply.createdAt as string) || !clean(reply._key)) continue;
      pushRow(map, {
        sourceId: `reply:${program._id}:${reply._key}`,
        ipHash: hash,
        createdAt: String(reply.createdAt),
        event: "comment_reply",
        programSlug: program.slug,
        path: program.slug ? `/program/${program.slug}` : undefined,
        label: clean(reply.body)?.slice(0, 140)
      });
    }
  }
  contributionCache = { at: Date.now(), map };
  return map;
}

async function loadAllLiveByHash(refresh: boolean): Promise<Map<string, SourceEvent[]>> {
  if (!refresh && liveCache && Date.now() - liveCache.at < 2 * 60_000) return liveCache.map;
  const map = new Map<string, SourceEvent[]>();
  let cursor = "";
  for (let page = 0; page < 30; page++) {
    const docs = await sanity.fetch<Array<Record<string, unknown> & { _id: string }>>(
      `*[_type == "trackingEvent" && _id > $cursor] | order(_id asc)[0...1000]{
        _id, event, createdAt, path, programSlug, referrer, country, city, userAgent, notFound,
        key, social, activationUrl, programFlow, utm_source, utm_medium, utm_campaign, ipHash
      }`,
      { cursor }
    );
    if (!docs?.length) break;
    for (const doc of docs) {
      const hash = clean(doc.ipHash as string);
      if (!hash) continue;
      pushRow(map, mapAnalytics(`event:${doc._id}`, hash, doc));
    }
    cursor = docs[docs.length - 1]._id;
    if (docs.length < 1000) break;
  }
  liveCache = { at: Date.now(), map };
  return map;
}

async function loadBundleEvents(bundleId: string): Promise<SourceEvent[]> {
  const rows: SourceEvent[] = [];
  const seenKeys = new Set<string>();
  for (let start = 0; start < 8000; start += 2000) {
    const end = start + 2000;
    const slice = await sanity.fetch<Array<Record<string, unknown>>>(
      `*[_id == $id][0].events[${start}...${end}]{
        _key, event, createdAt, path, programSlug, referrer, country, city, userAgent, notFound,
        key, social, activationUrl, programFlow, utm_source, utm_medium, utm_campaign, ipHash
      }`,
      { id: bundleId }
    );
    if (!slice?.length) break;
    for (const event of slice) {
      const key = clean(event._key);
      const hash = clean(event.ipHash as string);
      if (!key || !hash) continue;
      const row = mapAnalytics(`bundle:${bundleId}:${key}`, hash, event);
      if (!row || seenKeys.has(row.sourceId)) continue;
      seenKeys.add(row.sourceId);
      rows.push(row);
    }
    if (slice.length < 2000) break;
  }
  return rows;
}

function extrasThatFit(analytics: SourceEvent[], extras: SourceEvent[], seen: Set<string>): SourceEvent[] {
  let min = Infinity;
  let max = -Infinity;
  for (const event of analytics) {
    const t = ts(event.createdAt);
    if (t < min) min = t;
    if (t > max) max = t;
  }
  if (!Number.isFinite(min)) return [];
  const picked: SourceEvent[] = [];
  for (const extra of extras) {
    if (seen.has(extra.sourceId)) continue;
    const t = ts(extra.createdAt);
    if (t >= min - SESSION_IDLE_MS && t <= max + SESSION_IDLE_MS) picked.push(extra);
  }
  return picked;
}

async function writeSessions(sessions: BundledSession[], seen: Set<string>): Promise<number> {
  let written = 0;
  const queue = [...sessions];
  while (queue.length) {
    const chunk: BundledSession[] = [];
    let bytes = 2_000;
    while (queue.length && chunk.length < SESSION_BUNDLE_CAPACITY) {
      const size = JSON.stringify(queue[0]).length;
      if (chunk.length && (bytes + size > WRITE_BYTES || chunk.length >= SESSION_BUNDLE_CAPACITY)) break;
      bytes += size;
      chunk.push(queue.shift() as BundledSession);
    }
    if (!chunk.length) break;
    let start = chunk[0].startedAt;
    let end = chunk[0].lastEventAt;
    for (const session of chunk) {
      if (session.startedAt < start) start = session.startedAt;
      if (session.lastEventAt > end) end = session.lastEventAt;
    }
    const now = new Date().toISOString();
    await sanity.create({
      _type: "trackingSessionBundle",
      origin: "migration",
      bundledAt: now,
      updatedAt: now,
      timeRangeStart: start,
      timeRangeEnd: end,
      sessionCount: chunk.length,
      capacity: SESSION_BUNDLE_CAPACITY,
      sessions: chunk
    });
    remember(chunk, seen);
    written += chunk.length;
  }
  return written;
}

async function commitGroups(
  analytics: SourceEvent[],
  live: Map<string, SourceEvent[]> | null,
  contributions: Map<string, SourceEvent[]>,
  seen: Set<string>
): Promise<Stats> {
  const byHash = new Map<string, SourceEvent[]>();
  let skipped = 0;
  for (const event of analytics) {
    if (seen.has(event.sourceId)) {
      skipped += 1;
      continue;
    }
    const list = byHash.get(event.ipHash);
    if (list) list.push(event);
    else byHash.set(event.ipHash, [event]);
  }

  const sessions: BundledSession[] = [];
  let events = 0;
  for (const [hash, rows] of byHash) {
    const extras = [
      ...extrasThatFit(rows, live?.get(hash) ?? [], seen),
      ...extrasThatFit(rows, contributions.get(hash) ?? [], seen)
    ];
    for (const group of groupIntoSessions([...rows, ...extras])) {
      sessions.push(toBundledSession(group));
      events += group.length;
    }
  }
  const written = await writeSessions(sessions, seen);
  return { visitors: byHash.size, sessions: written, events, skipped };
}

async function convertBundle(
  bundle: { _id: string; timeRangeEnd?: string },
  isLast: boolean,
  contributions: Map<string, SourceEvent[]>,
  seen: Set<string>
): Promise<Stats> {
  const recent =
    isLast || (bundle.timeRangeEnd ? Date.now() - ts(bundle.timeRangeEnd) < LIVE_MERGE_MS : false);
  const [analytics, live] = await Promise.all([
    loadBundleEvents(bundle._id),
    recent ? loadAllLiveByHash(false) : Promise.resolve(null)
  ]);
  return commitGroups(analytics, live, contributions, seen);
}

async function convertLiveTail(
  contributions: Map<string, SourceEvent[]>,
  seen: Set<string>
): Promise<Stats> {
  const live = await loadAllLiveByHash(true);
  const analytics: SourceEvent[] = [];
  for (const rows of live.values()) analytics.push(...rows);
  return commitGroups(analytics, null, contributions, seen);
}

async function convertOrphanContributions(
  contributions: Map<string, SourceEvent[]>,
  seen: Set<string>
): Promise<Stats> {
  const analytics: SourceEvent[] = [];
  for (const rows of contributions.values()) {
    for (const row of rows) {
      if (!seen.has(row.sourceId)) analytics.push(row);
    }
  }
  return commitGroups(analytics, null, new Map(), seen);
}

function syntheticVisitorHash(seed: string): string {
  return createHash("sha256").update(`keyaway-hashless:${seed}`).digest("hex");
}

function closestVisitor(
  event: SourceEvent,
  sessions: Array<{ visitorHash: string; country?: string; city?: string; startedAt: string; lastEventAt: string }>
): string | null {
  const when = ts(event.createdAt);
  let best: { hash: string; gap: number } | null = null;
  for (const session of sessions) {
    if (!session.visitorHash || session.country !== event.country || session.city !== event.city) continue;
    const start = ts(session.startedAt);
    const end = ts(session.lastEventAt);
    const gap = when < start ? start - when : when > end ? when - end : 0;
    if (gap > SESSION_IDLE_MS) continue;
    if (!best || gap < best.gap) best = { hash: session.visitorHash, gap };
  }
  return best?.hash ?? null;
}

async function loadHashlessBundleEvents(): Promise<SourceEvent[]> {
  const bundles = await sanity.fetch<Array<{ _id: string; events?: Array<Record<string, unknown>> }>>(
    `*[_type == "trackingEventBundle" && count(events[!defined(ipHash) || ipHash == ""]) > 0]{
      _id,
      "events": events[!defined(ipHash) || ipHash == ""]{
        _key, event, createdAt, path, programSlug, referrer, country, city, userAgent, notFound,
        key, social, activationUrl, programFlow, utm_source, utm_medium, utm_campaign
      }
    }`
  );
  const rows: SourceEvent[] = [];
  for (const bundle of bundles ?? []) {
    for (const event of bundle.events ?? []) {
      const key = clean(event._key);
      if (!key) continue;
      const row = mapAnalytics(`bundle:${bundle._id}:${key}`, "pending", event);
      if (row) rows.push({ ...row, ipHash: "" });
    }
  }
  return rows;
}

async function loadHashlessForms(): Promise<SourceEvent[]> {
  const [suggestions, contacts] = await Promise.all([
    sanity.fetch<Array<Record<string, unknown>>>(
      `*[_type == "keySuggestion" && (!defined(ipHash) || ipHash == "")]{ _id, createdAt, programName }`
    ),
    sanity.fetch<Array<Record<string, unknown>>>(
      `*[_type == "contactMessage" && (!defined(ipHash) || ipHash == "")]{ _id, createdAt, title }`
    )
  ]);
  const rows: SourceEvent[] = [];
  for (const suggestion of suggestions ?? []) {
    if (!clean(suggestion.createdAt as string)) continue;
    rows.push({
      sourceId: `keySuggestion:${suggestion._id}`,
      ipHash: "",
      createdAt: String(suggestion.createdAt),
      event: "key_suggestion",
      label: clean(suggestion.programName),
      path: "/contact"
    });
  }
  for (const message of contacts ?? []) {
    if (!clean(message.createdAt as string)) continue;
    rows.push({
      sourceId: `contact:${message._id}`,
      ipHash: "",
      createdAt: String(message.createdAt),
      event: "contact",
      label: clean(message.title),
      path: "/contact"
    });
  }
  return rows;
}

/** Rows with no ipHash cannot use the original visitor id. Match a nearby visit in the same city, otherwise mint a sha256 hash and group by place and time. */
export async function attachHashlessRows() {
  const seen = await ensureCopiedIds();
  const [analytics, forms] = await Promise.all([loadHashlessBundleEvents(), loadHashlessForms()]);
  const pendingAnalytics = analytics.filter(event => !seen.has(event.sourceId));
  const cities = [...new Set(pendingAnalytics.map(event => event.city).filter((city): city is string => Boolean(city)))];
  const times = pendingAnalytics.map(event => ts(event.createdAt)).filter(Boolean);
  const start = times.length ? new Date(Math.min(...times) - SESSION_IDLE_MS).toISOString() : "";
  const end = times.length ? new Date(Math.max(...times) + SESSION_IDLE_MS).toISOString() : "";
  const nearbyRaw = cities.length && start
    ? await sanity.fetch<unknown>(
        `*[_type == "trackingSessionBundle"].sessions[city in $cities && lastEventAt >= $start && startedAt <= $end]{
          visitorHash, country, city, startedAt, lastEventAt
        }`,
        { cities, start, end }
      )
    : [];
  const nearby: Array<{ visitorHash: string; country?: string; city?: string; startedAt: string; lastEventAt: string }> = [];
  const flattenNearby = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) flattenNearby(item);
      return;
    }
    if (typeof value === "object" && value && "visitorHash" in value && "startedAt" in value) {
      nearby.push(value as (typeof nearby)[number]);
    }
  };
  flattenNearby(nearbyRaw);

  let matchedVisitors = 0;
  const unmatched: SourceEvent[] = [];
  for (const event of pendingAnalytics) {
    const hash = closestVisitor(event, nearby);
    if (hash) {
      event.ipHash = hash;
      matchedVisitors += 1;
    } else unmatched.push(event);
  }

  const syntheticGroups = new Map<string, SourceEvent[]>();
  for (const event of unmatched) {
    const place = `${event.country || "unknown"}|${event.city || "unknown"}`;
    const list = syntheticGroups.get(place);
    if (list) list.push(event);
    else syntheticGroups.set(place, [event]);
  }
  const assigned: SourceEvent[] = pendingAnalytics.filter(event => event.ipHash);
  let syntheticVisitors = 0;
  for (const [place, rows] of syntheticGroups) {
    for (const group of groupIntoSessions(rows)) {
      const hash = syntheticVisitorHash(`${place}|${group[0].createdAt}`);
      syntheticVisitors += 1;
      for (const event of group) assigned.push({ ...event, ipHash: hash });
    }
  }

  const pendingForms = forms.filter(form => !seen.has(form.sourceId));
  const placedForms: SourceEvent[] = [];
  for (const form of pendingForms.sort((a, b) => ts(a.createdAt) - ts(b.createdAt))) {
    const when = ts(form.createdAt);
    let best: { hash: string; gap: number } | null = null;
    for (const event of [...assigned, ...placedForms]) {
      const gap = Math.abs(ts(event.createdAt) - when);
      if (gap > SESSION_IDLE_MS) continue;
      if (!best || gap < best.gap) best = { hash: event.ipHash, gap };
    }
    if (best) placedForms.push({ ...form, ipHash: best.hash });
    else {
      const hash = syntheticVisitorHash(`form|${form.createdAt}`);
      syntheticVisitors += 1;
      placedForms.push({ ...form, ipHash: hash });
    }
  }

  const stats = await commitGroups([...assigned, ...placedForms], null, new Map(), seen);
  console.log(
    `[migrate] hashless +${stats.events} events, ${matchedVisitors} matched a visit, ${syntheticVisitors} new hashes`
  );
  return { ...stats, matchedVisitors, syntheticVisitors, forms: placedForms.length };
}

export async function deleteConvertedBatch(options?: { restart?: boolean }) {
  const checkpoint = await readCheckpoint();
  if (options?.restart) {
    checkpoint.deleteEventCursor = "";
    checkpoint.deleteBundleCursor = "";
    checkpoint.deleteEventsDone = false;
    checkpoint.deleteBundlesDone = false;
  }
  const seen = await ensureCopiedIds();
  let deletedEvents = 0;
  let deletedBundles = 0;
  let skippedBundles = 0;
  const started = Date.now();

  if (!checkpoint.deleteEventsDone) {
    while (Date.now() - started < 25_000) {
      const page = await sanity.fetch<Array<{ _id: string }>>(
        `*[_type == "trackingEvent" && _id > $cursor] | order(_id asc)[0...100]{ _id }`,
        { cursor: checkpoint.deleteEventCursor }
      );
      if (!page?.length) {
        checkpoint.deleteEventsDone = true;
        break;
      }
      checkpoint.deleteEventCursor = page[page.length - 1]._id;
      const hit = page.filter(doc => seen.has(`event:${doc._id}`)).map(doc => doc._id);
      if (!hit.length) continue;
      let tx = sanity.transaction();
      for (const id of hit) tx = tx.delete(id);
      await tx.commit();
      deletedEvents += hit.length;
    }
  }

  if (checkpoint.deleteEventsDone && !checkpoint.deleteBundlesDone) {
    while (Date.now() - started < 50_000) {
      const bundle = await sanity.fetch<{ _id: string; keys?: Array<string | null> } | null>(
        `*[_type == "trackingEventBundle" && _id > $cursor] | order(_id asc)[0]{ _id, "keys": events[]._key }`,
        { cursor: checkpoint.deleteBundleCursor }
      );
      if (!bundle?._id) {
        checkpoint.deleteBundlesDone = true;
        break;
      }
      checkpoint.deleteBundleCursor = bundle._id;
      const keys = (bundle.keys ?? []).filter((key): key is string => Boolean(key && key.trim()));
      const copied = keys.every(key => seen.has(`bundle:${bundle._id}:${key}`));
      if (!copied) {
        skippedBundles += 1;
        continue;
      }
      await sanity.delete(bundle._id);
      deletedBundles += 1;
    }
  }

  await writeCheckpoint(checkpoint);
  return {
    deletedEvents,
    deletedBundles,
    skippedBundles,
    done: checkpoint.deleteEventsDone && checkpoint.deleteBundlesDone
  };
}

export async function migrationPreview() {
  const [liveDocs, bundles, reports, suggestions, contacts] = await Promise.all([
    sanity.fetch<number>(`count(*[_type == "trackingEvent"])`),
    sanity.fetch<Array<{ eventCount?: number }>>(`*[_type == "trackingEventBundle"]{ eventCount }`),
    sanity.fetch<number>(`count(*[_type == "keyReport"])`),
    sanity.fetch<number>(`count(*[_type == "keySuggestion"])`),
    sanity.fetch<number>(`count(*[_type == "contactMessage"])`)
  ]);
  const bundledEvents = (bundles ?? []).reduce((sum, bundle) => sum + (bundle.eventCount ?? 0), 0);
  const sourceEvents = (liveDocs ?? 0) + bundledEvents;
  const checkpoint = await readCheckpoint();
  return {
    trackingEventDocs: liveDocs ?? 0,
    trackingEventBundleDocs: bundles?.length ?? 0,
    bundledEvents,
    sourceEvents,
    keyReports: reports ?? 0,
    keySuggestions: suggestions ?? 0,
    contactMessages: contacts ?? 0,
    worstCaseNewDocs: Math.max(1, Math.ceil(sourceEvents / SESSION_BUNDLE_CAPACITY)),
    checkpoint
  };
}

export async function runMigrationBatch(options?: { catchUp?: boolean }) {
  const checkpoint = await readCheckpoint();
  const idle = {
    ...checkpoint,
    done: checkpoint.phase === "done",
    advanced: false,
    busy: false,
    hashes: [] as string[],
    batchEvents: 0,
    batchSessions: 0,
    batchSkipped: 0,
    bundleTotal: 0,
    knownCopies: copiedIds?.size ?? 0
  };
  if (checkpoint.lockedAt && Date.now() - ts(checkpoint.lockedAt) < LOCK_MS) {
    return { ...idle, busy: true, done: false };
  }
  if (checkpoint.phase === "done" && !options?.catchUp) return idle;
  if (checkpoint.phase === "done" && options?.catchUp) {
    checkpoint.phase = "tail";
    checkpoint.cursor = "";
  }
  if (checkpoint.phase === "live" || checkpoint.phase === "bundle") checkpoint.phase = "sweep";

  checkpoint.lockedAt = new Date().toISOString();
  await writeCheckpoint(checkpoint);

  const started = Date.now();
  let batchEvents = 0;
  let batchSessions = 0;
  let batchSkipped = 0;
  let bundleTotal = 0;
  let advanced = false;
  let bundles: Array<{ _id: string; timeRangeEnd?: string }> | null = null;

  try {
    const seen = await ensureCopiedIds();
    const contributions = await loadContributionMap();
    while (Date.now() - started < BUDGET_MS && checkpoint.phase !== "done") {
      if (checkpoint.phase === "sweep") {
        if (!bundles) {
          bundles =
            (await sanity.fetch<Array<{ _id: string; timeRangeEnd?: string }>>(
              `*[_type == "trackingEventBundle"] | order(timeRangeStart asc){ _id, timeRangeEnd }`
            )) ?? [];
          bundleTotal = bundles.length;
        }
        const index = checkpoint.sweepIndex ?? 0;
        if (index >= bundles.length) {
          checkpoint.phase = "tail";
          advanced = true;
          continue;
        }
        const stats = await convertBundle(bundles[index], index === bundles.length - 1, contributions, seen);
        checkpoint.sweepIndex = index + 1;
        checkpoint.visitors += stats.visitors;
        checkpoint.sessions += stats.sessions;
        checkpoint.events += stats.events;
        batchEvents += stats.events;
        batchSessions += stats.sessions;
        batchSkipped += stats.skipped;
        advanced = true;
        console.log(
          `[migrate] bundle ${index + 1}/${bundles.length} +${stats.events} events, skipped ${stats.skipped}`
        );
      } else if (checkpoint.phase === "tail") {
        const stats = await convertLiveTail(contributions, seen);
        checkpoint.phase = "contrib";
        checkpoint.visitors += stats.visitors;
        checkpoint.sessions += stats.sessions;
        checkpoint.events += stats.events;
        batchEvents += stats.events;
        batchSessions += stats.sessions;
        batchSkipped += stats.skipped;
        advanced = true;
        console.log(`[migrate] live events +${stats.events}, skipped ${stats.skipped}`);
      } else if (checkpoint.phase === "contrib") {
        const stats = await convertOrphanContributions(contributions, seen);
        checkpoint.phase = "done";
        checkpoint.visitors += stats.visitors;
        checkpoint.sessions += stats.sessions;
        checkpoint.events += stats.events;
        batchEvents += stats.events;
        batchSessions += stats.sessions;
        advanced = true;
        console.log(`[migrate] leftover contributions +${stats.events}`);
      } else {
        checkpoint.phase = "sweep";
        advanced = true;
      }
    }
  } finally {
    checkpoint.lockedAt = undefined;
    await writeCheckpoint(checkpoint);
  }

  return {
    ...checkpoint,
    done: checkpoint.phase === "done",
    advanced,
    busy: false,
    hashes: [] as string[],
    batchEvents,
    batchSessions,
    batchSkipped,
    bundleTotal,
    knownCopies: copiedIds?.size ?? 0
  };
}

async function sumEventCounts(query: string): Promise<Record<string, number>> {
  const rows = await sanity.fetch<Array<Record<string, number>>>(query);
  const totals: Record<string, number> = {};
  for (const name of EVENT_NAMES) totals[name] = 0;
  for (const row of rows ?? []) {
    for (const name of EVENT_NAMES) totals[name] += row[name] ?? 0;
  }
  return totals;
}

export async function verifyMigration() {
  const projection = EVENT_NAMES.map(name => `"${name}": count(events[event == "${name}"])`).join(", ");
  const sessionProjection = EVENT_NAMES.map(
    name => `"${name}": count(sessions[].events[event == "${name}"])`
  ).join(", ");
  const [live, bundled, copiedBundles, copiedLive, contributions, commentRows] = await Promise.all([
    sanity.fetch<Record<string, number>>(
      `{ ${EVENT_NAMES.map(name => `"${name}": count(*[_type == "trackingEvent" && event == "${name}"])`).join(", ")} }`
    ),
    sumEventCounts(`*[_type == "trackingEventBundle"]{ ${projection} }`),
    sumEventCounts(`*[_type == "trackingSessionBundle"]{ ${sessionProjection} }`),
    sumEventCounts(`*[_type == "trackingSession"]{ ${projection} }`),
    sanity.fetch<Record<string, number>>(`{
      "report_key_working": count(*[_type == "keyReport" && eventType == "report_key_working"]),
      "report_key_expired": count(*[_type == "keyReport" && eventType == "report_key_expired"]),
      "report_key_limit_reached": count(*[_type == "keyReport" && eventType == "report_key_limit_reached"]),
      "key_suggestion": count(*[_type == "keySuggestion"]),
      "contact": count(*[_type == "contactMessage"])
    }`),
    sanity.fetch<Array<{ comment?: number; comment_reply?: number }>>(
      `*[_type == "program"]{
        "comment": count(programComments),
        "comment_reply": count(programComments[].replies[])
      }`
    )
  ]);

  const commentTotals = (commentRows ?? []).reduce<{ comment: number; comment_reply: number }>(
    (sum, row) => ({
      comment: sum.comment + (row.comment ?? 0),
      comment_reply: sum.comment_reply + (row.comment_reply ?? 0)
    }),
    { comment: 0, comment_reply: 0 }
  );

  const rows = EVENT_NAMES.map(name => {
    const fromEvents = (live?.[name] ?? 0) + (bundled[name] ?? 0);
    const fromDocs =
      name === "comment" || name === "comment_reply"
        ? commentTotals[name]
        : (contributions?.[name] ?? 0);
    const source = fromEvents + fromDocs;
    const copied = (copiedBundles[name] ?? 0) + (copiedLive[name] ?? 0);
    return { event: name, source, copied, ok: source === copied };
  });
  return { ok: rows.every(row => row.ok), rows };
}
