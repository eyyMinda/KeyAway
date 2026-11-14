"use client";

/**
 * @fileoverview Key report review dialog (opened from the dashboard alerts): keys whose status probably needs to change,
 * with the reasons and a one-click update, and key reports that look doubtful, with why and a spammer switch.
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import MarkSpammerButton from "@/src/components/admin/MarkSpammerButton";
import { KEY_STATUS_TONES, REPORT_EVENT_OPTIONS, statusLabel } from "@/src/components/admin/key-reports/keyReportUi";
import { Chip } from "@/src/components/admin/list/AdminListKit";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type { DoubtfulReport, KeyReview, KeySuggestion } from "@/src/lib/admin/keyReview";
import type { KeyReportEvent } from "@/src/types";

export type KeyReviewTab = "keys" | "reports";

const keyLink = (item: { programSlug: string; storageKey: string }) =>
  `/admin/key-reports?program=${encodeURIComponent(item.programSlug)}&key=${encodeURIComponent(item.storageKey)}`;

const eventLabel = (event: string) => REPORT_EVENT_OPTIONS.find(o => o.value === event)?.label ?? event;

function StatusBadge({ status }: { status: KeySuggestion["status"] }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${KEY_STATUS_TONES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

function KeyCard({ item, onApplied }: { item: KeySuggestion; onApplied: (item: KeySuggestion) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!item.keyId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/key-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [{ programSlug: item.programSlug, keyId: item.keyId, newStatus: item.suggested }]
        })
      });
      if (!res.ok) throw new Error();
      onApplied(item);
    } catch {
      setError("Could not update the key.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.programTitle}</span>
        <Chip tone={item.confidence === "high" ? "red" : "amber"}>{item.confidence} confidence</Chip>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <StatusBadge status={item.status} /> → <StatusBadge status={item.suggested} />
        </span>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-gray-600 dark:text-gray-300">
        {item.label}
        {item.keyVersion && <span className="font-sans text-gray-500"> · listed for v{item.keyVersion}</span>}
        {item.latestVersion && <span className="font-sans text-gray-500"> · latest v{item.latestVersion}</span>}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-300">
        {item.reasons.map(reason => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {item.counts.reporters} visitors reported in the last 30 days: {item.counts.working} working,{" "}
        {item.counts.failedListed} failed on the listed version, {item.counts.failedLatest} failed on the latest
        {item.lastReportAt && ` · last ${formatRelativeTimeCompact(item.lastReportAt)}`}
      </p>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.keyId && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void apply()}
            className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Updating…" : `Mark as ${statusLabel(item.suggested).toLowerCase()}`}
          </button>
        )}
        <Link
          href={keyLink(item)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          Open reports
        </Link>
      </div>
    </li>
  );
}

function ReportRow({ report }: { report: DoubtfulReport }) {
  return (
    <li className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{report.programTitle}</span>
        <Chip tone={report.eventType === "report_key_working" ? "green" : "red"}>
          {eventLabel(report.eventType as KeyReportEvent)}
        </Chip>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatRelativeTimeCompact(report.createdAt)}
          {report.fit === "other" && report.triedVersion && ` · tried v${report.triedVersion}`}
          {report.visitorTier && ` · ${report.visitorTier} visitor`}
        </span>
      </div>
      <p className="mt-0.5 break-all font-mono text-xs text-gray-600 dark:text-gray-300">{report.label}</p>
      <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-gray-700 dark:text-gray-300">
        {report.reasons.map(reason => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Link href={keyLink(report)} className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">
          Open key
        </Link>
        {report.ipHash && (
          <MarkSpammerButton
            visitorHash={report.ipHash}
            isSpammer={report.reasons.some(r => r.includes("spammer"))}
            variant="compact"
          />
        )}
      </div>
    </li>
  );
}

export default function KeyReviewModal({ tab: initialTab, onClose }: { tab: KeyReviewTab; onClose: () => void }) {
  const [tab, setTab] = useState<KeyReviewTab>(initialTab);
  const [review, setReview] = useState<KeyReview | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/admin/key-review")
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((json: { data: KeyReview }) => !cancelled && setReview(json.data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const onApplied = useCallback((item: KeySuggestion) => {
    setReview(prev =>
      prev
        ? {
            ...prev,
            keys: prev.keys.filter(k => !(k.programSlug === item.programSlug && k.storageKey === item.storageKey))
          }
        : prev
    );
  }, []);

  const tabButton = (value: KeyReviewTab, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      aria-pressed={tab === value}
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium ${
        tab === value
          ? "border-gray-900 bg-gray-900 text-white dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900"
          : "border-gray-200 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300"
      }`}>
      {label} {count != null && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );

  return (
    <AdminDetailsModal
      title="Key report review"
      subtitle={`Last ${review?.windowDays ?? 30} days of reports`}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <span>
          Recent reports and trusted visitors count more; spammers do not count. Reports on the program&apos;s latest
          version count against a key listed for an older one.
        </span>
      }>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabButton("keys", "Keys to update", review?.keys.length)}
        {tabButton("reports", "Doubtful reports", review?.reports.length)}
      </div>

      {!review ? (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          {error ? "Could not load the review." : "Reviewing reports…"}
        </p>
      ) : tab === "keys" ? (
        review.keys.length ? (
          <ul className="space-y-3">
            {review.keys.map(item => (
              <KeyCard key={`${item.programSlug}:${item.storageKey}`} item={item} onApplied={onApplied} />
            ))}
          </ul>
        ) : (
          <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No key needs a status change right now.
          </p>
        )
      ) : review.reports.length ? (
        <ul className="space-y-2">
          {review.reports.map(report => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      ) : (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">No report looks doubtful.</p>
      )}
    </AdminDetailsModal>
  );
}
