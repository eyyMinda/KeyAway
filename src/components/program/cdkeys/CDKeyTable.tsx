"use client";

import { useState, useEffect, useMemo } from "react";
import { CDKey, CDKeyTableProps, ReportData } from "@/src/types";
import CDKeyItem from "@/src/components/program/cdkeys/CDKeyItem";
import CDKeyMobileCard from "@/src/components/program/cdkeys/CDKeyMobileCard";
import KeyStatusTooltip from "@/src/components/program/KeyStatusTooltip";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import { getExpiringKeysMessage, sortCdKeysByScore, sortCdKeysByColumn } from "@/src/lib/cdKeyUtils";
import { useKeyReportData } from "@/src/hooks/useKeyReportData";

export default function CDKeyTable({ cdKeys, slug }: CDKeyTableProps) {
  const expiringKeysMessage = getExpiringKeysMessage(cdKeys);
  const { getReportData, loading, refreshReportData } = useKeyReportData(slug, cdKeys);
  const [reportDataMap, setReportDataMap] = useState<Map<string, ReportData>>(new Map());
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Load report data for all keys
  useEffect(() => {
    const loadReportData = async () => {
      const dataMap = new Map<string, ReportData>();
      for (const cdKey of cdKeys) {
        const reportData = await getReportData(cdKey.key);
        dataMap.set(cdKey.key, reportData);
      }
      setReportDataMap(dataMap);
    };

    if (!loading) {
      loadReportData();
    }
  }, [cdKeys, getReportData, loading]);

  // Handle report submission refresh
  const handleReportSubmitted = () => {
    refreshReportData();
  };

  // Define table columns
  const tableColumns: SortableColumn[] = [
    { key: "key", label: "Key", sortable: false, className: "text-left" },
    { key: "status", label: "Status", sortable: true, className: "text-center" },
    { key: "reports", label: "Reports", sortable: true, className: "text-center" },
    { key: "version", label: "Version", sortable: true, className: "text-center" },
    { key: "validFrom", label: "Valid From", sortable: true, className: "text-center" },
    { key: "validUntil", label: "Valid Until", sortable: true, className: "text-center" },
    { key: "actions", label: "Actions", sortable: false, className: "text-center" }
  ];

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      // Status defaults to asc (new→active→limit→expired), others default to desc (latest first)
      setSortDirection(column === "status" ? "asc" : "desc");
    }
  };

  // Sort keys
  const sortedKeys = useMemo(() => {
    if (!sortColumn) {
      return sortCdKeysByScore(cdKeys, reportDataMap);
    }
    return sortCdKeysByColumn(cdKeys, sortColumn, sortDirection, reportDataMap);
  }, [cdKeys, sortColumn, sortDirection, reportDataMap]);

  return (
    <section className="py-6 sm:py-10 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-600">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white mb-1.5 sm:mb-2 leading-tight">
                  Free CD Keys & <span className="text-gradient-pro">Activation Codes</span>
                </h2>
                <p className="text-gray-300 text-xs sm:text-sm lg:text-base leading-tight sm:leading-normal">
                  Activate working CD keys for premium software
                </p>
              </div>
              <div className="flex-shrink-0">
                <KeyStatusTooltip />
              </div>
            </div>
            {expiringKeysMessage && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg sm:rounded-xl">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-amber-300 font-medium text-xs sm:text-sm leading-tight sm:leading-normal">
                      {expiringKeysMessage}
                    </p>
                    <p className="text-amber-400/70 text-xs sm:text-sm mt-1 leading-tight">
                      Note: Once expired, the key won&apos;t activate and your software&apos;s pro version will stop
                      working.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {cdKeys && cdKeys.length > 0 ? (
            <>
              {/* Mobile Card Layout */}
              <div className="block lg:hidden px-3 sm:px-4 py-4 sm:py-6">
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {sortedKeys.map((cdKey: CDKey, i: number) => (
                    <CDKeyMobileCard
                      key={i}
                      cdKey={cdKey}
                      slug={slug}
                      reportData={reportDataMap.get(cdKey.key) || { working: 0, expired: 0, limit_reached: 0 }}
                      onReportSubmitted={handleReportSubmitted}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <SortableTableHead
                    columns={tableColumns}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    className="bg-white/5 text-gray-200"
                  />
                  <tbody className="divide-y divide-white/10">
                    {sortedKeys.map((cdKey: CDKey, i: number) => (
                      <CDKeyItem
                        key={i}
                        cdKey={cdKey}
                        index={i}
                        slug={slug}
                        reportData={reportDataMap.get(cdKey.key) || { working: 0, expired: 0, limit_reached: 0 }}
                        onReportSubmitted={handleReportSubmitted}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="text-gray-500 text-6xl mb-6">🔑</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-3">No Keys Available</h3>
              <p className="text-gray-400 text-lg">There are currently no CD keys available for this program.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
