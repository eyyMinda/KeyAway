"use client";

import { useState } from "react";
import { CDKey } from "@/src/types/ProgramType";
import { trackCopyEvent } from "@/src/lib/copyTracking";
import { trackEvent } from "@/src/lib/trackEvent";

interface CDKeyActionsProps {
  cdKey: CDKey;
  isDisabled: boolean;
  slug: string;
}

export default function CDKeyActions({ cdKey, isDisabled, slug }: CDKeyActionsProps) {
  const [notification, setNotification] = useState<string | null>(null);

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setNotification("Key copied to clipboard!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to copy: ", err);
      setNotification("Failed to copy key");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const markAsExpired = async (key: string) => {
    // Track the expired key report
    await trackEvent("report_expired_cdkey", {
      programSlug: slug,
      key: cdKey,
      path: window.location.pathname
    });

    setNotification(`Key ${key.substring(0, 8)}... marked as expired. Thank you for your feedback!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-primary-600 text-white px-6 py-3 rounded-lg shadow-medium z-50 animate-slide-up">
          {notification}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-2">
        <button
          onClick={() => {
            copyToClipboard(cdKey.key);
            trackCopyEvent(cdKey, slug, "button_click");
          }}
          className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-none cursor-pointer"
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
          onClick={() => markAsExpired(cdKey.key)}
          className="inline-flex items-center px-3 py-1 bg-error-600 hover:bg-error-700 text-white text-xs font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed group relative cursor-pointer"
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
