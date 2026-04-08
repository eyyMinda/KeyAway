/** @fileoverview Analytics dashboard “Recent activity” list: event line + meta row; visitor tier/hash on the right under the timestamp. */
import { AnalyticsEventData } from "@/src/types";
import { getTrackingRowDotClass, formatEventName, extractReferrerInfo } from "@/src/lib/analytics/analyticsUtils";
import { visitorTierBadgeClasses } from "@/src/theme/colorSchema";
import { isPageViewNotFoundRow } from "@/src/lib/analytics/pageViewDisplay";

interface RecentActivityProps {
  events: AnalyticsEventData[];
  maxItems?: number;
  title?: string;
  subtitle?: string;
}

export default function RecentActivity({
  events,
  maxItems = 10,
  title = "Recent Activity",
  subtitle = "Latest tracking events"
}: RecentActivityProps) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          {displayEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            displayEvents.map(event => {
              const hash = event.ipHash?.trim();
              const hashShort = hash ? `${hash.slice(0, 10)}…` : null;
              return (
                <div
                  key={event._id}
                  className="flex items-start justify-between gap-3 py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${getTrackingRowDotClass(event)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
                        <span className="text-sm font-medium text-gray-900 shrink-0">
                          {formatEventName(event.event)}
                        </span>
                        {event.notFound === true && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            Not found
                          </span>
                        )}
                        {event.programSlug && !isPageViewNotFoundRow(event) && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {event.programSlug}
                          </span>
                        )}
                        {event.social && (
                          <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">{event.social}</span>
                        )}
                        {event.interaction && (
                          <span className="text-xs text-cyan-900 bg-cyan-100 px-2 py-1 rounded font-mono">
                            {event.interaction}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {event.country && (
                          <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">
                            {event.country}
                            {event.city && `, ${event.city}`}
                          </span>
                        )}
                        {event.path && <span className="text-xs text-gray-500 font-mono">{event.path}</span>}
                        {event.referrer && (
                          <span
                            className="text-xs text-gray-500 truncate max-w-32 whitespace-nowrap"
                            title={event.referrer}>
                            from {extractReferrerInfo(event.referrer).hostname}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(event.createdAt).toLocaleString()}
                    </div>
                    {hash ? (
                      <div className="flex flex-wrap items-center justify-end gap-1.5 max-w-56">
                        {event.visitorIsSpammer ? (
                          <span className={visitorTierBadgeClasses("new", true)}>spammer</span>
                        ) : null}
                        <span className={visitorTierBadgeClasses(event.visitTier, false)}>
                          {event.visitTier || "new"}
                        </span>
                        <span className="font-mono text-[10px] text-gray-500 truncate" title={hash}>
                          {hashShort}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">—</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
