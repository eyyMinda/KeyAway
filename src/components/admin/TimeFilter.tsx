"use client";

import { useState, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";

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

  // Automatically show custom range when custom period is selected
  useEffect(() => {
    setShowCustomRange(selectedPeriod === "custom");
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    if (period === "custom" && selectedPeriod === "custom") {
      // Toggle custom range visibility if custom is already selected
      setShowCustomRange(!showCustomRange);
    } else {
      // Change period and show/hide custom range accordingly
      onPeriodChange(period);
      setShowCustomRange(period === "custom");
    }
  };

  const handleCustomDateChange = (field: "start" | "end", value: string) => {
    if (onCustomDateChange && customDateRange) {
      const newStart = field === "start" ? value : customDateRange.start;
      const newEnd = field === "end" ? value : customDateRange.end;
      onCustomDateChange(newStart, newEnd);
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
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              selectedPeriod === period.value ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {period.label}
            {period.value === "custom" && (
              <FaChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${showCustomRange ? "rotate-180" : ""}`}
              />
            )}
          </button>
        ))}
      </div>

      {showCustomRange && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Select Date Range</h4>
            <p className="text-xs text-gray-500">Choose both start and end dates to apply the custom filter</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange?.start || ""}
                onChange={e => handleCustomDateChange("start", e.target.value)}
                max={customDateRange?.end || new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange?.end || ""}
                onChange={e => handleCustomDateChange("end", e.target.value)}
                min={customDateRange?.start || ""}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          {customDateRange?.start && customDateRange?.end && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700">
                  <span className="font-medium">Selected range:</span> {customDateRange.start} to {customDateRange.end}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
