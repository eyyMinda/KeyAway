"use client";

/**
 * @fileoverview Activity over the selected period: visitors by tier, page views by page type or actions by type.
 * Stacked columns beside a totals panel that doubles as the legend and series filter, with a table view of every value.
 */
import { useMemo, useState } from "react";
import type { AnalyticsTimeline, TimelineDimension } from "@/src/lib/api/adminEventsListCache";
import StackedColumnChart, { type ChartPoint } from "@/src/components/admin/charts/StackedColumnChart";
import {
  ACTION_SERIES,
  PAGE_TYPE_SERIES,
  VISITOR_TIER_SERIES,
  formatBucket,
  type ChartSeries
} from "@/src/lib/analytics/activitySeries";

type Metric = "visitors" | "views" | "actions";
type View = "chart" | "table";

const METRICS: Array<{ key: Metric; label: string; dimension: TimelineDimension; series: ChartSeries[]; panel: string; noun: string }> = [
  { key: "visitors", label: "Visitors", dimension: "tier", series: VISITOR_TIER_SERIES, panel: "By visitor tier", noun: "visitors" },
  { key: "views", label: "Page views", dimension: "page", series: PAGE_TYPE_SERIES, panel: "By page type", noun: "views" },
  { key: "actions", label: "Actions", dimension: "action", series: ACTION_SERIES, panel: "By action", noun: "actions" }
];

type ActivityOverviewProps = {
  timeline: AnalyticsTimeline;
  uniqueVisitors: number;
  pageViews: number;
};

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium" role="group" aria-label={label}>
      {options.map(o => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
            value === o.key
              ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ActivityOverview({ timeline, uniqueVisitors, pageViews }: ActivityOverviewProps) {
  const [metric, setMetric] = useState<Metric>("views");
  const [view, setView] = useState<View>("chart");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const config = METRICS.find(m => m.key === metric) ?? METRICS[0];
  const { bucket } = timeline;

  const points = useMemo<ChartPoint[]>(
    () =>
      timeline.points.map(p => ({
        key: p.t,
        label: formatBucket(p.t, bucket),
        title: formatBucket(p.t, bucket, true),
        values: p.breakdown[config.dimension]
      })),
    [timeline.points, bucket, config.dimension]
  );

  /** Everything except known series folds into nothing rather than a guessed color, so totals come from the series. */
  const totals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of config.series) {
      out[s.key] =
        metric === "visitors" ? (timeline.tierTotals[s.key] ?? 0) : points.reduce((n, p) => n + (p.values[s.key] ?? 0), 0);
    }
    return out;
  }, [config.series, metric, points, timeline.tierTotals]);

  const present = config.series.filter(s => totals[s.key] > 0);
  const shown = present.filter(s => !hidden.has(s.key));
  const total = metric === "visitors" ? uniqueVisitors : present.reduce((n, s) => n + totals[s.key], 0);
  const peak = points.reduce<{ point: ChartPoint; value: number } | null>((best, point) => {
    const value = shown.reduce((n, s) => n + (point.values[s.key] ?? 0), 0);
    return value > 0 && (!best || value > best.value) ? { point, value } : best;
  }, null);

  const selectMetric = (next: Metric) => {
    setMetric(next);
    setHidden(new Set());
  };
  const toggleSeries = (key: string) => {
    setHidden(prev => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  };

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {total.toLocaleString()} {config.noun}
            {peak ? ` · busiest ${peak.point.title} with ${peak.value.toLocaleString()}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Segmented label="Metric" options={METRICS} value={metric} onChange={selectMetric} />
          <Segmented
            label="View"
            options={[
              { key: "chart" as View, label: "Chart" },
              { key: "table" as View, label: "Table" }
            ]}
            value={view}
            onChange={setView}
          />
        </div>
      </div>

      {points.length === 0 || present.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">No activity in this period</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0">
            {view === "chart" ? (
              <StackedColumnChart points={points} series={shown} label={`${config.label} ${config.panel.toLowerCase()}`} height={260} />
            ) : (
              <div className="max-h-72 overflow-auto rounded-lg border border-gray-100 dark:border-gray-800">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium whitespace-nowrap">Period</th>
                      {present.map(s => (
                        <th key={s.key} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                          {s.label}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[...points].reverse().map(p => (
                      <tr key={p.key} className="text-gray-900 dark:text-gray-100">
                        <td className="px-3 py-1.5 whitespace-nowrap text-gray-500 dark:text-gray-400">{p.title}</td>
                        {present.map(s => (
                          <td key={s.key} className="px-3 py-1.5 text-right tabular-nums">
                            {(p.values[s.key] ?? 0).toLocaleString()}
                          </td>
                        ))}
                        <td className="px-3 py-1.5 text-right font-semibold tabular-nums">
                          {present.reduce((n, s) => n + (p.values[s.key] ?? 0), 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{config.panel}</p>
              {metric === "actions" && pageViews > 0 && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400">per 100 views</p>
              )}
            </div>
            <ul className="space-y-0.5">
              {[...present].sort((a, b) => totals[b.key] - totals[a.key]).map(s => {
                const value = totals[s.key];
                const off = hidden.has(s.key);
                const share = total ? (value / total) * 100 : 0;
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-pressed={!off}
                      title={off ? `Show ${s.label}` : `Hide ${s.label}`}
                      onClick={() => toggleSeries(s.key)}
                      className={`w-full cursor-pointer rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 ${off ? "opacity-45" : ""}`}>
                      <span className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: s.color }} />
                        <span className="min-w-0 truncate text-gray-900 dark:text-gray-100">{s.label}</span>
                        <span className="ml-auto font-semibold tabular-nums text-gray-900 dark:text-gray-100">
                          {value.toLocaleString()}
                        </span>
                        <span className="w-9 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
                          {metric === "actions" && pageViews > 0 ? ((value / pageViews) * 100).toFixed(1) : `${share.toFixed(0)}%`}
                        </span>
                      </span>
                      <span className="mt-1 ml-4.5 block h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <span className="block h-full rounded-full" style={{ width: `${share}%`, background: s.color }} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 px-2 text-[11px] text-gray-500 dark:text-gray-400">
              {metric === "visitors"
                ? "Unique across the period, so columns can add up to more. Tiers are each visitor's current tier. "
                : ""}
              Click a row to hide it.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
