"use client";

import { useCallback, useRef, useState } from "react";
import { FaRegSmile } from "react-icons/fa";
import EmojiPickerPopover from "@/src/components/program/comments/EmojiPickerPopover";
import { useAdminAccess } from "@/src/hooks/useAdminAccess";
import { MAX_COMMENT_AUTHOR, MAX_COMMENT_BODY } from "@/src/lib/program/commentBody";
import { STAFF_COMMENT_AUTHOR_NAME, STAFF_COMMENT_AUTHOR_ROLE } from "@/src/lib/program/staffCommentIdentity";

type ProgramCommentFormProps = {
  programSlug: string;
  programTitle: string;
  replyTo?: { commentKey: string; authorName: string } | null;
  onCancelReply?: () => void;
  onPosted: () => void;
};

const AUTHOR_STORAGE_KEY = "keyaway_comment_author";

export default function ProgramCommentForm({
  programSlug,
  programTitle,
  replyTo,
  onCancelReply,
  onPosted
}: ProgramCommentFormProps) {
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [authorName, setAuthorName] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(AUTHOR_STORAGE_KEY) ?? "";
  });
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insertEmoji = useCallback(
    (emoji: string) => {
      const el = textareaRef.current;
      if (!el) {
        setBody(prev => `${prev}${emoji}`.slice(0, MAX_COMMENT_BODY));
        return;
      }
      const start = el.selectionStart ?? body.length;
      const end = el.selectionEnd ?? body.length;
      const next = `${body.slice(0, start)}${emoji}${body.slice(end)}`;
      setBody(next.slice(0, MAX_COMMENT_BODY));
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + emoji.length;
        el.setSelectionRange(pos, pos);
      });
    },
    [body]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const text = body.trim();
    const name = isAdmin ? STAFF_COMMENT_AUTHOR_NAME : authorName.trim();
    if (!text || (!isAdmin && !name)) {
      setError(isAdmin ? "Comment is required." : "Name and comment are required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/program-comments", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programSlug,
          ...(!isAdmin ? { authorName: name } : {}),
          body: text,
          website,
          ...(replyTo ? { parentCommentKey: replyTo.commentKey } : {})
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json?.error?.message === "string" ? json.error.message : "Could not post comment. Try again.";
        setError(msg);
        return;
      }

      if (!isAdmin) window.localStorage.setItem(AUTHOR_STORAGE_KEY, name);
      setBody("");
      setShowEmoji(false);
      onCancelReply?.();
      onPosted();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="website"
        value={website}
        onChange={e => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {replyTo ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm border border-[#4a90c4] bg-[#1a2f45] px-3 py-2 text-sm text-[#c6d4df]">
          <span>
            Replying to <strong className="text-white">{replyTo.authorName}</strong>
          </span>
          {onCancelReply ? (
            <button
              type="button"
              onClick={onCancelReply}
              className="text-xs font-semibold text-[#66c0f4] hover:text-white">
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}

      {!adminLoading && isAdmin ? (
        <p className="rounded-sm border border-[#4a90c4] bg-[#1a2f45] px-3 py-2 text-sm text-[#c6d4df]">
          Posting as <strong className="text-white">{STAFF_COMMENT_AUTHOR_NAME}</strong>
          <span className="text-[#8f98a0]"> · {STAFF_COMMENT_AUTHOR_ROLE}</span>
        </p>
      ) : (
        <div>
          <label htmlFor="comment-author" className="mb-1 block text-sm font-medium text-[#c6d4df]">
            Display name
          </label>
          <input
            id="comment-author"
            type="text"
            value={authorName}
            onChange={e => setAuthorName(e.target.value.slice(0, MAX_COMMENT_AUTHOR))}
            maxLength={MAX_COMMENT_AUTHOR}
            autoComplete="nickname"
            className="w-full rounded-sm border border-[#2a475e] bg-[#16202d] px-3 py-2 text-sm text-[#c6d4df] placeholder:text-[#8f98a0] focus:border-[#4a90c4] focus:outline-none"
            placeholder="Your name"
          />
        </div>
      )}

      <div>
        <label htmlFor="comment-body" className="mb-1 block text-sm font-medium text-[#c6d4df]">
          {replyTo ? "Your reply" : `Comment on ${programTitle}`}
        </label>
        <textarea
          id="comment-body"
          ref={textareaRef}
          value={body}
          onChange={e => setBody(e.target.value.slice(0, MAX_COMMENT_BODY))}
          maxLength={MAX_COMMENT_BODY}
          rows={4}
          className="w-full resize-y rounded-sm border border-[#2a475e] bg-[#16202d] px-3 py-2 text-sm text-[#c6d4df] placeholder:text-[#8f98a0] focus:border-[#4a90c4] focus:outline-none"
          placeholder="Share activation tips, ask a question, or leave feedback…"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            ref={emojiButtonRef}
            type="button"
            onClick={() => setShowEmoji(v => !v)}
            className="inline-flex items-center gap-2 rounded-sm border border-[#2a475e] bg-[#1b2838] px-3 py-1.5 text-xs font-medium text-[#c6d4df] hover:border-[#4a90c4] cursor-pointer"
            aria-expanded={showEmoji}
            aria-label="Insert emoji">
            <FaRegSmile className="text-[#66c0f4]" />
            Emoji
          </button>
          <span className="text-xs text-[#8f98a0]">
            {body.length}/{MAX_COMMENT_BODY}
          </span>
        </div>
        <EmojiPickerPopover
          open={showEmoji}
          onClose={() => setShowEmoji(false)}
          anchorRef={emojiButtonRef}
          onSelect={insertEmoji}
        />
      </div>

      {error ? <p className="text-sm text-[#e8632a]">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-sm border border-[#5c8529] bg-[#4c6b22] px-5 py-2.5 text-sm font-bold text-[#c6d4df] transition-colors hover:bg-[#5c8529] hover:text-white disabled:opacity-60 cursor-pointer">
        {submitting ? "Posting…" : replyTo ? "Post reply" : "Post comment"}
      </button>

      <p className="text-xs text-[#8f98a0]">
        Be respectful. Spam, profanity, and abusive posts are blocked. See our{" "}
        <a href="/terms" className="text-[#66c0f4] underline hover:text-white">
          Terms
        </a>
        .
      </p>
    </form>
  );
}
