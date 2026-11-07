"use client";

/** @fileoverview One report in the key details list. Memoized: a change elsewhere in the list never re-renders it. */
import { memo, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import MarkSpammerButton from "@/src/components/admin/MarkSpammerButton";
import { RelativeDate, StatusPill } from "@/src/components/admin/list/AdminListKit";
import { REPORT_EVENT_OPTIONS, REPORT_EVENT_TONES } from "@/src/components/admin/key-reports/keyReportUi";
import { effectiveReferrerHref, extractReferrerInfo } from "@/src/lib/analytics/analyticsUtils";
import type { KeyReportRow as Row } from "@/src/lib/admin/keyReportGroups";
import {
  filterTriedVersionInput,
  formatVersionLabelDisplay,
  isValidTriedVersionInput,
  normalizeTriedVersionForStorage
} from "@/src/lib/program/versionFitLabel";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import type { KeyReportEvent } from "@/src/types";

export type ReportVisitor = { visitTier?: string; isSpammer?: boolean };

export type VersionFit = { fit: "listed" } | { fit: "other"; version: string };

type KeyReportRowProps = {
  row: Row;
  visitor?: ReportVisitor;
  /** Reports on this key from the same visitor. */
  repeatCount: number;
  selected: boolean;
  saving: boolean;
  onToggle: (id: string) => void;
  onSetEvent: (id: string, eventType: KeyReportEvent) => void;
  onSetVersionFit: (id: string, fit: VersionFit) => Promise<void>;
  onSpammerChange: (hash: string, isSpammer: boolean) => void;
};

const fitButton = (active: boolean) =>
  `h-6 cursor-pointer px-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    active
      ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
  }`;

/** Which version the visitor tried: the listed one (counts against the key) or another one, with its number. */
function VersionFitControl({ row, onSave }: { row: Row; onSave: (fit: VersionFit) => Promise<void> }) {
  const stored = row.triedVersion ?? "";
  const isOther = row.triedVersionFit === "other";
  const [editingOther, setEditingOther] = useState(false);
  const [draft, setDraft] = useState(stored);
  const [saving, setSaving] = useState(false);
  const showOther = isOther || editingOther;
  const draftValue = normalizeTriedVersionForStorage(draft.trim());
  const storedValue = isValidTriedVersionInput(stored) ? normalizeTriedVersionForStorage(stored) : stored;
  const dirty = Boolean(draftValue) && (!isOther || draftValue !== storedValue);

  const save = async (fit: VersionFit) => {
    setSaving(true);
    try {
      await onSave(fit);
      setEditingOther(false);
    } finally {
      setSaving(false);
    }
  };

  const chooseListed = () => {
    if (isOther) void save({ fit: "listed" });
    setEditingOther(false);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        role="group"
        aria-label="Version tried"
        className="inline-flex overflow-hidden rounded border border-gray-300 dark:border-gray-700">
        <button
          type="button"
          disabled={saving}
          aria-pressed={!showOther}
          onClick={chooseListed}
          className={fitButton(!showOther)}>
          Listed{row.listedVersion ? ` v${row.listedVersion}` : ""}
        </button>
        <button
          type="button"
          disabled={saving}
          aria-pressed={showOther}
          onClick={() => setEditingOther(true)}
          className={`border-l border-gray-300 dark:border-gray-700 ${fitButton(showOther)}`}>
          Other
        </button>
      </span>
      {showOther && (
        <>
          <span className="text-gray-500 dark:text-gray-400">v</span>
          <input
            aria-label="Tried version"
            value={draft}
            maxLength={4}
            autoFocus={editingOther && !isOther}
            placeholder={formatVersionLabelDisplay(stored || "?")}
            onChange={e => setDraft(filterTriedVersionInput(e.target.value))}
            onKeyDown={e => {
              if (e.key === "Enter" && dirty && draftValue) void save({ fit: "other", version: draftValue });
              if (e.key === "Escape" && !isOther) setEditingOther(false);
            }}
            className="h-6 w-11 rounded border border-gray-300 bg-white px-1 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          {dirty && draftValue && (
            <button
              type="button"
              disabled={saving}
              onClick={() => void save({ fit: "other", version: draftValue })}
              className="h-6 cursor-pointer rounded bg-gray-900 px-1.5 text-[11px] font-medium text-white disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900">
              {saving ? "…" : "Save"}
            </button>
          )}
        </>
      )}
    </span>
  );
}

function KeyReportRowInner({
  row,
  visitor,
  repeatCount,
  selected,
  saving,
  onToggle,
  onSetEvent,
  onSetVersionFit,
  onSpammerChange
}: KeyReportRowProps) {
  const hash = row.ipHash?.trim();
  const isSpam = visitor?.isSpammer === true;
  const referrer = row.referrer?.trim();

  return (
    <li
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1.5 px-3 py-2 text-xs sm:grid-cols-[auto_9.5rem_minmax(0,1fr)_16rem_13.5rem] ${
        selected ? "bg-sky-50/70 dark:bg-sky-500/5" : ""
      }`}>
      <input
        type="checkbox"
        aria-label="Select report"
        checked={selected}
        onChange={() => onToggle(row._id)}
        className="h-4 w-4 cursor-pointer rounded"
      />

      <div className="flex min-w-0 items-center gap-1.5">
        <StatusPill
          value={row.eventType}
          options={REPORT_EVENT_OPTIONS}
          tones={REPORT_EVENT_TONES}
          disabled={saving}
          onChange={next => onSetEvent(row._id, next)}
        />
        {saving && <FaSpinner className="h-3 w-3 shrink-0 animate-spin text-gray-400" aria-label="Saving" />}
      </div>

      <div className="col-start-2 min-w-0 sm:col-start-auto">
        <p className="truncate text-gray-800 dark:text-gray-200" title={`${row.city}, ${row.country}`}>
          {row.city}, {row.country}
        </p>
        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
          <RelativeDate iso={row.createdAt} />
          {" · "}
          {referrer ? (
            <a
              href={effectiveReferrerHref(referrer)}
              target="_blank"
              rel="noopener noreferrer"
              title={referrer}
              className="text-sky-700 hover:underline dark:text-sky-300">
              {extractReferrerInfo(referrer).hostname}
            </a>
          ) : (
            "no referrer"
          )}
        </p>
      </div>

      <div className="col-start-2 min-w-0 sm:col-start-auto">
        {row.eventType === "report_key_working" ? (
          <span className="text-gray-400 dark:text-gray-500" title="Only failed reports ask which version was tried">
            —
          </span>
        ) : (
          <VersionFitControl
            key={`${row.triedVersionFit}-${row.triedVersion}`}
            row={row}
            onSave={fit => onSetVersionFit(row._id, fit)}
          />
        )}
      </div>

      <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-1.5 sm:col-start-auto sm:justify-end">
        <span className={visitorTierBadgeClasses(visitor?.visitTier ?? "new", false)}>{visitor?.visitTier ?? "new"}</span>
        {repeatCount > 1 && (
          <span title="Reports on this key from the same visitor" className="tabular-nums text-amber-700 dark:text-amber-300">
            ×{repeatCount}
          </span>
        )}
        {hash ? (
          <MarkSpammerButton
            visitorHash={hash}
            isSpammer={isSpam}
            variant="compact"
            onSuccess={next => onSpammerChange(hash, next)}
          />
        ) : null}
      </div>
    </li>
  );
}

const KeyReportRow = memo(KeyReportRowInner);
export default KeyReportRow;
