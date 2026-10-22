"use client";

/** @fileoverview All-time ad totals per concrete page (e.g. each program page); expand a row for its placements. */
import { Fragment, useState } from "react";
import Link from "next/link";
import { FaChevronDown, FaExternalLinkAlt } from "react-icons/fa";
import { clickRate, percent, type AdPathSummary } from "@/src/lib/ads/adStatsView";
import { FillPill, UnitBadge } from "./AdMetricPills";

const PAGE_SIZE = 15;

export default function AdPathsTable({ paths, title }: { paths: AdPathSummary[]; title: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">All time · busiest first · click a row for its placements</p>
      </div>
      {paths.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No ad data yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2 font-medium sm:px-5">Page</th>
                <th className="px-2 py-2 font-medium text-right">Views</th>
                <th className="px-2 py-2 font-medium text-right">Clicks</th>
                <th className="px-2 py-2 font-medium text-right">Click rate</th>
                <th className="px-4 py-2 font-medium text-right sm:px-5">Fill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paths.slice(0, shown).map(p => {
                const expanded = open === p.path;
                return (
                  <Fragment key={p.path}>
                    <tr
                      onClick={() => setOpen(expanded ? null : p.path)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-4 py-2.5 sm:px-5">
                        <div className="flex items-center gap-2">
                          <FaChevronDown
                            className={`h-2.5 w-2.5 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                          <span className="truncate font-mono text-xs text-gray-900 dark:text-gray-100">{p.path}</span>
                          <Link
                            href={p.path}
                            target="_blank"
                            onClick={e => e.stopPropagation()}
                            aria-label={`Open ${p.path}`}
                            className="text-gray-400 hover:text-primary-500">
                            <FaExternalLinkAlt className="h-2.5 w-2.5" />
                          </Link>
                        </div>
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
                      <td className="px-4 py-2.5 text-right sm:px-5">
                        <FillPill counts={p.totals} />
                      </td>
                    </tr>
                    {expanded &&
                      p.placements.map(pl => (
                        <tr key={pl.key} className="bg-gray-50/70 text-xs dark:bg-gray-800/30">
                          <td className="py-2 pl-10 pr-2 sm:pl-11">
                            <span className="text-gray-700 dark:text-gray-300">{pl.label}</span>{" "}
                            <UnitBadge label={pl.unitLabel} />
                          </td>
                          <td className="px-2 py-2 text-right tabular-nums">{pl.totals.views.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{pl.totals.clicks.toLocaleString()}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{percent(clickRate(pl.totals))}</td>
                          <td className="px-4 py-2 text-right sm:px-5">
                            <FillPill counts={pl.totals} />
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {paths.length > shown && (
        <button
          type="button"
          onClick={() => setShown(n => n + PAGE_SIZE)}
          className="w-full cursor-pointer border-t border-gray-200 py-2.5 text-xs font-medium text-primary-600 hover:bg-gray-50 dark:border-gray-800 dark:text-sky-400 dark:hover:bg-gray-800/40">
          Show {Math.min(PAGE_SIZE, paths.length - shown)} more of {paths.length - shown}
        </button>
      )}
    </div>
  );
}
