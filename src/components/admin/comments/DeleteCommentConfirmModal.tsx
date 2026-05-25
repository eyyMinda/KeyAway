"use client";

import { useEffect, useRef } from "react";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import type { AdminProgramCommentRow } from "@/src/types/admin/programComments";

type DeleteCommentConfirmModalProps = {
  row: AdminProgramCommentRow | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteCommentConfirmModal({
  row,
  busy = false,
  onClose,
  onConfirm
}: DeleteCommentConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!row) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [row, busy, onClose]);

  if (!row) return null;

  const kind = row.isReply ? "reply" : "comment";

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div
        ref={modalRef}
        role="alertdialog"
        aria-labelledby="delete-comment-title"
        aria-describedby="delete-comment-desc"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="delete-comment-title" className="text-lg font-bold text-gray-900">
            Delete {kind}?
          </h3>
          <ModalCloseButton
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            iconClassName="h-5 w-5"
            aria-label="Close"
          />
        </div>
        <p id="delete-comment-desc" className="text-sm leading-relaxed text-gray-600">
          Remove this {kind} by <strong className="text-gray-900">{row.authorName}</strong> on{" "}
          <strong className="text-gray-900">{row.programTitle}</strong>? This cannot be undone.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? "Deleting…" : `Delete ${kind}`}
          </button>
        </div>
      </div>
    </div>
  );
}
