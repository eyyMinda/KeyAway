import { useEffect, useMemo, useState } from "react";
import { adminChrome } from "@/src/theme/colorSchema";

interface DataTableRow {
  key: string;
  value: number;
  label?: string;
  referrerParam?: string;
  /** Tailwind bg-* only — small dot before the label when set. */
  swatchClass?: string;
}

interface DataTableProps {
  title: string;
  data: DataTableRow[];
  maxItems?: number;
  showPercentage?: boolean;
  className?: string;
  countNoun?: string;
  /** Adds a search box; filters label/key/referrerParam. Use for long lists. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function DataTable({
  title,
  data,
  maxItems = 10,
  showPercentage = false,
  className = "",
  countNoun = "events",
  searchable = false,
  searchPlaceholder = "Search…"
}: DataTableProps) {
  const [visible, setVisible] = useState(maxItems);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setVisible(maxItems);
  }, [maxItems]);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const sorted = useMemo(() => [...data].sort((a, b) => b.value - a.value), [data]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return sorted;
    return sorted.filter(item =>
      [item.label, item.key, item.referrerParam].some(v => v?.toLowerCase().includes(q))
    );
  }, [sorted, q]);

  // While searching, show every match. Otherwise page with Show more.
  const displayed = q ? filtered : filtered.slice(0, visible);
  const barMax = Math.max(...displayed.map(i => i.value), 1);
  const canShowMore = !q && filtered.length > visible;

  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">
          {data.length} total items • {total.toLocaleString()} total {countNoun}
        </p>
        {searchable ? (
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        ) : null}
      </div>

      <div className="p-6">
        {displayed.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>{q ? "No matches" : "No data available"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((item, index) => {
              const percentage = showPercentage && total > 0 ? (item.value / total) * 100 : 0;

              return (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <div className="flex-1 min-w-0 ml-3">
                      <div className="flex flex-col min-w-0">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2 min-w-0">
                          {item.swatchClass ? (
                            <span className={`size-2.5 rounded-full shrink-0 ${item.swatchClass}`} aria-hidden />
                          ) : null}
                          <span className="truncate">{item.label || item.key}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col">
                      {showPercentage && (
                        <p className="text-xs text-gray-500 mb-1">{percentage.toFixed(1)}% of total</p>
                      )}
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`${adminChrome.progressBarFill} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${(item.value / barMax) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {canShowMore ? (
          <button
            type="button"
            onClick={() => setVisible(v => v + maxItems)}
            className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
            Show more ({filtered.length - visible})
          </button>
        ) : null}
      </div>
    </div>
  );
}
