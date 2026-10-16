#!/usr/bin/env node
/**
 * Import Sanity analytics history (sessions + events, key reports, visitors, their bundles) into Supabase.
 *
 * Reads an extracted `sanity dataset export` file offline (no Sanity API requests) and upserts into the
 * `analytics` schema. Safe to re-run: every write is idempotent, and later exports only add what is new.
 *
 *   npm run migrate:analytics -- --file <export-dir>/data.ndjson [--dry-run] [--types sessions,keyReports,visitors,legacy]
 *
 * Merge rules
 * - Sessions: id = trackingSession uuid or bundle row _key. A session that kept going in Postgres after the cutover
 *   (same client session id) is merged: earliest start, latest event, Sanity's entry/referrer. Counters are
 *   recomputed from events at the end.
 * - Duplicate copies from the old bundling race are skipped and listed in the report: sessions whose events
 *   were all seen already, and key report rows whose sourceId was seen already.
 * - Events: id = Sanity _key, insert-only.
 * - Key reports: matched on Sanity id (bundled rows: sourceId). Rows edited in Postgres are never overwritten.
 * - Visitors: newest copy per hash (live doc wins) goes to `visitors` unless the hash already exists there
 *   (seeded or active after cutover); every other copy goes to `visitor_snapshots`.
 * - Unknown fields are kept in `extra`. Legacy analytics doc types are stored verbatim in `legacy_documents`.
 *
 * Env: SUPABASE_DB_URL (Supabase pooler connection string).
 */
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { createHash } from "node:crypto";
import postgres from "postgres";

const args = process.argv.slice(2);
const flag = name => args.includes(`--${name}`);
const option = name => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const file = option("file");
const dryRun = flag("dry-run");
const ALL_TYPES = ["sessions", "keyReports", "visitors", "legacy"];
const types = new Set((option("types") ?? ALL_TYPES.join(",")).split(",").map(t => t.trim()));
const BATCH = 1000;
const VERIFY_BATCH = 5000;

if (!file || !fs.existsSync(file)) {
  console.error("Usage: npm run migrate:analytics -- --file <export-dir>/data.ndjson [--dry-run] [--types ...]");
  process.exit(1);
}
for (const t of types) {
  if (!ALL_TYPES.includes(t)) {
    console.error(`Unknown type "${t}". Use: ${ALL_TYPES.join(", ")}`);
    process.exit(1);
  }
}
if (!dryRun && !process.env.SUPABASE_DB_URL) {
  console.error("Missing SUPABASE_DB_URL");
  process.exit(1);
}
if (!dryRun && !URL.canParse(process.env.SUPABASE_DB_URL)) {
  console.error("SUPABASE_DB_URL is not a valid URL. URL-encode the password (e.g. % -> %25, # -> %23, @ -> %40).");
  process.exit(1);
}

const LEGACY_TYPES = new Set(["analyticsMigration", "trackingEvent", "trackingEventBundle", "interactionEventBucket"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SYSTEM_FIELDS = new Set(["_id", "_rev", "_type", "_createdAt", "_updatedAt", "_key"]);

/** Deterministic uuid (v5-style) for rows whose Sanity key is not a uuid. */
function stableUuid(name) {
  const h = createHash("sha1").update(`keyaway-analytics:${name}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const idFor = (key, ref) => (typeof key === "string" && UUID_RE.test(key) ? key.toLowerCase() : stableUuid(ref));
const str = v => (typeof v === "string" && v.trim() ? v : null);
const num = v => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : 0);
const time = v => (typeof v === "string" && !Number.isNaN(new Date(v).getTime()) ? v : null);

/** Fields not mapped to a column, minus Sanity system fields. */
function extraOf(obj, known) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!known.has(k) && !SYSTEM_FIELDS.has(k)) out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

const SESSION_FIELDS = new Set([
  "visitorHash", "startedAt", "lastEventAt", "entry", "referrer", "landingPath", "userAgent", "country", "city",
  "utm_source", "utm_medium", "utm_campaign", "eventCount", "reportCount", "contributionCount", "events"
]);
const EVENT_FIELDS = new Set([
  "event", "createdAt", "path", "programSlug", "notFound", "key", "label", "social", "activationUrl", "programFlow",
  "listedVersion", "triedVersionFit", "triedVersion", "sourceId"
]);
const REPORT_FIELDS = new Set([
  "eventType", "programSlug", "key", "label", "path", "referrer", "userAgent", "country", "city", "utm_source",
  "utm_medium", "utm_campaign", "ipHash", "listedVersion", "triedVersionFit", "triedVersion", "createdAt", "sourceId"
]);
const VISITOR_FIELDS = new Set([
  "visitorHash", "visitCount", "lastActivityAt", "visitTier", "isSpammer", "spamMarkedAt", "reportCount",
  "suggestionCount", "commentCount", "contributionScore", "country", "city", "geoUpdatedAt", "createdAt", "updatedAt"
]);

const isContribution = e =>
  e.startsWith("report_") || e === "comment" || e === "comment_reply" || e === "key_suggestion" || e === "contact";

// ---------------------------------------------------------------------------------------------------------------

const report = {
  file: path.resolve(file),
  dryRun,
  types: [...types],
  startedAt: new Date().toISOString(),
  source: {
    docsByType: {},
    liveSessions: 0,
    bundledSessions: 0,
    migrationBundleSessions: 0,
    events: 0,
    eventsByType: {},
    liveKeyReports: 0,
    bundledKeyReports: 0,
    liveVisitors: 0,
    bundledVisitors: 0,
    uniqueVisitorHashes: 0,
    legacyDocs: 0,
    drafts: 0
  },
  skipped: {
    duplicateSessionCopies: [],
    duplicateEventRows: 0,
    duplicateKeyReportCopies: []
  },
  notes: {
    sessionsWithStoredCountMismatch: 0,
    eventsWithoutCreatedAt: 0
  },
  written: {},
  verify: {}
};

const sql = dryRun
  ? null
  : postgres(process.env.SUPABASE_DB_URL, { prepare: false, max: 1, onnotice: () => {}, connect_timeout: 30 });

let runId = null;
const sessionBuffer = [];
const eventBuffer = [];
const reportBuffer = [];
const legacyBuffer = [];
const expected = { sessions: new Set(), events: new Set(), keyReports: new Set(), visitors: new Set() };
const seenEventIds = new Set();
const seenReportIds = new Set();
/** visitorHash -> candidates [{ row, ref, live }] */
const visitorCandidates = new Map();

function count(map, key) {
  map[key] = (map[key] ?? 0) + 1;
}

async function flushSessions() {
  if (!sessionBuffer.length) return;
  const rows = sessionBuffer.splice(0);
  if (!sql) return;
  await sql`
    insert into analytics.sessions ${sql(rows)}
    on conflict (id) do update set
      started_at    = least(sessions.started_at, excluded.started_at),
      last_event_at = greatest(sessions.last_event_at, excluded.last_event_at),
      entry         = excluded.entry,
      referrer      = excluded.referrer,
      landing_path  = coalesce(excluded.landing_path, sessions.landing_path),
      user_agent    = coalesce(excluded.user_agent, sessions.user_agent),
      country       = coalesce(excluded.country, sessions.country),
      city          = coalesce(excluded.city, sessions.city),
      utm_source    = coalesce(excluded.utm_source, sessions.utm_source),
      utm_medium    = coalesce(excluded.utm_medium, sessions.utm_medium),
      utm_campaign  = coalesce(excluded.utm_campaign, sessions.utm_campaign),
      origin        = excluded.origin,
      sanity_ref    = excluded.sanity_ref,
      extra         = excluded.extra
    -- Only touch rows that change: sessions born in Postgres after cutover, or visits that grew in a newer export.
    where sessions.origin = 'live'
       or excluded.started_at < sessions.started_at
       or excluded.last_event_at > sessions.last_event_at
  `;
}

async function flushEvents() {
  if (!eventBuffer.length) return;
  await flushSessions(); // events reference sessions
  const rows = eventBuffer.splice(0);
  if (!sql) return;
  await sql`insert into analytics.events ${sql(rows)} on conflict (id) do nothing`;
}

async function flushReports() {
  if (!reportBuffer.length) return;
  const rows = reportBuffer.splice(0);
  if (!sql) return;
  await sql`
    insert into analytics.key_reports ${sql(rows)}
    on conflict (sanity_id) do update set
      event_type = excluded.event_type, program_slug = excluded.program_slug, key = excluded.key,
      label = excluded.label, path = excluded.path, referrer = excluded.referrer, user_agent = excluded.user_agent,
      country = excluded.country, city = excluded.city, utm_source = excluded.utm_source,
      utm_medium = excluded.utm_medium, utm_campaign = excluded.utm_campaign, ip_hash = excluded.ip_hash,
      listed_version = excluded.listed_version, tried_version_fit = excluded.tried_version_fit,
      tried_version = excluded.tried_version, created_at = excluded.created_at, origin = excluded.origin,
      sanity_ref = excluded.sanity_ref, extra = excluded.extra
    where key_reports.updated_at is null
      and (key_reports.event_type, key_reports.created_at, key_reports.listed_version,
           key_reports.tried_version_fit, key_reports.tried_version)
          is distinct from
          (excluded.event_type, excluded.created_at, excluded.listed_version,
           excluded.tried_version_fit, excluded.tried_version)
  `;
}

async function flushLegacy() {
  if (!legacyBuffer.length) return;
  const rows = legacyBuffer.splice(0);
  if (!sql) return;
  await sql`
    insert into analytics.legacy_documents ${sql(rows)}
    on conflict (sanity_id) do update set doc = excluded.doc, type = excluded.type
  `;
}

async function addSession(s, { id, ref, origin }) {
  const events = Array.isArray(s.events) ? s.events : [];
  const eventIds = events.map((e, i) => idFor(e?._key, `${ref}#event:${i}`));

  // A copy of a session already imported from another bundle: same event keys.
  if (events.length && eventIds.every(eid => seenEventIds.has(eid))) {
    report.skipped.duplicateSessionCopies.push(ref);
    return;
  }

  const times = events.map(e => time(e?.createdAt)).filter(Boolean).sort();
  const startedAt = time(s.startedAt) ?? times[0] ?? null;
  const lastEventAt = time(s.lastEventAt) ?? times[times.length - 1] ?? startedAt;
  if (!startedAt) throw new Error(`Session without any timestamp: ${ref}`);

  const reports = events.filter(e => String(e?.event ?? "").startsWith("report_")).length;
  const contributions = events.filter(e => isContribution(String(e?.event ?? ""))).length;
  const extra = extraOf(s, SESSION_FIELDS) ?? {};
  const storedCounts = { eventCount: s.eventCount, reportCount: s.reportCount, contributionCount: s.contributionCount };
  if (
    (s.eventCount !== undefined && s.eventCount !== events.length) ||
    (s.reportCount !== undefined && s.reportCount !== reports) ||
    (s.contributionCount !== undefined && s.contributionCount !== contributions)
  ) {
    extra.sanityCounts = storedCounts;
    report.notes.sessionsWithStoredCountMismatch++;
  }

  expected.sessions.add(id);
  sessionBuffer.push({
    id,
    visitor_hash: str(s.visitorHash) ?? "unknown",
    started_at: startedAt,
    last_event_at: lastEventAt,
    entry: str(s.entry),
    referrer: str(s.referrer),
    landing_path: str(s.landingPath),
    user_agent: str(s.userAgent),
    country: str(s.country),
    city: str(s.city),
    utm_source: str(s.utm_source),
    utm_medium: str(s.utm_medium),
    utm_campaign: str(s.utm_campaign),
    event_count: events.length,
    report_count: reports,
    contribution_count: contributions,
    origin,
    sanity_ref: ref,
    extra: Object.keys(extra).length ? extra : null
  });

  for (const [i, e] of events.entries()) {
    const eid = eventIds[i];
    if (seenEventIds.has(eid)) {
      report.skipped.duplicateEventRows++;
      continue;
    }
    seenEventIds.add(eid);
    expected.events.add(eid);
    const createdAt = time(e.createdAt);
    if (!createdAt) report.notes.eventsWithoutCreatedAt++;
    count(report.source.eventsByType, String(e.event));
    report.source.events++;
    eventBuffer.push({
      id: eid,
      session_id: id,
      event: String(e.event ?? "unknown"),
      created_at: createdAt ?? startedAt,
      path: str(e.path),
      program_slug: str(e.programSlug),
      not_found: e.notFound === true,
      key: str(e.key),
      label: str(e.label),
      social: str(e.social),
      activation_url: str(e.activationUrl),
      program_flow: str(e.programFlow),
      listed_version: str(e.listedVersion),
      tried_version_fit: str(e.triedVersionFit),
      tried_version: str(e.triedVersion),
      source_id: str(e.sourceId),
      extra: extraOf(e, EVENT_FIELDS)
    });
  }

  if (sessionBuffer.length >= BATCH) await flushSessions();
  if (eventBuffer.length >= BATCH) await flushEvents();
}

async function addReport(r, { sanityId, ref, origin, fallbackTime }) {
  // Identical copies of one report landed in several bundles (old bundling race); keep the first.
  if (seenReportIds.has(sanityId)) {
    report.skipped.duplicateKeyReportCopies.push(ref);
    return;
  }
  seenReportIds.add(sanityId);
  expected.keyReports.add(sanityId);
  const createdAt = time(r.createdAt) ?? time(r._createdAt) ?? fallbackTime;
  if (!createdAt) throw new Error(`Key report without a timestamp: ${ref}`);
  reportBuffer.push({
    sanity_id: sanityId,
    event_type: String(r.eventType ?? "unknown"),
    program_slug: str(r.programSlug),
    key: str(r.key),
    label: str(r.label),
    path: str(r.path),
    referrer: str(r.referrer),
    user_agent: str(r.userAgent),
    country: str(r.country),
    city: str(r.city),
    utm_source: str(r.utm_source),
    utm_medium: str(r.utm_medium),
    utm_campaign: str(r.utm_campaign),
    ip_hash: str(r.ipHash),
    listed_version: str(r.listedVersion),
    tried_version_fit: str(r.triedVersionFit),
    tried_version: str(r.triedVersion),
    created_at: createdAt,
    origin,
    sanity_ref: ref,
    extra: extraOf(r, REPORT_FIELDS)
  });
  if (reportBuffer.length >= BATCH) await flushReports();
}

function addVisitorCandidate(v, { ref, live }) {
  const hash = str(v.visitorHash);
  if (!hash) return;
  const list = visitorCandidates.get(hash) ?? [];
  list.push({ row: v, ref, live });
  visitorCandidates.set(hash, list);
}

function visitorRow(hash, { row: v, ref, live }) {
  const now = new Date().toISOString();
  return {
    visitor_hash: hash,
    visit_count: num(v.visitCount),
    last_activity_at: time(v.lastActivityAt),
    visit_tier: str(v.visitTier) ?? "new",
    is_spammer: v.isSpammer === true,
    spam_marked_at: time(v.spamMarkedAt),
    report_count: num(v.reportCount),
    suggestion_count: num(v.suggestionCount),
    comment_count: num(v.commentCount),
    contribution_score: num(v.contributionScore),
    country: str(v.country),
    city: str(v.city),
    geo_updated_at: time(v.geoUpdatedAt),
    created_at: time(v.createdAt) ?? time(v._createdAt) ?? now,
    updated_at: time(v.updatedAt) ?? time(v._updatedAt) ?? now,
    origin: live ? "sanity_live" : "sanity_bundle",
    sanity_ref: ref,
    extra: extraOf(v, VISITOR_FIELDS)
  };
}

/** Live doc wins (it already carries archived counts forward), else the newest lastActivityAt. */
function pickVisitor(candidates) {
  return [...candidates].sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1;
    return String(b.row.lastActivityAt ?? "").localeCompare(String(a.row.lastActivityAt ?? ""));
  });
}

async function writeVisitors() {
  report.source.uniqueVisitorHashes = visitorCandidates.size;
  const winners = [];
  const snapshots = [];
  for (const [hash, candidates] of visitorCandidates) {
    const [best, ...rest] = pickVisitor(candidates);
    expected.visitors.add(hash);
    winners.push(visitorRow(hash, best));
    for (const c of rest) snapshots.push({ sanity_ref: c.ref, visitor_hash: hash, data: c.row });
  }
  report.written.visitorSnapshots = snapshots.length;
  if (!sql) return;
  for (let i = 0; i < winners.length; i += BATCH) {
    await sql`insert into analytics.visitors ${sql(winners.slice(i, i + BATCH))} on conflict (visitor_hash) do nothing`;
  }
  for (let i = 0; i < snapshots.length; i += BATCH) {
    await sql`insert into analytics.visitor_snapshots ${sql(snapshots.slice(i, i + BATCH))} on conflict (sanity_ref) do nothing`;
  }
}

async function handleDoc(doc) {
  const type = doc._type;
  count(report.source.docsByType, type);
  if (String(doc._id).startsWith("drafts.")) {
    report.source.drafts++;
    return;
  }

  if (types.has("sessions") && type === "trackingSession") {
    report.source.liveSessions++;
    const suffix = String(doc._id).replace(/^trackingSession\./, "");
    await addSession(doc, { id: idFor(suffix, doc._id), ref: doc._id, origin: "sanity_live" });
  } else if (types.has("sessions") && type === "trackingSessionBundle") {
    const origin = doc.origin === "migration" ? "sanity_migration" : "sanity_bundle";
    for (const [i, s] of (doc.sessions ?? []).entries()) {
      report.source.bundledSessions++;
      if (origin === "sanity_migration") report.source.migrationBundleSessions++;
      const ref = `${doc._id}#${s._key ?? i}`;
      await addSession(s, { id: idFor(s._key, ref), ref, origin });
    }
  } else if (types.has("keyReports") && type === "keyReport") {
    report.source.liveKeyReports++;
    await addReport(doc, { sanityId: doc._id, ref: doc._id, origin: "sanity_live" });
  } else if (types.has("keyReports") && type === "keyReportBundle") {
    for (const [i, r] of (doc.reports ?? []).entries()) {
      report.source.bundledKeyReports++;
      const ref = `${doc._id}#${r._key ?? i}`;
      await addReport(r, {
        sanityId: str(r.sourceId) ?? ref,
        ref,
        origin: "sanity_bundle",
        fallbackTime: time(doc.timeRangeStart) ?? time(doc.bundledAt)
      });
    }
  } else if (types.has("visitors") && type === "visitor") {
    report.source.liveVisitors++;
    addVisitorCandidate(doc, { ref: doc._id, live: true });
  } else if (types.has("visitors") && type === "visitorBundle") {
    for (const [i, v] of (doc.visitors ?? []).entries()) {
      report.source.bundledVisitors++;
      addVisitorCandidate(v, { ref: `${doc._id}#${v._key ?? i}`, live: false });
    }
  } else if (types.has("legacy") && LEGACY_TYPES.has(type)) {
    report.source.legacyDocs++;
    legacyBuffer.push({ sanity_id: doc._id, type, doc });
    if (legacyBuffer.length >= 100) await flushLegacy();
  }
}

/** Every exported id must now exist in Postgres. */
async function verifyIds(label, query, ids) {
  const all = [...ids];
  let found = 0;
  for (let i = 0; i < all.length; i += VERIFY_BATCH) {
    const chunk = all.slice(i, i + VERIFY_BATCH);
    const [row] = await query(chunk);
    found += Number(row.n);
  }
  report.verify[label] = { expected: all.length, found, missing: all.length - found };
}

async function main() {
  console.log(`${dryRun ? "[dry run] " : ""}Reading ${file}`);
  if (sql) {
    const [run] = await sql`insert into analytics.migration_runs (export_file) values (${report.file}) returning id`;
    runId = run.id;
  }

  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
  let lines = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    await handleDoc(JSON.parse(line));
    if (++lines % 50 === 0) process.stdout.write(`\r  ${lines} docs, ${report.source.events} events`);
  }
  await flushEvents();
  await flushSessions();
  await flushReports();
  await flushLegacy();
  if (types.has("visitors")) await writeVisitors();
  process.stdout.write(`\r  ${lines} docs, ${report.source.events} events\n`);

  if (sql && types.has("sessions")) {
    // Counters follow the rows that are actually stored (merged sessions included).
    const recomputed = await sql`
      update analytics.sessions s set
        event_count        = c.n,
        report_count       = c.reports,
        contribution_count = c.contributions,
        started_at         = least(s.started_at, c.first_at),
        last_event_at      = greatest(s.last_event_at, c.last_at)
      from (
        select session_id,
               count(*)::int as n,
               count(*) filter (where event like 'report\\_%')::int as reports,
               count(*) filter (where event like 'report\\_%'
                                or event in ('comment', 'comment_reply', 'key_suggestion', 'contact'))::int as contributions,
               min(created_at) as first_at,
               max(created_at) as last_at
        from analytics.events
        group by session_id
      ) c
      where c.session_id = s.id
        and (s.event_count, s.report_count, s.contribution_count) is distinct from (c.n, c.reports, c.contributions)
    `;
    report.written.sessionCountersRecomputed = recomputed.count;
  }

  if (sql) {
    console.log("Verifying every exported id exists in Postgres...");
    if (types.has("sessions")) {
      await verifyIds("sessions", c => sql`select count(*) as n from analytics.sessions where id in ${sql(c)}`, expected.sessions);
      await verifyIds("events", c => sql`select count(*) as n from analytics.events where id in ${sql(c)}`, expected.events);
    }
    if (types.has("keyReports")) {
      await verifyIds("keyReports", c => sql`select count(*) as n from analytics.key_reports where sanity_id in ${sql(c)}`, expected.keyReports);
    }
    if (types.has("visitors")) {
      await verifyIds("visitors", c => sql`select count(*) as n from analytics.visitors where visitor_hash in ${sql(c)}`, expected.visitors);
    }
    const [size] = await sql`select pg_size_pretty(pg_database_size(current_database())) as size`;
    report.databaseSize = size.size;
  }

  report.written.sessions = expected.sessions.size;
  report.written.events = expected.events.size;
  report.written.keyReports = expected.keyReports.size;
  report.written.visitors = expected.visitors.size;
  report.written.legacyDocs = report.source.legacyDocs;
  report.finishedAt = new Date().toISOString();

  const missing = Object.values(report.verify).reduce((n, v) => n + v.missing, 0);
  report.ok = missing === 0;

  const out = `migration-report-${report.startedAt.replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  if (sql) {
    await sql`update analytics.migration_runs set finished_at = now(), report = ${sql.json(report)} where id = ${runId}`;
    await sql.end();
  }

  const s = report.source;
  console.log(`
Source:   ${s.liveSessions + s.bundledSessions} sessions (${s.liveSessions} live), ${s.events} unique events,
          ${s.liveKeyReports + s.bundledKeyReports} key reports, ${s.liveVisitors + s.bundledVisitors} visitor rows (${s.uniqueVisitorHashes} hashes), ${s.legacyDocs} legacy docs
Skipped:  ${report.skipped.duplicateSessionCopies.length} duplicate session copies, ${report.skipped.duplicateEventRows} duplicate event rows, ${report.skipped.duplicateKeyReportCopies.length} duplicate key report copies
Verify:   ${dryRun ? "skipped (dry run)" : Object.entries(report.verify).map(([k, v]) => `${k} ${v.found}/${v.expected}`).join(", ")}
Database: ${report.databaseSize ?? "-"}
Report:   ${out}
${dryRun ? "" : report.ok ? "OK: every exported record is in Postgres." : "FAILED: some records are missing, see the report."}`);
  if (!dryRun && !report.ok) process.exit(1);
}

main().catch(async err => {
  console.error("\nMigration failed:", err);
  if (sql) await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
});
