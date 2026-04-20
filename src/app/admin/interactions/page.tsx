"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import TimeFilter from "@/src/components/admin/TimeFilter";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";
import { InteractionEventBucketData } from "@/src/types";
import SortableTableHead, { SortDirection, SortableColumn } from "@/src/components/ui/SortableTableHead";
import Pagination from "@/src/components/ui/Pagination";
import { adminChrome } from "@/src/theme/colorSchema";

interface InteractionsApiResponse {
  data: {
    rows: InteractionEventBucketData[];
    totals: {
      totalCount: number;
      buckets: number;
      uniqueInteractionIds: number;
      uniqueSections: number;
    };
    byInteraction: Array<{ key: string; value: number }>;
    bySection: Array<{ key: string; value: number }>;
    byPath: Array<{ key: string; value: number }>;
    byProgram: Array<{ key: string; value: number }>;
  };
}

export default function InteractionsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [rows, setRows] = useState<InteractionEventBucketData[]>([]);
  const [totals, setTotals] = useState({
    totalCount: 0,
    buckets: 0,
    uniqueInteractionIds: 0,
    uniqueSections: 0
  });
  const [byInteraction, setByInteraction] = useState<Array<{ key: string; value: number }>>([]);
  const [bySection, setBySection] = useState<Array<{ key: string; value: number }>>([]);
  const [byPath, setByPath] = useState<Array<{ key: string; value: number }>>([]);
  const [byProgram, setByProgram] = useState<Array<{ key: string; value: number }>>([]);
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedPath, setSelectedPath] = useState("all");
  const [selectedInteraction, setSelectedInteraction] = useState("all");
  const [sortColumn, setSortColumn] = useState<string>("lastSeenAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 25;

  const tableColumns: SortableColumn[] = [
    { key: "interactionId", label: "Interaction", sortable: true },
    { key: "sectionId", label: "Section", sortable: true },
    { key: "pagePath", label: "Path", sortable: true },
    { key: "programSlug", label: "Program", sortable: true },
    { key: "count", label: "Count", sortable: true },
    { key: "bucketDateHour", label: "Hour Bucket", sortable: true },
    { key: "lastSeenAt", label: "Last Seen", sortable: true }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
        setRows([]);
        setTotals({ totalCount: 0, buckets: 0, uniqueInteractionIds: 0, uniqueSections: 0 });
        setByInteraction([]);
        setBySection([]);
        setByPath([]);
        setByProgram([]);
        return;
      }
      const { since, until } = getDateRange(selectedPeriod, customDateRange);
      const res = await fetch(
        `/api/v1/admin/interactions?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`
      );
      const json = (await res.json()) as InteractionsApiResponse;
      if (!res.ok) throw new Error("Failed to fetch interactions");
      setRows(json.data.rows || []);
      setTotals(json.data.totals);
      setByInteraction((json.data.byInteraction || []).map(i => ({ ...i, label: i.key })));
      setBySection((json.data.bySection || []).map(i => ({ ...i, label: i.key })));
      setByPath((json.data.byPath || []).map(i => ({ ...i, label: i.key })));
      setByProgram((json.data.byProgram || []).map(i => ({ ...i, label: i.key })));
    } catch (e) {
      console.error("[admin interactions] fetch", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [customDateRange, selectedPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sectionOptions = useMemo(() => Array.from(new Set(rows.map(r => r.sectionId).filter(Boolean))).sort(), [rows]);
  const pathOptions = useMemo(() => Array.from(new Set(rows.map(r => r.pagePath).filter(Boolean))).sort(), [rows]);
  const interactionOptions = useMemo(
    () => Array.from(new Set(rows.map(r => r.interactionId).filter(Boolean))).sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (selectedSection !== "all" && r.sectionId !== selectedSection) return false;
      if (selectedPath !== "all" && r.pagePath !== selectedPath) return false;
      if (selectedInteraction !== "all" && r.interactionId !== selectedInteraction) return false;
      return true;
    });
  }, [rows, selectedInteraction, selectedPath, selectedSection]);

  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortColumn];
      const bv = (b as unknown as Record<string, unknown>)[sortColumn];
      let cmp = 0;
      if (sortColumn === "count") cmp = (Number(av) || 0) - (Number(bv) || 0);
      else if (sortColumn === "lastSeenAt")
        cmp = new Date(String(av || "")).getTime() - new Date(String(bv || "")).getTime();
      else cmp = String(av || "").localeCompare(String(bv || ""));
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filteredRows, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * rowsPerPage;
  const pagedRows = sortedRows.slice(pageStart, pageStart + rowsPerPage);

  return (
    <ProtectedAdminLayout title="Interactions" subtitle="Lightweight bucketed interaction tracking">
      <div className="mb-6">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customDateRange={customDateRange}
          onCustomDateChange={(start, end) => setCustomDateRange({ start, end })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsCard title="Total Interactions" value={totals.totalCount} icon="🖱️" color="blue" />
        <AnalyticsCard title="Buckets" value={totals.buckets} icon="🧱" color="purple" />
        <AnalyticsCard title="Unique Elements" value={totals.uniqueInteractionIds} icon="🎯" color="green" />
        <AnalyticsCard title="Unique Sections" value={totals.uniqueSections} icon="📍" color="orange" />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Loading interactions...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <DataTable title="Top Interactions" data={byInteraction} maxItems={12} showPercentage />
            <DataTable title="Top Sections" data={bySection} maxItems={12} showPercentage />
            <DataTable title="Top Paths" data={byPath} maxItems={12} showPercentage />
            <DataTable title="Top Programs" data={byProgram} maxItems={12} showPercentage />
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Buckets</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => {
                    setSelectedSection(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900">
                  <option value="all">All</option>
                  {sectionOptions.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Path</label>
                <select
                  value={selectedPath}
                  onChange={e => {
                    setSelectedPath(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900">
                  <option value="all">All</option>
                  {pathOptions.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Interaction</label>
                <select
                  value={selectedInteraction}
                  onChange={e => {
                    setSelectedInteraction(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm text-gray-900">
                  <option value="all">All</option>
                  {interactionOptions.map(o => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedSection("all");
                  setSelectedPath("all");
                  setSelectedInteraction("all");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${adminChrome.filterPillIdle}`}>
                Reset Filters
              </button>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-xl shadow-soft border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Interaction Buckets</h3>
              <p className="text-sm text-gray-500 mt-1">
                Showing {pagedRows.length} of {sortedRows.length} filtered rows
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <SortableTableHead
                  columns={tableColumns}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={col => {
                    setCurrentPage(1);
                    if (col === sortColumn) setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
                    else {
                      setSortColumn(col);
                      setSortDirection("asc");
                    }
                  }}
                />
                <tbody className="bg-white divide-y divide-gray-200">
                  {pagedRows.map(row => (
                    <tr key={row._id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm font-mono text-gray-900">{row.interactionId}</td>
                      <td className="p-4 text-sm text-gray-900">{row.sectionId}</td>
                      <td className="p-4 text-sm font-mono text-gray-700">{row.pagePath}</td>
                      <td className="p-4 text-sm text-gray-700">{row.programSlug || "-"}</td>
                      <td className="p-4 text-sm font-semibold text-gray-900">{row.count.toLocaleString()}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{row.bucketDateHour}</td>
                      <td className="p-4 text-sm text-gray-500">{new Date(row.lastSeenAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={clampedPage}
                totalPages={totalPages}
                totalItems={sortedRows.length}
                itemsPerPage={rowsPerPage}
                onPageChange={setCurrentPage}
                variant="simple"
              />
            </div>
          </div>
        </>
      )}

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
        Showing {rows.length.toLocaleString()} interaction buckets in selected period.
      </div>
    </ProtectedAdminLayout>
  );
}
