/** @fileoverview Analytics dashboard “Recent activity” list: one compact row per event (event + context, meta line, time + visitor). */
import { FiCornerDownRight, FiMapPin } from "react-icons/fi";
import { AnalyticsEventData } from "@/src/types";
import { getTrackingRowDotClass, formatEventName, extractReferrerInfo } from "@/src/lib/analytics/analyticsUtils";
import { formatRelativeTimeCompact } from "@/src/lib/dateUtils";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import { isPageViewNotFoundRow } from "@/src/lib/analytics/pageViewDisplay";

interface RecentActivityProps {
  events: AnalyticsEventData[];
  maxItems?: number;
  title?: string;
  subtitle?: string;
}

const chip = "text-[11px] leading-4 px-1.5 rounded";

export default function RecentActivity({
  events,
  maxItems = 10,
  title = "Recent Activity",
  subtitle = "Latest tracking events"
}: RecentActivityProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-soft border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-800 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      {displayEvents.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">No recent activity</p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {displayEvents.map(event => {
            const hash = event.ipHash?.trim();
            const location = [event.city, event.country].filter(Boolean).join(", ");
            const referrer = event.referrer ? extractReferrerInfo(event.referrer).hostname : "";
            const showProgram = event.programSlug && !isPageViewNotFoundRow(event);
            // The program chip already says where the visit was; repeat the path only when it adds something.
            const showPath = event.path && !(showProgram && event.path === `/program/${event.programSlug}`);
            return (
              <li
                key={event._id}
                className="flex items-center gap-3 px-4 sm:px-6 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getTrackingRowDotClass(event)}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {formatEventName(event.event)}
                    </span>
                    {event.notFound === true && (
                      <span className={`${chip} font-semibold uppercase text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/10`}>404</span>
                    )}
                    {showProgram && (
                      <span className={`${chip} text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 truncate`}>{event.programSlug}</span>
                    )}
                    {event.social && <span className={`${chip} text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10 truncate`}>{event.social}</span>}
                  </div>
                  {(location || showPath || referrer) && (
                    <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 min-w-0">
                      {location && (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap">
                          <FiMapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                          {location}
                        </span>
                      )}
                      {showPath && (
                        <span className="font-mono truncate" title={event.path}>
                          {event.path}
                        </span>
                      )}
                      {referrer && (
                        <span className="inline-flex items-center gap-1 truncate" title={event.referrer}>
                          <FiCornerDownRight className="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
                          {referrer}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {hash && (
                    <>
                      {event.visitorIsSpammer && <span className={visitorTierBadgeClasses("new", true)}>spammer</span>}
                      <span className={visitorTierBadgeClasses(event.visitTier, false)} title={hash}>
                        {event.visitTier || "new"}
                      </span>
                    </>
                  )}
                  <time
                    dateTime={event.createdAt}
                    title={new Date(event.createdAt).toLocaleString()}
                    className="w-14 text-right text-[11px] text-gray-500 dark:text-gray-400 tabular-nums whitespace-nowrap">
                    {formatRelativeTimeCompact(event.createdAt)}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
