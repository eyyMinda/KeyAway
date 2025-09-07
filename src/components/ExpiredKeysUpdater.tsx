"use client";

import { useState } from "react";

export default function ExpiredKeysUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updateExpiredKeys = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/update-expired-keys", {
        method: "POST"
      });

      const result = await response.json();

      if (result.success) {
        setLastUpdated(new Date());
        // Optionally show a success message
        console.log("Expired keys updated successfully");
      } else {
        console.error("Failed to update expired keys:", result.message);
      }
    } catch (error) {
      console.error("Error updating expired keys:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Key Status Management</h3>
          <p className="text-neutral-300 text-sm">Manually update expired keys based on their validity dates</p>
          {lastUpdated && <p className="text-neutral-400 text-xs mt-1">Last updated: {lastUpdated.toLocaleString()}</p>}
        </div>
        <button
          onClick={updateExpiredKeys}
          disabled={isUpdating}
          className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 flex items-center">
          {isUpdating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Update Keys
            </>
          )}
        </button>
      </div>
    </div>
  );
}
