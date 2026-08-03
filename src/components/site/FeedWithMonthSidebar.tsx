"use client";

import { useRef, type ReactNode } from "react";
import FeedMonthSidebar, { type FeedMonthSidebarProps } from "@/src/components/site/FeedMonthSidebar";
import { useFeedMonthScrollSpy } from "@/src/hooks/useFeedMonthScrollSpy";
import { useScrollToFeedOnMonthChange } from "@/src/hooks/useScrollToFeedOnMonthChange";
import { FEED_SECTION_ID } from "@/src/lib/site/feedHrefUtils";

type FeedWithMonthSidebarProps = {
  sidebar: FeedMonthSidebarProps;
  /** When false (month URL filter), sidebar uses the filter only. */
  scrollSpyEnabled: boolean;
  children: ReactNode;
};

export default function FeedWithMonthSidebar({
  sidebar,
  scrollSpyEnabled,
  children
}: FeedWithMonthSidebarProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const visibleMonth = useFeedMonthScrollSpy(scrollSpyEnabled, contentRef);
  useScrollToFeedOnMonthChange();

  return (
    <section id={FEED_SECTION_ID} className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <FeedMonthSidebar {...sidebar} visibleMonth={scrollSpyEnabled ? visibleMonth : undefined} />
        <div ref={contentRef} className="min-w-0">
          {children}
        </div>
      </div>
    </section>
  );
}
