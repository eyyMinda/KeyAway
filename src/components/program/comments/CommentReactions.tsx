"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaRegSmile } from "react-icons/fa";
import EmojiPickerPopover from "@/src/components/program/comments/EmojiPickerPopover";
import {
  aggregateCommentReactions,
  applyOptimisticReactionToggle,
  canVisitorAddReaction,
  countVisitorReactionTypes,
  MAX_REACTIONS_PER_VISITOR,
  orderReactionsForDisplay
} from "@/src/lib/program/commentReactions";
import type { ProgramCommentReaction, ProgramCommentReactionSummary } from "@/src/types/program";

type CommentReactionsProps = {
  programSlug: string;
  commentKey: string;
  replyKey?: string;
  initialReactions?: ProgramCommentReaction[];
  /** Full summaries with counts + `reacted` (from GET). Display applies visibility rules. */
  summaries?: ProgramCommentReactionSummary[] | null;
  disabled?: boolean;
};

export default function CommentReactions({
  programSlug,
  commentKey,
  replyKey,
  initialReactions,
  summaries,
  disabled = false
}: CommentReactionsProps) {
  const [allSummaries, setAllSummaries] = useState<ProgramCommentReactionSummary[]>(() =>
    summaries ?? aggregateCommentReactions(initialReactions)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const allSummariesRef = useRef(allSummaries);
  allSummariesRef.current = allSummaries;

  useEffect(() => {
    if (summaries) setAllSummaries(summaries);
  }, [summaries]);

  const visibleItems = useMemo(() => orderReactionsForDisplay(allSummaries), [allSummaries]);

  const atVisitorEmojiLimit = countVisitorReactionTypes(allSummaries) >= MAX_REACTIONS_PER_VISITOR;

  const toggleEmoji = useCallback(
    async (emoji: string) => {
      if (disabled || busy || !emoji) return;

      const prev = allSummariesRef.current;
      const row = prev.find(r => r.emoji === emoji);
      const isRemoving = Boolean(row?.reacted);

      if (!isRemoving && !canVisitorAddReaction(prev, emoji)) {
        setError(`You can react with at most ${MAX_REACTIONS_PER_VISITOR} different emojis here.`);
        return;
      }

      setBusy(true);
      setError(null);
      setAllSummaries(applyOptimisticReactionToggle(prev, emoji));

      try {
        const res = await fetch("/api/v1/program-comments/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programSlug,
            commentKey,
            ...(replyKey ? { replyKey } : {}),
            emoji
          })
        });
        const json = (await res.json().catch(() => ({}))) as {
          data?: { reactions?: ProgramCommentReactionSummary[] };
          error?: { message?: string };
        };
        if (!res.ok) {
          setAllSummaries(prev);
          setError(json.error?.message ?? "Could not update reaction.");
          return;
        }
        if (json.data?.reactions) setAllSummaries(json.data.reactions);
      } catch {
        setAllSummaries(prev);
        setError("Could not update reaction.");
      } finally {
        setBusy(false);
      }
    },
    [busy, commentKey, disabled, programSlug, replyKey]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visibleItems.map(item => (
        <button
          key={item.emoji}
          type="button"
          disabled={disabled || busy}
          onClick={() => toggleEmoji(item.emoji)}
          className={`inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-xs transition-colors cursor-pointer disabled:opacity-60 ${
            item.reacted
              ? "border-[#4a90c4] bg-[#1a3a5c] text-white"
              : "border-[#2a475e] bg-[#1b2838] text-[#c6d4df] hover:border-[#4a90c4]"
          }`}
          aria-pressed={item.reacted}
          aria-label={`React with ${item.emoji}, ${item.count} ${item.count === 1 ? "person" : "people"}`}>
          <span className="font-emoji text-base" aria-hidden>
            {item.emoji}
          </span>
          <span className="font-semibold tabular-nums">{item.count}</span>
        </button>
      ))}

      <button
        ref={emojiButtonRef}
        type="button"
        disabled={disabled || busy || atVisitorEmojiLimit}
        title={
          atVisitorEmojiLimit
            ? `You can use up to ${MAX_REACTIONS_PER_VISITOR} different emojis (remove one to add another)`
            : undefined
        }
        onClick={() => setShowPicker(v => !v)}
        className="inline-flex items-center gap-1.5 rounded-sm border border-[#2a475e] bg-[#1b2838] px-2 py-1 text-xs font-medium text-[#c6d4df] hover:border-[#4a90c4] cursor-pointer disabled:opacity-60"
        aria-expanded={showPicker}
        aria-label="Add reaction">
        <FaRegSmile className="text-[#66c0f4]" />
        React
      </button>

      <EmojiPickerPopover
        open={showPicker}
        onClose={() => setShowPicker(false)}
        anchorRef={emojiButtonRef}
        onSelect={emoji => {
          setShowPicker(false);
          void toggleEmoji(emoji);
        }}
      />

      {error ? <span className="w-full text-xs text-[#e8632a]">{error}</span> : null}
    </div>
  );
}
