import React from "react";
import { FaChevronDown } from "react-icons/fa";

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
        className={`text-xs font-medium ${isActive ? "text-gray-700" : "text-gray-400"} tracking-wider select-none ${column.className || ""}`}>
        <button onClick={() => onSort(column.key)} className="px-6 py-3 flex items-center group cursor-pointer">
          <span>{column.label}</span>
          <span className={`group-hover:text-gray-600 ${isActive ? "text-gray-700" : "text-gray-400"}`}>
            <FaChevronDown
              className={`ml-1 w-2 h-2 inline-block transition-transform ${
                isActive && sortDirection === "desc" ? "rotate-180" : "rotate-0"
              }`}
            />
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
