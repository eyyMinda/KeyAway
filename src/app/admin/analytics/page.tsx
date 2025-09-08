"use client";

import { useState, useEffect, useCallback } from "react";
import { trackingEventsQuery, allProgramsQuery } from "@/src/lib/queries";
import { client } from "@/src/sanity/lib/client";
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import AnalyticsCard from "@/src/components/admin/AnalyticsCard";
import DataTable from "@/src/components/admin/DataTable";
import EventChart from "@/src/components/admin/EventChart";
import TimeFilter from "@/src/components/admin/TimeFilter";
import { Program } from "@/src/types/ProgramType";

type EventDoc = {
  _id: string;
  event: string;
  programSlug?: string;
  social?: string;
  path?: string;
  referrer?: string;
  country?: string;
  city?: string;
  createdAt: string;
};

export default function AnalyticsPage() {
  const [events, setEvents] = useState<EventDoc[]>([]);
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
      const getDateFromPeriod = (period: string) => {
        const now = new Date();
        switch (period) {
          case "1h":
            return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
          case "24h":
            return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          case "7d":
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          case "30d":
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          case "90d":
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
          case "custom":
            return customDateRange.start
              ? new Date(customDateRange.start).toISOString()
              : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          default:
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      };

      const since = getDateFromPeriod(selectedPeriod);
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
  }, [selectedPeriod, customDateRange.start]);

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
  const totals = new Map<string, number>();
  const byProgram = new Map<string, number>();
  const bySocial = new Map<string, number>();
  const byPath = new Map<string, number>();
  const byCountry = new Map<string, number>();
  const byReferrer = new Map<string, number>();

  for (const e of events) {
    totals.set(e.event, (totals.get(e.event) || 0) + 1);
    if (e.programSlug) byProgram.set(e.programSlug, (byProgram.get(e.programSlug) || 0) + 1);
    if (e.social) bySocial.set(e.social, (bySocial.get(e.social) || 0) + 1);
    if (e.path) byPath.set(e.path, (byPath.get(e.path) || 0) + 1);
    if (e.country) byCountry.set(e.country, (byCountry.get(e.country) || 0) + 1);
    if (e.referrer) {
      try {
        const hostname = new URL(e.referrer).hostname;
        byReferrer.set(hostname, (byReferrer.get(hostname) || 0) + 1);
      } catch {
        // Invalid URL, skip
      }
    }
  }

  const totalEvents = events.length;
  const uniquePrograms = byProgram.size;

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
  const eventData = Array.from(totals).map(([name, count]) => ({
    name: name.replace(/_/g, " ").toUpperCase(),
    value: count,
    color: getEventColor(name)
  }));

  const programData = Array.from(byProgram).map(([slug, count]) => ({
    key: slug,
    value: count,
    label: slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
  }));

  const socialData = Array.from(bySocial).map(([name, count]) => ({
    key: name,
    value: count,
    label: name.charAt(0).toUpperCase() + name.slice(1)
  }));

  const pathData = Array.from(byPath).map(([path, count]) => ({
    key: path,
    value: count,
    label:
      path === "/"
        ? "Home"
        : path
            .replace(/^\//, "")
            .replace(/\//g, " | ")
            .replace(/-/g, " ")
            .replace(/\b\w/g, l => l.toUpperCase())
  }));

  const countryData = Array.from(byCountry).map(([country, count]) => ({
    key: country,
    value: count,
    label: country
  }));

  const referrerData = Array.from(byReferrer).map(([hostname, count]) => ({
    key: hostname,
    value: count,
    label: hostname
  }));

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 mb-8">
        <AnalyticsCard title="Total Events" value={totalEvents} subtitle="Last 30 days" icon="📊" color="blue" />
        <AnalyticsCard
          title="Total Programs"
          value={programs.length}
          subtitle="All programs in system"
          icon="🎮"
          color="green"
        />
        <AnalyticsCard
          title="Active Programs"
          value={uniquePrograms}
          subtitle="With tracked events"
          icon="📈"
          color="purple"
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
      <div className="bg-white rounded-xl shadow-soft border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500 mt-1">Latest tracking events</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {events.slice(0, 10).map(event => (
              <div
                key={event._id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${getEventDotColor(event.event)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {event.event.replace(/_/g, " ").toUpperCase()}
                      </span>
                      {event.programSlug && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{event.programSlug}</span>
                      )}
                      {event.social && (
                        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">{event.social}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      {event.country && (
                        <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                          {event.country}
                          {event.city && `, ${event.city}`}
                        </span>
                      )}
                      {event.path && <span className="text-xs text-gray-500 font-mono">{event.path}</span>}
                      {event.referrer && (
                        <span className="text-xs text-gray-500 truncate max-w-32" title={event.referrer}>
                          from {new URL(event.referrer).hostname}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedAdminLayout>
  );
}

function getEventColor(event: string): string {
  switch (event) {
    case "copy_cdkey":
      return "#10B981"; // green
    case "download_click":
      return "#3B82F6"; // blue
    case "social_click":
      return "#8B5CF6"; // purple
    default:
      return "#6B7280"; // gray
  }
}

function getEventDotColor(event: string): string {
  switch (event) {
    case "copy_cdkey":
      return "bg-green-500";
    case "download_click":
      return "bg-blue-500";
    case "social_click":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}
