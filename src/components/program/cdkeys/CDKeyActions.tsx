"use client";

import { useState } from "react";
import { CDKeyActionsProps } from "@/src/types";
import { trackCopyEvent } from "@/src/lib/copyTracking";
import ReportPopup from "./ReportPopup";
import Toast from "@/src/components/ui/Toast";

const NOTIFICATION_DURATION = 3000;
const KEY_PREVIEW_LENGTH = 8;

/**
 * CDKeyActions component provides copy and expired reporting functionality for CD keys
 * @param cdKey - The CD key object containing key data
 * @param isDisabled - Whether the actions should be disabled
 * @param slug - The program slug for tracking purposes
 */
export default function CDKeyActions({ cdKey, isDisabled, slug }: CDKeyActionsProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isReportPopupOpen, setIsReportPopupOpen] = useState(false);

  /**
   * Handles copying the CD key to clipboard and shows notification
   */
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(cdKey.key);
      setNotification("Key copied to clipboard!");
      trackCopyEvent(cdKey, slug, "button_click");
    } catch (err) {
      console.error("Failed to copy: ", err);
      setNotification("Failed to copy key");
    }
  };

  /**
   * Handles opening the report popup
   */
  const handleReportClick = () => {
    setIsReportPopupOpen(true);
  };

  /**
   * Handles closing the notification
   */
  const handleNotificationClose = () => {
    setNotification(null);
  };

  return (
    <>
      {/* Toast Notification */}
      {notification && (
        <Toast message={notification} type="info" duration={NOTIFICATION_DURATION} onClose={handleNotificationClose} />
      )}

      {/* Report Popup */}
      <ReportPopup isOpen={isReportPopupOpen} onClose={() => setIsReportPopupOpen(false)} cdKey={cdKey} slug={slug} />

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={handleCopyKey}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none cursor-pointer"
          disabled={isDisabled}
          title="Copy key to clipboard">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </button>

        <button
          onClick={handleReportClick}
          className="inline-flex items-center px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative cursor-pointer"
          disabled={isDisabled}
          title="Report the status of this CD key">
          Report
        </button>
      </div>
    </>
  );
}
