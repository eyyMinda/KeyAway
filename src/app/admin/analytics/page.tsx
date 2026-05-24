"use client";

/** @fileoverview Admin analytics dashboard: time filter, charts, ranked tables, recent activity. */
import { useState, useEffect, useCallback } from "react";
import { allProgramsQuery } from "@/src/lib/sanity/queries";
import { client } from "@/src/sanity/lib/client";
import {
  fetchAnalyticsSummary,
  fetchVisitorTagAggregatesForRange,
  type AnalyticsSummaryData,
  type VisitorTagAggregateRow
} from "@/src/lib/analytics/eventsApi";
import { visitorTierSwatchBgClass } from "@/src/theme/colorSchema";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import EventChart from "@/src/components/admin/EventChart";
import TimeFilter from "@/src/components/admin/TimeFilter";
import RecentActivity from "@/src/components/admin/RecentActivity";
import { Program } from "@/src/types";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummaryData | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
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
          setPrograms([]);
          setVisitorTagRows([]);
          return;
        }
        const { since, until } = getDateRange(selectedPeriod, customDateRange);
        const [summaryData, programsData, visitorRows] = await Promise.all([
          fetchAnalyticsSummary(since, until, { refresh: isRefresh }),
          client.fetch(allProgramsQuery),
          fetchVisitorTagAggregatesForRange(since, until)
        ]);
        setSummary(summaryData);
        setPrograms(programsData);
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

  const totalPrograms = programs.filter(p => p.slug?.current).length;
  const totals = summary?.totals ?? {};

  if (loading && !refreshing) {
    return (
      <ProtectedAdminLayout title="Analytics" subtitle="Real-time insights into user behavior and engagement">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  const eventData = summary?.eventChart ?? [];
  const programData = summary?.programTable ?? [];
  const socialData = summary?.socialTable ?? [];
  const pathData = summary?.pathTable ?? [];
  const countryData = summary?.countryTable ?? [];
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-8">
        <AnalyticsCard
          title="Total Events"
          value={summary?.totalEvents ?? 0}
          subtitle="Selected period"
          icon="📊"
          color="blue"
        />
        <AnalyticsCard
          title="Total Programs"
          value={totalPrograms}
          subtitle="Programs on website"
          icon="💻"
          color="green"
        />
        <AnalyticsCard
          title="Social Clicks"
          value={totals.social_click ?? 0}
          subtitle="Social media engagement"
          icon="📱"
          color="purple"
        />
        <AnalyticsCard
          title="Page Views"
          value={totals.page_viewed ?? 0}
          subtitle="Total page views"
          icon="👁️"
          color="orange"
        />
        <AnalyticsCard
          title="Unique Visitors"
          value={summary?.uniqueVisitors ?? 0}
          subtitle="Distinct visitors"
          icon="👨‍👩‍👧"
          color="purple"
        />
        <AnalyticsCard
          title="Unique Countries"
          value={summary?.uniqueCountries ?? 0}
          subtitle="Geographic reach"
          icon="🌍"
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EventChart data={eventData} title="Events Distribution" type="doughnut" />
        <EventChart data={eventData} title="Events Overview" type="bar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable title="Top Programs" data={programData} maxItems={12} showPercentage={true} />
        <DataTable title="Top Referrers" data={referrerData} maxItems={12} showPercentage={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable title="Top Countries" data={countryData} maxItems={20} showPercentage={true} />
        <DataTable title="Page Activity" data={pathData} maxItems={20} showPercentage={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable
          title="Visitor tags"
          data={visitorTagRows.map(r => ({
            key: r.key,
            value: r.value,
            label: r.label,
            swatchClass: visitorTierSwatchBgClass(r.key)
          }))}
          showPercentage={true}
        />
        <DataTable title="Social Media Engagement" data={socialData} maxItems={10} showPercentage={true} />
      </div>

      <RecentActivity events={recentEvents} maxItems={10} />
    </ProtectedAdminLayout>
  );
}
