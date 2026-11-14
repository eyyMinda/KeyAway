"use client";

/**
 * @fileoverview Key report review dialog (opened from the dashboard alerts). Built to be read at a glance: status
 * change as pills, who reported what as one bar, versions side by side, and the reasons as short chips (the full
 * sentence is on hover). Keys can be updated in one click; doubtful reports link to their key and the spammer switch.
 */
import Link from "next/link";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import {
  FaArrowRight,
  FaBolt,
  FaCalendarTimes,
  FaCheckCircle,
  FaCodeBranch,
  FaHistory,
  FaRobot,
  FaTimesCircle,
  FaUserCheck
} from "react-icons/fa";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import MarkSpammerButton from "@/src/components/admin/MarkSpammerButton";
import { KEY_STATUS_TONES, REPORT_EVENT_OPTIONS, statusLabel } from "@/src/components/admin/key-reports/keyReportUi";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type { DoubtfulReport, KeyReview, KeySignal, KeySuggestion, ReportFlag } from "@/src/lib/admin/keyReview";
import type { KeyReportEvent } from "@/src/types";

export type KeyReviewTab = "keys" | "reports";

type Tone = "red" | "orange" | "amber" | "green" | "blue" | "purple" | "gray";

const TONES: Record<Tone, string> = {
  red: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
  orange:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300",
  amber:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
  green:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300",
  blue: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
  purple:
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-300",
  gray: "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

const keyLink = (item: { programSlug: string; storageKey: string }) =>
  `/admin/key-reports?program=${encodeURIComponent(item.programSlug)}&key=${encodeURIComponent(item.storageKey)}`;

function SignalChip({
  icon: Icon,
  tone,
  children,
  title
}: {
  icon: ComponentType<{ className?: string }>;
  tone: Tone;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {children}
    </span>
  );
}

/** One chip per signal: icon, colour and a few words instead of a sentence. */
function keySignalChip(signal: KeySignal): { icon: ComponentType<{ className?: string }>; tone: Tone; text: string } {
  switch (signal.kind) {
    case "broken-listed":
      return { icon: FaTimesCircle, tone: "red", text: `${pct(signal.share)} say broken · ${signal.reporters}` };
    case "recent-failures":
      return { icon: FaHistory, tone: "red", text: `Last ${signal.count} failed` };
    case "fails-latest":
      return { icon: FaCodeBranch, tone: "orange", text: `Fails on latest v${signal.version} · ${signal.reporters}` };
    case "past-valid-until":
      return { icon: FaCalendarTimes, tone: "red", text: `Expired ${new Date(signal.date).toLocaleDateString()}` };
    case "works-again":
      return { icon: FaCheckCircle, tone: "green", text: `${pct(signal.share)} say it works · ${signal.reporters}` };
    case "still-working":
      return { icon: FaCheckCircle, tone: "gray", text: `${signal.reporters} still say it works` };
  }
}

function reportFlagChip(flag: ReportFlag): { icon: ComponentType<{ className?: string }>; tone: Tone; text: string } {
  switch (flag.kind) {
    case "spammer":
      return { icon: FaRobot, tone: "red", text: "Spammer" };
    case "mass-reporter":
      return {
        icon: FaBolt,
        tone: "amber",
        text: `${flag.count} keys${flag.programs > 1 ? ` / ${flag.programs} programs` : ""} in a day`
      };
    case "contradicted":
      return { icon: FaUserCheck, tone: "blue", text: `${flag.confirmations} said it works after` };
    case "impossible-version":
      return { icon: FaCodeBranch, tone: "purple", text: `v${flag.tried} > latest v${flag.latest}` };
  }
}

function StatusPill({ status }: { status: KeySuggestion["status"] }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${KEY_STATUS_TONES[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

/** Who reported what, as one bar: working, failed on the listed version, failed on the latest version. */
function ReportBar({ counts }: { counts: KeySuggestion["counts"] }) {
  const parts = [
    { label: "Working", n: counts.working, bar: "bg-green-500", dot: "bg-green-500" },
    { label: "Failed (listed version)", n: counts.failedListed, bar: "bg-red-500", dot: "bg-red-500" },
    { label: "Failed (latest version)", n: counts.failedLatest, bar: "bg-orange-400", dot: "bg-orange-400" }
  ];
  const total = parts.reduce((sum, p) => sum + p.n, 0) || 1;
  return (
    <div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"
        role="img"
        aria-label="Reports by outcome">
        {parts.map(
          p => p.n > 0 && <div key={p.label} className={p.bar} style={{ width: `${(p.n / total) * 100}%` }} />
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        {parts.map(p => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${p.dot}`} aria-hidden />
            <span className="font-semibold tabular-nums text-gray-900 dark:text-gray-100">{p.n}</span> {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function VersionPair({ keyVersion, latest }: { keyVersion?: string; latest?: string }) {
  if (!keyVersion && !latest) return null;
  const behind = keyVersion && latest && keyVersion !== latest;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700 dark:bg-gray-800 dark:text-gray-200"
        title="Version the key is listed for">
        key v{keyVersion ?? "?"}
      </span>
      <FaArrowRight className="h-2.5 w-2.5 text-gray-400" aria-hidden />
      <span
        className={`rounded-md px-1.5 py-0.5 font-mono ${behind ? "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"}`}
        title="Program's latest official version">
        latest v{latest ?? "?"}
      </span>
    </span>
  );
}

function KeyCard({ item, onApplied }: { item: KeySuggestion; onApplied: (item: KeySuggestion) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const apply = async () => {
    if (!item.keyId) return;
    setSaving(true);
    setError(false);
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
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <li
      className={`rounded-xl border-l-4 border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${item.confidence === "high" ? "border-l-red-500" : "border-l-amber-400"}`}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-gray-100">{item.programTitle}</p>
          <p className="truncate font-mono text-xs text-gray-500 dark:text-gray-400" title={item.label}>
            {item.label}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${item.confidence === "high" ? "bg-red-600 text-white" : "bg-amber-400 text-amber-950"}`}>
          {item.confidence}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <StatusPill status={item.status} />
          <FaArrowRight className="h-3 w-3 text-gray-400" aria-hidden />
          <StatusPill status={item.suggested} />
        </span>
        <VersionPair keyVersion={item.keyVersion} latest={item.latestVersion} />
      </div>

      <div className="mt-3">
        <ReportBar counts={item.counts} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" title={item.reasons.join("\n")}>
        {item.signals.map(signal => {
          const chip = keySignalChip(signal);
          return (
            <SignalChip key={signal.kind} icon={chip.icon} tone={chip.tone}>
              {chip.text}
            </SignalChip>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.keyId && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void apply()}
            className="cursor-pointer rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            {saving ? "Updating…" : `Mark ${statusLabel(item.suggested).toLowerCase()}`}
          </button>
        )}
        <Link
          href={keyLink(item)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800">
          Open reports
        </Link>
        {error && <span className="text-xs text-red-600 dark:text-red-400">Could not update</span>}
        {item.lastReportAt && (
          <span className="ml-auto text-xs text-gray-400">
            last report {formatRelativeTimeCompact(item.lastReportAt)}
          </span>
        )}
      </div>
    </li>
  );
}

function ReportRow({ report }: { report: DoubtfulReport }) {
  const working = report.eventType === "report_key_working";
  const label =
    REPORT_EVENT_OPTIONS.find(o => o.value === (report.eventType as KeyReportEvent))?.label ?? report.eventType;
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900">
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${working ? TONES.green : TONES.red}`}>
        {working ? <FaCheckCircle className="h-3 w-3" /> : <FaTimesCircle className="h-3 w-3" />}
        {label}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {report.programTitle} <span className="font-mono text-xs font-normal text-gray-500">{report.label}</span>
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5" title={report.reasons.join("\n")}>
          {report.flags.map(flag => {
            const chip = reportFlagChip(flag);
            return (
              <SignalChip key={flag.kind} icon={chip.icon} tone={chip.tone}>
                {chip.text}
              </SignalChip>
            );
          })}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span title={new Date(report.createdAt).toLocaleString()}>{formatRelativeTimeCompact(report.createdAt)}</span>
        {report.visitorTier && (
          <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">{report.visitorTier}</span>
        )}
        <Link href={keyLink(report)} className="font-medium text-sky-700 hover:underline dark:text-sky-300">
          Open
        </Link>
        {report.ipHash && (
          <MarkSpammerButton
            visitorHash={report.ipHash}
            isSpammer={report.flags.some(f => f.kind === "spammer")}
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
      subtitle={`Last ${review?.windowDays ?? 30} days · hover a chip for details`}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={<span>Recent reports and trusted visitors count more; spammers do not count.</span>}>
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
