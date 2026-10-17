/** @fileoverview Compact KPI tile: label, headline number, one context line, optional sparkline of the same metric. */

interface AnalyticsCardProps {
  label: string;
  value: number;
  /** One short line of context (a ratio, a top item). */
  detail?: string;
  /** Same metric over the selected period, oldest first. */
  spark?: number[];
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  const line = values.map((v, i) => `${(i * step).toFixed(2)},${(30 - (v / max) * 28).toFixed(2)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-8 text-primary-500" aria-hidden>
      <polygon points={`0,30 ${line} 100,30`} className="fill-current opacity-10" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function AnalyticsCard({ label, value, detail, spark }: AnalyticsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-soft p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums leading-tight">{value.toLocaleString()}</p>
      {detail && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{detail}</p>}
      {spark && (
        <div className="mt-auto pt-2">
          <Sparkline values={spark} />
        </div>
      )}
    </div>
  );
}
