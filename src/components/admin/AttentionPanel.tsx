"use client";

/**
 * @fileoverview Dashboard "needs attention": a banner for cron jobs that failed or missed their schedule, and a card
 * with program versions waiting for review or applied automatically from trusted sources this week.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type { AdminAttention } from "@/src/lib/admin/attention.server";

const PROBLEM_TEXT = { failed: "failed", overdue: "has not run on schedule", never: "has never run automatically" };
const VERSIONS_HREF = "/admin/programs?view=versions";

/** One request per page load, shared by the banner and the card. */
let pending: Promise<AdminAttention | null> | null = null;

function useAttention() {
  const [data, setData] = useState<AdminAttention | null>(null);
  useEffect(() => {
    let cancelled = false;
    pending ??= fetch("/api/v1/admin/attention")
      .then(res => (res.ok ? res.json() : null))
      .then((json: { data: AdminAttention } | null) => json?.data ?? null)
      .catch(() => null)
      .finally(() => setTimeout(() => (pending = null), 1000));
    pending.then(result => !cancelled && setData(result));
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

function JobAlerts({ jobs }: { jobs: AdminAttention["jobs"] }) {
  if (!jobs.length) return null;
  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
      <p className="flex items-center gap-2 text-sm font-semibold text-red-800 dark:text-red-200">
        <FaExclamationTriangle className="h-3.5 w-3.5" aria-hidden />
        {jobs.length === 1 ? "A scheduled job needs attention" : `${jobs.length} scheduled jobs need attention`}
      </p>
      <ul className="mt-1.5 space-y-1 text-sm text-red-800 dark:text-red-200">
        {jobs.map(job => (
          <li key={job.job}>
            <span className="font-medium">{job.label}</span> {PROBLEM_TEXT[job.problem]}
            {job.at && (
              <span className="text-red-700/80 dark:text-red-300/80"> · last {formatRelativeTimeCompact(job.at)}</span>
            )}
            {job.details && (
              <span className="block truncate text-xs text-red-700/80 dark:text-red-300/80" title={job.details}>
                {job.details}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function VersionUpdatesCard({ data }: { data: AdminAttention }) {
  const { versionsWaiting, autoApplied, versionChecksFailed } = data;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Version updates</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {versionsWaiting.length} waiting for review · {autoApplied.length} applied automatically this week
            {versionChecksFailed > 0 && (
              <span className="text-red-600 dark:text-red-400"> · {versionChecksFailed} checks failing</span>
            )}
          </p>
        </div>
        <Link
          href={VERSIONS_HREF}
          className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          Versions
        </Link>
      </div>
      {versionsWaiting.length + autoApplied.length > 0 ? (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {versionsWaiting.slice(0, 5).map(v => (
            <li key={`w-${v.id}`} className="flex items-center gap-2 px-3 py-2">
              <span className="min-w-0 flex-1 truncate font-medium text-gray-900 dark:text-gray-100">{v.title}</span>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                {v.current ?? "?"} → <span className="font-semibold text-blue-600 dark:text-blue-400">{v.found}</span>
              </span>
            </li>
          ))}
          {autoApplied.slice(0, 5).map(v => (
            <li key={`a-${v.id}`} className="flex items-center gap-2 px-3 py-2">
              <FaShieldAlt
                className="h-3 w-3 shrink-0 text-green-600 dark:text-green-400"
                aria-label="Trusted source"
              />
              <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">{v.title}</span>
              <span className="tabular-nums text-gray-500 dark:text-gray-400">
                {v.found}
                {v.at && ` · ${formatRelativeTimeCompact(v.at)}`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Every tracked program is up to date.</p>
      )}
    </div>
  );
}

/** Shown at the top of the dashboard only when a job failed or missed its schedule. */
export function AttentionBanner() {
  const data = useAttention();
  return data ? <JobAlerts jobs={data.jobs} /> : null;
}

export function VersionUpdates() {
  const data = useAttention();
  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 shadow-soft dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Loading version updates…
      </div>
    );
  }
  return <VersionUpdatesCard data={data} />;
}
