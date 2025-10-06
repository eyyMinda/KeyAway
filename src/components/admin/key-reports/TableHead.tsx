import React from "react";
import SortableTableHead, { SortableColumn, SortDirection } from "@/src/components/ui/SortableTableHead";

type SortColumn = "program" | "status" | "reportStatus" | "lastReport";

type HeaderDef = {
  key: string;
  label: string;
  sortable: boolean;
  column?: SortColumn;
  className?: string;
};

interface TableHeadProps {
  tableHead: HeaderDef[];
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onHeaderClick: (column: SortColumn) => void;
}

export default function TableHead({ tableHead, sortColumn, sortDirection, onHeaderClick }: TableHeadProps) {
  const columns: SortableColumn[] = tableHead.map(h => ({
    key: h.column || h.key,
    label: h.label,
    sortable: h.sortable,
    className: h.className
  }));

  const handleSort = (column: string) => {
    onHeaderClick(column as SortColumn);
  };

  return (
    <SortableTableHead columns={columns} sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort} />
  );
}

export type { HeaderDef, SortColumn, SortDirection };
