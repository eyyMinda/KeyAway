import React from "react";

type SortColumn = "program" | "status" | "reportStatus" | "lastReport";
type SortDirection = "asc" | "desc";

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

const Chevron = ({ active, sortDirection }: { active: boolean; sortDirection: SortDirection }) => (
  <svg
    className={`ml-1 h-3 w-3 inline-block transition-transform ${active && sortDirection === "desc" ? "rotate-180" : "rotate-0"}`}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

function renderHeaderCell(
  h: HeaderDef,
  sortColumn: SortColumn,
  sortDirection: SortDirection,
  onHeaderClick: (column: SortColumn) => void
) {
  if (h.sortable && h.column) {
    const isActive = sortColumn === h.column;
    const aria = isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
    return (
      <th
        key={h.key}
        scope="col"
        aria-sort={aria}
        className={`text-xs font-medium text-gray-800 tracking-wider select-none ${h.className || ""}`}>
        <button onClick={() => onHeaderClick(h.column!)} className="px-6 py-3 flex items-center group cursor-pointer">
          <span>{h.label}</span>
          <span className={`ml-1 text-gray-400 group-hover:text-gray-600 ${isActive ? "text-gray-700" : ""}`}>
            <Chevron active={isActive} sortDirection={sortDirection} />
          </span>
        </button>
      </th>
    );
  }
  return (
    <th key={h.key} className={`px-6 py-3 text-xs font-medium text-gray-800 tracking-wider ${h.className || ""}`}>
      {h.label}
    </th>
  );
}

export default function TableHead({ tableHead, sortColumn, sortDirection, onHeaderClick }: TableHeadProps) {
  return (
    <thead className="bg-gray-50">
      <tr>{tableHead.map(h => renderHeaderCell(h, sortColumn, sortDirection, onHeaderClick))}</tr>
    </thead>
  );
}

export type { HeaderDef, SortColumn, SortDirection };
