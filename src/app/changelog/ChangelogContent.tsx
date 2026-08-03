import Link from "next/link";
import ChangelogReleaseList from "@/src/components/changelog/ChangelogReleaseList";
import FeedShowMoreButton from "@/src/components/site/FeedShowMoreButton";
import FeedWithMonthSidebar from "@/src/components/site/FeedWithMonthSidebar";
import TrustPageHero from "@/src/components/site/TrustPageHero";
import {
  buildChangelogHref,
  buildChangelogSidebarIndex,
  filterChangelogByMonth,
  groupChangelogByMonth,
  resolveChangelogPageParams
} from "@/src/lib/changelog/changelogPageUtils";import { getCachedChangelogReleases } from "@/src/lib/changelog/getChangelogReleases.server";
import { formatChangelogDate } from "@/src/lib/changelog/changelogEntries";
import { getCachedStoreDetailsDocument } from "@/src/lib/sanity/getCachedStoreDetails";
import {
  applyFeedLimit,
  CHANGELOG_FEED_DEFAULT_LIMIT,
  CHANGELOG_FEED_LIMIT_INCREMENT,
  nextFeedLimit,
  resolveFeedLimit
} from "@/src/lib/site/feedLimitUtils";
import { formatMonthLabel } from "@/src/lib/updates/updatesPageUtils";

/** Must match `PUBLIC_ISR_REVALIDATE_SECONDS` (Next.js requires a literal). */
export const revalidate = 43200;

interface ChangelogContentProps {
  searchParams: Promise<{ month?: string; limit?: string }>;
}

export default async function ChangelogContent({ searchParams }: ChangelogContentProps) {
  const sp = await searchParams;
  const { month } = resolveChangelogPageParams(sp);
  const limit = resolveFeedLimit(sp.limit, CHANGELOG_FEED_DEFAULT_LIMIT);

  const store = await getCachedStoreDetailsDocument();
  const storeTitle = store?.title?.trim() || "KeyAway";
  const releases = await getCachedChangelogReleases();
  const latestDate = releases[0]?.releasedAt;

  const sidebarYears = buildChangelogSidebarIndex(releases);
  const filtered = filterChangelogByMonth(releases, month);
  const unlimited = Boolean(month);
  const { visible, hasMore, total } = applyFeedLimit(filtered, limit, unlimited);
  const showMoreHref = buildChangelogHref(undefined, nextFeedLimit(limit, CHANGELOG_FEED_LIMIT_INCREMENT, total));

  const heading = month ? formatMonthLabel(month) : "All releases";
  const releaseGroups = groupChangelogByMonth(visible);
  const latestReleaseId = !month ? visible[0]?.id : undefined;
  return (
    <div className="min-h-screen static-bg text-[#c6d4df]">
      <TrustPageHero
        label="Changelog"
        title={
          <>
            What&apos;s new on <span className="text-gradient-pro">{storeTitle}</span>
          </>
        }
        subtitle="Release notes for major features, improvements, and fixes shipped to KeyAway."
        lastUpdated={latestDate ? formatChangelogDate(latestDate) : undefined}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#2a475e] bg-[#1b2838] px-4 py-3 sm:px-5">
          <p className="text-sm text-[#8f98a0]">Platform release history</p>
          <Link href="/updates" className="text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
            Catalog activity feed →
          </Link>
        </div>

        <FeedWithMonthSidebar
          scrollSpyEnabled={!month}
          sidebar={{
            years: sidebarYears,
            activeMonth: month,
            totalCount: releases.length,
            allLabel: "All releases",
            ariaLabel: "Filter changelog by month",
            feed: "changelog"
          }}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white sm:text-2xl">{heading}</h2>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-sm border border-[#2a475e] bg-[#1b2838] px-5 py-10 text-center">
              <p className="text-sm text-neutral-100 sm:text-base">
                {month ? `No releases for ${formatMonthLabel(month).toLowerCase()}.` : "No releases yet."}
              </p>
              <Link
                href="/changelog"
                className="mt-4 inline-block text-sm font-semibold text-[#66c0f4] transition-colors hover:text-white">
                View all releases →
              </Link>
            </div>
          ) : (
            <>
              <ChangelogReleaseList
                groups={releaseGroups}
                monthFilter={month}
                latestReleaseId={latestReleaseId}
              />

              {!unlimited && hasMore ? (
                <FeedShowMoreButton href={showMoreHref} label="Load more releases" />
              ) : null}
            </>
          )}

          <p className="mt-10 text-center text-xs text-[#8f98a0] sm:text-sm lg:text-left">
            For day-to-day listings and key drops, see{" "}
            <Link href="/updates" className="font-semibold text-[#66c0f4] hover:text-white">
              Updates
            </Link>
            .
          </p>
        </FeedWithMonthSidebar>
      </div>
    </div>
  );
}
