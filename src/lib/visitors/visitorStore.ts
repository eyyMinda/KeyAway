/** @fileoverview `analytics.visitors`: one row per hashed IP with visit tier, contribution counters and spam flag. */
import { db } from "@/src/lib/db/postgres";
import { MINUTE_MS } from "@/src/lib/time";
import { ensureVisitorSeeded } from "@/src/lib/visitors/sanityVisitorSeed";

export type Visitor = {
  visitorHash: string;
  visitTier: string;
  isSpammer: boolean;
  visitCount: number;
  reportCount: number;
  suggestionCount: number;
  commentCount: number;
  contributionScore: number;
  country?: string;
  city?: string;
  lastActivityAt?: string;
};

export type VisitorContributionKind = "report" | "suggestion" | "comment";

/** 30m without a page view starts a new visit (increments visitCount / tier). */
const VISIT_GAP = `${30 * MINUTE_MS} milliseconds`;

const VISITOR_COLUMNS = `visitor_hash, visit_tier, is_spammer, visit_count, report_count, suggestion_count,
  comment_count, contribution_score, country, city, last_activity_at`;

function toVisitor(row: Record<string, unknown>): Visitor {
  return {
    ...(row as Visitor),
    country: (row.country as string | null) ?? undefined,
    city: (row.city as string | null) ?? undefined,
    lastActivityAt: (row.lastActivityAt as string | null) ?? undefined
  };
}

export async function fetchVisitorByHash(visitorHash: string): Promise<Visitor | null> {
  if (!visitorHash) return null;
  await ensureVisitorSeeded(visitorHash);
  const sql = db();
  const [row] = await sql`select ${sql.unsafe(VISITOR_COLUMNS)} from analytics.visitors where visitor_hash = ${visitorHash}`;
  return row ? toVisitor(row) : null;
}

/** Batch lookup for admin tables. */
export async function fetchVisitorsByHashes(hashes: string[]): Promise<Map<string, Visitor>> {
  const unique = [...new Set(hashes.filter(Boolean))];
  const map = new Map<string, Visitor>();
  if (!unique.length) return map;
  const sql = db();
  const rows = await sql`select ${sql.unsafe(VISITOR_COLUMNS)} from analytics.visitors where visitor_hash in ${sql(unique)}`;
  for (const row of rows) map.set(row.visitorHash as string, toVisitor(row));
  return map;
}

export async function isVisitorSpammerByHash(visitorHash: string | undefined): Promise<boolean> {
  if (!visitorHash) return false;
  return (await fetchVisitorByHash(visitorHash))?.isSpammer === true;
}

/** After a stored `page_viewed`: create the visitor, or count a new visit when the last one is 30m+ old. */
export async function upsertVisitorOnPageView(
  visitorHash: string | undefined,
  location?: { country?: string; city?: string }
): Promise<void> {
  if (!visitorHash) return;
  await ensureVisitorSeeded(visitorHash);
  const country = location?.country ?? null;
  const city = location?.city ?? null;
  await db()`
    insert into analytics.visitors as v (visitor_hash, visit_count, last_activity_at, visit_tier, country, city, geo_updated_at)
    values (${visitorHash}, 1, now(), 'new', ${country}, ${city}, ${country || city ? new Date().toISOString() : null})
    on conflict (visitor_hash) do update set
      visit_count      = v.visit_count + 1,
      last_activity_at = now(),
      visit_tier       = analytics.visit_tier(v.visit_count + 1, v.contribution_score, v.is_spammer),
      country          = coalesce(excluded.country, v.country),
      city             = coalesce(excluded.city, v.city),
      geo_updated_at   = coalesce(excluded.geo_updated_at, v.geo_updated_at),
      updated_at       = now()
    where v.last_activity_at is null or v.last_activity_at < now() - ${VISIT_GAP}::interval
  `;
}

/** Successful key report, key suggestion or program comment: bump the counter and contribution score. */
export async function upsertVisitorContribution(
  visitorHash: string | undefined,
  kind: VisitorContributionKind
): Promise<void> {
  if (!visitorHash) return;
  await ensureVisitorSeeded(visitorHash);
  const report = kind === "report" ? 1 : 0;
  const suggestion = kind === "suggestion" ? 1 : 0;
  const comment = kind === "comment" ? 1 : 0;
  await db()`
    insert into analytics.visitors as v (
      visitor_hash, visit_count, last_activity_at, visit_tier, report_count, suggestion_count, comment_count, contribution_score
    )
    values (${visitorHash}, 0, now(), analytics.visit_tier(0, 1, false), ${report}, ${suggestion}, ${comment}, 1)
    on conflict (visitor_hash) do update set
      report_count       = v.report_count + ${report},
      suggestion_count   = v.suggestion_count + ${suggestion},
      comment_count      = v.comment_count + ${comment},
      contribution_score = v.contribution_score + 1,
      visit_tier         = analytics.visit_tier(v.visit_count, v.contribution_score + 1, v.is_spammer),
      last_activity_at   = now(),
      updated_at         = now()
  `;
}

/** Ensures a visitor row exists and bumps lastActivityAt (no contribution increment). */
export async function touchVisitorActivity(visitorHash: string | undefined): Promise<void> {
  if (!visitorHash) return;
  await ensureVisitorSeeded(visitorHash);
  await db()`
    insert into analytics.visitors as v (visitor_hash, visit_count, last_activity_at, visit_tier)
    values (${visitorHash}, 0, now(), 'new')
    on conflict (visitor_hash) do update set last_activity_at = now(), updated_at = now()
  `;
}

/** Admin flag. Returns false when un-flagging a hash that has no visitor row. */
export async function setVisitorSpammer(visitorHash: string, isSpammer: boolean): Promise<boolean> {
  await ensureVisitorSeeded(visitorHash);
  const sql = db();
  if (!isSpammer) {
    const rows = await sql`
      update analytics.visitors v set
        is_spammer = false,
        spam_marked_at = null,
        visit_tier = analytics.visit_tier(v.visit_count, v.contribution_score, false),
        updated_at = now()
      where v.visitor_hash = ${visitorHash}
      returning 1
    `;
    return rows.length > 0;
  }
  await sql`
    insert into analytics.visitors as v (visitor_hash, visit_count, last_activity_at, visit_tier, is_spammer, spam_marked_at)
    values (${visitorHash}, 0, now(), analytics.visit_tier(0, 0, true), true, now())
    on conflict (visitor_hash) do update set
      is_spammer     = true,
      spam_marked_at = now(),
      visit_tier     = analytics.visit_tier(v.visit_count, v.contribution_score, true),
      updated_at     = now()
  `;
  return true;
}

export interface VisitorTagAggregateRow {
  key: string;
  label: string;
  value: number;
}

const TIER_ORDER = ["new", "returning", "regular", "star"] as const;

/** Visitors active in range: count per tier plus flagged spammers. */
export async function fetchVisitorTagAggregates(since: string, until: string): Promise<VisitorTagAggregateRow[]> {
  const rows = await db()<Array<{ tier: string; count: number; spammers: number }>>`
    select coalesce(lower(visit_tier), 'new') as tier, count(*)::int as count, count(*) filter (where is_spammer)::int as spammers
    from analytics.visitors
    where last_activity_at >= ${since} and last_activity_at <= ${until}
    group by 1
  `;
  const counts = new Map(rows.map(r => [r.tier, r.count]));
  const out: VisitorTagAggregateRow[] = TIER_ORDER.map(t => ({
    key: t,
    label: t.charAt(0).toUpperCase() + t.slice(1),
    value: counts.get(t) ?? 0
  }));
  for (const t of [...counts.keys()].filter(t => !(TIER_ORDER as readonly string[]).includes(t)).sort()) {
    out.push({ key: t, label: t, value: counts.get(t) ?? 0 });
  }
  out.push({ key: "spammer", label: "Spammers (flagged)", value: rows.reduce((n, r) => n + r.spammers, 0) });
  return out;
}
