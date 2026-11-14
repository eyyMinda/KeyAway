"use client";

/**
 * @fileoverview Dashboard first fold: everything that needs attention, most severe first, each linking to where it
 * can be handled, next to count tiles for the inboxes. Replaces the old navigation cards (the header has the links).
 */
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaChevronRight,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaShieldAlt
} from "react-icons/fa";
import { FaArrowsRotate } from "react-icons/fa6";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import KeyReviewModal, { type KeyReviewTab } from "@/src/components/admin/KeyReviewModal";
import type {
  AlertSeverity,
  DashboardAlerts as Payload,
  DashboardVersions
} from "@/src/lib/admin/dashboardAlerts.server";

const SEVERITY_STYLES: Record<AlertSeverity, { row: string; icon: string; Icon: typeof FaInfoCircle; label: string }> =
  {
    critical: {
      row: "border-red-200 bg-red-50 hover:bg-red-100/70 dark:border-red-500/30 dark:bg-red-500/10 dark:hover:bg-red-500/15",
      icon: "text-red-600 dark:text-red-400",
      Icon: FaExclamationCircle,
      label: "Critical"
    },
    warning: {
      row: "border-amber-200 bg-amber-50 hover:bg-amber-100/70 dark:border-amber-500/30 dark:bg-amber-500/10 dark:hover:bg-amber-500/15",
      icon: "text-amber-600 dark:text-amber-400",
      Icon: FaExclamationTriangle,
      label: "Warning"
    },
    info: {
      row: "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60",
      icon: "text-sky-600 dark:text-sky-400",
      Icon: FaInfoCircle,
      label: "To do"
    }
  };

/** Alerts with an action open a dialog; same-page anchors (#usage) scroll; the rest navigate. */
function AlertLink({
  href,
  onOpen,
  className,
  children
}: {
  href: string;
  onOpen?: () => void;
  className: string;
  children: React.ReactNode;
}) {
  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className={`w-full cursor-pointer text-left ${className}`}>
        {children}
      </button>
    );
  }
  if (href.startsWith("/admin#")) {
    return (
      <a href={href.slice("/admin".length)} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

async function fetchAlerts(): Promise<Payload | null> {
  try {
    const res = await fetch("/api/v1/admin/alerts");
    return res.ok ? ((await res.json()) as { data: Payload }).data : null;
  } catch {
    return null;
  }
}

const VERSIONS_HREF = "/admin/programs?view=versions";

/** Two-column inbox card: versions waiting for review, and versions trusted sources applied this week. */
function VersionsTile({ versions }: { versions: DashboardVersions }) {
  const { versionsWaiting: waiting, autoApplied, versionChecksFailed: failing } = versions;
  const attention = waiting.length > 0 || failing > 0;
  return (
    <Link
      href={VERSIONS_HREF}
      className={`col-span-2 rounded-xl border p-4 transition-colors ${
        attention
          ? "border-sky-200 bg-sky-50 hover:bg-sky-100/70 dark:border-sky-500/30 dark:bg-sky-500/10 dark:hover:bg-sky-500/15"
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
      }`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Versions</p>
        {failing > 0 && <span className="text-xs text-red-600 dark:text-red-400">{failing} checks failing</span>}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-3">
        <span
          className={`text-2xl font-semibold tabular-nums ${waiting.length ? "text-sky-700 dark:text-sky-300" : "text-gray-400 dark:text-gray-500"}`}>
          {waiting.length}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          to review · {autoApplied.length} applied automatically this week
        </span>
      </p>
      {waiting.length + autoApplied.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {waiting.slice(0, 3).map(v => (
            <li key={`w-${v.id}`} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-gray-200">{v.title}</span>
              <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                {v.current ?? "?"} → <span className="font-semibold text-sky-700 dark:text-sky-300">{v.found}</span>
              </span>
            </li>
          ))}
          {autoApplied.slice(0, 2).map(v => (
            <li key={`a-${v.id}`} className="flex items-center gap-2">
              <FaShieldAlt
                className="h-2.5 w-2.5 shrink-0 text-green-600 dark:text-green-400"
                aria-label="Trusted source"
              />
              <span className="min-w-0 flex-1 truncate text-gray-600 dark:text-gray-400">{v.title}</span>
              <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">{v.found}</span>
            </li>
          ))}
        </ul>
      )}
    </Link>
  );
}

export default function DashboardAlerts() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<KeyReviewTab | null>(null);

  const apply = useCallback((payload: Payload | null) => {
    if (payload) {
      setData(payload);
      setLoadedAt(new Date().toISOString());
    }
    setError(!payload);
  }, []);

  const refresh = async () => {
    setLoading(true);
    apply(await fetchAlerts());
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    void fetchAlerts().then(payload => !cancelled && apply(payload));
    return () => {
      cancelled = true;
    };
  }, [apply]);

  const alerts = data?.alerts ?? [];
  const serious = alerts.filter(a => a.severity !== "info").length;

  return (
    <section
      aria-labelledby="dashboard-alerts"
      className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div>
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 id="dashboard-alerts" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Needs attention
          </h3>
          {data && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {alerts.length
                ? `${alerts.length} item${alerts.length === 1 ? "" : "s"}${serious ? `, ${serious} urgent` : ""}`
                : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-100">
            <FaArrowsRotate className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            {loadedAt ? `Updated ${formatRelativeTimeCompact(loadedAt)}` : "Refresh"}
          </button>
        </div>

        {!data ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
            {error ? "Could not load alerts." : "Checking…"}
          </p>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-500/30 dark:bg-green-500/10">
            <FaCheckCircle className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-900 dark:text-green-200">All clear</p>
              <p className="text-sm text-green-800/80 dark:text-green-300/80">
                Jobs ran on schedule, nothing is waiting and usage is within limits.
              </p>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {alerts.map(alert => {
              const style = SEVERITY_STYLES[alert.severity];
              return (
                <li key={alert.id}>
                  <AlertLink
                    href={alert.href}
                    onOpen={
                      alert.action
                        ? () => setReviewTab(alert.action === "key-review-keys" ? "keys" : "reports")
                        : undefined
                    }
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${style.row}`}>
                    <style.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.icon}`} aria-label={style.label} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {alert.title}
                      </span>
                      {alert.detail && (
                        <span
                          className="mt-0.5 block truncate text-xs text-gray-600 dark:text-gray-400"
                          title={alert.detail}>
                          {alert.detail}
                        </span>
                      )}
                    </span>
                    <FaChevronRight className="mt-1 h-3 w-3 shrink-0 text-gray-400" aria-hidden />
                  </AlertLink>
                </li>
              );
            })}
          </ul>
        )}
        {data?.partial && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Some checks could not run; the list may be incomplete.
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">Inbox</h3>
        <div className="grid grid-cols-2 gap-3">
          {(data?.tiles ?? []).map((tile, i, tiles) => (
            <Link
              key={tile.id}
              href={tile.href}
              className={`rounded-xl border p-4 transition-colors ${
                // An odd last tile fills the row instead of leaving a gap.
                tiles.length % 2 && i === tiles.length - 1 ? "col-span-2" : ""
              } ${
                tile.attention
                  ? "border-sky-200 bg-sky-50 hover:bg-sky-100/70 dark:border-sky-500/30 dark:bg-sky-500/10 dark:hover:bg-sky-500/15"
                  : "border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
              }`}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{tile.label}</p>
              <p
                className={`text-2xl font-semibold tabular-nums ${tile.attention ? "text-sky-700 dark:text-sky-300" : "text-gray-400 dark:text-gray-500"}`}>
                {tile.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tile.hint}</p>
            </Link>
          ))}
          {data?.versions && <VersionsTile versions={data.versions} />}
        </div>
      </div>
      {reviewTab && (
        <KeyReviewModal
          tab={reviewTab}
          onClose={() => {
            setReviewTab(null);
            void refresh();
          }}
        />
      )}
    </section>
  );
}
