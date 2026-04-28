"use client";

/** @fileoverview Program activation table: report counts, sort, mobile cards (flow-aware). */
import { useState, useMemo, useCallback } from "react";
import { CDKey, CDKeyTableProps, ReportData } from "@/src/types";
import CDKeyItem from "@/src/components/program/cdkeys/CDKeyItem";
import CDKeyMobileCard from "@/src/components/program/cdkeys/CDKeyMobileCard";
import KeyStatusTooltip from "@/src/components/program/KeyStatusTooltip";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";
import { getExpiringKeysMessage, sortCdKeysByScore, sortCdKeysByColumn } from "@/src/lib/program/cdKeyUtils";
import { useKeyReportData } from "@/src/hooks/useKeyReportData";
import { formatProgramDisplayTitle } from "@/src/lib/program/formatProgramDisplayTitle";
import { useI18n } from "@/src/contexts/i18n";
import { isAccountFlow, normalizeProgramFlow } from "@/src/lib/program/activationEntry";

export default function CDKeyTable({
  cdKeys,
  rowStorageIds,
  slug,
  program,
  programTitle,
  isSpammerVisitor = false,
  vendorReleaseForIntro,
  introVersionConfirmation,
  versionSummaryLine
}: CDKeyTableProps) {
  const { t } = useI18n("program");
  const programFlow = normalizeProgramFlow(program.programFlow);
  const expiringKeysMessage = getExpiringKeysMessage(cdKeys);
  const { reportData, loading, refreshReportData } = useKeyReportData(slug, rowStorageIds);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const idForCdKey = useMemo(() => {
    const m = new WeakMap<CDKey, string>();
    cdKeys.forEach((k, i) => {
      m.set(k, rowStorageIds[i] ?? "");
    });
    return m;
  }, [cdKeys, rowStorageIds]);

  const storageKeyOf = useCallback((k: CDKey) => idForCdKey.get(k) ?? "", [idForCdKey]);

  const emptyReport: ReportData = { working: 0, expired: 0, limit_reached: 0 };

  const handleReportSubmitted = () => {
    refreshReportData();
  };

  const columnKeyLabel = t.keyTable.columnKey();

  const tableColumns: SortableColumn[] = useMemo(() => {
    const base: SortableColumn[] = [{ key: "key", label: columnKeyLabel, sortable: false, className: "text-left" }];
    if (isAccountFlow(programFlow)) {
      base.push({ key: "password", label: t.keyTable.columnPassword(), sortable: false, className: "text-center" });
    }
    base.push(
      { key: "status", label: "Status", sortable: true, className: "text-center" },
      { key: "reports", label: "Reports", sortable: true, className: "text-center" },
      { key: "version", label: "Version", sortable: true, className: "text-center" },
      { key: "validFrom", label: "Valid From", sortable: true, className: "text-center" },
      { key: "validUntil", label: "Valid Until", sortable: true, className: "text-center" },
      { key: "actions", label: "Actions", sortable: false, className: "text-center" }
    );
    return base;
  }, [programFlow, columnKeyLabel, t]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "status" ? "asc" : "desc");
    }
  };

  const sortedKeys = useMemo(() => {
    if (!sortColumn) {
      return sortCdKeysByScore(cdKeys, reportData, programFlow, storageKeyOf);
    }
    return sortCdKeysByColumn(cdKeys, sortColumn, sortDirection, reportData, programFlow, storageKeyOf);
  }, [cdKeys, sortColumn, sortDirection, reportData, programFlow, storageKeyOf]);

  const headingSuffix = t.keyTable.headingSuffix();
  const intro = t.keyTable.intro({ programTitle });
  const emptyTitle = t.keyTable.empty();
  const expiringDisclaimer = t.keyTable.expiringDisclaimer();

  return (
    <section className="py-6 sm:py-10 bg-linear-to-b from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-600 overflow-hidden">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight mb-1.5 sm:mb-2">
                  <span className="text-white">{formatProgramDisplayTitle(program)}</span>
                  <span className="text-gray-500 font-normal mx-1 sm:mx-1.5" aria-hidden>
                    —
                  </span>
                  <span className="text-gradient-pro">{headingSuffix}</span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-base leading-relaxed text-gray-300">
                  {intro}
                  {introVersionConfirmation ? (
                    <>
                      {" "}
                      <span className="text-gray-400">{introVersionConfirmation}</span>
                    </>
                  ) : null}
                  {versionSummaryLine ? (
                    <>
                      {" "}
                      <span className="text-gray-400">{versionSummaryLine}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="shrink-0">
                <KeyStatusTooltip />
              </div>
            </div>
            {expiringKeysMessage && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-amber-500/10 border border-amber-400/30 rounded-lg sm:rounded-xl">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 mt-0.5 shrink-0"
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
                    <p className="text-amber-400/70 text-xs sm:text-sm mt-1 leading-tight">{expiringDisclaimer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {cdKeys && cdKeys.length > 0 ? (
            <>
              <div className="block lg:hidden px-3 sm:px-4 py-4 sm:py-6">
                <div className="grid auto-rows-auto grid-flow-dense grid-cols-1 xs:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                  {sortedKeys.map((cdKey: CDKey, i: number) => {
                    const rowStorageId = storageKeyOf(cdKey);
                    return (
                      <CDKeyMobileCard
                        key={rowStorageId || `m-${i}`}
                        cdKey={cdKey}
                        rowStorageId={rowStorageId}
                        slug={slug}
                        programFlow={programFlow}
                        reportData={loading ? emptyReport : (reportData.get(rowStorageId) ?? emptyReport)}
                        onReportSubmitted={handleReportSubmitted}
                        isSpammerVisitor={isSpammerVisitor}
                      />
                    );
                  })}
                </div>
              </div>

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
                    {sortedKeys.map((cdKey: CDKey, i: number) => {
                      const rowStorageId = storageKeyOf(cdKey);
                      return (
                        <CDKeyItem
                          key={rowStorageId || `d-${i}`}
                          cdKey={cdKey}
                          index={i}
                          rowStorageId={rowStorageId}
                          slug={slug}
                          programFlow={programFlow}
                          reportData={loading ? emptyReport : (reportData.get(rowStorageId) ?? emptyReport)}
                          onReportSubmitted={handleReportSubmitted}
                          isSpammerVisitor={isSpammerVisitor}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="text-gray-500 text-6xl mb-6">🔑</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-3">{emptyTitle}</h3>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
