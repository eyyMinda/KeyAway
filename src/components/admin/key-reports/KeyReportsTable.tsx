import React, { useMemo, useState } from "react";
import { ExpiredKeyReport } from "@/src/types/admin";
import { CDKeyStatus } from "@/src/types/program";
import TableHead, { HeaderDef, SortColumn, SortDirection } from "@/src/components/admin/key-reports/TableHead";
import TableBody from "@/src/components/admin/key-reports/TableBody";
import Pagination from "@/src/components/ui/Pagination";
import { formatSlugToTitle } from "@/src/lib/programUtils";

interface KeyReportsTableProps {
  reports: ExpiredKeyReport[];
  pendingChanges: Map<string, { originalStatus: CDKeyStatus; newStatus: CDKeyStatus }>;
  saving: Set<string>;
  onStatusChange: (report: ExpiredKeyReport, newStatus: CDKeyStatus) => void;
  onSaveStatusChange: (report: ExpiredKeyReport) => void;
  onCancelStatusChange: (report: ExpiredKeyReport) => void;
  onViewDetails: (report: ExpiredKeyReport) => void;
}

const STATUS_ORDER: Record<CDKeyStatus, number> = {
  new: 1,
  active: 2,
  expired: 3,
  limit: 4
};

export default function KeyReportsTable({
  reports,
  pendingChanges,
  saving,
  onStatusChange,
  onSaveStatusChange,
  onCancelStatusChange,
  onViewDetails
}: KeyReportsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("lastReport");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const getLatestReportTs = (r: ExpiredKeyReport): number => {
    if (!r.reports || r.reports.length === 0) return 0;
    let latest = 0;
    for (const item of r.reports) {
      const ts = new Date(item.createdAt).getTime();
      if (ts > latest) latest = ts;
    }
    return latest;
  };

  const getWorkingRatio = (r: ExpiredKeyReport): number => {
    const { working, expired, limit_reached } = r.reportData || { working: 0, expired: 0, limit_reached: 0 };
    const total = working + expired + limit_reached;
    if (total === 0) return 0;
    return working / total;
  };

  const sortedReports = useMemo(() => {
    const sorted = [...reports].sort((a, b) => {
      let cmp = 0;
      if (sortColumn === "program") {
        const aTitle = formatSlugToTitle(a.programSlug).toLowerCase();
        const bTitle = formatSlugToTitle(b.programSlug).toLowerCase();
        cmp = aTitle.localeCompare(bTitle);
      } else if (sortColumn === "status") {
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      } else if (sortColumn === "reportStatus") {
        cmp = getWorkingRatio(a) - getWorkingRatio(b);
      } else if (sortColumn === "lastReport") {
        cmp = getLatestReportTs(a) - getLatestReportTs(b);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [reports, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sortedReports.length / pageSize));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (clampedPage - 1) * pageSize;
  const pageEndIndex = Math.min(pageStartIndex + pageSize, sortedReports.length);
  const paginatedReports = sortedReports.slice(pageStartIndex, pageEndIndex);

  const onHeaderClick = (column: SortColumn) => {
    setCurrentPage(1);
    if (sortColumn === column) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      // Default to ascending for text/ratio columns; keep lastReport descending when selected
      setSortColumn(column);
      setSortDirection(column === "lastReport" ? "desc" : "asc");
    }
  };

  const tableHead: HeaderDef[] = [
    { key: "program", label: "Program", sortable: true, column: "program", className: "text-left" },
    { key: "key", label: "Key", sortable: false, className: "text-left" },
    { key: "status", label: "Status", sortable: true, column: "status", className: "text-left" },
    { key: "reportStatus", label: "Report Status", sortable: true, column: "reportStatus", className: "text-left" },
    { key: "lastReport", label: "Last Report", sortable: true, column: "lastReport", className: "text-left" },
    { key: "actions", label: "Actions", sortable: false, className: "text-left" }
  ];

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No key reports found</div>
        <div className="text-gray-400 text-sm mt-2">Reports will appear here when users report key status changes</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <TableHead
          tableHead={tableHead}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onHeaderClick={onHeaderClick}
        />
        <TableBody
          reports={paginatedReports}
          pendingChanges={pendingChanges}
          saving={saving}
          onStatusChange={onStatusChange}
          onSaveStatusChange={onSaveStatusChange}
          onCancelStatusChange={onCancelStatusChange}
          onViewDetails={onViewDetails}
          getLatestReportTs={getLatestReportTs}
        />
      </table>
      <Pagination
        currentPage={clampedPage}
        totalPages={totalPages}
        totalItems={sortedReports.length}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
        variant="simple"
        alwaysVisible={true}
        className="p-4 border-t border-gray-200"
      />
    </div>
  );
}
