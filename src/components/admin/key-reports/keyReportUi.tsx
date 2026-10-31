"use client";

/** @fileoverview Small pieces shared by the key reports table and its modal. */
import { useState } from "react";
import { FaCheck, FaRegCopy } from "react-icons/fa";
import { pillTones } from "@/src/components/admin/list/AdminListKit";
import type { CDKeyStatus } from "@/src/types/program";
import type { KeyReportEvent } from "@/src/types";

export const KEY_STATUS_OPTIONS: Array<{ value: CDKeyStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "limit", label: "Limit reached" }
];

export const KEY_STATUS_TONES: Record<CDKeyStatus, string> = {
  new: pillTones.blue,
  active: pillTones.green,
  expired: pillTones.red,
  limit: pillTones.amber
};

export const statusLabel = (status: CDKeyStatus) => KEY_STATUS_OPTIONS.find(o => o.value === status)?.label ?? status;

export const REPORT_EVENT_OPTIONS: Array<{ value: KeyReportEvent; label: string }> = [
  { value: "report_key_working", label: "Working" },
  { value: "report_key_expired", label: "Expired" },
  { value: "report_key_limit_reached", label: "Limit reached" }
];

export const REPORT_EVENT_TONES: Record<KeyReportEvent, string> = {
  report_key_working: pillTones.green,
  report_key_expired: pillTones.red,
  report_key_limit_reached: pillTones.amber
};

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-200">
      {copied ? <FaCheck className="h-3 w-3 text-green-600 dark:text-green-400" /> : <FaRegCopy className="h-3 w-3" />}
    </button>
  );
}

export function VersionTag({ version, behind }: { version?: string; behind?: boolean }) {
  if (!version) return null;
  return (
    <span
      title={behind ? "Older than the latest official version" : undefined}
      className={`inline-flex items-center rounded border px-1 text-[10px] font-semibold leading-4 tabular-nums ${
        behind ? pillTones.amber : pillTones.gray
      }`}>
      v{version}
    </span>
  );
}
