"use client";

/** @fileoverview Shared pieces for admin list pages: filter bar controls, list card, status pill, paging. */
import { useState, type ReactNode } from "react";
import { FaSearch } from "react-icons/fa";
import Pagination from "@/src/components/ui/Pagination";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";

const control =
  "h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500";

export type SelectOption = { value: string; label: string; count?: number };

/** Labeled select for filters; counts are shown inline ("Open (4)"). */
export function AdminSelect({
  label,
  value,
  onChange,
  options,
  className = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`${control} px-3 pr-8 cursor-pointer ${className}`}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.count != null ? `${o.label} (${o.count})` : o.label}
        </option>
      ))}
    </select>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${control} w-full pl-9 pr-3 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
      />
    </label>
  );
}

/** One row of filters above a list: search grows, selects keep their width; stacks on mobile. */
export function AdminFilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>;
}

export function AdminListCard({
  title,
  meta,
  children,
  footer
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-4 sm:px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        {meta && <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{meta}</span>}
      </div>
      {children}
      {footer && <div className="px-4 sm:px-5 py-3 border-t border-gray-200 dark:border-gray-800">{footer}</div>}
    </div>
  );
}

export function AdminEmptyRows({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        {children}
      </td>
    </tr>
  );
}

/** Table head cell styling shared by admin lists. */
export const adminTh =
  "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap";
export const adminTd = "px-4 py-3 align-top";
export const adminTheadRow = "bg-gray-50 dark:bg-gray-800/50";
export const adminRow = "hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors";

/** Inline status dropdown styled as a colored pill. */
export function StatusPill<T extends string>({
  value,
  options,
  tones,
  onChange,
  disabled
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  tones: Record<T, string>;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value as T)}
      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border cursor-pointer disabled:opacity-50 ${tones[value]}`}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export const pillTones = {
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30",
  green: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/30",
  red: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/30",
  gray: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30"
} as const;

/** Small flag chip ("Needs reply", "Pinned"). */
export function Chip({ tone, children }: { tone: keyof typeof pillTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-1.5 text-[10px] font-semibold uppercase tracking-wide leading-4 ${pillTones[tone]}`}>
      {children}
    </span>
  );
}

export function RelativeDate({ iso }: { iso?: string }) {
  if (!iso) return <span className="text-gray-400 dark:text-gray-500">—</span>;
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()} className="whitespace-nowrap">
      {formatRelativeTimeCompact(iso)}
    </time>
  );
}

/**
 * Client-side paging that snaps back to page 1 whenever `resetKey` (the active filters) changes.
 */
export function usePagedList<T>(items: T[], resetKey: string, pageSize = 25) {
  const [state, setState] = useState({ key: resetKey, page: 1 });
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(state.key === resetKey ? state.page : 1, totalPages);
  return {
    page,
    totalPages,
    pageSize,
    pageItems: items.slice((page - 1) * pageSize, page * pageSize),
    setPage: (next: number) => setState({ key: resetKey, page: next })
  };
}

export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      totalItems={total}
      itemsPerPage={pageSize}
      onPageChange={onPageChange}
      tone="dark"
      alwaysVisible
    />
  );
}

/** "Name (count)" options for a program dropdown, sorted by name. */
export function programOptions(
  items: Array<{ key: string; label: string }>,
  allLabel = "All programs"
): SelectOption[] {
  const counts = new Map<string, { label: string; count: number }>();
  for (const item of items) {
    const entry = counts.get(item.key) ?? { label: item.label, count: 0 };
    entry.count++;
    counts.set(item.key, entry);
  }
  return [
    { value: "all", label: allLabel, count: items.length },
    ...[...counts]
      .sort((a, b) => a[1].label.localeCompare(b[1].label))
      .map(([value, { label, count }]) => ({ value, label, count }))
  ];
}
