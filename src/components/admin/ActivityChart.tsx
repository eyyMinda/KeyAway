"use client";

/** @fileoverview Activity over the selected period: one metric at a time (tabs), area line with hover crosshair + tooltip. */
import { useMemo, useRef, useState } from "react";
import type { AnalyticsTimeline } from "@/src/lib/api/adminEventsListCache";

type Metric = "visitors" | "views" | "actions";

const METRICS: Array<{ key: Metric; label: string }> = [
  { key: "visitors", label: "Visitors" },
  { key: "views", label: "Page views" },
  { key: "actions", label: "Actions" }
];

const HEIGHT = 200;
const GRID_LINES = 3;

function formatBucket(iso: string, bucket: AnalyticsTimeline["bucket"], withTime = false): string {
  const d = new Date(iso);
  if (bucket === "hour") {
    const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return withTime ? `${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${time}` : time;
  }
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return bucket === "week" ? `Week of ${date}` : date;
}

/** Round the axis top to 1/2/5 × 10^n so grid labels stay readable. */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });

export default function ActivityChart({ timeline }: { timeline: AnalyticsTimeline }) {
  const [metric, setMetric] = useState<Metric>("views");
  const [hover, setHover] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const points = timeline.points;

  const { line, area, max } = useMemo(() => {
    const values = points.map(p => p[metric]);
    const top = niceMax(Math.max(...values, 0));
    const step = points.length > 1 ? 100 / (points.length - 1) : 0;
    const coords = values.map((v, i) => `${(i * step).toFixed(3)},${(100 - (v / top) * 100).toFixed(3)}`);
    return { line: coords.join(" "), area: `0,100 ${coords.join(" ")} 100,100`, max: top };
  }, [points, metric]);

  const onMove = (e: React.PointerEvent) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || points.length === 0) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(Math.round(ratio * (points.length - 1)));
  };

  const hovered = hover !== null ? points[hover] : null;
  const hoverX = hover !== null && points.length > 1 ? (hover / (points.length - 1)) * 100 : 0;
  const xLabels = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 p-4 sm:p-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Activity</h3>
        <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5 text-xs font-medium" role="tablist">
          {METRICS.map(m => (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={metric === m.key}
              onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                metric === m.key ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {points.length < 2 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-16 text-center">Not enough activity in this period</p>
      ) : (
        <div className="flex gap-2">
          {/* Y axis labels */}
          <div className="relative w-8 shrink-0 text-[10px] text-gray-400 dark:text-gray-500 tabular-nums text-right" style={{ height: HEIGHT }}>
            {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
              <span
                key={i}
                className="absolute right-0 leading-none -translate-y-1/2"
                style={{ top: `${(i / GRID_LINES) * 100}%` }}>
                {compact.format((max * (GRID_LINES - i)) / GRID_LINES)}
              </span>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <div
              ref={plotRef}
              className="relative touch-none"
              style={{ height: HEIGHT }}
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setHover(null)}>
              {/* Grid */}
              {Array.from({ length: GRID_LINES + 1 }, (_, i) => (
                <div
                  key={i}
                  className={`absolute inset-x-0 border-t ${i === GRID_LINES ? "border-gray-200 dark:border-gray-800" : "border-gray-100 dark:border-gray-800"}`}
                  style={{ top: `${(i / GRID_LINES) * 100}%` }}
                />
              ))}

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full text-primary-500" aria-hidden>
                <polygon points={area} className="fill-current opacity-10" />
                <polyline
                  points={line}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {hovered && (
                <>
                  <div className="absolute inset-y-0 w-px bg-gray-300 dark:bg-gray-600 pointer-events-none" style={{ left: `${hoverX}%` }} />
                  <div
                    className="absolute w-2.5 h-2.5 -ml-[5px] -mt-[5px] rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900 pointer-events-none"
                    style={{ left: `${hoverX}%`, top: `${100 - (hovered[metric] / max) * 100}%` }}
                  />
                  <div
                    className="absolute top-0 z-10 pointer-events-none rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs px-3 py-2 shadow-lg whitespace-nowrap"
                    style={hoverX > 60 ? { right: `${100 - hoverX}%`, marginRight: 8 } : { left: `${hoverX}%`, marginLeft: 8 }}>
                    <div className="font-medium mb-1">{formatBucket(hovered.t, timeline.bucket, true)}</div>
                    {METRICS.map(m => (
                      <div key={m.key} className={`flex justify-between gap-4 ${m.key === metric ? "" : "text-gray-400 dark:text-gray-500"}`}>
                        <span>{m.label}</span>
                        <span className="tabular-nums">{hovered[m.key].toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* X axis labels */}
            <div className="flex justify-between mt-2 text-[10px] text-gray-400 dark:text-gray-500">
              {xLabels.map(i => (
                <span key={i}>{formatBucket(points[i].t, timeline.bucket)}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
