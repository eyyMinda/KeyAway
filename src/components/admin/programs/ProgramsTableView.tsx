"use client";

import { Fragment, useMemo, useState } from "react";
import { FaChevronDown, FaPlus, FaSyncAlt } from "react-icons/fa";
import SearchInput from "@/src/components/ui/SearchInput";
import { STATUS_LABELS, STATUS_STYLES } from "@/src/components/admin/programs/editor/KeysTab";
import type { EditorLookups } from "@/src/components/admin/programs/editor/types";
import { getWorkingKeysCount } from "@/src/lib/admin/adminHelpers";
import type { ProgramEditorTab } from "@/src/lib/admin/programFields";
import { isNewerVersion } from "@/src/lib/versions/compareVersions";
import { urlFor } from "@/src/sanity/lib/image";
import type { AdminProgramRow } from "@/src/types/admin";
import type { ProgramFlow } from "@/src/types/program";

type KeysFilter = "all" | "no-working" | "has-working";
type SortKey = "title" | "updated" | "popularity" | "working" | "version";

export const FLOW_LABELS: Record<ProgramFlow, string> = {
  cd_key: "CD keys",
  link_based_cdkey: "Link CD keys",
  account: "Accounts",
  link_based_account: "Account links"
};

const PAGE_SIZES = [10, 20, 50, 100] as const;
const PAGE_SIZE_STORAGE_KEY = "keyaway-admin-programs-page-size";

function readPageSize(): number {
  try {
    const saved = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY));
    if ((PAGE_SIZES as readonly number[]).includes(saved)) return saved;
  } catch {
    /* storage blocked: default */
  }
  return 20;
}

/** What a public program page is still missing. */
function contentGaps(p: AdminProgramRow): string[] {
  const gaps: string[] = [];
  if (!p.vendor) gaps.push("vendor");
  if (!p.image?.asset?._ref) gaps.push("image");
  if (!p.aboutCount) gaps.push("about");
  if (!p.faqCount) gaps.push("FAQ");
  if (!p.freeVsProCount) gaps.push("free vs PRO");
  if (!p.latestOfficialVersion) gaps.push("version");
  return gaps;
}

export function relativeTime(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function hasNewVersion(p: AdminProgramRow): boolean {
  return isNewerVersion(p.versionStatus?.latestVersion, p.latestOfficialVersion);
}

interface ProgramsTableViewProps {
  programs: AdminProgramRow[];
  lookups: EditorLookups;
  loading: boolean;
  loadError: string | null;
  onRefresh: () => void;
  onOpen: (id: string | null, tab?: ProgramEditorTab) => void;
  onShowVersions: () => void;
}

export default function ProgramsTableView({ programs, lookups, loading, loadError, onRefresh, onOpen, onShowVersions }: ProgramsTableViewProps) {
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [flowFilter, setFlowFilter] = useState<"" | ProgramFlow>("");
  const [keysFilter, setKeysFilter] = useState<KeysFilter>("all");
  const [incompleteOnly, setIncompleteOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "title", dir: 1 });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(() => (typeof window === "undefined" ? 20 : readPageSize()));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = programs.filter(p => {
      if (q) {
        const hay = [p.title, p.slug.current, p.vendor?.name, ...(p.aliases ?? [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (vendorFilter && p.vendor?._id !== vendorFilter) return false;
      if (categoryFilter && !p.categories?.some(c => c._id === categoryFilter)) return false;
      if (flowFilter && p.programFlow !== flowFilter) return false;
      const working = getWorkingKeysCount(p.cdKeys);
      if (keysFilter === "no-working" && working > 0) return false;
      if (keysFilter === "has-working" && working === 0) return false;
      if (incompleteOnly && contentGaps(p).length === 0) return false;
      return true;
    });
    const value = (p: AdminProgramRow): string | number => {
      switch (sort.key) {
        case "updated":
          return p._updatedAt;
        case "popularity":
          return p.popularity;
        case "working":
          return getWorkingKeysCount(p.cdKeys);
        case "version":
          return p.latestOfficialVersion ?? "";
        default:
          return p.title.toLowerCase();
      }
    };
    return rows.sort((a, b) => {
      const va = value(a);
      const vb = value(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [programs, search, vendorFilter, categoryFilter, flowFilter, keysFilter, incompleteOnly, sort]);

  // "Show more" count resets whenever the filters, sort or page size change (all client-side, no refetch).
  const listKey = JSON.stringify([search, vendorFilter, categoryFilter, flowFilter, keysFilter, incompleteOnly, sort, pageSize]);
  const [shown, setShown] = useState({ key: listKey, count: pageSize });
  const shownCount = shown.key === listKey ? shown.count : pageSize;
  const visible = filtered.slice(0, shownCount);
  const remaining = filtered.length - visible.length;

  const totals = useMemo(() => {
    let keys = 0;
    let working = 0;
    let noWorking = 0;
    let incomplete = 0;
    let newVersions = 0;
    for (const p of programs) {
      const w = getWorkingKeysCount(p.cdKeys);
      keys += p.cdKeys?.length ?? 0;
      working += w;
      if (w === 0) noWorking++;
      if (contentGaps(p).length) incomplete++;
      if (hasNewVersion(p)) newVersions++;
    }
    return { keys, working, noWorking, incomplete, newVersions };
  }, [programs]);

  const filtersActive = !!(search || vendorFilter || categoryFilter || flowFilter || keysFilter !== "all" || incompleteOnly);
  const resetFilters = () => {
    setSearch("");
    setVendorFilter("");
    setCategoryFilter("");
    setFlowFilter("");
    setKeysFilter("all");
    setIncompleteOnly(false);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    try {
      localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
    } catch {
      /* only for this visit */
    }
  };

  const sortHeader = (key: SortKey, label: string, className = "") => (
    <th className={`px-3 py-2.5 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => setSort(s => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "title" ? 1 : -1 }))}
        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer">
        {label}
        {sort.key === key && <span aria-hidden>{sort.dir === 1 ? "↑" : "↓"}</span>}
      </button>
    </th>
  );

  const select =
    "px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 cursor-pointer";

  const statTile = (label: string, value: number, onClick?: () => void, active?: boolean, tone = "") => (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={`text-left rounded-xl border bg-white dark:bg-gray-900 px-4 py-3 transition-colors ${
        active ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 dark:border-gray-800"
      } ${onClick ? "hover:border-blue-400 cursor-pointer" : "cursor-default"}`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100 ${tone}`}>{value}</p>
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {statTile("Programs", programs.length, filtersActive ? resetFilters : undefined)}
        {statTile("Working entries", totals.working, undefined, false, "text-green-600 dark:text-green-400")}
        {statTile(
          "No working keys",
          totals.noWorking,
          () => setKeysFilter(f => (f === "no-working" ? "all" : "no-working")),
          keysFilter === "no-working",
          totals.noWorking ? "text-amber-600 dark:text-amber-400" : ""
        )}
        {statTile("Missing content", totals.incomplete, () => setIncompleteOnly(v => !v), incompleteOnly)}
        {statTile("New versions", totals.newVersions, onShowVersions, false, totals.newVersions ? "text-blue-600 dark:text-blue-400" : "")}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-800">
          <SearchInput value={search} onChange={setSearch} placeholder="Search title, slug, vendor, alias…" className="w-full sm:w-72" />
          <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className={select} aria-label="Vendor">
            <option value="">All vendors</option>
            {lookups.vendors.map(v => (
              <option key={v._id} value={v._id}>
                {v.name}
              </option>
            ))}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className={select} aria-label="Category">
            <option value="">All categories</option>
            {lookups.categories.map(c => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <select value={flowFilter} onChange={e => setFlowFilter(e.target.value as "" | ProgramFlow)} className={select} aria-label="Activation flow">
            <option value="">All flows</option>
            {(Object.keys(FLOW_LABELS) as ProgramFlow[]).map(f => (
              <option key={f} value={f}>
                {FLOW_LABELS[f]}
              </option>
            ))}
          </select>
          <select value={keysFilter} onChange={e => setKeysFilter(e.target.value as KeysFilter)} className={select} aria-label="Keys">
            <option value="all">Any keys</option>
            <option value="no-working">No working keys</option>
            <option value="has-working">Has working keys</option>
          </select>
          {filtersActive && (
            <button type="button" onClick={resetFilters} className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
              Clear
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onRefresh}
              aria-label="Refresh"
              title="Refresh"
              className="p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <FaSyncAlt size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => onOpen(null)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
              <FaPlus size={11} /> New program
            </button>
          </div>
        </div>

        {loading && programs.length === 0 ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : loadError ? (
          <p className="p-8 text-center text-sm text-red-600 dark:text-red-400">{loadError}</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-gray-900 dark:text-gray-100">{filtersActive ? "No programs match" : "No programs yet"}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filtersActive ? "Try a different search or clear the filters." : "Create your first program to get started."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-950/60 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="w-8" />
                  {sortHeader("title", "Program")}
                  <th className="px-3 py-2.5 font-medium hidden lg:table-cell">Flow</th>
                  {sortHeader("version", "Version", "hidden md:table-cell")}
                  {sortHeader("working", "Keys")}
                  <th className="px-3 py-2.5 font-medium hidden xl:table-cell">Content</th>
                  {sortHeader("popularity", "Popularity", "hidden lg:table-cell")}
                  {sortHeader("updated", "Updated", "hidden md:table-cell")}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {visible.map(p => {
                  const keys = p.cdKeys ?? [];
                  const workingKeys = keys.filter(k => k.status === "new" || k.status === "active");
                  const hiddenKeys = keys.length - workingKeys.length;
                  const gaps = contentGaps(p);
                  const open = expanded === p._id;
                  const newVersion = hasNewVersion(p) ? p.versionStatus?.latestVersion : null;
                  return (
                    <Fragment key={p._id}>
                      <tr
                        onClick={() => onOpen(p._id)}
                        className={`cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-500/5 ${open ? "bg-gray-50 dark:bg-gray-950/40" : ""}`}>
                        <td className="pl-3">
                          <button
                            type="button"
                            aria-label={open ? "Hide keys" : "Show keys"}
                            onClick={e => {
                              e.stopPropagation();
                              setExpanded(open ? null : p._id);
                            }}
                            className="p-1.5 rounded-md text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
                            <FaChevronDown size={10} className={`transition-transform ${open ? "" : "-rotate-90"}`} />
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-3 min-w-56">
                            <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              {p.image?.asset?._ref ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={urlFor(p.image as { asset: { _ref: string } }).width(72).height(72).fit("crop").url()}
                                  alt=""
                                  loading="lazy"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-white text-sm">🎮</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{p.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {p.vendor?.name ?? <span className="text-amber-600 dark:text-amber-400">No vendor</span>}
                                <span className="mx-1">·</span>/{p.slug.current}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-gray-600 dark:text-gray-400 whitespace-nowrap">{FLOW_LABELS[p.programFlow]}</td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-gray-600 dark:text-gray-400 tabular-nums whitespace-nowrap">
                          {p.latestOfficialVersion || <span className="text-gray-300 dark:text-gray-600">—</span>}
                          {newVersion && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                onShowVersions();
                              }}
                              title="A newer version was found. Review it in the Versions tab."
                              className="ml-2 rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer">
                              → {newVersion}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums ${
                              workingKeys.length > 0
                                ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}>
                            {workingKeys.length} working
                          </span>
                          <span className="ml-1.5 text-xs text-gray-400 tabular-nums">/ {keys.length}</span>
                        </td>
                        <td className="px-3 py-2.5 hidden xl:table-cell">
                          {gaps.length === 0 ? (
                            <span className="text-xs text-green-600 dark:text-green-400">Complete</span>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400" title={`Missing: ${gaps.join(", ")}`}>
                              Missing {gaps.slice(0, 2).join(", ")}
                              {gaps.length > 2 && ` +${gaps.length - 2}`}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-gray-600 dark:text-gray-400 tabular-nums">{p.popularity}</td>
                        <td className="px-3 py-2.5 hidden md:table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">{relativeTime(p._updatedAt)}</td>
                      </tr>
                      {open && (
                        <tr className="bg-gray-50 dark:bg-gray-950/40">
                          <td />
                          <td colSpan={7} className="px-3 pb-4 pt-1">
                            {workingKeys.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No working entries.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {workingKeys.slice(0, 24).map(k => (
                                  <span key={k._key} className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${STATUS_STYLES[k.status] ?? STATUS_STYLES.new}`}>
                                    <span className="font-mono">{k.key || k.accountLabel || k.username || k.linkTitles?.filter(Boolean).join(", ") || "—"}</span>
                                    <span className="opacity-70">
                                      {STATUS_LABELS[k.status] ?? k.status}
                                      {k.version ? ` · v${k.version}` : ""}
                                      {k.validUntil ? ` · until ${new Date(k.validUntil).toLocaleDateString()}` : ""}
                                    </span>
                                  </span>
                                ))}
                                {workingKeys.length > 24 && <span className="text-xs text-gray-500 self-center">+{workingKeys.length - 24} more</span>}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                              <button
                                type="button"
                                onClick={() => onOpen(p._id, "keys")}
                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                                Manage keys →
                              </button>
                              {hiddenKeys > 0 && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {hiddenKeys} expired or limit-reached {hiddenKeys === 1 ? "entry" : "entries"} in the Keys tab
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loadError && filtered.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              Showing {visible.length} of {filtered.length}
              {filtered.length !== programs.length && ` (${programs.length} total)`}
            </p>
            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setShown({ key: listKey, count: shownCount + pageSize })}
                className="mx-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">
                Show {Math.min(pageSize, remaining)} more
              </button>
            )}
            <label className="ml-auto flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              Rows per step
              <select value={pageSize} onChange={e => changePageSize(Number(e.target.value))} className={`${select} py-1 text-xs`}>
                {PAGE_SIZES.map(n => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </>
  );
}
