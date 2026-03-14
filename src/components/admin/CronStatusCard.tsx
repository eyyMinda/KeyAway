"use client";

import { useState, useEffect } from "react";
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
    bearer: "bg-amber-100 text-amber-800",
    manual: "bg-gray-100 text-gray-700"
  };
  const labels: Record<string, string> = {
    vercel_cron: "Vercel",
    bearer: "Bearer",
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

  const byJob = {
    "bundle-events": runs.find(r => r.job === "bundle-events" && r.source === "vercel_cron"),
    "update-expired-keys": runs.find(r => r.job === "update-expired-keys" && r.source === "vercel_cron")
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">🕐 Cron Jobs</h3>
      <p className="text-gray-500 text-sm mb-4">Last Vercel cron runs (manual runs shown in history)</p>

      <div className="space-y-4 mb-4">
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <span className="font-medium text-gray-900">Bundle Events</span>
            <p className="text-xs text-gray-500">Daily at 21:00 UTC</p>
          </div>
          {byJob["bundle-events"] ? (
            <div className="text-right">
              <span className={`text-sm font-medium ${byJob["bundle-events"].status === "ok" ? "text-green-600" : "text-red-600"}`}>
                {byJob["bundle-events"].status === "ok" ? "✓" : "✗"}
              </span>
              <p className="text-xs text-gray-500">{formatRelativeTimeCompact(byJob["bundle-events"].ranAt)}</p>
            </div>
          ) : (
            <span className="text-amber-600 text-sm">No Vercel run yet</span>
          )}
        </div>
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <div>
            <span className="font-medium text-gray-900">Update Expired Keys</span>
            <p className="text-xs text-gray-500">Daily at 20:00 UTC</p>
          </div>
          {byJob["update-expired-keys"] ? (
            <div className="text-right">
              <span className={`text-sm font-medium ${byJob["update-expired-keys"].status === "ok" ? "text-green-600" : "text-red-600"}`}>
                {byJob["update-expired-keys"].status === "ok" ? "✓" : "✗"}
              </span>
              <p className="text-xs text-gray-500">{formatRelativeTimeCompact(byJob["update-expired-keys"].ranAt)}</p>
            </div>
          ) : (
            <span className="text-amber-600 text-sm">No Vercel run yet</span>
          )}
        </div>
      </div>

      {runs.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">Recent runs ({runs.length})</summary>
          <ul className="mt-2 space-y-1 text-xs max-h-48 overflow-y-auto">
            {runs.slice(0, 20).map(run => (
              <li key={run._id} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <span>
                  <JobLabel job={run.job} /> <SourceBadge source={run.source} />
                  {run.details && <span className="text-gray-500 ml-1">({run.details})</span>}
                </span>
                <span className={`font-medium ${run.status === "ok" ? "text-green-600" : "text-red-600"}`}>
                  {formatRelativeTimeCompact(run.ranAt)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
