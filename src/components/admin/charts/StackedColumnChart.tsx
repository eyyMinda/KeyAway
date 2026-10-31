"use client";

/** @fileoverview Stacked columns on one axis: values read from the marks and axis; hover or arrow keys add the details. */
import { useState } from "react";
import type { ChartSeries } from "@/src/lib/analytics/activitySeries";

export type ChartPoint = {
  key: string;
  /** Short x axis text. */
  label: string;
  /** Full tooltip heading. */
  title: string;
  values: Record<string, number>;
};

type StackedColumnChartProps = {
  points: ChartPoint[];
  series: ChartSeries[];
  /** What the chart shows, for screen readers. */
  label: string;
  height?: number;
  /** Fractional values (rates): skips the whole-number axis and the tooltip total. */
  fractional?: boolean;
  format?: (value: number) => string;
  /** Extra tooltip rows for this point. */
  details?: (point: ChartPoint) => Array<{ label: string; value: string }>;
};

const MAX_X_LABELS = 7;
const COLUMN_MAX_WIDTH = 24;

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const axisNumber = (v: number, top: number) => (top >= 10_000 ? compact.format(v) : v.toLocaleString());

/** Clean 1/2/5 × 10^n axis step that leaves at most four intervals. */
export function niceScale(max: number, fractional: boolean): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const pow = 10 ** Math.floor(Math.log10(max / 4));
  const step = [1, 2, 5, 10].map(m => m * pow).find(s => max / s <= 4) ?? 10 * pow;
  const usable = fractional ? step : Math.max(1, step);
  const top = Math.ceil(max / usable) * usable;
  const count = Math.round(top / usable);
  return { top, ticks: Array.from({ length: count + 1 }, (_, i) => i * usable) };
}

const sum = (point: ChartPoint, series: ChartSeries[]) => series.reduce((n, s) => n + (point.values[s.key] ?? 0), 0);

export default function StackedColumnChart({
  points,
  series,
  label,
  height = 220,
  fractional = false,
  format = v => v.toLocaleString(),
  details
}: StackedColumnChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const totals = points.map(p => sum(p, series));
  const { top, ticks } = niceScale(Math.max(...totals, 0), fractional);
  const labelStep = Math.max(1, Math.ceil(points.length / MAX_X_LABELS));
  const current = active !== null ? points[active] : null;
  const activeX = active !== null ? ((active + 0.5) / points.length) * 100 : 0;
  const tickText = (v: number) => (fractional ? format(v) : axisNumber(v, top));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    setActive(i => Math.min(points.length - 1, Math.max(0, (i ?? (step > 0 ? -1 : points.length)) + step)));
  };

  return (
    <div className="flex gap-2 min-w-0">
      <div className="relative w-9 shrink-0 text-[10px] tabular-nums text-right text-gray-500 dark:text-gray-400" style={{ height }} aria-hidden>
        {ticks.map(t => (
          <span key={t} className="absolute right-0 leading-none translate-y-1/2" style={{ bottom: `${(t / top) * 100}%` }}>
            {tickText(t)}
          </span>
        ))}
      </div>

      <div className="flex-1 min-w-0">
        <div
          role="img"
          aria-label={`${label}. Use the left and right arrow keys to read each column.`}
          tabIndex={0}
          className="relative touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          style={{ height }}
          onKeyDown={onKeyDown}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}>
          {ticks.map(t => (
            <div
              key={t}
              className={`absolute inset-x-0 border-t ${t === 0 ? "border-gray-300 dark:border-gray-700" : "border-gray-100 dark:border-gray-800"}`}
              style={{ bottom: `${(t / top) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex">
            {points.map((point, i) => (
              <div
                key={point.key}
                className={`flex h-full min-w-0 flex-1 cursor-default items-end justify-center px-px transition-colors ${
                  active === i ? "bg-gray-100 dark:bg-gray-800/70" : ""
                }`}
                onPointerEnter={() => setActive(i)}
                onPointerDown={() => setActive(i)}>
                {totals[i] > 0 && (
                  <div
                    className="flex w-full flex-col-reverse gap-px overflow-hidden rounded-t-[3px]"
                    style={{ height: `${(totals[i] / top) * 100}%`, maxWidth: COLUMN_MAX_WIDTH, minHeight: 2 }}>
                    {series.map(s => {
                      const value = point.values[s.key] ?? 0;
                      return value > 0 ? (
                        <div key={s.key} style={{ flexGrow: value / totals[i], flexBasis: 0, minHeight: 1, background: s.color }} />
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {current && (
            <div
              className="absolute top-1 z-10 min-w-36 pointer-events-none rounded-lg bg-gray-900 dark:bg-gray-700 px-3 py-2 text-xs text-white shadow-lg whitespace-nowrap"
              style={activeX > 60 ? { right: `${100 - activeX}%`, marginRight: 12 } : { left: `${activeX}%`, marginLeft: 12 }}>
              <p className="mb-1 font-medium text-gray-300">{current.title}</p>
              {series.map(s => {
                const value = current.values[s.key] ?? 0;
                return value > 0 ? (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="tabular-nums font-semibold">{format(value)}</span>
                    <span className="ml-auto pl-4 text-gray-300">{s.label}</span>
                  </div>
                ) : null;
              })}
              {series.length > 1 && !fractional && (
                <div className="mt-1 flex justify-between gap-4 border-t border-white/15 pt-1">
                  <span className="tabular-nums font-semibold">{format(sum(current, series))}</span>
                  <span className="text-gray-300">Total</span>
                </div>
              )}
              {details?.(current).map(d => (
                <div key={d.label} className="flex justify-between gap-4">
                  <span className="tabular-nums font-semibold">{d.value}</span>
                  <span className="text-gray-300">{d.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-2 h-3 text-[10px] leading-none text-gray-500 dark:text-gray-400" aria-hidden>
          {points.map((p, i) =>
            i % labelStep === 0 ? (
              <span
                key={p.key}
                className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0"
                style={{ left: i === 0 ? 0 : `${((i + 0.5) / points.length) * 100}%` }}>
                {p.label}
              </span>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
