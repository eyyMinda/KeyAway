"use client";

/** @fileoverview Program activation table: report counts, sort, mobile cards (flow-aware). */
import { useState, useMemo, useCallback, useEffect } from "react";
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
  const PAGE_SIZE = 10;
  const { t } = useI18n("program");
  const programFlow = normalizeProgramFlow(program.programFlow);
  const expiringKeysMessage = getExpiringKeysMessage(cdKeys);
  const { reportData, loading, refreshReportData } = useKeyReportData(slug, rowStorageIds);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
  const visibleKeys = useMemo(() => sortedKeys.slice(0, visibleCount), [sortedKeys, visibleCount]);
  const remainingCount = Math.max(sortedKeys.length - visibleCount, 0);
  const canShowMore = remainingCount > 0;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortColumn, sortDirection, slug, cdKeys.length]);

  const headingSuffix = t.keyTable.headingSuffix();
  const intro = t.keyTable.intro({ programTitle });
  const emptyTitle = t.keyTable.empty();
  const expiringDisclaimer = t.keyTable.expiringDisclaimer();

  return (
    <section className="border-t border-[#2a475e] bg-[#0f1923] py-6 sm:py-10">
      <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-visible rounded-sm border border-[#2a475e] bg-[#1b2838] shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="section-title mb-1.5 leading-tight sm:mb-2">
                  <span>{formatProgramDisplayTitle(program)}</span>
                  <span className="mx-1 font-normal text-[#556772] sm:mx-1.5" aria-hidden>
                    —
                  </span>
                  <span className="text-gradient-pro">{headingSuffix}</span>
                </h2>
                <p className="text-xs leading-relaxed text-[#8f98a0] sm:text-sm lg:text-base">
                  {intro}
                  {introVersionConfirmation ? (
                    <>
                      {" "}
                      <span className="text-[#556772]">{introVersionConfirmation}</span>
                    </>
                  ) : null}
                  {versionSummaryLine ? (
                    <>
                      {" "}
                      <span className="text-[#556772]">{versionSummaryLine}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="shrink-0">
                <KeyStatusTooltip />
              </div>
            </div>
            {expiringKeysMessage && (
              <div className="mt-3 rounded-sm border border-[#a3421b] bg-[#3a2800] p-3 sm:mt-4 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#e8632a] sm:h-5 sm:w-5"
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
                    <p className="text-xs font-medium leading-tight text-[#f4a460] sm:text-sm sm:leading-normal">
                      {expiringKeysMessage}
                    </p>
                    <p className="mt-1 text-xs leading-tight text-[#e8b28f] sm:text-sm">{expiringDisclaimer}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {cdKeys && cdKeys.length > 0 ? (
            <>
              <div className="block lg:hidden px-3 sm:px-4 py-4 sm:py-6">
                <div className="grid auto-rows-auto grid-flow-dense grid-cols-1 xs:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
                  {visibleKeys.map((cdKey: CDKey, i: number) => {
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
                    className="bg-[#16202d] text-[#c6d4df]"
                  />
                  <tbody className="divide-y divide-[#2a475e]">
                    {visibleKeys.map((cdKey: CDKey, i: number) => {
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

              {canShowMore ? (
                <div className="flex justify-center px-3 py-4 sm:px-4 sm:pb-6">
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                    className="w-fit cursor-pointer rounded-sm border border-[#4a90c4] bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-[#c6d4df] transition-colors hover:bg-[#213246] hover:text-white">
                    Show 10 more ({remainingCount} remaining)
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="px-8 py-16 text-center">
              <div className="mb-6 text-6xl text-[#556772]">🔑</div>
              <h3 className="mb-3 text-xl font-semibold text-[#8f98a0]">{emptyTitle}</h3>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
