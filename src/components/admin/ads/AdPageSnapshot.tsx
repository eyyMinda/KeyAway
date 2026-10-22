"use client";

/**
 * @fileoverview Wireframe of one page type: its ad placements in page order, between grey content blocks, each
 * shaded by its share of the page's views. Click a placement to see its daily trend and raw counts.
 */
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { clickRate, percent, type AdPlacementSummary } from "@/src/lib/ads/adStatsView";
import { FillPill, MiniSpark, UnitBadge } from "./AdMetricPills";

function UnitShape({ unit }: { unit: string }) {
  const block = "rounded-[2px] bg-primary-500/70";
  if (unit === "native")
    return (
      <div className="grid w-14 grid-cols-4 gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`${block} h-4`} />
        ))}
      </div>
    );
  if (unit === "card")
    return (
      <div className="grid w-14 grid-cols-4 gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-4 rounded-[2px] ${i === 2 ? "bg-primary-500/70" : "bg-gray-200 dark:bg-gray-700"}`} />
        ))}
      </div>
    );
  if (unit === "rail") return <div className={`${block} mx-auto h-6 w-2.5`} aria-hidden />;
  return <div className={`${block} h-2.5 w-14`} aria-hidden />;
}

function ContentBlock() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5" aria-hidden>
      <div className="h-1.5 w-14 rounded-full bg-gray-200 dark:bg-gray-800" />
      <div className="h-1.5 flex-1 rounded-full bg-gray-100 dark:bg-gray-800/60" />
    </div>
  );
}

export default function AdPageSnapshot({ placements, title }: { placements: AdPlacementSummary[]; title: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const ordered = [...placements].sort((a, b) => a.order - b.order);
  const pageViews = ordered.reduce((n, p) => n + p.totals.views, 0);
  const maxViews = Math.max(...ordered.map(p => p.totals.views), 1);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Placements top to bottom · click one for details</p>
        </div>
        <div className="hidden items-center gap-1.5 sm:flex" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="py-14 text-center text-sm text-gray-500 dark:text-gray-400">No ad data for this page in this period</p>
      ) : (
        <ol className="py-2">
          <li>
            <ContentBlock />
          </li>
          {ordered.map(p => {
            const share = pageViews ? p.totals.views / pageViews : 0;
            const expanded = open === p.key;
            return (
              <li key={p.key}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : p.key)}
                  aria-expanded={expanded}
                  className="group relative mx-2 flex w-[calc(100%-1rem)] cursor-pointer items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-primary-300 dark:hover:border-primary-500/40">
                  <span
                    className="absolute inset-y-0 left-0 bg-primary-500/10 dark:bg-primary-500/15"
                    style={{ width: `${(p.totals.views / maxViews) * 100}%` }}
                    aria-hidden
                  />
                  <span className="relative w-14 shrink-0">
                    <UnitShape unit={p.unit} />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{p.label}</span>
                      <UnitBadge label={p.unitLabel} />
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{percent(share, 0)} of this page&apos;s ad views</span>
                  </span>
                  <span className="relative hidden w-20 text-right sm:block">
                    <span className="block text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {p.totals.views.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">views</span>
                  </span>
                  <span className="relative w-16 text-right">
                    <span className="block text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                      {p.totals.clicks.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">{percent(clickRate(p.totals))}</span>
                  </span>
                  <span className="relative w-12 text-right">
                    <FillPill counts={p.totals} />
                  </span>
                  <FaChevronDown
                    className={`relative h-3 w-3 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {expanded && (
                  <div className="mx-2 mb-1 grid grid-cols-2 gap-3 rounded-b-lg bg-gray-50 px-4 py-3 text-xs dark:bg-gray-800/40 sm:grid-cols-5">
                    <div className="col-span-2 sm:col-span-1">
                      <p className="mb-1 text-gray-500 dark:text-gray-400">Views per day</p>
                      <MiniSpark values={p.timeline.map(d => d.views)} className="h-8 w-full" />
                    </div>
                    {(
                      [
                        ["Loads", p.totals.loads],
                        ["Shown", p.totals.fills],
                        ["Views", p.totals.views],
                        ["Clicks", p.totals.clicks]
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label}>
                        <p className="text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {value.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <ContentBlock />
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
