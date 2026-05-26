import { FaChevronDown } from "react-icons/fa";

export type SortDirection = "asc" | "desc";

/** `light` = pale headers on dark sections; `dark` = dark headers on white/light sections. */
export type SortableTableHeadTone = "light" | "dark";

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
  tone?: SortableTableHeadTone;
}

const sortableHeadToneStyles: Record<
  SortableTableHeadTone,
  { inactive: string; hover: string; active: string; static: string }
> = {
  light: {
    inactive: "text-[#8f98a0]",
    hover: "hover:text-[#c6d4df]",
    active: "text-white",
    static: "text-[#8f98a0]"
  },
  dark: {
    inactive: "text-gray-600",
    hover: "hover:text-gray-500",
    active: "text-black",
    static: "text-gray-600"
  }
};

function renderHeaderCell(
  column: SortableColumn,
  tone: SortableTableHeadTone,
  sortColumn?: string,
  sortDirection?: SortDirection,
  onSort?: (column: string) => void
) {
  const styles = sortableHeadToneStyles[tone];

  if (column.sortable && onSort) {
    const isActive = sortColumn === column.key;
    const aria = isActive ? (sortDirection === "asc" ? "ascending" : "descending") : "none";
    const textClass = isActive ? styles.active : `${styles.inactive} ${styles.hover}`;

    return (
      <th
        key={column.key}
        scope="col"
        aria-sort={aria}
        className={`p-4 text-sm font-semibold tracking-wider select-none ${textClass} ${column.className || ""}`}>
        <button
          type="button"
          onClick={() => onSort(column.key)}
          className={`flex items-center group cursor-pointer w-full ${textClass}`}>
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
    <th
      key={column.key}
      className={`p-4 text-sm font-semibold tracking-wider ${styles.static} ${column.className || ""}`}>
      {column.label}
    </th>
  );
}

export default function SortableTableHead({
  columns,
  sortColumn,
  sortDirection,
  onSort,
  className = "",
  tone = "dark"
}: SortableTableHeadProps) {
  return (
    <thead className={className}>
      <tr>{columns.map(column => renderHeaderCell(column, tone, sortColumn, sortDirection, onSort))}</tr>
    </thead>
  );
}
