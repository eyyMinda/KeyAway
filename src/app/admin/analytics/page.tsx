"use client";

/** @fileoverview Admin analytics dashboard: time filter, charts, ranked tables, recent activity. */
import { useState, useEffect, useCallback } from "react";
import {
  fetchAnalyticsSummary,
  fetchVisitorTagAggregatesForRange,
  type AnalyticsSummaryData,
  type VisitorTagAggregateRow
} from "@/src/lib/analytics/eventsApi";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import ActivityOverview from "@/src/components/admin/ActivityOverview";
import PromotionTracking from "@/src/components/admin/PromotionTracking";
import TimeFilter from "@/src/components/admin/TimeFilter";
import RecentActivity from "@/src/components/admin/RecentActivity";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";
import { VISITOR_TIER_SWATCH, countActions } from "@/src/lib/analytics/activitySeries";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [visitorTagRows, setVisitorTagRows] = useState<VisitorTagAggregateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const fetchData = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = options?.refresh === true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
          setSummary(null);
          setVisitorTagRows([]);
          return;
        }
        const { since, until } = getDateRange(selectedPeriod, customDateRange);
        const [summaryData, visitorRows] = await Promise.all([
          fetchAnalyticsSummary(since, until, { refresh: isRefresh }),
          fetchVisitorTagAggregatesForRange(since, until)
        ]);
        setSummary(summaryData);
        setVisitorTagRows(visitorRows);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPeriod, customDateRange]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData({ refresh: true });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomDateRange({ start, end });
  };


  if (loading && !refreshing) {
    return (
      <ProtectedAdminLayout title="Analytics" subtitle="Real-time insights into user behavior and engagement">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  const totals = summary?.totals ?? {};
  const timeline = summary?.timeline ?? { bucket: "day" as const, points: [], tierTotals: {} };
  const promotions = summary?.promotions ?? { clicks: 0, visitors: 0, placements: [], pages: [], campaign: null };
  const sessions = summary?.sessions ?? 0;
  const pageViews = totals.page_viewed ?? 0;
  const actions = countActions(totals);
  const spark = (key: "visitors" | "views" | "actions") => timeline.points.map(p => p[key]);
  const programData = summary?.programTable ?? [];
  const socialData = summary?.socialTable ?? [];
  const pathData = summary?.pathTable ?? [];
  const countryData = summary?.countryTable ?? [];
  const countryTotal = countryData.reduce((n, c) => n + c.value, 0);
  const topCountry = countryData.reduce<(typeof countryData)[number] | null>((top, c) => (!top || c.value > top.value ? c : top), null);
  const topCountryShare = topCountry && countryTotal ? Math.round((topCountry.value / countryTotal) * 100) : 0;
  const referrerData = summary?.referrerTable ?? [];
  const recentEvents = summary?.recentEvents ?? [];

  return (
    <ProtectedAdminLayout title="Analytics" subtitle="Real-time insights into user behavior and engagement">
      <div className="mb-8">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          customDateRange={customDateRange}
          onCustomDateChange={handleCustomDateChange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          refreshDisabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <AnalyticsCard
          label="Visitors"
          value={summary?.uniqueVisitors ?? 0}
          detail={`${sessions.toLocaleString()} sessions`}
          spark={spark("visitors")}
        />
        <AnalyticsCard
          label="Page views"
          value={pageViews}
          detail={sessions ? `${(pageViews / sessions).toFixed(1)} per session` : undefined}
          spark={spark("views")}
        />
        <AnalyticsCard
          label="Actions"
          value={actions}
          detail={pageViews ? `${((actions / pageViews) * 100).toFixed(1)} per 100 views` : undefined}
          spark={spark("actions")}
        />
        <AnalyticsCard
          label="Countries"
          value={summary?.uniqueCountries ?? 0}
          detail={topCountry ? `Top: ${topCountry.label} · ${topCountryShare}%` : undefined}
        />
      </div>

      <div className="space-y-6 mb-8">
        <ActivityOverview timeline={timeline} uniqueVisitors={summary?.uniqueVisitors ?? 0} pageViews={pageViews} />
        <PromotionTracking timeline={timeline} promotions={promotions} pageViews={pageViews} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Top Programs"
          data={programData}
          maxItems={12}
          showPercentage={true}
          searchable
          searchPlaceholder="Search programs…"
        />
        <DataTable
          title="Session sources"
          data={referrerData}
          maxItems={12}
          showPercentage={true}
          countNoun="sessions"
          searchable
          searchPlaceholder="Search sources…"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Top Countries"
          data={countryData}
          maxItems={12}
          showPercentage={true}
          searchable
          searchPlaceholder="Search countries…"
        />
        <DataTable
          title="Page Activity"
          data={pathData}
          maxItems={12}
          showPercentage={true}
          searchable
          searchPlaceholder="Search pages…"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Visitor tags"
          data={visitorTagRows.map(r => ({
            key: r.key,
            value: r.value,
            label: r.label,
            swatchClass: VISITOR_TIER_SWATCH[r.key] ?? "bg-neutral-400"
          }))}
          showPercentage={true}
        />
        <DataTable title="Social Media Engagement" data={socialData} maxItems={10} showPercentage={true} />
      </div>

      <RecentActivity events={recentEvents} maxItems={10} />
    </ProtectedAdminLayout>
  );
}
