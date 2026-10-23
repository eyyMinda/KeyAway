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
    <span className={`text-xs px-2 py-0.5 rounded ${styles[source] ?? "bg-gray-100 dark:bg-gray-800"}`}>{labels[source] ?? source}</span>
  );
}

function JobLabel({ job }: { job: string }) {
  const labels: Record<string, string> = {
    "sync-program-stats": "Program Stats",
    "update-expired-keys": "Update Expired Keys",
    "prune-cron-runs": "Prune Cron Runs",
    "discover-giveaways": "Discover Giveaways",
    "check-versions": "Check Versions"
  };
  return <>{labels[job] ?? job}</>;
}

type CronJobKey =
  | "sync-program-stats"
  | "update-expired-keys"
  | "prune-cron-runs"
  | "discover-giveaways"
  | "check-versions";

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
    "check-versions": runs.find(r => r.job === "check-versions" && (r.source === "vercel_cron" || r.source === "bearer"))
  };
  const lastByJob: Record<CronJobKey, CronRun | undefined> = {
    "sync-program-stats": runs.find(r => r.job === "sync-program-stats"),
    "update-expired-keys": runs.find(r => r.job === "update-expired-keys"),
    "prune-cron-runs": runs.find(r => r.job === "prune-cron-runs"),
    "discover-giveaways": runs.find(r => r.job === "discover-giveaways"),
    "check-versions": runs.find(r => r.job === "check-versions")
  };

  function JobStatusRow({ job, schedule, label }: { job: CronJobKey; schedule: string; label: string }) {
    const vercelRun = vercelByJob[job];
    const lastRun = lastByJob[job];
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
          <p className="text-xs text-gray-500 dark:text-gray-400">{schedule}</p>
        </div>
        {vercelRun ? (
          <div className="text-right">
            <span className={`text-sm font-medium ${vercelRun.status === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {vercelRun.status === "ok" ? "✓" : "✗"}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTimeCompact(vercelRun.ranAt)}</p>
          </div>
        ) : lastRun ? (
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Last: <SourceBadge source={lastRun.source} /> {formatRelativeTimeCompact(lastRun.ranAt)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center justify-end gap-1.5">
              <FiInfo
                className="w-4 h-4 shrink-0"
                title="Automatic Vercel cron runs on schedule. This job was triggered manually via POST."
              />
              No automatic run yet
            </p>
          </div>
        ) : (
          <span className="text-amber-600 dark:text-amber-400 text-sm">No runs yet</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">🕐 Cron Jobs</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
        Automatic runs via Vercel cron. Manual runs appear in recent history.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-0 min-w-0 lg:pr-8">
          <JobStatusRow job="sync-program-stats" schedule="Every 6h" label="Program Stats" />
          <JobStatusRow job="update-expired-keys" schedule="Daily at 22:00 UTC" label="Update Expired Keys" />
          <JobStatusRow job="prune-cron-runs" schedule="Daily at 03:15 UTC" label="Prune Cron Runs (7d)" />
          <JobStatusRow job="discover-giveaways" schedule="Daily at 07:00 UTC" label="Discover Giveaways" />
          <JobStatusRow job="check-versions" schedule="Daily at 06:00 UTC" label="Check Versions" />
        </div>

        <div className="min-w-0 lg:border-l lg:pl-8 border-gray-200 dark:border-gray-800">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recent runs</h4>
          {runs.length > 0 ? (
            <ul className="space-y-1.5 text-sm max-h-58 overflow-y-auto">
              {runs.slice(0, 20).map(run => (
                <li
                  key={run._id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <span className="text-gray-900 dark:text-gray-100 font-medium shrink-0">
                    <JobLabel job={run.job} />
                  </span>
                  <span className="flex items-center gap-2 flex-wrap justify-end">
                    <SourceBadge source={run.source} />
                    {run.details && <span className="text-gray-500 dark:text-gray-400 text-xs">({run.details})</span>}
                    <span className={`font-medium shrink-0 ${run.status === "ok" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {formatRelativeTimeCompact(run.ranAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No runs recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
