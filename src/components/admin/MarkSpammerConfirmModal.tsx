"use client";

import { useEffect, useRef } from "react";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";

type MarkSpammerConfirmModalProps = {
  open: boolean;
  visitorHash: string;
  markingSpammer: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function MarkSpammerConfirmModal({
  open,
  visitorHash,
  markingSpammer,
  busy = false,
  onClose,
  onConfirm
}: MarkSpammerConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, busy, onClose]);

  if (!open) return null;

  const shortHash = `${visitorHash.slice(0, 10)}…`;

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div
        ref={modalRef}
        role="alertdialog"
        aria-labelledby="mark-spammer-title"
        aria-describedby="mark-spammer-desc"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl text-start"
        onClick={e => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 id="mark-spammer-title" className="text-lg font-bold text-gray-900">
            {markingSpammer ? "Mark as spammer?" : "Unmark spammer?"}
          </h3>
          <ModalCloseButton
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            iconClassName="h-5 w-5"
            aria-label="Close"
          />
        </div>
        <p id="mark-spammer-desc" className="text-sm leading-relaxed text-gray-600">
          {markingSpammer ? (
            <>
              Are you sure you want to mark visitor <strong className="font-mono text-gray-900">{shortHash}</strong> as
              a spammer? They will be blocked from comments, contact messages, key submissions, and negative key
              reports.
            </>
          ) : (
            <>
              Are you sure you want to unmark visitor <strong className="font-mono text-gray-900">{shortHash}</strong>?
              They will be able to submit again.
            </>
          )}
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
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
              markingSpammer ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700"
            }`}>
            {busy ? "Saving…" : markingSpammer ? "Yes, mark spammer" : "Yes, unmark"}
          </button>
        </div>
      </div>
    </div>
  );
}
