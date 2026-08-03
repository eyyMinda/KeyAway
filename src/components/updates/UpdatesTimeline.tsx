import type { TimelineYear } from "@/src/lib/updates/updatesPageUtils";
import UpdateFeedItem from "@/src/components/updates/UpdateFeedItem";

type UpdatesTimelineProps = {
  groups: TimelineYear[];
  showYearHeadings?: boolean;
};

export default function UpdatesTimeline({ groups, showYearHeadings = true }: UpdatesTimelineProps) {
  return (
    <div className="divide-y divide-[#2a475e] rounded-sm border border-[#2a475e] bg-[#1b2838]">
      {groups.map(yearGroup => (
        <section key={yearGroup.year} className="px-4 sm:px-5">
          {showYearHeadings ? (
            <h2 className="sticky top-18 z-10 -mx-4 border-b border-[#2a475e] bg-[#1b2838]/95 px-4 py-3 text-lg font-bold text-white backdrop-blur-sm sm:-mx-5 sm:px-5">
              {yearGroup.year}
            </h2>
          ) : null}

          {yearGroup.months.map(month => (
            <div key={month.monthKey} data-feed-month={month.monthKey} id={`month-${month.monthKey}`} className="scroll-mt-24">
              <h3 className="pt-4 pb-2 text-sm font-semibold uppercase tracking-wide text-[#8f98a0]">
                {showYearHeadings ? month.monthName : `${month.monthName} ${yearGroup.year}`}
              </h3>
              <ul className="divide-y divide-[#2a475e]/70">
                {month.items.map(item => (
                  <UpdateFeedItem key={item.id} notification={item} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
