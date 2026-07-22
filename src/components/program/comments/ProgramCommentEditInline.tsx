"use client";

import { useState } from "react";
import { commentBodyToPlain, MAX_COMMENT_BODY } from "@/src/lib/program/commentBody";
import type { ProgramComment, ProgramCommentReply } from "@/src/types/program";

type ProgramCommentEditInlineProps = {
  programSlug: string;
  commentKey: string;
  replyKey?: string;
  body: ProgramComment["body"] | ProgramCommentReply["body"];
  onSaved: () => void;
  onCancel: () => void;
};

export default function ProgramCommentEditInline({
  programSlug,
  commentKey,
  replyKey,
  body,
  onSaved,
  onCancel
}: ProgramCommentEditInlineProps) {
  const [text, setText] = useState(() => commentBodyToPlain(body));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Comment cannot be empty.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/program-comments", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programSlug,
          commentKey,
          ...(replyKey ? { replyKey } : {}),
          body: trimmed
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json?.error?.message === "string" ? json.error.message : "Could not save changes.";
        setError(msg);
        return;
      }
      onSaved();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-2 space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value.slice(0, MAX_COMMENT_BODY))}
        maxLength={MAX_COMMENT_BODY}
        rows={4}
        autoFocus
        className="w-full resize-y rounded-sm border border-[#4a90c4] bg-[#16202d] px-3 py-2 text-sm text-[#c6d4df] focus:border-[#66c0f4] focus:outline-none"
        aria-label="Edit comment"
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm border border-[#5c8529] bg-[#4c6b22] px-3 py-1.5 text-xs font-bold text-[#c6d4df] hover:bg-[#5c8529] hover:text-white disabled:opacity-60 cursor-pointer">
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onCancel}
          className="text-xs font-semibold text-[#66c0f4] hover:text-white cursor-pointer disabled:opacity-60">
          Cancel
        </button>
        <span className="text-xs text-[#8f98a0]">
          {text.length}/{MAX_COMMENT_BODY}
        </span>
      </div>
      {error ? <p className="text-xs text-[#e8632a]">{error}</p> : null}
    </form>
  );
}
