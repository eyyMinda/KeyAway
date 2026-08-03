import Link from "next/link";
import JsonLd from "@/src/components/JsonLd";
import FeedShowMoreButton from "@/src/components/site/FeedShowMoreButton";
import FeedWithMonthSidebar from "@/src/components/site/FeedWithMonthSidebar";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import UpdatesTimeline from "@/src/components/updates/UpdatesTimeline";
import { readSiteNotificationHistory } from "@/src/lib/notifications/notificationFeed.server";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import { generateUpdatesPageJsonLd } from "@/src/lib/seo/jsonLd";
import { resolveUpdatesPageSeo } from "@/src/lib/seo/trustPageSeo";
import {
  applyFeedLimit,
  nextFeedLimit,
  UPDATES_FEED_LIMIT_INCREMENT
} from "@/src/lib/site/feedLimitUtils";
import {
  buildMonthSidebarIndex,
  buildUpdatesHref,
  filterNotificationsByMonth,
  formatMonthLabel,
  formatUpdateDate,
  groupSortedNotifications,
  resolveUpdatesPageParams
} from "@/src/lib/updates/updatesPageUtils";

/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 43200;

interface UpdatesContentProps {
  searchParams: Promise<{ month?: string; limit?: string }>;
}

export default async function UpdatesContent({ searchParams }: UpdatesContentProps) {
  const sp = await searchParams;
  const { month, limit } = resolveUpdatesPageParams(sp);

  const [store, allUpdates] = await Promise.all([getCachedStoreDetailsDocument(), readSiteNotificationHistory()]);
  const sidebarYears = buildMonthSidebarIndex(allUpdates);
  const filtered = filterNotificationsByMonth(allUpdates, month);
  const unlimited = Boolean(month);
  const { visible, hasMore, total } = applyFeedLimit(filtered, limit, unlimited);
  const timeline = groupSortedNotifications(visible);
  const showMoreHref = buildUpdatesHref(undefined, nextFeedLimit(limit, UPDATES_FEED_LIMIT_INCREMENT, total));

  const { pageUrl: siteUrl, storeTitle } = resolveUpdatesPageSeo(store);
  const jsonLd = generateUpdatesPageJsonLd(filtered.slice(0, 50), siteUrl);

  const heading = month ? formatMonthLabel(month) : "All updates";
  const latestDate = allUpdates[0]?.createdAt;

  return (
    <>
      <JsonLd data={jsonLd} />

      <div className="min-h-screen static-bg text-[#c6d4df]">
        <TrustPageHero
          label="Updates"
          title={
            <>
              Latest catalog updates on <span className="text-gradient-pro">{storeTitle}</span>
            </>
          }
          subtitle={`New programs and fresh giveaway keys added to ${storeTitle}, refreshed from our live catalog.`}
          lastUpdated={latestDate ? formatUpdateDate(latestDate) : undefined}
        />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#2a475e] bg-[#1b2838] px-4 py-3 sm:px-5">
            <p className="text-sm text-[#8f98a0]">Catalog activity feed</p>
            <Link href="/changelog" className="text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
              Platform release history →
            </Link>
          </div>

          <FeedWithMonthSidebar
            scrollSpyEnabled={!month}
            sidebar={{
              years: sidebarYears,
              activeMonth: month,
              totalCount: allUpdates.length,
              allLabel: "All updates",
              ariaLabel: "Filter updates by month",
              feed: "updates"
            }}>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white sm:text-2xl">{heading}</h2>
            </div>

            {visible.length === 0 ? (
              <div className="rounded-sm border border-[#2a475e] bg-[#1b2838] px-5 py-10 text-center">
                <p className="text-sm text-neutral-100 sm:text-base">
                  {month ? `No updates for ${formatMonthLabel(month).toLowerCase()}.` : "No catalog updates yet."}
                </p>
                {month ? (
                  <Link
                    href="/updates"
                    className="mt-4 inline-block text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
                    View all updates →
                  </Link>
                ) : (
                  <Link
                    href="/programs"
                    className="mt-4 inline-block text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
                    Browse all programs →
                  </Link>
                )}
              </div>
            ) : (
              <>
                <UpdatesTimeline groups={timeline} showYearHeadings={!month || timeline.length > 1} />
                {!unlimited && hasMore ? (
                  <FeedShowMoreButton href={showMoreHref} label="Load more updates" />
                ) : null}
              </>
            )}

            <p className="mt-8 text-center text-xs text-[#8f98a0] sm:text-sm lg:text-left">
              <Link href="/programs" className="font-semibold text-[#66c0f4] hover:text-white">
                Browse the full program catalog
              </Link>
            </p>
          </FeedWithMonthSidebar>
        </div>
      </div>
    </>
  );
}
