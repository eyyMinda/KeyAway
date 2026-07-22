"use client";

import CommentBodyText from "@/src/components/program/comments/CommentBodyText";
import CommentReactions from "@/src/components/program/comments/CommentReactions";
import { hasCommentBody } from "@/src/lib/program/commentBody";
import { reactionStorageKey } from "@/src/lib/program/commentReactions";
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
  onReply?: (comment: ProgramComment) => void;
};

export default function ProgramCommentsList({
  comments,
  programSlug,
  reactionSummaries,
  reactionsDisabled = false,
  onReply
}: ProgramCommentsListProps) {
  const visible = sortComments(comments.filter(c => c.authorName?.trim() && hasCommentBody(c.body)));

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
        const date = formatCommentDate(comment.createdAt);
        const commentKey = comment._key ?? `idx-${index}`;
        const replies = comment.replies?.filter(r => r.authorName?.trim() && hasCommentBody(r.body)) ?? [];

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
              {date ? <span className="text-xs text-[#8f98a0]">{date}</span> : null}
            </div>
            <CommentBodyText body={comment.body} className="text-sm leading-relaxed text-[#c6d4df]" />
            {comment._key ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <CommentReactions
                  programSlug={programSlug}
                  commentKey={comment._key}
                  initialReactions={comment.reactions}
                  summaries={reactionSummaries?.[comment._key]}
                  disabled={reactionsDisabled}
                />
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
                  const replyDate = formatCommentDate(reply.createdAt);
                  return (
                    <li key={reply._key ?? `reply-${commentKey}-${ri}`}>
                      <div className="mb-1 flex flex-wrap items-baseline gap-2">
                        <span className="text-sm font-semibold text-[#c6d4df]">{reply.authorName}</span>
                        {reply.authorRole?.trim() ? (
                          <span className={roleBadgeClass(reply.authorRole)}>{reply.authorRole.trim()}</span>
                        ) : null}
                        {replyDate ? <span className="text-xs text-[#8f98a0]">{replyDate}</span> : null}
                      </div>
                      <CommentBodyText body={reply.body} className="text-sm leading-relaxed text-[#8f98a0]" />
                      {comment._key && reply._key ? (
                        <div className="mt-2">
                          <CommentReactions
                            programSlug={programSlug}
                            commentKey={comment._key}
                            replyKey={reply._key}
                            initialReactions={reply.reactions}
                            summaries={reactionSummaries?.[reactionStorageKey(comment._key, reply._key)]}
                            disabled={reactionsDisabled}
                          />
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
