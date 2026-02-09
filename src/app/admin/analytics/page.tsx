"use client";

import { useState, useEffect, useCallback } from "react";
import { trackingEventsQuery, allProgramsQuery } from "@/src/lib/queries";
import { client } from "@/src/sanity/lib/client";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import EventChart from "@/src/components/admin/EventChart";
import TimeFilter from "@/src/components/admin/TimeFilter";
import RecentActivity from "@/src/components/admin/RecentActivity";
import { Program, AnalyticsEventData } from "@/src/types";
import {
  getDateFromPeriod,
  aggregateEvents,
  transformEventData,
  transformProgramData,
  transformSocialData,
  transformPathData,
  transformCountryData,
  transformReferrerDataWithParams
} from "@/src/lib/analyticsUtils";

export default function AnalyticsPage() {
  const [events, setEvents] = useState<AnalyticsEventData[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const since = getDateFromPeriod(selectedPeriod, customDateRange);
      const [eventsData, programsData] = await Promise.all([
        client.fetch(trackingEventsQuery, { since }),
        client.fetch(allProgramsQuery)
      ]);
      setEvents(eventsData);
      setPrograms(programsData);
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

  // Aggregate data
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

  // Convert maps to arrays for components
  const eventData = transformEventData(totals);
  const programData = transformProgramData(byProgram);
  const socialData = transformSocialData(bySocial);
  const pathData = transformPathData(byPath);
  const countryData = transformCountryData(byCountry);
  const referrerData = transformReferrerDataWithParams(events);

  return (
    <ProtectedAdminLayout title="Analytics Dashboard" subtitle="Real-time insights into user behavior and engagement">
      {/* Time Filter */}
      <div className="mb-8">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          customDateRange={customDateRange}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      {/* Key Metrics */}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <EventChart data={eventData} title="Events Distribution" type="doughnut" />
        <EventChart data={eventData} title="Events Overview" type="bar" />
      </div>

      {/* Data Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable title="Top Programs" data={programData} maxItems={10} showPercentage={true} />
        <DataTable title="Social Media Engagement" data={socialData} maxItems={8} showPercentage={true} />
      </div>

      {/* Location & Referrer Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataTable title="Top Countries" data={countryData} maxItems={10} showPercentage={true} />
        <DataTable title="Top Referrers" data={referrerData} maxItems={8} showPercentage={true} />
      </div>

      {/* Page Activity */}
      <div className="mb-8">
        <DataTable title="Page Activity" data={pathData} maxItems={15} showPercentage={true} />
      </div>

      {/* Recent Activity */}
      <RecentActivity events={events} maxItems={10} />
    </ProtectedAdminLayout>
  );
}
