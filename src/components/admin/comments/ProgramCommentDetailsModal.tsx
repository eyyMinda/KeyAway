"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import AdminVisitorSection from "@/src/components/admin/AdminVisitorSection";
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
  const modalRef = useRef<HTMLDivElement>(null);
  const busy = busyId === row.id;
  const displayRow = row.isReply && parentComment ? parentComment : row;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {row.isReply ? "Reply details" : "Comment details"}
            </h2>
            <Link
              href={`/program/${row.programSlug}`}
              target="_blank"
              className="cursor-pointer text-sm text-blue-700 hover:underline">
              {row.programTitle}
            </Link>
          </div>
          <ModalCloseButton
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
            iconClassName="h-5 w-5"
            aria-label="Close"
          />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
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

          <AdminVisitorSection ipHash={row.ipHash} onSpammerChanged={onSpammerChanged} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => onRequestDelete(row)}
            className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Delete {row.isReply ? "reply" : "comment"}
          </button>
        </div>
      </div>
    </div>
  );
}
