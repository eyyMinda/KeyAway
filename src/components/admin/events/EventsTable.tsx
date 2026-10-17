import React from "react";
import { AnalyticsEventData } from "@/src/types";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import Pagination from "@/src/components/ui/Pagination";
import { extractReferrerInfo, effectiveReferrerHref, formatEventName } from "@/src/lib/analytics/analyticsUtils";
import { analyticsEventPillClasses, visitorTierBadgeClasses } from "@/src/theme/colorSchema";
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
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No events found</h3>
        <p className="text-gray-500 dark:text-gray-400">No events match the current filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800">
      <div className="p-4 sm:px-6 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Events</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Showing {events.length} events</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <SortableTableHead columns={columns} sortColumn={sortColumn} sortDirection={sortDirection} onSort={onSort} />
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {events.map(event => {
              const hash = event.ipHash?.trim();
              const hashShort = hash ? `${hash.slice(0, 10)}…` : null;
              return (
                <tr key={event._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="max-w-40 p-4 align-top text-sm text-gray-900 dark:text-gray-100">
                    {hash ? (
                      <div className="flex flex-col gap-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={visitorTierBadgeClasses(event.visitTier, false)}>
                            {event.visitTier || "new"}
                          </span>
                          {event.visitorIsSpammer ? (
                            <span className={visitorTierBadgeClasses("new", true)}>spammer</span>
                          ) : null}
                        </div>
                        <div className="font-mono text-[10px] text-gray-500 dark:text-gray-400 truncate min-w-0" title={hash}>
                          {hashShort}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="max-w-44 p-4 align-top whitespace-nowrap">
                    <div className="flex flex-col gap-0 items-center">
                      {event.notFound === true && (
                        <span className="text-xs font-semibold text-rose-900 dark:text-rose-200 mx-auto">Not Found</span>
                      )}
                      <span
                        className={analyticsEventPillClasses(event.event, {
                          isPageViewNotFound: isPageViewNotFoundRow(event)
                        })}>
                        {formatEventName(event.event)}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-3xs p-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {event.programSlug && !isPageViewNotFoundRow(event) ? (
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded capitalize">
                        {event.programSlug.replace(/-/g, " ")}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="max-w-3xs p-4 text-sm text-gray-900 dark:text-gray-100">
                    {event.social ? (
                      <span className="capitalize">{event.social}</span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="max-w-3xs p-4 text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-mono text-xs">{event.path || "/"}</span>
                  </td>
                  <td className="max-w-44 p-4 text-sm text-gray-900 dark:text-gray-100">
                    {event.country || event.city ? (
                      <div className="flex flex-col">
                        {event.country && <span className="font-medium">{event.country}</span>}
                        {event.city && <span className="text-xs text-gray-500 dark:text-gray-400">{event.city}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="max-w-3xs p-4 text-sm text-gray-900 dark:text-gray-100">
                    {event.referrer ? (
                      <div className="flex flex-col whitespace-nowrap">
                        <a
                          href={effectiveReferrerHref(event.referrer)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs truncate max-w-32 block"
                          title={event.referrer}>
                          {extractReferrerInfo(event.referrer).hostname}
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="max-w-3xs p-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col">
                      <span className="font-medium">{new Date(event.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(event.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          variant="simple"
          tone="dark"
          className=""
        />
      </div>
    </div>
  );
}
