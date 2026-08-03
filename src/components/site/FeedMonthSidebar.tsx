"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buildFeedMonthHref, type FeedKind } from "@/src/lib/site/feedHrefUtils";
import type { SidebarYear } from "@/src/lib/site/monthSidebarUtils";

const linkClass = (active: boolean) =>
  `flex items-center justify-between rounded-sm px-3 py-2 text-sm transition-colors ${
    active
      ? "bg-[#213246] font-semibold text-white"
      : "text-[#c6d4df] hover:bg-[#213246]/70 hover:text-white"
  }`;

export type FeedMonthSidebarProps = {
  years: SidebarYear[];
  /** Month selected via `?month=` URL filter. */
  activeMonth?: string;
  /** Month currently in view while scrolling (scroll-spy). */
  visibleMonth?: string | null;
  totalCount: number;
  allLabel: string;
  ariaLabel: string;
  feed: FeedKind;
};

export default function FeedMonthSidebar({
  years,
  activeMonth,
  visibleMonth,
  totalCount,
  allLabel,
  ariaLabel,
  feed
}: FeedMonthSidebarProps) {
  const highlightedMonth = activeMonth ?? visibleMonth ?? undefined;

  useEffect(() => {
    if (!visibleMonth || activeMonth) return;
    document
      .querySelector(`[data-sidebar-month="${visibleMonth}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [visibleMonth, activeMonth]);

  return (
    <nav aria-label={ariaLabel} className="lg:sticky lg:top-24 lg:self-start">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8f98a0]">Filter by month</p>

      <ul className="space-y-1 rounded-sm border border-[#2a475e] bg-[#1b2838] p-2">
        <li>
          <Link
            href={buildFeedMonthHref(feed)}
            scroll={false}
            className={linkClass(!activeMonth && !highlightedMonth)}
            aria-current={!activeMonth && !highlightedMonth ? "true" : undefined}>
            <span>{allLabel}</span>
            <span className="text-xs tabular-nums text-[#8f98a0]">{totalCount}</span>
          </Link>
        </li>
      </ul>

      <div className="mt-4 max-h-[min(70vh,560px)] space-y-5 overflow-y-auto rounded-sm border border-[#2a475e] bg-[#1b2838] p-3">
        {years.map(({ year, months }) => (
          <div key={year}>
            <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[#66c0f4]">{year}</p>
            <ul className="space-y-0.5">
              {months.map(month => {
                const isHighlighted = highlightedMonth === month.key;
                return (
                  <li key={month.key}>
                    <Link
                      href={buildFeedMonthHref(feed, month.key)}
                      scroll={false}
                      data-sidebar-month={month.key}
                      className={linkClass(isHighlighted)}
                      aria-current={isHighlighted ? "true" : undefined}>
                      <span>{month.monthName}</span>
                      <span className="text-xs tabular-nums text-[#8f98a0]">{month.count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
