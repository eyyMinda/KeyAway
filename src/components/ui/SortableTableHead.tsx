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
  onSort?: (column: string) => void,
  themeClass?: string
) {
  const isDarkTheme = themeClass?.includes("text-gray-200");

  if (column.sortable && onSort) {
    const isActive = sortColumn === column.key;
    const aria = isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
    const baseColor = isDarkTheme ? "text-gray-400" : "text-gray-400";
    const activeColor = isDarkTheme ? "text-gray-100" : "text-gray-700";
    const hoverColor = isDarkTheme ? "group-hover:text-gray-200" : "group-hover:text-gray-600";

    return (
      <th
        key={column.key}
        scope="col"
        aria-sort={aria}
        className={`px-8 py-6 text-sm font-semibold ${isActive ? activeColor : baseColor} tracking-wider select-none ${column.className || ""}`}>
        <button onClick={() => onSort(column.key)} className="flex items-center group cursor-pointer w-full">
          <span>{column.label}</span>
          <span className={`ml-1 ${hoverColor} ${isActive ? activeColor : baseColor}`}>
            <FaChevronDown
              className={`w-3 h-3 inline-block transition-transform ${
                isActive && sortDirection === "desc" ? "rotate-180" : "rotate-0"
              }`}
            />
          </span>
        </button>
      </th>
    );
  }
  return (
    <th key={column.key} className={`px-8 py-6 text-sm font-semibold tracking-wider ${column.className || ""}`}>
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
      <tr>{columns.map(column => renderHeaderCell(column, sortColumn, sortDirection, onSort, className))}</tr>
    </thead>
  );
}
