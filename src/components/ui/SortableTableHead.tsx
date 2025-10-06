import React from "react";

export type SortDirection = "asc" | "desc";

export interface SortableColumn {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
}

export interface SortableTableHeadProps {
  columns: SortableColumn[];
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string) => void;
  className?: string;
}

const Chevron = ({ active, sortDirection }: { active: boolean; sortDirection?: SortDirection }) => (
  <svg
    className={`ml-1 h-3 w-3 inline-block transition-transform ${
      active && sortDirection === "desc" ? "rotate-180" : "rotate-0"
    }`}
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
  column: SortableColumn,
  sortColumn?: string,
  sortDirection?: SortDirection,
  onSort?: (column: string) => void
) {
  if (column.sortable && onSort) {
    const isActive = sortColumn === column.key;
    const aria = isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
    return (
      <th
        key={column.key}
        scope="col"
        aria-sort={aria}
        className={`text-xs font-medium text-gray-500 tracking-wider select-none ${column.className || ""}`}>
        <button onClick={() => onSort(column.key)} className="px-6 py-3 flex items-center group cursor-pointer">
          <span>{column.label}</span>
          <span className={`ml-1 text-gray-400 group-hover:text-gray-600 ${isActive ? "text-gray-700" : ""}`}>
            <Chevron active={isActive} sortDirection={sortDirection} />
          </span>
        </button>
      </th>
    );
  }
  return (
    <th
      key={column.key}
      className={`px-6 py-3 text-xs font-medium text-gray-500 tracking-wider ${column.className || ""}`}>
      {column.label}
    </th>
  );
}

export default function SortableTableHead({
  columns,
  sortColumn,
  sortDirection,
  onSort,
  className = ""
}: SortableTableHeadProps) {
  return (
    <thead className={`bg-gray-50 ${className}`}>
      <tr>{columns.map(column => renderHeaderCell(column, sortColumn, sortDirection, onSort))}</tr>
    </thead>
  );
}
