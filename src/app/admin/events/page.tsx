"use client";

/** @fileoverview Admin visit list. One row per session, events open in a modal. */
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import TimeFilter from "@/src/components/admin/TimeFilter";
import SessionDetailsModal from "@/src/components/admin/sessions/SessionDetailsModal";
import SessionMigrationPanel from "@/src/components/admin/sessions/SessionMigrationPanel";
import Pagination from "@/src/components/ui/Pagination";
import { sessionSourceLabel } from "@/src/lib/analytics/sessionEntry";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";
import { adminChrome, visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import type { AdminSessionSummary } from "@/src/lib/analytics/sessionAdmin";
import { useCallback, useEffect, useState } from "react";

type SessionRow = AdminSessionSummary & { visitTier?: string; visitorIsSpammer?: boolean };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "external", label: "External" },
  { id: "direct", label: "Direct" },
  { id: "internal", label: "Internal" },
  { id: "restore", label: "Restored" },
  { id: "contributions", label: "Has contribution" }
] as const;

function durationLabel(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function EventsPage() {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [entry, setEntry] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const { since, until } = getDateRange(selectedPeriod, customDateRange);
      const sp = new URLSearchParams({ since, until, page: String(page), limit: "25", entry });
      const res = await fetch(`/api/v1/admin/sessions?${sp.toString()}`);
      const json = await res.json();
      setRows(json.data ?? []);
      setTotal(json.meta?.total ?? 0);
      setTotalPages(json.meta?.totalPages ?? 1);
      setCounts(json.meta?.countsByEntry ?? {});
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customDateRange, page, entry]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ProtectedAdminLayout title="Sessions" subtitle="One row per visit. Open a session to see every click and key report.">
      <SessionMigrationPanel />

      <div className="mb-6">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={period => {
            setSelectedPeriod(period);
            setPage(1);
          }}
          customDateRange={customDateRange}
          onCustomDateChange={(start, end) => {
            setCustomDateRange({ start, end });
            setPage(1);
          }}
          onRefresh={() => void load()}
          refreshing={loading}
          refreshDisabled={loading}
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(filter => (
          <button
            key={filter.id}
            type="button"
            onClick={() => {
              setEntry(filter.id);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-sm ${entry === filter.id ? adminChrome.filterPillActive : adminChrome.filterPillIdle}`}
          >
            {filter.label}
            {counts[filter.id] != null ? ` (${counts[filter.id]})` : ""}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-soft">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Visits</h3>
          <p className="mt-1 text-sm text-gray-500">{total.toLocaleString()} sessions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="p-4">Visitor</th>
                <th className="p-4">Source</th>
                <th className="p-4">Landing</th>
                <th className="p-4">Location</th>
                <th className="p-4">Events</th>
                <th className="p-4">Started</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm">
                    <span className={visitorTierBadgeClasses(row.visitTier, false)}>{row.visitTier || "new"}</span>
                    {row.visitorIsSpammer ? (
                      <span className={`${visitorTierBadgeClasses("new", true)} ml-1`}>spammer</span>
                    ) : null}
                  </td>
                  <td className="p-4 text-sm text-gray-900">{sessionSourceLabel(row.entry, row.referrer)}</td>
                  <td className="max-w-48 truncate p-4 text-sm text-gray-700">{row.landingPath || "—"}</td>
                  <td className="p-4 text-sm text-gray-700">{[row.city, row.country].filter(Boolean).join(", ") || "—"}</td>
                  <td className="p-4 text-sm text-gray-700">
                    {row.eventCount}
                    {(row.contributionCount || row.reportCount) > 0
                      ? ` · ${row.contributionCount || row.reportCount} contribution${(row.contributionCount || row.reportCount) === 1 ? "" : "s"}`
                      : ""}
                    <div className="text-xs text-gray-400">{durationLabel(row.startedAt, row.lastEventAt)}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-700">{new Date(row.startedAt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setOpenId(row.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-800"
                    >
                      View session
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-gray-500">
                    No sessions in this range yet. New visits are recorded here. Older clicks remain in analytics event documents.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={25}
          onPageChange={setPage}
        />
      </div>

      {openId ? <SessionDetailsModal sessionId={openId} onClose={() => setOpenId(null)} /> : null}
    </ProtectedAdminLayout>
  );
}
