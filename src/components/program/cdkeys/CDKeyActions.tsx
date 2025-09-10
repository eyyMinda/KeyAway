"use client";

import { useState } from "react";
import { CDKeyActionsProps } from "@/src/types";
import { trackCopyEvent } from "@/src/lib/copyTracking";
import { trackEvent } from "@/src/lib/trackEvent";
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
   * Handles marking the CD key as expired and shows notification
   */
  const handleMarkAsExpired = async () => {
    try {
      // Track the expired key report
      await trackEvent("report_expired_cdkey", {
        programSlug: slug,
        key: cdKey,
        path: window.location.pathname
      });

      setNotification(
        `Key ${cdKey.key.substring(0, KEY_PREVIEW_LENGTH)}... marked as expired. Thank you for your feedback!`
      );
    } catch (error) {
      console.error("Failed to report expired key:", error);
      setNotification("Failed to report expired key. Please try again.");
    }
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
          Copy Key
        </button>

        <button
          onClick={handleMarkAsExpired}
          className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative cursor-pointer"
          disabled={isDisabled}
          title="Feel free to report this CD key as expired. If enough people report it, its status will change accordingly.">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Expired
        </button>
      </div>
    </>
  );
}
