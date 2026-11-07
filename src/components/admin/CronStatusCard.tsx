"use client";

import { useState, useEffect } from "react";
import { FiInfo } from "react-icons/fi";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";

interface CronRun {
  _id: string;
  job: string;
  source: string;
  status: string;
  details?: string;
  ranAt: string;
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    vercel_cron: "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300",
    bearer: "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300",
    manual: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
  };
  const labels: Record<string, string> = {
    vercel_cron: "Vercel",
    bearer: "Vercel",
    manual: "Manual"
  };
  return (
    <span className={`shrink-0 text-[11px] px-1.5 py-0.5 rounded ${styles[source] ?? "bg-gray-100 dark:bg-gray-800"}`}>
      {labels[source] ?? source}
    </span>
  );
}

function JobLabel({ job }: { job: string }) {
  const labels: Record<string, string> = {
    "sync-program-stats": "Program Stats",
    "update-expired-keys": "Update Expired Keys",
    "prune-cron-runs": "Prune & Rollup",
    "discover-giveaways": "Discover Giveaways",
    "check-versions": "Check Versions"
  };
  return <>{labels[job] ?? job}</>;
}

type CronJobKey =
  "sync-program-stats" | "update-expired-keys" | "prune-cron-runs" | "discover-giveaways" | "check-versions";

export default function CronStatusCard() {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/admin/cron-status")
      .then(res => res.json())
      .then(data => {
        if (data?.data?.runs) setRuns(data.data.runs);
        else setError("Failed to load");
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🕐 Cron Jobs</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🕐 Cron Jobs</h3>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  const vercelByJob: Record<CronJobKey, CronRun | undefined> = {
    "sync-program-stats": runs.find(
      r => r.job === "sync-program-stats" && (r.source === "vercel_cron" || r.source === "bearer")
    ),
    "update-expired-keys": runs.find(
      r => r.job === "update-expired-keys" && (r.source === "vercel_cron" || r.source === "bearer")
    ),
    "prune-cron-runs": runs.find(
      r => r.job === "prune-cron-runs" && (r.source === "vercel_cron" || r.source === "bearer")
    ),
    "discover-giveaways": runs.find(
      r => r.job === "discover-giveaways" && (r.source === "vercel_cron" || r.source === "bearer")
    ),
    "check-versions": runs.find(
      r => r.job === "check-versions" && (r.source === "vercel_cron" || r.source === "bearer")
    )
  };
  const lastByJob: Record<CronJobKey, CronRun | undefined> = {
    "sync-program-stats": runs.find(r => r.job === "sync-program-stats"),
    "update-expired-keys": runs.find(r => r.job === "update-expired-keys"),
    "prune-cron-runs": runs.find(r => r.job === "prune-cron-runs"),
    "discover-giveaways": runs.find(r => r.job === "discover-giveaways"),
    "check-versions": runs.find(r => r.job === "check-versions")
  };

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-6 shadow-soft dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">🕐 Cron Jobs</h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Status of the last automatic run. Manual runs appear in recent history.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          <JobStatusRow
            vercelRun={vercelByJob["sync-program-stats"]}
            lastRun={lastByJob["sync-program-stats"]}
            schedule="Every 6h"
            label="Program Stats"
          />
          <JobStatusRow
            vercelRun={vercelByJob["update-expired-keys"]}
            lastRun={lastByJob["update-expired-keys"]}
            schedule="Daily at 22:00 UTC"
            label="Update Expired Keys"
          />
          <JobStatusRow
            vercelRun={vercelByJob["prune-cron-runs"]}
            lastRun={lastByJob["prune-cron-runs"]}
            schedule="Daily at 03:15 UTC"
            label="Prune & Analytics Rollup"
          />
          <JobStatusRow
            vercelRun={vercelByJob["discover-giveaways"]}
            lastRun={lastByJob["discover-giveaways"]}
            schedule="Daily at 07:00 UTC"
            label="Discover Giveaways"
          />
          <JobStatusRow
            vercelRun={vercelByJob["check-versions"]}
            lastRun={lastByJob["check-versions"]}
            schedule="Daily at 06:00 UTC"
            label="Check Versions"
          />
        </ul>

        <div className="min-w-0 border-gray-200 dark:border-gray-800 lg:border-l lg:pl-6">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Recent runs
          </h4>
          {runs.length > 0 ? (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto pr-1 dark:divide-gray-800">
              {runs.slice(0, 20).map(run => (
                <RecentRun key={run._id} run={run} dotClass={dot(run.status)} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No runs recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

const dot = (status?: string) =>
  `h-2 w-2 shrink-0 rounded-full ${status === "ok" ? "bg-green-500" : status ? "bg-red-500" : "bg-amber-400"}`;

function JobStatusRow({
  vercelRun,
  lastRun,
  schedule,
  label
}: {
  vercelRun?: CronRun;
  lastRun?: CronRun;
  schedule: string;
  label: string;
}) {
  const shown = vercelRun ?? lastRun;
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className={dot(shown?.status)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{schedule}</p>
      </div>
      <div className="shrink-0 text-right text-xs">
        {shown ? (
          <>
            <p
              className={shown.status === "ok" ? "text-gray-700 dark:text-gray-200" : "text-red-600 dark:text-red-400"}>
              {shown.status === "ok" ? "OK" : "Failed"} · {formatRelativeTimeCompact(shown.ranAt)}
            </p>
            {!vercelRun && (
              <p
                className="flex items-center justify-end gap-1 text-amber-600 dark:text-amber-400"
                title="Automatic Vercel cron runs on schedule. This job was only triggered manually so far.">
                <FiInfo className="h-3 w-3" /> No automatic run yet
              </p>
            )}
          </>
        ) : (
          <span className="text-amber-600 dark:text-amber-400">No runs yet</span>
        )}
      </div>
    </li>
  );
}

/** One run: job, source and time on a line, its details clamped to one line until clicked. */
function RecentRun({ run, dotClass }: { run: CronRun; dotClass: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className={dotClass} aria-hidden />
        <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
          <JobLabel job={run.job} />
        </span>
        <SourceBadge source={run.source} />
        <span className="ml-auto shrink-0 text-xs tabular-nums text-gray-500 dark:text-gray-400">
          {formatRelativeTimeCompact(run.ranAt)}
        </span>
      </div>
      {run.details && (
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          title={open ? undefined : run.details}
          className={`mt-0.5 block w-full cursor-pointer pl-4 text-left text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ${open ? "whitespace-pre-wrap break-words" : "truncate"}`}>
          {run.details}
        </button>
      )}
    </li>
  );
}
