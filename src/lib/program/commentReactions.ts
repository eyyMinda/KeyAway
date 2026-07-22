import type { ProgramCommentReaction, ProgramCommentReactionSummary } from "@/src/types/program";

export const MAX_REACTION_EMOJI_LENGTH = 16;
/** Max reaction chips shown on a comment/reply (popularity + viewer's own). */
export const MAX_VISIBLE_REACTION_EMOJI_TYPES = 6;
/** Max distinct emojis one visitor may have active on one comment/reply. */
export const MAX_REACTIONS_PER_VISITOR = 3;
/** Safety cap on total reaction rows per comment/reply (spam/abuse). */
export const MAX_REACTION_ROWS = 500;

/** Map key for GET/POST: comment only, or `commentKey:replyKey`. */
export function reactionStorageKey(commentKey: string, replyKey?: string | null): string {
  return replyKey?.trim() ? `${commentKey}:${replyKey.trim()}` : commentKey;
}

/** Strip ZWJ / variation selectors noise and enforce length. */
export function sanitizeReactionEmoji(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const emoji = raw.trim();
  if (!emoji || emoji.length > MAX_REACTION_EMOJI_LENGTH) return null;
  if (/^[\s\p{C}]+$/u.test(emoji)) return null;
  return emoji;
}

function sortByPopularity(a: ProgramCommentReactionSummary, b: ProgramCommentReactionSummary): number {
  return b.count - a.count || a.emoji.localeCompare(b.emoji);
}

export function aggregateCommentReactions(
  reactions: ProgramCommentReaction[] | undefined | null,
  viewerHash?: string | null
): ProgramCommentReactionSummary[] {
  const counts = new Map<string, { count: number; reacted: boolean }>();

  for (const row of reactions ?? []) {
    const emoji = typeof row.emoji === "string" ? row.emoji.trim() : "";
    if (!emoji) continue;
    const prev = counts.get(emoji) ?? { count: 0, reacted: false };
    prev.count += 1;
    if (viewerHash && row.ipHash === viewerHash) prev.reacted = true;
    counts.set(emoji, prev);
  }

  return [...counts.entries()].map(([emoji, { count, reacted }]) => ({ emoji, count, reacted }));
}

/** Viewer emojis first (by count), then top others by count — max `MAX_VISIBLE_REACTION_EMOJI_TYPES`. */
export function orderReactionsForDisplay(
  summaries: ProgramCommentReactionSummary[]
): ProgramCommentReactionSummary[] {
  if (summaries.length === 0) return [];

  const mine = summaries.filter(s => s.reacted).sort(sortByPopularity);
  const others = summaries.filter(s => !s.reacted).sort(sortByPopularity);

  const visible: ProgramCommentReactionSummary[] = [];
  const seen = new Set<string>();

  for (const s of mine) {
    if (visible.length >= MAX_VISIBLE_REACTION_EMOJI_TYPES) break;
    visible.push(s);
    seen.add(s.emoji);
  }
  for (const s of others) {
    if (visible.length >= MAX_VISIBLE_REACTION_EMOJI_TYPES) break;
    if (seen.has(s.emoji)) continue;
    visible.push(s);
  }
  return visible;
}

export function countVisitorReactionTypes(summaries: ProgramCommentReactionSummary[]): number {
  return summaries.filter(s => s.reacted).length;
}

/** Whether this visitor may add (not remove) a reaction for `emoji`. */
export function canVisitorAddReaction(
  summaries: ProgramCommentReactionSummary[],
  emoji: string
): boolean {
  const row = summaries.find(s => s.emoji === emoji);
  if (row?.reacted) return true;
  if (countVisitorReactionTypes(summaries) >= MAX_REACTIONS_PER_VISITOR) return false;
  return true;
}

export function applyOptimisticReactionToggle(
  summaries: ProgramCommentReactionSummary[],
  emoji: string
): ProgramCommentReactionSummary[] {
  const row = summaries.find(s => s.emoji === emoji);
  if (row?.reacted) {
    const nextCount = row.count - 1;
    if (nextCount <= 0) return summaries.filter(s => s.emoji !== emoji);
    return summaries.map(s => (s.emoji === emoji ? { ...s, count: nextCount, reacted: false } : s));
  }
  if (row) {
    return summaries.map(s => (s.emoji === emoji ? { ...s, count: s.count + 1, reacted: true } : s));
  }
  return [...summaries, { emoji, count: 1, reacted: true }];
}
