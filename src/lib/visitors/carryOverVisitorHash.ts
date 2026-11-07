/**
 * @fileoverview Keeps returning visitors recognized after ANALYTICS_SALT is rotated.
 *
 * A visitor id is sha256(ip + salt), so a new salt gives everyone a new id. While ANALYTICS_SALT_PREVIOUS is set,
 * each tracked visit checks for a visitor under the old id and moves them to the new one: visitor row (merged if the
 * new id already exists), sessions and key reports in Postgres, then the ipHash on their Sanity comments, replies,
 * reactions, contact messages and key suggestions. Visitors who never come back keep the old id.
 */
import { after } from "next/server";
import { db } from "@/src/lib/db/postgres";
import { hashIp, previousIpHash } from "@/src/lib/api/requestGeo";
import { mutationClient } from "@/src/lib/sanity/mutationClient";

const SANITY_ATTEMPTS = 3;

type HashCarrier = { ipHash?: string };
type Comment = HashCarrier & {
  reactions?: HashCarrier[];
  replies?: Array<HashCarrier & { reactions?: HashCarrier[] }>;
};

/** Moves the visitor's Postgres rows; true when there was an old visitor to move. */
async function carryOverRows(oldHash: string, newHash: string): Promise<boolean> {
  return db().begin(async sql => {
    await sql`select pg_advisory_xact_lock(hashtextextended(${oldHash}, 0))`;
    const [old] = await sql`select 1 from analytics.visitors where visitor_hash = ${oldHash} for update`;
    if (!old) return false;

    // Merge into the new id: the visitor may already have been seen since the rotation.
    await sql`
      with old_row as (delete from analytics.visitors where visitor_hash = ${oldHash} returning *)
      insert into analytics.visitors as v (
        visitor_hash, visit_count, last_activity_at, visit_tier, is_spammer, spam_marked_at, report_count,
        suggestion_count, comment_count, contribution_score, country, city, geo_updated_at, created_at, updated_at,
        origin, sanity_ref, extra
      )
      select ${newHash}, visit_count, last_activity_at, visit_tier, is_spammer, spam_marked_at, report_count,
             suggestion_count, comment_count, contribution_score, country, city, geo_updated_at, created_at, now(),
             origin, sanity_ref, extra
      from old_row
      on conflict (visitor_hash) do update set
        visit_count        = v.visit_count + excluded.visit_count,
        report_count       = v.report_count + excluded.report_count,
        suggestion_count   = v.suggestion_count + excluded.suggestion_count,
        comment_count      = v.comment_count + excluded.comment_count,
        contribution_score = v.contribution_score + excluded.contribution_score,
        is_spammer         = v.is_spammer or excluded.is_spammer,
        spam_marked_at     = coalesce(v.spam_marked_at, excluded.spam_marked_at),
        last_activity_at   = greatest(v.last_activity_at, excluded.last_activity_at),
        country            = coalesce(v.country, excluded.country),
        city               = coalesce(v.city, excluded.city),
        geo_updated_at     = greatest(v.geo_updated_at, excluded.geo_updated_at),
        created_at         = least(v.created_at, excluded.created_at),
        updated_at         = now(),
        visit_tier         = analytics.visit_tier(
                               v.visit_count + excluded.visit_count,
                               v.contribution_score + excluded.contribution_score,
                               v.is_spammer or excluded.is_spammer)
    `;
    await sql`update analytics.sessions set visitor_hash = ${newHash} where visitor_hash = ${oldHash}`;
    await sql`update analytics.key_reports set ip_hash = ${newHash} where ip_hash = ${oldHash}`;
    return true;
  });
}

/** Rewrites the old hash on the visitor's Sanity documents and program comments. */
async function carryOverSanity(oldHash: string, newHash: string): Promise<void> {
  const swap = <T extends HashCarrier>(item: T): T => (item.ipHash === oldHash ? { ...item, ipHash: newHash } : item);

  const [docIds, programs] = await Promise.all([
    mutationClient.fetch<string[]>(`*[_type in ["contactMessage", "keySuggestion"] && ipHash == $old]._id`, {
      old: oldHash
    }),
    mutationClient.fetch<Array<{ _id: string; _rev: string; programComments: Comment[] }>>(
      `*[_type == "program" && (
        $old in programComments[].ipHash || $old in programComments[].replies[].ipHash ||
        $old in programComments[].reactions[].ipHash || $old in programComments[].replies[].reactions[].ipHash
      )]{ _id, _rev, programComments }`,
      { old: oldHash }
    )
  ]);
  if (!docIds.length && !programs.length) return;

  const tx = mutationClient.transaction();
  for (const id of docIds) tx.patch(id, p => p.set({ ipHash: newHash }));
  for (const program of programs) {
    const programComments = program.programComments.map(comment => ({
      ...swap(comment),
      ...(comment.reactions && { reactions: comment.reactions.map(swap) }),
      ...(comment.replies && {
        replies: comment.replies.map(reply => ({
          ...swap(reply),
          ...(reply.reactions && { reactions: reply.reactions.map(swap) })
        }))
      })
    }));
    // Only if nobody changed the comments meanwhile; otherwise the caller re-reads and tries again.
    tx.patch(program._id, p => p.ifRevisionId(program._rev).set({ programComments }));
  }
  await tx.commit({ visibility: "async" });
}

/**
 * Call before using the visitor hash on a tracked visit. No-op unless a salt rotation is in progress
 * (ANALYTICS_SALT_PREVIOUS set) and this visitor still has a record under the old hash.
 */
export async function carryOverVisitorHash(ip: string | undefined): Promise<void> {
  const oldHash = previousIpHash(ip);
  const newHash = hashIp(ip);
  if (!oldHash || !newHash || oldHash === newHash) return;

  try {
    if (!(await carryOverRows(oldHash, newHash))) return;
    // The Postgres rows have moved, so a later visit will not come back for these: retry on a revision conflict.
    after(async () => {
      for (let attempt = 1; attempt <= SANITY_ATTEMPTS; attempt++) {
        try {
          return await carryOverSanity(oldHash, newHash);
        } catch (err) {
          if (attempt === SANITY_ATTEMPTS) console.error("[carryOverVisitorHash] sanity", err);
        }
      }
    });
  } catch (err) {
    console.error("[carryOverVisitorHash]", err);
  }
}
