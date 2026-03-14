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
    vercel_cron: "bg-blue-100 text-blue-800",
    bearer: "bg-blue-100 text-blue-800",
    manual: "bg-gray-100 text-gray-700"
  };
  const labels: Record<string, string> = {
    vercel_cron: "Vercel",
    bearer: "Vercel",
    manual: "Manual"
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${styles[source] ?? "bg-gray-100"}`}>
      {labels[source] ?? source}
    </span>
  );
}

function JobLabel({ job }: { job: string }) {
  const labels: Record<string, string> = {
    "bundle-events": "Bundle Events",
    "update-expired-keys": "Update Expired Keys"
  };
  return <>{labels[job] ?? job}</>;
}

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
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Cron Jobs</h3>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Cron Jobs</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  const vercelByJob = {
    "bundle-events": runs.find(r => r.job === "bundle-events" && (r.source === "vercel_cron" || r.source === "bearer")),
    "update-expired-keys": runs.find(r => r.job === "update-expired-keys" && (r.source === "vercel_cron" || r.source === "bearer"))
  };
  const lastByJob = {
    "bundle-events": runs.find(r => r.job === "bundle-events"),
    "update-expired-keys": runs.find(r => r.job === "update-expired-keys")
  };

  function JobStatusRow({ job, schedule, label }: { job: "bundle-events" | "update-expired-keys"; schedule: string; label: string }) {
    const vercelRun = vercelByJob[job];
    const lastRun = lastByJob[job];
    return (
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <div>
          <span className="font-medium text-gray-900">{label}</span>
          <p className="text-xs text-gray-500">{schedule}</p>
        </div>
        {vercelRun ? (
          <div className="text-right">
            <span className={`text-sm font-medium ${vercelRun.status === "ok" ? "text-green-600" : "text-red-600"}`}>
              {vercelRun.status === "ok" ? "✓" : "✗"}
            </span>
            <p className="text-xs text-gray-500">{formatRelativeTimeCompact(vercelRun.ranAt)}</p>
          </div>
        ) : lastRun ? (
          <div className="text-right">
            <p className="text-xs text-gray-600">
              Last: <SourceBadge source={lastRun.source} /> {formatRelativeTimeCompact(lastRun.ranAt)}
            </p>
            <p className="text-xs text-amber-600 flex items-center justify-end gap-1.5">
              <FiInfo
                className="w-4 h-4 shrink-0"
                title="Automatic Vercel cron runs on schedule. This job was triggered manually via POST."
              />
              No automatic run yet
            </p>
          </div>
        ) : (
          <span className="text-amber-600 text-sm">No runs yet</span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">🕐 Cron Jobs</h3>
      <p className="text-gray-500 text-sm mb-4">
        Automatic runs via Vercel cron. Manual runs appear in recent history.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-0 min-w-0 lg:pr-8">
          <JobStatusRow job="bundle-events" schedule="Daily at 21:00 UTC" label="Bundle Events" />
          <JobStatusRow job="update-expired-keys" schedule="Daily at 22:00 UTC" label="Update Expired Keys" />
        </div>

        <div className="min-w-0 lg:border-l lg:pl-8 border-gray-200">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent runs</h4>
          {runs.length > 0 ? (
            <ul className="space-y-1.5 text-sm max-h-40 overflow-y-auto">
              {runs.slice(0, 20).map(run => (
                <li key={run._id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-900 font-medium shrink-0">
                    <JobLabel job={run.job} />
                  </span>
                  <span className="flex items-center gap-2 flex-wrap justify-end">
                    <SourceBadge source={run.source} />
                    {run.details && <span className="text-gray-500 text-xs">({run.details})</span>}
                    <span className={`font-medium shrink-0 ${run.status === "ok" ? "text-green-600" : "text-red-600"}`}>
                      {formatRelativeTimeCompact(run.ranAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No runs recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
