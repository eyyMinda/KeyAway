"use client";

import { useEffect, useState } from "react";
import AdminDetailsModal from "@/src/components/admin/AdminDetailsModal";
import { formatEventName } from "@/src/lib/analytics/analyticsUtils";
import { sessionSourceLabel } from "@/src/lib/analytics/sessionEntry";
import type { AdminSessionDetail, AdminSessionEvent } from "@/src/lib/analytics/sessionAdmin";

function reportLabel(event: string): string {
  if (event === "report_key_working") return "Key working";
  if (event === "report_key_expired") return "Key expired";
  if (event === "report_key_limit_reached") return "Limit reached";
  if (event === "comment") return "Comment";
  if (event === "comment_reply") return "Comment reply";
  if (event === "key_suggestion") return "Key suggestion";
  if (event === "contact") return "Contact form";
  return formatEventName(event);
}

function eventDetail(event: AdminSessionEvent): string {
  const parts = [event.programSlug, event.label || event.key, event.path, event.social].filter(Boolean);
  if (event.triedVersion) parts.push(`tried ${event.triedVersion}`);
  else if (event.listedVersion) parts.push(`v${event.listedVersion}`);
  return parts.join(" · ");
}

function rowClass(event: string): string {
  if (event === "report_key_working") return "border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10";
  if (event === "report_key_expired") return "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10";
  if (event === "report_key_limit_reached") return "border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10";
  if (event === "comment" || event === "comment_reply") return "border-purple-300 dark:border-purple-500/40 bg-purple-50 dark:bg-purple-500/10";
  if (event === "key_suggestion" || event === "contact") return "border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-500/10";
  return "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900";
}

export default function SessionDetailsModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/v1/admin/sessions/detail?id=${encodeURIComponent(sessionId)}`)
      .then(res => res.json())
      .then(json => {
        if (!cancelled) setDetail(json.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const events = [...(detail?.events ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const source = detail ? sessionSourceLabel(detail.entry, detail.referrer) : "";

  return (
    <AdminDetailsModal
      title="Session"
      accent="purple"
      subtitle={detail ? `${source}${detail.landingPath ? ` · ${detail.landingPath}` : ""}` : loading ? "Loading…" : "Not found"}
      onClose={onClose}
      visitorHash={detail ? (detail.visitorHash ?? "") : undefined}
      footer={
        detail
          ? `${events.length} events · started ${new Date(detail.startedAt).toLocaleString()}`
          : null
      }
    >
      {loading ? <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Loading session…</p> : null}
      {!loading && !detail ? <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Session not found.</p> : null}
      {detail ? (
        <>
          <dl className="mb-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-gray-800 dark:text-gray-200">Location</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{[detail.city, detail.country].filter(Boolean).join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-800 dark:text-gray-200">Source</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">
                {source}
                {detail.entry === "external" && detail.referrer ? (
                  <span className="mt-1 block break-all text-gray-700 dark:text-gray-300">{detail.referrer}</span>
                ) : null}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-800 dark:text-gray-200">Started</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{new Date(detail.startedAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-800 dark:text-gray-200">Last event</dt>
              <dd className="mt-1 text-gray-900 dark:text-gray-100">{new Date(detail.lastEventAt).toLocaleString()}</dd>
            </div>
          </dl>

          <h3 className="mb-3 flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
            <span className="mr-3 h-6 w-1 rounded-full bg-accent-600" />
            History
          </h3>
          <ol className="space-y-2">
            {events.map((event, index) => (
              <li key={`${event.createdAt}-${index}`} className={`rounded-lg border px-3 py-2 ${rowClass(event.event)}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{reportLabel(event.event)}</span>
                  <span className="shrink-0 text-xs font-medium text-gray-800 dark:text-gray-200">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                {eventDetail(event) ? <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">{eventDetail(event)}</p> : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </AdminDetailsModal>
  );
}
