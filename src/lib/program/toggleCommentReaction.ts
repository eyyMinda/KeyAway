import { client } from "@/src/sanity/lib/client";
import {
  aggregateCommentReactions,
  MAX_REACTION_ROWS,
  MAX_REACTIONS_PER_VISITOR,
  reactionStorageKey
} from "@/src/lib/program/commentReactions";
import type { ProgramCommentReaction, ProgramCommentReactionSummary } from "@/src/types/program";

type SanityReactionRow = ProgramCommentReaction & { _key: string; _type: "programCommentReaction" };

export type ReactionTarget =
  | { kind: "comment"; commentKey: string }
  | { kind: "reply"; commentKey: string; replyKey: string };

function newKey(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function escapeKey(key: string): string {
  return key.replace(/"/g, "");
}

function reactionsFieldPath(target: ReactionTarget): string {
  const commentKey = escapeKey(target.commentKey);
  if (target.kind === "comment") {
    return `programComments[_key=="${commentKey}"].reactions`;
  }
  const replyKey = escapeKey(target.replyKey);
  return `programComments[_key=="${commentKey}"].replies[_key=="${replyKey}"].reactions`;
}

export async function fetchReactions(
  programId: string,
  target: ReactionTarget
): Promise<ProgramCommentReaction[]> {
  const commentKey = escapeKey(target.commentKey);
  if (target.kind === "reply") {
    const replyKey = escapeKey(target.replyKey);
    const rows = await client.fetch<ProgramCommentReaction[] | null>(
      `*[_id == $id][0].programComments[_key == $commentKey][0].replies[_key == $replyKey][0].reactions[]{ _key, emoji, ipHash, createdAt }`,
      { id: programId, commentKey, replyKey }
    );
    return rows ?? [];
  }
  const rows = await client.fetch<ProgramCommentReaction[] | null>(
    `*[_id == $id][0].programComments[_key == $commentKey][0].reactions[]{ _key, emoji, ipHash, createdAt }`,
    { id: programId, commentKey }
  );
  return rows ?? [];
}

export async function fetchProgramReactionSummaryMap(
  programId: string,
  viewerHash?: string | null
): Promise<Record<string, ProgramCommentReactionSummary[]>> {
  const comments = await client.fetch<
    Array<{
      _key?: string;
      reactions?: ProgramCommentReaction[];
      replies?: Array<{ _key?: string; reactions?: ProgramCommentReaction[] }>;
    }> | null
  >(
    `*[_id == $id][0].programComments[]{
      _key,
      reactions[]{ emoji, ipHash },
      replies[]{
        _key,
        reactions[]{ emoji, ipHash }
      }
    }`,
    { id: programId }
  );

  const map: Record<string, ProgramCommentReactionSummary[]> = {};
  for (const c of comments ?? []) {
    if (!c._key) continue;
    map[reactionStorageKey(c._key)] = aggregateCommentReactions(c.reactions, viewerHash);
    for (const reply of c.replies ?? []) {
      if (!reply._key) continue;
      map[reactionStorageKey(c._key, reply._key)] = aggregateCommentReactions(reply.reactions, viewerHash);
    }
  }
  return map;
}

function visitorDistinctEmojiCount(reactions: ProgramCommentReaction[], ipHash: string): number {
  return new Set(reactions.filter(r => r.ipHash === ipHash).map(r => r.emoji).filter(Boolean)).size;
}

export async function toggleCommentReaction(opts: {
  programId: string;
  target: ReactionTarget;
  emoji: string;
  ipHash: string;
}): Promise<{ reactions: ProgramCommentReactionSummary[]; action: "added" | "removed"; storageKey: string }> {
  const { programId, target, emoji, ipHash } = opts;
  const storageKey = reactionStorageKey(
    target.commentKey,
    target.kind === "reply" ? target.replyKey : undefined
  );
  const path = reactionsFieldPath(target);
  const existing = await fetchReactions(programId, target);

  const match = existing.find(r => r.emoji === emoji && r.ipHash === ipHash);
  if (match?._key) {
    const reactionKey = escapeKey(match._key);
    await client
      .patch(programId)
      .unset([`${path}[_key=="${reactionKey}"]`])
      .commit({ autoGenerateArrayKeys: true });

    const next = existing.filter(r => r._key !== match._key);
    return { reactions: aggregateCommentReactions(next, ipHash), action: "removed", storageKey };
  }

  if (existing.length >= MAX_REACTION_ROWS) {
    throw new Error("REACTION_LIMIT");
  }

  const visitorEmojiCount = visitorDistinctEmojiCount(existing, ipHash);
  const visitorAlreadyHasEmoji = existing.some(r => r.emoji === emoji && r.ipHash === ipHash);
  if (!visitorAlreadyHasEmoji && visitorEmojiCount >= MAX_REACTIONS_PER_VISITOR) {
    throw new Error("VISITOR_EMOJI_LIMIT");
  }

  const row: SanityReactionRow = {
    _key: newKey(),
    _type: "programCommentReaction",
    emoji,
    ipHash,
    createdAt: new Date().toISOString()
  };

  await client
    .patch(programId)
    .setIfMissing({ [path]: [] })
    .insert("after", `${path}[-1]`, [row])
    .commit({ autoGenerateArrayKeys: true });

  return {
    reactions: aggregateCommentReactions([...existing, row], ipHash),
    action: "added",
    storageKey
  };
}

/** @deprecated use fetchProgramReactionSummaryMap */
export const fetchProgramCommentReactionMap = fetchProgramReactionSummaryMap;
