"use client";

import { useState } from "react";
import { FiExternalLink } from "react-icons/fi";
import t from "@/src/locales/admin/giveaway-finds/en.json";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import type { GiveawayWatchPageHealth } from "@/src/types/giveaways";

interface WatchPagesPanelProps {
  pages: GiveawayWatchPageHealth[];
  removingKey: string | null;
  onRemove: (key: string) => void;
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname.replace(/^www\./, "")}${u.pathname}`.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Watch pages with their last check result; failing pages (deleted/renamed) are listed first and always shown. */
export default function WatchPagesPanel({ pages, removingKey, onRemove }: WatchPagesPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const failing = pages.filter(p => p.errorCount > 0);
  const sorted = [...pages].sort(
    (a, b) => b.errorCount - a.errorCount || (a.programTitle ?? "").localeCompare(b.programTitle ?? "")
  );
  const visible = expanded ? sorted : sorted.filter(p => p.errorCount > 0);

  if (!pages.length) return null;

  return (
    <div className="mb-6 bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t.watch.title}</h3>
          <p className={`text-sm mt-1 ${failing.length ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}>
            {t.watch.summary.replace("{total}", String(pages.length)).replace("{failing}", String(failing.length))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-sm text-primary-600 dark:text-sky-400 hover:text-primary-700 dark:hover:text-sky-300 cursor-pointer">
          {expanded ? t.watch.hide : t.watch.show}
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="px-4 sm:px-6 pb-5 text-sm text-gray-500 dark:text-gray-400">{t.watch.allHealthy}</p>
      ) : (
        <div className="overflow-x-auto border-t border-gray-200 dark:border-gray-800">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                {[t.watch.columns.program, t.watch.columns.page, t.watch.columns.status, t.watch.columns.actions].map(
                  (label, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map(page => (
                <tr key={page.key || page.url} className={page.errorCount ? "bg-red-50/50 dark:bg-red-500/10" : ""}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">{page.programTitle ?? "—"}</td>
                  <td className="px-4 py-2 text-sm max-w-md">
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 max-w-full text-primary-600 dark:text-sky-400 hover:text-primary-700 dark:hover:text-sky-300">
                      <FiExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{shortUrl(page.url)}</span>
                    </a>
                    {page.sourceLabel && <div className="text-xs text-gray-500 dark:text-gray-400">{page.sourceLabel}</div>}
                  </td>
                  <td className="px-4 py-2 text-xs whitespace-nowrap">
                    {page.errorCount > 0 ? (
                      <span className="text-red-700 dark:text-red-300">
                        {t.watch.failing
                          .replace("{count}", String(page.errorCount))
                          .replace("{error}", page.lastError ?? "")}
                        {page.lastOkAt && (
                          <span className="block text-gray-500 dark:text-gray-400">
                            {t.watch.lastOk.replace("{time}", formatRelativeTimeCompact(page.lastOkAt))}
                          </span>
                        )}
                      </span>
                    ) : page.checkedAt ? (
                      <span className="text-green-700 dark:text-green-300">
                        {t.watch.ok} · {formatRelativeTimeCompact(page.checkedAt)}
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">{t.watch.notChecked}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      disabled={removingKey === page.key || !page.key}
                      onClick={() => onRemove(page.key)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer disabled:opacity-50">
                      {t.watch.remove}
                    </button>
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
