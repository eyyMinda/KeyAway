"use client";

import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import TimeFilter from "@/src/components/admin/TimeFilter";
import EventsFilter from "@/src/components/admin/events/EventsFilter";
import EventsTable from "@/src/components/admin/events/EventsTable";
import { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import { useState, useEffect, useCallback, useMemo } from "react";
import { client } from "@/src/sanity/lib/client";
import { trackingEventsQuery, trackingEventsWithRangeQuery } from "@/src/lib/queries";
import { AnalyticsEventData } from "@/src/types";
import { getDateFromPeriod } from "@/src/lib/analyticsUtils";

export default function EventsPage() {
  const [events, setEvents] = useState<AnalyticsEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const tableColumns: SortableColumn[] = [
    { key: "event", label: "Event Type", sortable: true },
    { key: "program", label: "Program", sortable: true },
    { key: "social", label: "Social Platform", sortable: true },
    { key: "path", label: "Path", sortable: true },
    { key: "location", label: "Location", sortable: true },
    { key: "referrer", label: "Referrer", sortable: true },
    { key: "timestamp", label: "Timestamp", sortable: true }
  ];
  const eventsPerPage = 25;

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
    setCurrentPage(1); // Reset to first page when period changes
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomDateRange({ start, end });
    setCurrentPage(1); // Reset to first page when date range changes
    // Only trigger fetch if both dates are selected and we're in custom mode
    if (start && end && selectedPeriod === "custom") {
      // The useEffect will trigger the fetch automatically
    }
  };

  const handleEventFilterChange = (eventType: string) => {
    setSelectedEvent(eventType);
    setCurrentPage(1); // Reset to first page when event filter changes
  };

  const handleSort = (column: string) => {
    setCurrentPage(1); // Reset to first page when sorting changes
    if (sortColumn === column) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredEvents = selectedEvent === "all" ? events : events.filter(event => event.event === selectedEvent);

  // Sorting logic
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case "event":
          cmp = a.event.localeCompare(b.event);
          break;
        case "program":
          const aProgram = a.programSlug || "";
          const bProgram = b.programSlug || "";
          cmp = aProgram.localeCompare(bProgram);
          break;
        case "social":
          const aSocial = a.social || "";
          const bSocial = b.social || "";
          cmp = aSocial.localeCompare(bSocial);
          break;
        case "path":
          const aPath = a.path || "";
          const bPath = b.path || "";
          cmp = aPath.localeCompare(bPath);
          break;
        case "location":
          const aLocation = `${a.country || ""} ${a.city || ""}`.trim();
          const bLocation = `${b.country || ""} ${b.city || ""}`.trim();
          cmp = aLocation.localeCompare(bLocation);
          break;
        case "referrer":
          const aReferrer = a.referrer || "";
          const bReferrer = b.referrer || "";
          cmp = aReferrer.localeCompare(bReferrer);
          break;
        case "timestamp":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [filteredEvents, sortColumn, sortDirection]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedEvents.length / eventsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (clampedPage - 1) * eventsPerPage;
  const pageEndIndex = Math.min(pageStartIndex + eventsPerPage, sortedEvents.length);
  const paginatedEvents = sortedEvents.slice(pageStartIndex, pageEndIndex);

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
        <EventsFilter
          selectedEvent={selectedEvent}
          eventTypes={[]}
          events={events}
          onEventChange={handleEventFilterChange}
        />

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
      <EventsFilter
        selectedEvent={selectedEvent}
        eventTypes={eventTypes}
        events={events}
        onEventChange={handleEventFilterChange}
      />

      {/* Events Table */}
      <EventsTable
        events={paginatedEvents}
        columns={tableColumns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        currentPage={clampedPage}
        totalPages={totalPages}
        itemsPerPage={eventsPerPage}
        onPageChange={setCurrentPage}
      />
    </ProtectedAdminLayout>
  );
}
