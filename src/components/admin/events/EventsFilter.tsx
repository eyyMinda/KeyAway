import React from "react";
import { AnalyticsEventData } from "@/src/types";
import { adminChrome } from "@/src/theme/colorSchema";

interface EventsFilterProps {
  selectedEvent: string;
  eventTypes: string[];
  events: AnalyticsEventData[];
  onEventChange: (eventType: string) => void;
}

export default function EventsFilter({ selectedEvent, eventTypes, events, onEventChange }: EventsFilterProps) {
  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onEventChange("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedEvent === "all" ? adminChrome.filterPillActive : adminChrome.filterPillIdle
            }`}>
            All Events ({events.length})
          </button>
          {eventTypes.map(eventType => (
            <button
              key={eventType}
              onClick={() => onEventChange(eventType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedEvent === eventType ? adminChrome.filterPillActive : adminChrome.filterPillIdle
              }`}>
              {eventType.replace(/_/g, " ").toUpperCase()} ({events.filter(e => e.event === eventType).length})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
