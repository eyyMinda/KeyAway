"use client";

/** @fileoverview Admin events list with filters, sort, pagination. */
import ProtectedAdminLayout from "@/src/components/admin/ProtectedAdminLayout";
import TimeFilter from "@/src/components/admin/TimeFilter";
import EventsFilter from "@/src/components/admin/events/EventsFilter";
import EventsTable from "@/src/components/admin/events/EventsTable";
import { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import { useState, useEffect, useCallback } from "react";
import { AnalyticsEventData } from "@/src/types";
import { getDateRange } from "@/src/lib/analytics/analyticsUtils";
import { fetchAdminEventsPage } from "@/src/lib/analytics/eventsApi";

const SORT_API_MAP: Record<string, string> = {
  timestamp: "createdAt",
  event: "event",
  program: "programSlug",
  social: "social",
  path: "path"
};

export default function EventsPage() {
  const [events, setEvents] = useState<AnalyticsEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("24h");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [countsByEvent, setCountsByEvent] = useState<Record<string, number>>({});
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: ""
  });

  const tableColumns: SortableColumn[] = [
    { key: "visitorTags", label: "Visitor", sortable: true },
    { key: "event", label: "Event Type", sortable: true },
    { key: "program", label: "Program", sortable: true },
    { key: "social", label: "Social", sortable: true },
    { key: "path", label: "Path", sortable: true },
    { key: "location", label: "Location", sortable: true },
    { key: "referrer", label: "Referrer", sortable: true },
    { key: "timestamp", label: "Timestamp", sortable: true }
  ];
  const eventsPerPage = 25;

  const fetchEvents = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = options?.refresh === true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
          setEvents([]);
          setCountsByEvent({});
          setTotalItems(0);
          setTotalPages(1);
          return;
        }
        const { since, until } = getDateRange(selectedPeriod, customDateRange);
        const sort = SORT_API_MAP[sortColumn] ?? "createdAt";
        const result = await fetchAdminEventsPage({
          since,
          until,
          event: selectedEvent,
          page: currentPage,
          limit: eventsPerPage,
          sort,
          order: sortDirection,
          refresh: isRefresh
        });
        setEvents(result.data);
        setCountsByEvent(result.meta.countsByEvent);
        setTotalItems(result.meta.total);
        setTotalPages(result.meta.totalPages);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPeriod, customDateRange, selectedEvent, currentPage, sortColumn, sortDirection]
  );

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    fetchEvents({ refresh: true });
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    setCurrentPage(1);
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setCustomDateRange({ start, end });
    setCurrentPage(1);
  };

  const handleEventFilterChange = (eventType: string) => {
    setSelectedEvent(eventType);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const eventTypes = Object.keys(countsByEvent).sort();

  if (loading && !refreshing) {
    return (
      <ProtectedAdminLayout title="Events" subtitle="Track and analyze site analytics">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading events...</p>
          </div>
        </div>
      </ProtectedAdminLayout>
    );
  }

  if (selectedPeriod === "custom" && (!customDateRange.start || !customDateRange.end)) {
    return (
      <ProtectedAdminLayout title="Events" subtitle="Track and analyze site analytics">
        <div className="mb-6">
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

        <EventsFilter
          selectedEvent={selectedEvent}
          eventTypes={[]}
          countsByEvent={{}}
          totalCount={0}
          onEventChange={handleEventFilterChange}
        />

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center">
            <div className="shrink-0">
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
    <ProtectedAdminLayout title="Events" subtitle="Track and analyze site analytics">
      <div className="mb-6">
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

      <EventsFilter
        selectedEvent={selectedEvent}
        eventTypes={eventTypes}
        countsByEvent={countsByEvent}
        totalCount={Object.values(countsByEvent).reduce((a, b) => a + b, 0)}
        onEventChange={handleEventFilterChange}
      />

      <EventsTable
        events={events}
        totalItems={totalItems}
        columns={tableColumns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={eventsPerPage}
        onPageChange={setCurrentPage}
      />
    </ProtectedAdminLayout>
  );
}
