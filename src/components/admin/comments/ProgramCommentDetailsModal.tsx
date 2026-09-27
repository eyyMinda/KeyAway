"use client";

import Link from "next/link";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import ModalSection from "@/src/components/admin/ModalSection";
import type { AdminProgramCommentRow } from "@/src/types/admin/programComments";

type ProgramCommentDetailsModalProps = {
  row: AdminProgramCommentRow;
  threadReplies: AdminProgramCommentRow[];
  parentComment?: AdminProgramCommentRow;
  busyId: string | null;
  onClose: () => void;
  onRequestDelete: (row: AdminProgramCommentRow) => void;
  onSpammerChanged?: () => void | Promise<void>;
};

function formatDate(iso?: string) {
  if (!iso?.trim()) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function CommentBlock({
  label,
  authorName,
  authorRole,
  body,
  createdAt
}: {
  label: string;
  authorName: string;
  authorRole?: string;
  body: string;
  createdAt?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{authorName}</span>
        {authorRole?.trim() ? (
          <span className="text-xs text-gray-500">{authorRole.trim()}</span>
        ) : null}
        <span className="text-xs text-gray-400">{formatDate(createdAt)}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{body}</p>
    </div>
  );
}

export default function ProgramCommentDetailsModal({
  row,
  threadReplies,
  parentComment,
  busyId,
  onClose,
  onRequestDelete,
  onSpammerChanged
}: ProgramCommentDetailsModalProps) {
  const busy = busyId === row.id;
  const displayRow = row.isReply && parentComment ? parentComment : row;

  return (
    <AdminDetailsModal
      title={row.isReply ? "Reply details" : "Comment details"}
      accent="purple"
      subtitle={
        <Link href={`/program/${row.programSlug}`} target="_blank" className="cursor-pointer text-primary-800 hover:underline">
          {row.programTitle}
        </Link>
      }
      onClose={onClose}
      visitorHash={row.ipHash}
      onSpammerChanged={onSpammerChanged}
      footerActions={
        <button
          type="button"
          disabled={busy}
          onClick={() => onRequestDelete(row)}
          className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete {row.isReply ? "reply" : "comment"}
        </button>
      }
    >
      <div className="space-y-6">
          {row.isReply && parentComment ? (
            <ModalSection title="Parent comment" color="gray">
              <CommentBlock
                label="Thread"
                authorName={parentComment.authorName}
                authorRole={parentComment.authorRole}
                body={parentComment.body}
                createdAt={parentComment.createdAt}
              />
            </ModalSection>
          ) : null}

          <ModalSection title={row.isReply ? "Reply" : "Comment"} color="blue">
            <CommentBlock
              label={row.isReply ? "Reply" : "Comment"}
              authorName={row.authorName}
              authorRole={row.authorRole}
              body={row.body}
              createdAt={row.createdAt}
            />
            {displayRow.isPinned ? (
              <p className="mt-2 text-xs font-medium text-amber-700">Pinned on program page</p>
            ) : null}
          </ModalSection>

          {!row.isReply && threadReplies.length > 0 ? (
            <ModalSection title={`Replies (${threadReplies.length})`} color="purple">
              <ul className="space-y-3">
                {threadReplies.map(reply => (
                  <li key={reply.id}>
                    <CommentBlock
                      label="Reply"
                      authorName={reply.authorName}
                      authorRole={reply.authorRole}
                      body={reply.body}
                      createdAt={reply.createdAt}
                    />
                  </li>
                ))}
              </ul>
            </ModalSection>
          ) : null}

          {!row.isReply && threadReplies.length === 0 ? (
            <p className="text-sm text-gray-500">No replies on this comment.</p>
          ) : null}

      </div>
    </AdminDetailsModal>
  );
}
