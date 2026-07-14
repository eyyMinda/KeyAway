"use client";

import { useState } from "react";
import MarkSpammerConfirmModal from "@/src/components/admin/MarkSpammerConfirmModal";
import { patchVisitorSpammer } from "@/src/lib/admin/patchVisitorSpammer";

type MarkSpammerButtonProps = {
  visitorHash: string;
  isSpammer: boolean;
  disabled?: boolean;
  onSuccess?: (nextIsSpammer: boolean) => void | Promise<void>;
  variant?: "default" | "compact" | "report";
  className?: string;
};

const variantClasses: Record<NonNullable<MarkSpammerButtonProps["variant"]>, (isSpammer: boolean) => string> = {
  default: () =>
    "cursor-pointer rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50",
  compact: () =>
    "cursor-pointer rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50",
  report: isSpammer =>
    `h-7 px-2.5 rounded border text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      isSpammer
        ? "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
        : "border-red-300 bg-red-50 text-red-800 hover:bg-red-100"
    }`
};

export default function MarkSpammerButton({
  visitorHash,
  isSpammer,
  disabled = false,
  onSuccess,
  variant = "default",
  className = ""
}: MarkSpammerButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const hash = visitorHash.trim();
  if (!hash) return null;

  async function handleConfirm() {
    const nextIsSpammer = !isSpammer;
    setBusy(true);
    try {
      const ok = await patchVisitorSpammer(hash, nextIsSpammer);
      if (ok) {
        setConfirmOpen(false);
        await onSuccess?.(nextIsSpammer);
      }
    } finally {
      setBusy(false);
    }
  }

  const buttonClass = `${variantClasses[variant](isSpammer)} ${className}`.trim();

  return (
    <>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setConfirmOpen(true)}
        className={buttonClass}>
        {busy ? "…" : isSpammer ? "Unmark spammer" : "Mark spammer"}
      </button>

      <MarkSpammerConfirmModal
        open={confirmOpen}
        visitorHash={hash}
        markingSpammer={!isSpammer}
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleConfirm()}
      />
    </>
  );
}
