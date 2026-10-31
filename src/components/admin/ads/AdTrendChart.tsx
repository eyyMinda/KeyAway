"use client";

/** @fileoverview Daily ad trend as columns: views, clicks or click rate on a labeled axis, with each day's details on hover. */
import { useMemo, useState } from "react";
import StackedColumnChart, { type ChartPoint } from "@/src/components/admin/charts/StackedColumnChart";
import { clickRate, fillRate, percent, sumCounts, type AdDayPoint } from "@/src/lib/ads/adStatsView";

type Metric = "views" | "clicks" | "ctr";

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "views", label: "Views" },
  { key: "clicks", label: "Clicks" },
  { key: "ctr", label: "Click rate" }
];

const valueOf = (p: AdDayPoint, metric: Metric) => (metric === "ctr" ? clickRate(p) : p[metric]);
const format = (v: number, metric: Metric) => (metric === "ctr" ? percent(v) : v.toLocaleString());
const formatDay = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

export default function AdTrendChart({ points, title = "Trend" }: { points: AdDayPoint[]; title?: string }) {
  const [metric, setMetric] = useState<Metric>("views");
  const active = METRICS.find(m => m.key === metric) ?? METRICS[0];
  const byDay = useMemo(() => new Map(points.map(p => [p.day, p])), [points]);
  const chartPoints = useMemo<ChartPoint[]>(
    () =>
      points.map(p => ({
        key: p.day,
        label: formatDay(p.day),
        title: formatDay(p.day),
        values: { value: valueOf(p, metric) }
      })),
    [points, metric]
  );

  const totals = sumCounts(points);
  const peak = points.reduce<AdDayPoint | null>(
    (best, p) => (valueOf(p, metric) > 0 && (!best || valueOf(p, metric) > valueOf(best, metric)) ? p : best),
    null
  );

  const details = (point: ChartPoint) => {
    const day = byDay.get(point.key);
    if (!day) return [];
    return METRICS.filter(m => m.key !== metric)
      .map(m => ({ label: m.label, value: format(valueOf(day, m.key), m.key) }))
      .concat({ label: "Filled", value: day.loads ? percent(fillRate(day), 0) : "—" });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {metric === "ctr" ? `${percent(clickRate(totals))} overall` : `${totals[metric].toLocaleString()} ${active.label.toLowerCase()}`}
            {peak ? ` · best ${formatDay(peak.day)} with ${format(valueOf(peak, metric), metric)}` : ""}
          </p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium" role="group" aria-label="Metric">
          {METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              aria-pressed={metric === m.key}
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

      {chartPoints.every(p => p.values.value === 0) ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-16 text-center">No ad activity in this period yet</p>
      ) : (
        <StackedColumnChart
          points={chartPoints}
          series={[{ key: "value", label: active.label, color: "var(--viz-1)" }]}
          label={`${title}: ${active.label.toLowerCase()} per day`}
          height={200}
          fractional={metric === "ctr"}
          format={v => format(v, metric)}
          details={details}
        />
      )}
    </div>
  );
}
