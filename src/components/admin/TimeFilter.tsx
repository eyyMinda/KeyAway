"use client";

import { useState } from "react";

interface TimeFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  customDateRange?: {
    start: string;
    end: string;
  };
  onCustomDateChange?: (start: string, end: string) => void;
}

const timePeriods = [
  { value: "1h", label: "Last Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "custom", label: "Custom Range" }
];

export default function TimeFilter({
  selectedPeriod,
  onPeriodChange,
  customDateRange,
  onCustomDateChange
}: TimeFilterProps) {
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handlePeriodChange = (period: string) => {
    onPeriodChange(period);
    setShowCustomRange(period === "custom");
  };

  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    if (onCustomDateChange && customDateRange) {
      onCustomDateChange(
        field === "start" ? value : customDateRange.start,
        field === "end" ? value : customDateRange.end
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Period</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {timePeriods.map(period => (
          <button
            key={period.value}
            onClick={() => handlePeriodChange(period.value)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedPeriod === period.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {period.label}
          </button>
        ))}
      </div>

      {showCustomRange && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange?.start || ""}
                onChange={e => handleCustomDateChange("start", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange?.end || ""}
                onChange={e => handleCustomDateChange("end", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
