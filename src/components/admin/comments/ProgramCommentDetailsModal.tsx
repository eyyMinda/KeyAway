"use client";

import Link from "next/link";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import { Chip } from "@/src/components/admin/list/AdminListKit";
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
  authorName,
  authorRole,
  body,
  createdAt,
  active = false,
  indented = false
}: {
  authorName: string;
  authorRole?: string;
  body: string;
  createdAt?: string;
  active?: boolean;
  indented?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${indented ? "ml-5 border-l-2 border-gray-200 pl-4 dark:border-gray-700" : ""}`}>
      <span
        aria-hidden
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        {authorName.trim().charAt(0) || "?"}
      </span>
      <div
        className={`min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 ${
          active ? "border-sky-300 bg-sky-50/60 dark:border-sky-500/40 dark:bg-sky-500/5" : "border-gray-200 dark:border-gray-800"
        }`}>
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{authorName}</span>
          {authorRole?.trim() ? <span className="text-gray-500 dark:text-gray-400">{authorRole.trim()}</span> : null}
          <span className="text-gray-500 dark:text-gray-400">{formatDate(createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800 dark:text-gray-200">{body}</p>
      </div>
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
        <Link href={`/program/${row.programSlug}`} target="_blank" className="cursor-pointer hover:underline">
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
          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete {row.isReply ? "reply" : "comment"}
        </button>
      }
    >
      <div className="space-y-3">
        {displayRow.isPinned ? <Chip tone="amber">Pinned on program page</Chip> : null}

        {row.isReply && parentComment ? (
          <CommentBlock
            authorName={parentComment.authorName}
            authorRole={parentComment.authorRole}
            body={parentComment.body}
            createdAt={parentComment.createdAt}
          />
        ) : null}

        <CommentBlock
          authorName={row.authorName}
          authorRole={row.authorRole}
          body={row.body}
          createdAt={row.createdAt}
          active
          indented={row.isReply && Boolean(parentComment)}
        />

        {!row.isReply &&
          threadReplies.map(reply => (
            <CommentBlock
              key={reply.id}
              authorName={reply.authorName}
              authorRole={reply.authorRole}
              body={reply.body}
              createdAt={reply.createdAt}
              indented
            />
          ))}

        {!row.isReply && threadReplies.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No replies on this comment.</p>
        ) : null}
      </div>
    </AdminDetailsModal>
  );
}
