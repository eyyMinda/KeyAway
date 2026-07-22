"use client";

import { useMemo, useState } from "react";
import CommentBodyText from "@/src/components/program/comments/CommentBodyText";
import CommentReactions from "@/src/components/program/comments/CommentReactions";
import ProgramCommentEditInline from "@/src/components/program/comments/ProgramCommentEditInline";
import { hasCommentBody } from "@/src/lib/program/commentBody";
import { reactionStorageKey } from "@/src/lib/program/commentReactions";
import { replyOwnershipKey } from "@/src/lib/program/programCommentOwnership";
import type { ProgramComment, ProgramCommentReactionSummary } from "@/src/types/program";
import { STAFF_COMMENT_AUTHOR_ROLE } from "@/src/lib/program/staffCommentIdentity";

function roleBadgeClass(role: string): string {
  if (role.trim() === STAFF_COMMENT_AUTHOR_ROLE) {
    return "rounded-sm bg-[#1a3a5c] px-1.5 py-0.5 text-xs font-medium text-[#66c0f4]";
  }
  return "text-xs text-[#8f98a0]";
}

function formatCommentDate(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

function CommentDateLine({ createdAt, editedAt }: { createdAt?: string; editedAt?: string }) {
  const date = formatCommentDate(createdAt);
  if (!date) return null;
  const showEdited = Boolean(editedAt?.trim());
  return (
    <span className="text-xs text-[#8f98a0]">
      {date}
      {showEdited ? <span className="text-[#758691]"> (edited)</span> : null}
    </span>
  );
}

function sortComments(comments: ProgramComment[]): ProgramComment[] {
  return [...comments].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

type ProgramCommentsListProps = {
  comments: ProgramComment[];
  programSlug: string;
  reactionSummaries?: Record<string, ProgramCommentReactionSummary[]>;
  reactionsDisabled?: boolean;
  ownedCommentKeys?: ReadonlySet<string>;
  ownedReplyKeys?: ReadonlySet<string>;
  editDisabled?: boolean;
  onReply?: (comment: ProgramComment) => void;
  onEdited?: () => void;
};

export default function ProgramCommentsList({
  comments,
  programSlug,
  reactionSummaries,
  reactionsDisabled = false,
  ownedCommentKeys,
  ownedReplyKeys,
  editDisabled = false,
  onReply,
  onEdited
}: ProgramCommentsListProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const ownedComments = ownedCommentKeys ?? new Set<string>();
  const ownedReplies = ownedReplyKeys ?? new Set<string>();

  const visible = useMemo(
    () => sortComments(comments.filter(c => c.authorName?.trim() && hasCommentBody(c.body))),
    [comments]
  );

  if (visible.length === 0) {
    return (
      <p className="text-center text-sm text-[#8f98a0] py-6">
        No comments yet. Be the first to share activation tips or feedback.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {visible.map((comment, index) => {
        const commentKey = comment._key ?? `idx-${index}`;
        const replies = comment.replies?.filter(r => r.authorName?.trim() && hasCommentBody(r.body)) ?? [];
        const canEditComment = Boolean(comment._key && ownedComments.has(comment._key) && !editDisabled);
        const isEditingComment = editingKey === commentKey;

        return (
          <li key={commentKey} className="rounded-sm border border-[#2a475e] bg-[#16202d] p-4 sm:p-5">
            <div className="mb-2 flex flex-wrap items-baseline gap-2">
              <span className="font-semibold text-[#c6d4df]">{comment.authorName}</span>
              {comment.authorRole?.trim() ? (
                <span className={roleBadgeClass(comment.authorRole)}>{comment.authorRole.trim()}</span>
              ) : null}
              {comment.isPinned ? (
                <span className="rounded-sm bg-[#1a3a5c] px-1.5 py-0.5 text-xs font-medium text-[#66c0f4]">Pinned</span>
              ) : null}
              <CommentDateLine createdAt={comment.createdAt} editedAt={comment.editedAt} />
            </div>

            {isEditingComment && comment._key ? (
              <ProgramCommentEditInline
                programSlug={programSlug}
                commentKey={comment._key}
                body={comment.body}
                onCancel={() => setEditingKey(null)}
                onSaved={() => {
                  setEditingKey(null);
                  onEdited?.();
                }}
              />
            ) : (
              <CommentBodyText body={comment.body} className="text-sm leading-relaxed text-[#c6d4df]" />
            )}

            {comment._key && !isEditingComment ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <CommentReactions
                  programSlug={programSlug}
                  commentKey={comment._key}
                  initialReactions={comment.reactions}
                  summaries={reactionSummaries?.[comment._key]}
                  disabled={reactionsDisabled}
                />
                {canEditComment ? (
                  <button
                    type="button"
                    onClick={() => setEditingKey(commentKey)}
                    className="text-xs font-semibold text-[#66c0f4] hover:text-white cursor-pointer">
                    Edit
                  </button>
                ) : null}
                {onReply ? (
                  <button
                    type="button"
                    onClick={() => onReply(comment)}
                    className="text-xs font-semibold text-[#66c0f4] hover:text-white cursor-pointer">
                    Reply
                  </button>
                ) : null}
              </div>
            ) : null}

            {replies.length > 0 ? (
              <ul className="mt-4 space-y-3 border-l-2 border-[#2a475e] pl-4">
                {replies.map((reply, ri) => {
                  const replyKey = reply._key ?? `reply-${commentKey}-${ri}`;
                  const storageReplyKey = reply._key;
                  const canEditReply = Boolean(
                    comment._key &&
                      storageReplyKey &&
                      ownedReplies.has(replyOwnershipKey(comment._key, storageReplyKey)) &&
                      !editDisabled
                  );
                  const editKey = storageReplyKey ? replyOwnershipKey(comment._key!, storageReplyKey) : null;
                  const isEditingReply = editKey !== null && editingKey === editKey;

                  return (
                    <li key={replyKey}>
                      <div className="mb-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-[#c6d4df]">{reply.authorName}</span>
                        {reply.authorRole?.trim() ? (
                          <span className={roleBadgeClass(reply.authorRole)}>{reply.authorRole.trim()}</span>
                        ) : null}
                        <CommentDateLine createdAt={reply.createdAt} editedAt={reply.editedAt} />
                      </div>

                      {isEditingReply && comment._key && storageReplyKey ? (
                        <ProgramCommentEditInline
                          programSlug={programSlug}
                          commentKey={comment._key}
                          replyKey={storageReplyKey}
                          body={reply.body}
                          onCancel={() => setEditingKey(null)}
                          onSaved={() => {
                            setEditingKey(null);
                            onEdited?.();
                          }}
                        />
                      ) : (
                        <CommentBodyText body={reply.body} className="text-sm leading-relaxed text-[#8f98a0]" />
                      )}

                      {comment._key && storageReplyKey && !isEditingReply ? (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <CommentReactions
                            programSlug={programSlug}
                            commentKey={comment._key}
                            replyKey={storageReplyKey}
                            initialReactions={reply.reactions}
                            summaries={reactionSummaries?.[reactionStorageKey(comment._key, storageReplyKey)]}
                            disabled={reactionsDisabled}
                          />
                          {canEditReply ? (
                            <button
                              type="button"
                              onClick={() => setEditingKey(editKey)}
                              className="text-xs font-semibold text-[#66c0f4] hover:text-white cursor-pointer">
                              Edit
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
