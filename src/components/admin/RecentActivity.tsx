import { AnalyticsEventData } from "@/src/types";
import { getEventDotColor, formatEventName } from "@/src/lib/analyticsUtils";

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
            displayEvents.map(event => (
              <div
                key={event._id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`w-2 h-2 rounded-full ${getEventDotColor(event.event)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{formatEventName(event.event)}</span>
                      {event.programSlug && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{event.programSlug}</span>
                      )}
                      {event.social && (
                        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">{event.social}</span>
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
                        <span className="text-xs text-gray-500 truncate max-w-32" title={event.referrer}>
                          from {new URL(event.referrer).hostname}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
