"use client";

import { useCallback, useEffect, useState } from "react";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import TimeFilter from "@/src/components/admin/TimeFilter";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";
import { InteractionEventBucketData } from "@/src/types";

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
      const res = await fetch(`/api/v1/admin/interactions?since=${encodeURIComponent(since)}&until=${encodeURIComponent(until)}`);
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
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Loading interactions...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DataTable title="Top Interactions" data={byInteraction} maxItems={12} showPercentage />
          <DataTable title="Top Sections" data={bySection} maxItems={12} showPercentage />
          <DataTable title="Top Paths" data={byPath} maxItems={12} showPercentage />
          <DataTable title="Top Programs" data={byProgram} maxItems={12} showPercentage />
        </div>
      )}

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
        Showing {rows.length.toLocaleString()} interaction buckets in selected period.
      </div>
    </ProtectedAdminLayout>
  );
}
