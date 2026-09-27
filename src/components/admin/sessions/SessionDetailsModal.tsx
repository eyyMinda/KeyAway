"use client";

import { useEffect, useState } from "react";
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

export default function SessionDetailsModal({
  sessionId,
  onClose
}: {
  sessionId: string;
  onClose: () => void;
}) {
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
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-200 p-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session</h3>
            <p className="mt-1 text-sm text-gray-500">
              {detail ? sessionSourceLabel(detail.entry, detail.referrer) : "Loading"}
              {detail?.landingPath ? ` · ${detail.landingPath}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-900">
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading ? <p className="text-sm text-gray-500">Loading session…</p> : null}
          {!loading && !detail ? <p className="text-sm text-gray-500">Session not found.</p> : null}
          {detail ? (
            <>
              <dl className="mb-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Visitor</dt>
                  <dd className="font-mono text-xs break-all">{detail.visitorHash || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Location</dt>
                  <dd>{[detail.city, detail.country].filter(Boolean).join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd>
                    {sessionSourceLabel(detail.entry, detail.referrer)}
                    {detail.entry === "external" && detail.referrer ? (
                      <span className="mt-1 block truncate text-xs text-gray-500">{detail.referrer}</span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Started</dt>
                  <dd>{new Date(detail.startedAt).toLocaleString()}</dd>
                </div>
              </dl>

              <ol className="space-y-2">
                {events.map((event, index) => (
                  <li key={`${event.createdAt}-${index}`} className="rounded-lg border border-gray-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-gray-900">{reportLabel(event.event)}</span>
                      <span className="text-xs text-gray-500">{new Date(event.createdAt).toLocaleTimeString()}</span>
                    </div>
                    {eventDetail(event) ? <p className="mt-1 text-xs text-gray-600">{eventDetail(event)}</p> : null}
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
