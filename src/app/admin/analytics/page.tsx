"use client";

/** @fileoverview Admin analytics dashboard: time filter, charts, ranked tables, recent activity. */
import { useState, useEffect, useCallback } from "react";
import { allProgramsQuery } from "@/src/lib/sanity/queries";
import { client } from "@/src/sanity/lib/client";
import { fetchEventsForRange, fetchVisitorTagAggregatesForRange } from "@/src/lib/analytics/eventsApi";
import type { VisitorTagAggregateRow } from "@/src/lib/analytics/eventsApi";
import { visitorTierSwatchBgClass } from "@/src/theme/colorSchema";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import EventChart from "@/src/components/admin/EventChart";
import TimeFilter from "@/src/components/admin/TimeFilter";
import RecentActivity from "@/src/components/admin/RecentActivity";
import { Program, AnalyticsEventData } from "@/src/types";
import {
  getDateRange,
  aggregateEvents,
  transformEventData,
  transformProgramData,
  transformSocialData,
  transformPathActivityTable,
  transformCountryData,
  transformReferrerDataWithParams
} from "@/src/lib/analytics/analyticsUtils";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEventData[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [visitorTagRows, setVisitorTagRows] = useState<VisitorTagAggregateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
        setEvents([]);
        setPrograms([]);
        setVisitorTagRows([]);
        setLoading(false);
        return;
      }
      const { since, until } = getDateRange(selectedPeriod, customDateRange);
      const [eventsData, programsData, visitorRows] = await Promise.all([
        fetchEventsForRange(since, until),
        client.fetch(allProgramsQuery),
        fetchVisitorTagAggregatesForRange(since, until)
      ]);
      setEvents(eventsData);
      setPrograms(programsData);
      setVisitorTagRows(visitorRows);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, customDateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomDateRange({ start, end });
  };

  const { totals, byProgram, bySocial, byPath, byCountry } = aggregateEvents(events);
  const totalEvents = events.length;
  const totalPrograms = programs.filter(p => p.slug?.current).length;
  const uniqueVisitors = new Set(events.map(e => e.ipHash).filter(Boolean)).size;

  if (loading) {
    return (
      <ProtectedAdminLayout title="Analytics Dashboard" subtitle="Real-time insights into user behavior and engagement">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  const eventData = transformEventData(totals);
  const programData = transformProgramData(byProgram);
  const socialData = transformSocialData(bySocial);
  const pathData = transformPathActivityTable(events, byPath);
  const countryData = transformCountryData(byCountry);
  const referrerData = transformReferrerDataWithParams(events);

  return (
    <ProtectedAdminLayout title="Analytics Dashboard" subtitle="Real-time insights into user behavior and engagement">
      <div className="mb-8">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          customDateRange={customDateRange}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-8">
        <AnalyticsCard title="Total Events" value={totalEvents} subtitle="Last 30 days" icon="📊" color="blue" />
        <AnalyticsCard
          title="Total Programs"
          value={totalPrograms}
          subtitle="Programs on website"
          icon="💻"
          color="green"
        />
        <AnalyticsCard
          title="Social Clicks"
          value={totals.get("social_click") || 0}
          subtitle="Social media engagement"
          icon="📱"
          color="purple"
        />
        <AnalyticsCard
          title="Page Views"
          value={totals.get("page_viewed") || 0}
          subtitle="Total page views"
          icon="👁️"
          color="orange"
        />
        <AnalyticsCard
          title="Unique Visitors"
          value={uniqueVisitors}
          subtitle="Distinct visitors"
          icon="👨‍👩‍👧"
          color="purple"
        />
        <AnalyticsCard
          title="Unique Countries"
          value={byCountry.size}
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
          maxItems={10}
          showPercentage={true}
        />
        <DataTable title="Social Media Engagement" data={socialData} maxItems={10} showPercentage={true} />
      </div>

      <RecentActivity events={events} maxItems={10} />
    </ProtectedAdminLayout>
  );
}
