import React from "react";
import { AnalyticsEventData } from "@/src/types";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import Pagination from "@/src/components/ui/Pagination";
import { extractReferrerInfo } from "@/src/lib/analyticsUtils";

interface EventsTableProps {
  events: AnalyticsEventData[];
  totalItems: number;
  columns: SortableColumn[];
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function EventsTable({
  events,
  totalItems,
  columns,
  sortColumn,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange
}: EventsTableProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-500">No events match the current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
        <p className="text-sm text-gray-500 mt-1">Showing {events.length} events</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <SortableTableHead columns={columns} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map(event => (
              <tr key={event._id} className="hover:bg-gray-50">
                <td className="max-w-44 px-6 py-4 whitespace-nowrap">
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
                <td className="max-w-3xs px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {event.programSlug ? (
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                      {event.programSlug.replace(/-/g, " ")}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="max-w-3xs px-6 py-4 text-sm text-gray-900">
                  {event.social ? (
                    <span className="capitalize">{event.social}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="max-w-3xs px-6 py-4 text-sm text-gray-900">
                  <span className="font-mono text-xs">{event.path || "/"}</span>
                </td>
                <td className="max-w-44 px-6 py-4 text-sm text-gray-900">
                  {event.country || event.city ? (
                    <div className="flex flex-col">
                      {event.country && <span className="font-medium">{event.country}</span>}
                      {event.city && <span className="text-xs text-gray-500">{event.city}</span>}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="max-w-3xs px-6 py-4 text-sm text-gray-900">
                  {event.referrer ? (
                    <div className="flex flex-col whitespace-nowrap">
                      <a
                        href={
                          event.referrer.startsWith("http")
                            ? event.referrer
                            : `https://www.keyaway.app${event.referrer}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-xs truncate max-w-32 block"
                        title={event.referrer}>
                        {(() => {
                          const { hostname } = extractReferrerInfo(event.referrer);
                          return hostname;
                        })()}
                      </a>
                      {(() => {
                        const { referrerParam } = extractReferrerInfo(event.referrer);
                        return referrerParam ? (
                          <span className="text-xs text-gray-500 truncate">({referrerParam})</span>
                        ) : null;
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="max-w-3xs px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span className="font-medium">{new Date(event.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleTimeString()}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-200">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          variant="simple"
          className=""
        />
      </div>
    </div>
  );
}
