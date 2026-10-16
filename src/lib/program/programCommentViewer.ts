/** @fileoverview Per-visitor comment state (reaction summaries + owned comments) from one cached Sanity read per program. */
import { unstable_cache } from "next/cache";
import { client } from "@/src/sanity/lib/client";
import { PUBLIC_ISR_REVALIDATE_SECONDS } from "@/src/lib/cache/constants";
import { programCommentsTag } from "@/src/lib/cache/cacheTags";
import { aggregateCommentReactions, reactionStorageKey } from "@/src/lib/program/commentReactions";
import type { ProgramCommentOwnership } from "@/src/lib/program/programCommentOwnership";
import type { ProgramCommentReaction, ProgramCommentReactionSummary } from "@/src/types/program";

type Thread = {
  _key?: string;
  ipHash?: string;
  reactions?: ProgramCommentReaction[];
  replies?: Array<{ _key?: string; ipHash?: string; reactions?: ProgramCommentReaction[] }>;
};

export type ProgramCommentViewerState = {
  reactions: Record<string, ProgramCommentReactionSummary[]>;
  ownership: ProgramCommentOwnership;
};

/**
 * Server-only cache (holds visitor hashes). Comment and reaction writes expire `programCommentsTag(slug)`,
 * so page views read Sanity once per change instead of once per view. Null when the program does not exist.
 */
function getProgramCommentThreads(slug: string): Promise<{ comments: Thread[] | null } | null> {
  return unstable_cache(
    () =>
      client.fetch<{ comments: Thread[] | null } | null>(
        `*[_type == "program" && slug.current == $slug][0]{
          "comments": programComments[]{
            _key, ipHash,
            reactions[]{ emoji, ipHash },
            replies[]{ _key, ipHash, reactions[]{ emoji, ipHash } }
          }
        }`,
        { slug }
      ),
    ["program-comment-threads", slug],
    { tags: [programCommentsTag(slug)], revalidate: PUBLIC_ISR_REVALIDATE_SECONDS }
  )();
}

export async function getProgramCommentViewerState(
  slug: string,
  viewerHash: string
): Promise<ProgramCommentViewerState | null> {
  const program = await getProgramCommentThreads(slug);
  if (!program) return null;

  const reactions: Record<string, ProgramCommentReactionSummary[]> = {};
  const ownership: ProgramCommentOwnership = { commentKeys: [], replies: [] };

  for (const c of program.comments ?? []) {
    if (!c._key) continue;
    reactions[reactionStorageKey(c._key)] = aggregateCommentReactions(c.reactions, viewerHash);
    if (c.ipHash === viewerHash) ownership.commentKeys.push(c._key);
    for (const r of c.replies ?? []) {
      if (!r._key) continue;
      reactions[reactionStorageKey(c._key, r._key)] = aggregateCommentReactions(r.reactions, viewerHash);
      if (r.ipHash === viewerHash) ownership.replies.push({ commentKey: c._key, replyKey: r._key });
    }
  }

  return { reactions, ownership };
}
