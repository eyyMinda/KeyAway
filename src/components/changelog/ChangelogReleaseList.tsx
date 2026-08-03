import ChangelogReleaseCard from "@/src/components/changelog/ChangelogReleaseCard";
import type { ChangelogMonthGroup } from "@/src/lib/changelog/changelogPageUtils";

type ChangelogReleaseListProps = {
  groups: ChangelogMonthGroup[];
  /** When set, content is already filtered to one month — hide month headings. */
  monthFilter?: string;
  /** Index of the newest release in the full visible list (for "Latest" badge). */
  latestReleaseId?: string;
};

export default function ChangelogReleaseList({ groups, monthFilter, latestReleaseId }: ChangelogReleaseListProps) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute bottom-0 left-[11px] top-0 w-px bg-linear-to-b from-[#66c0f4]/80 via-[#2a475e] to-transparent sm:left-[15px]"
      />

      {groups.map(group => (
        <section
          key={group.monthKey}
          data-feed-month={group.monthKey}
          id={`month-${group.monthKey}`}
          className="my-5 scroll-mt-24">
          {!monthFilter ? (
            <h3 className="mb-5 pl-10 text-base sm:text-lg font-semibold uppercase tracking-wide text-[#dce8f2] sm:pl-12">
              {group.monthName}
            </h3>
          ) : null}

          <ol className="space-y-10 sm:space-y-12">
            {group.releases.map(release => {
              const isLatest = !monthFilter && release.id === latestReleaseId;

              return (
                <li key={release.id} className="relative pl-10 sm:pl-12">
                  <span
                    aria-hidden
                    className={`absolute left-0 top-6 flex h-6 w-6 items-center justify-center rounded-full border sm:top-7 sm:h-8 sm:w-8 ${
                      isLatest
                        ? "border-[#66c0f4] bg-[#1a3a5c] shadow-[0_0_16px_rgba(102,192,244,0.35)]"
                        : "border-[#2a475e] bg-[#16202d]"
                    }`}>
                    <span
                      className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${isLatest ? "bg-[#66c0f4]" : "bg-[#556772]"}`}
                    />
                  </span>

                  <ChangelogReleaseCard release={release} isLatest={isLatest} />
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
