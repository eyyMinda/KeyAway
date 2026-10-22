"use client";

/** @fileoverview Placements ranked by a chosen metric; clicking a page name jumps to that page's tab. */
import { useState } from "react";
import { clickRate, fillRate, pageLabel, percent, type AdPlacementSummary } from "@/src/lib/ads/adStatsView";
import type { AdPage } from "@/src/lib/ads/adPlacements";
import { FillPill, MiniSpark, UnitBadge } from "./AdMetricPills";

type SortKey = "views" | "clicks" | "ctr" | "fill";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "views", label: "Views" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "Click rate" },
  { key: "fill", label: "Fill rate" }
];

/** Rates on tiny samples are noise; rank them only once a placement has this many views. */
const MIN_VIEWS_FOR_RATE = 20;

function score(p: AdPlacementSummary, key: SortKey): number {
  if (key === "views") return p.totals.views;
  if (key === "clicks") return p.totals.clicks;
  if (key === "ctr") return p.totals.views >= MIN_VIEWS_FOR_RATE ? clickRate(p.totals) : -1;
  return p.totals.loads >= MIN_VIEWS_FOR_RATE ? fillRate(p.totals) : -1;
}

type AdRankingTableProps = {
  placements: AdPlacementSummary[];
  title: string;
  limit?: number;
  onPageClick?: (page: AdPage) => void;
};

export default function AdRankingTable({ placements, title, limit = 10, onPageClick }: AdRankingTableProps) {
  const [sort, setSort] = useState<SortKey>("views");
  const rows = [...placements].sort((a, b) => score(b, sort) - score(a, sort)).slice(0, limit);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium">
          {SORTS.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key}
              className={`px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                sort === s.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No ad data in this period</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2 font-medium sm:px-5">#</th>
                <th className="px-2 py-2 font-medium">Placement</th>
                <th className="px-2 py-2 font-medium text-right">Views</th>
                <th className="px-2 py-2 font-medium text-right">Clicks</th>
                <th className="px-2 py-2 font-medium text-right">Click rate</th>
                <th className="px-2 py-2 font-medium text-right">Fill</th>
                <th className="px-4 py-2 font-medium sm:px-5">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((p, i) => (
                <tr key={p.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                  <td className="px-4 py-2.5 tabular-nums text-gray-400 sm:px-5">{i + 1}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{p.label}</span>
                      <UnitBadge label={p.unitLabel} />
                    </div>
                    {onPageClick ? (
                      <button
                        type="button"
                        onClick={() => onPageClick(p.page)}
                        className="cursor-pointer text-xs text-primary-600 hover:underline dark:text-sky-400">
                        {pageLabel(p.page)}
                      </button>
                    ) : null}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">
                    {p.totals.views.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-gray-900 dark:text-gray-100">
                    {p.totals.clicks.toLocaleString()}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                    {percent(clickRate(p.totals))}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <FillPill counts={p.totals} />
                  </td>
                  <td className="px-4 py-2.5 sm:px-5">
                    <MiniSpark values={p.timeline.map(d => d.views)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
