import React from "react";
import { AnalyticsEventData } from "@/src/types";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import Pagination from "@/src/components/ui/Pagination";
import { extractReferrerInfo, effectiveReferrerHref, formatEventName } from "@/src/lib/analytics/analyticsUtils";
import { isPageViewNotFoundRow } from "@/src/lib/analytics/pageViewDisplay";

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
            {events.map(event => {
              const hash = event.ipHash?.trim();
              const hashShort = hash ? `${hash.slice(0, 10)}…` : null;
              return (
                <tr key={event._id} className="hover:bg-gray-50">
                  <td className="max-w-52 px-6 py-4 align-top text-sm text-gray-900">
                    {hash ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {event.visitorIsSpammer ? (
                          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded shrink-0">
                            spammer
                          </span>
                        ) : null}
                        <span className="text-xs text-violet-900 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded capitalize shrink-0">
                          {event.visitTier || "new"}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 truncate min-w-0" title={hash}>
                          {hashShort}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="max-w-44 px-6 py-4 align-top whitespace-nowrap">
                    <div className="flex flex-col gap-0 items-start">
                      {event.notFound === true && (
                        <span className="text-xs font-semibold text-rose-900 mx-auto">Not Found</span>
                      )}
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          event.event === "copy_cdkey"
                            ? "bg-green-100 text-green-800"
                            : event.event === "download_click"
                              ? "bg-blue-100 text-primary-800"
                              : event.event === "social_click"
                                ? "bg-red-100 text-red-800"
                                : isPageViewNotFoundRow(event)
                                  ? "bg-rose-100 text-rose-900"
                                  : "bg-purple-100 text-purple-800"
                        }`}>
                        {formatEventName(event.event)}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-3xs px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.programSlug && !isPageViewNotFoundRow(event) ? (
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
                          href={effectiveReferrerHref(event.referrer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs truncate max-w-32 block"
                          title={event.referrer}>
                          {extractReferrerInfo(event.referrer).hostname}
                        </a>
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
              );
            })}
          </tbody>
        </table>
      </div>

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
