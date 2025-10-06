import React from "react";
import { AnalyticsEventData } from "@/src/types";

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
              selectedEvent === "all" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            All Events ({events.length})
          </button>
          {eventTypes.map(eventType => (
            <button
              key={eventType}
              onClick={() => onEventChange(eventType)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                selectedEvent === eventType ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}>
              {eventType.replace(/_/g, " ").toUpperCase()} ({events.filter(e => e.event === eventType).length})
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
