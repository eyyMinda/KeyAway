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
        className={`p-4 text-sm font-semibold ${isActive ? "text-black" : "text-gray-600 hover:text-gray-500"} tracking-wider select-none ${column.className || ""}`}>
        <button onClick={() => onSort(column.key)} className="flex items-center group cursor-pointer w-full">
          <span>{column.label}</span>
          <span className="ml-1">
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
    <th key={column.key} className={`p-4 text-sm font-semibold tracking-wider text-gray-600 ${column.className || ""}`}>
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
    <thead className={`${className}`}>
      <tr>{columns.map(column => renderHeaderCell(column, sortColumn, sortDirection, onSort))}</tr>
    </thead>
  );
}
