/**
 * @fileoverview Cutover bridge. The first time a visitor hash is seen, copy its final Sanity state
 * (live doc, else newest bundled row) into Postgres so tiers, counters and spam flags carry over
 * before the history import has run. Set `ANALYTICS_SANITY_SEEDING=off` once
 * `npm run migrate:analytics` has finished; delete this file with the Sanity analytics cleanup.
 */
import { client } from "@/src/sanity/lib/client";
import { db } from "@/src/lib/db/postgres";

type SanityVisitor = {
  _id?: string;
  visitorHash?: string;
  visitCount?: number;
  lastActivityAt?: string;
  visitTier?: string;
  isSpammer?: boolean;
  spamMarkedAt?: string;
  reportCount?: number;
  suggestionCount?: number;
  commentCount?: number;
  contributionScore?: number;
  country?: string;
  city?: string;
  geoUpdatedAt?: string;
  createdAt?: string;
};

const FIELDS = `visitorHash, visitCount, lastActivityAt, visitTier, isSpammer, spamMarkedAt, reportCount,
  suggestionCount, commentCount, contributionScore, country, city, geoUpdatedAt, createdAt`;

const checked = new Set<string>();
const MAX_CHECKED = 50_000;

export function isSanitySeedingEnabled(): boolean {
  return process.env.ANALYTICS_SANITY_SEEDING !== "off";
}

async function fetchSanityVisitor(visitorHash: string): Promise<{ row: SanityVisitor; ref: string } | null> {
  const { live, archived } = await client.fetch<{
    live?: SanityVisitor | null;
    archived?: Array<SanityVisitor & { bundleId: string }>;
  }>(
    `{
      "live": *[_type == "visitor" && visitorHash == $h][0]{ _id, ${FIELDS} },
      "archived": *[_type == "visitorBundle" && ($h in visitorHashes || !defined(visitorHashes))]{
        "rows": visitors[visitorHash == $h]{ "bundleId": ^._id, ${FIELDS} }
      }.rows[]
    }`,
    { h: visitorHash }
  );
  if (live?.visitorHash) return { row: live, ref: live._id ?? visitorHash };
  const newest = (archived ?? [])
    .filter(r => r.visitorHash === visitorHash)
    .sort((a, b) => (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? ""))[0];
  return newest ? { row: newest, ref: newest.bundleId } : null;
}

/** No-op once the hash was checked in this instance, or when seeding is off. Never throws. */
export async function ensureVisitorSeeded(visitorHash: string): Promise<void> {
  if (!isSanitySeedingEnabled() || !visitorHash || checked.has(visitorHash)) return;
  try {
    const sql = db();
    const [existing] = await sql`select 1 as found from analytics.visitors where visitor_hash = ${visitorHash}`;
    if (!existing) {
      const found = await fetchSanityVisitor(visitorHash);
      if (found) {
        const v = found.row;
        await sql`
          insert into analytics.visitors (
            visitor_hash, visit_count, last_activity_at, visit_tier, is_spammer, spam_marked_at, report_count,
            suggestion_count, comment_count, contribution_score, country, city, geo_updated_at, created_at,
            origin, sanity_ref
          ) values (
            ${visitorHash}, ${v.visitCount ?? 0}, ${v.lastActivityAt ?? null}, ${v.visitTier ?? "new"},
            ${v.isSpammer === true}, ${v.spamMarkedAt ?? null}, ${v.reportCount ?? 0}, ${v.suggestionCount ?? 0},
            ${v.commentCount ?? 0}, ${v.contributionScore ?? 0}, ${v.country ?? null}, ${v.city ?? null},
            ${v.geoUpdatedAt ?? null}, ${v.createdAt ?? new Date().toISOString()}, 'sanity_seed', ${found.ref}
          )
          on conflict (visitor_hash) do nothing
        `;
      }
    }
    if (checked.size >= MAX_CHECKED) checked.clear();
    checked.add(visitorHash);
  } catch (err) {
    console.error("[ensureVisitorSeeded]", err);
  }
}
