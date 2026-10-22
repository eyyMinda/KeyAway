"use client";

/** @fileoverview Daily ad trend as bars: views, clicks or click rate, with a hover tooltip per day. */
import { useState } from "react";
import { clickRate, fillRate, percent, type AdDayPoint } from "@/src/lib/ads/adStatsView";

type Metric = "views" | "clicks" | "ctr";

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "views", label: "Views" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "Click rate" }
];

const HEIGHT = 180;

const valueOf = (p: AdDayPoint, metric: Metric) => (metric === "ctr" ? clickRate(p) : p[metric]);
const format = (v: number, metric: Metric) => (metric === "ctr" ? percent(v) : v.toLocaleString());
const formatDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

export default function AdTrendChart({ points, title = "Trend" }: { points: AdDayPoint[]; title?: string }) {
  const [metric, setMetric] = useState<Metric>("views");
  const [hover, setHover] = useState<number | null>(null);
  const values = points.map(p => valueOf(p, metric));
  const max = Math.max(...values, metric === "ctr" ? 0.01 : 1);
  const hovered = hover !== null ? points[hover] : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 h-4">
            {hovered
              ? `${formatDay(hovered.day)} · ${hovered.views.toLocaleString()} views · ${hovered.clicks.toLocaleString()} clicks · ${percent(fillRate(hovered), 0)} filled`
              : "Hover a day for details"}
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium" role="tablist">
          {METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                metric === m.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {values.every(v => v === 0) ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-16 text-center">No ad activity in this period yet</p>
      ) : (
        <>
          <div className="flex items-end gap-px sm:gap-0.5" style={{ height: HEIGHT }} onPointerLeave={() => setHover(null)}>
            {points.map((p, i) => {
              const v = values[i];
              return (
                <div
                  key={p.day}
                  className="group relative flex h-full flex-1 cursor-default items-end"
                  onPointerEnter={() => setHover(i)}>
                  <div
                    className={`w-full rounded-t-sm transition-colors ${
                      hover === i ? "bg-primary-500" : "bg-primary-500/40 dark:bg-primary-500/50"
                    }`}
                    style={{ height: `${Math.max(v > 0 ? 2 : 0, (v / max) * 100)}%` }}
                  />
                  {hover === i && (
                    <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium text-white shadow dark:bg-gray-700">
                      {format(v, metric)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">
            <span>{formatDay(points[0].day)}</span>
            {points.length > 2 && <span>{formatDay(points[Math.floor(points.length / 2)].day)}</span>}
            <span>{formatDay(points[points.length - 1].day)}</span>
          </div>
        </>
      )}
    </div>
  );
}
