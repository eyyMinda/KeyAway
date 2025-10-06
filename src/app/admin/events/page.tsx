"use client";

import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import TimeFilter from "@/src/components/admin/TimeFilter";
import { useState, useEffect, useCallback } from "react";
import { client } from "@/src/sanity/lib/client";
import { trackingEventsQuery, trackingEventsWithRangeQuery } from "@/src/lib/queries";
import { AnalyticsEventData } from "@/src/types";
import { getDateFromPeriod } from "@/src/lib/analyticsUtils";

export default function EventsPage() {
  const [events, setEvents] = useState<AnalyticsEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const tableColumns = ["Event Type", "Program", "Social Platform", "Path", "Location", "Referrer", "Timestamp"];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const since = getDateFromPeriod(selectedPeriod, customDateRange);

      let eventsData: AnalyticsEventData[];

      if (selectedPeriod === "custom" && customDateRange.start && customDateRange.end) {
        // Use custom range query only when both dates are selected
        const until = new Date(customDateRange.end + "T23:59:59.999Z").toISOString();
        eventsData = await client.fetch(trackingEventsWithRangeQuery, { since, until });
      } else if (selectedPeriod === "custom") {
        // Don't fetch if custom is selected but dates are incomplete
        setEvents([]);
        setLoading(false);
        return;
      } else {
        // Use regular query for non-custom periods
        eventsData = await client.fetch(trackingEventsQuery, { since });
      }

      setEvents(eventsData);
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
    // Only trigger fetch if both dates are selected and we're in custom mode
    if (start && end && selectedPeriod === "custom") {
      // The useEffect will trigger the fetch automatically
    }
  };

  const filteredEvents = selectedEvent === "all" ? events : events.filter(event => event.event === selectedEvent);

  const eventTypes = Array.from(new Set(events.map(e => e.event)));

  if (loading) {
    return (
      <ProtectedAdminLayout title="Events" subtitle="Track and analyze user interactions">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  // Show message when custom range is selected but dates are incomplete
  if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
    return (
      <ProtectedAdminLayout title="Events" subtitle="Track and analyze user interactions">
        {/* Time Filter */}
        <div className="mb-6">
          <TimeFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            customDateRange={customDateRange}
            onCustomDateChange={handleCustomDateChange}
          />
        </div>

        {/* Event Filter */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedEvent("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedEvent === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                All Events (0)
              </button>
            </div>
          </div>
        </div>

        {/* Custom Range Message */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Select Date Range</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Please select both start and end dates to view events for the custom range.</p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  return (
    <ProtectedAdminLayout title="Events" subtitle="Track and analyze user interactions">
      {/* Time Filter */}
      <div className="mb-6">
        <TimeFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={handlePeriodChange}
          customDateRange={customDateRange}
          onCustomDateChange={handleCustomDateChange}
        />
      </div>

      {/* Event Filter */}
      <div className="mb-6">
        <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEvent("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedEvent === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              All Events ({events.length})
            </button>
            {eventTypes.map(eventType => (
              <button
                key={eventType}
                onClick={() => setSelectedEvent(eventType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  selectedEvent === eventType ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {eventType.replace(/_/g, " ").toUpperCase()} ({events.filter(e => e.event === eventType).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl shadow-soft border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          <p className="text-sm text-gray-500 mt-1">
            Showing {filteredEvents.length} of {events.length} events
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {tableColumns.map(label => (
                  <th
                    key={label}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.slice(0, 50).map(event => (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.event === "copy_cdkey"
                          ? "bg-green-100 text-green-800"
                          : event.event === "download_click"
                            ? "bg-blue-100 text-primary-800"
                            : "bg-purple-100 text-purple-800"
                      }`}>
                      {event.event.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.programSlug ? (
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                        {event.programSlug.replace(/-/g, " ")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.social ? (
                      <span className="capitalize">{event.social}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-mono text-xs">{event.path || "/"}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.country || event.city ? (
                      <div className="flex flex-col">
                        {event.country && <span className="font-medium">{event.country}</span>}
                        {event.city && <span className="text-xs text-gray-500">{event.city}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.referrer ? (
                      <a
                        href={event.referrer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs truncate max-w-32 block"
                        title={event.referrer}>
                        {new URL(event.referrer).hostname}
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">No events match the current filter criteria.</p>
          </div>
        )}
      </div>
    </ProtectedAdminLayout>
  );
}
