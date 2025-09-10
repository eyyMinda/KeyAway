"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CDKey } from "@/src/types/program";
import { trackEvent } from "@/src/lib/trackEvent";
import Toast from "@/src/components/ui/Toast";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";

interface ReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cdKey: CDKey;
  slug: string;
}

const NOTIFICATION_DURATION = 3000;

interface ReportButtonProps {
  status: "working" | "expired" | "limit_reached";
  isSubmitting: boolean;
  onReport: (status: "working" | "expired" | "limit_reached") => void;
}

function ReportButton({ status, isSubmitting, onReport }: ReportButtonProps) {
  const buttonConfig = {
    working: {
      label: "Working",
      bgColor: "bg-green-600 hover:bg-green-700 disabled:bg-green-600/50",
      icon: <FiCheck className="w-5 h-5" />
    },
    expired: {
      label: "Expired",
      bgColor: "bg-red-600 hover:bg-red-700 disabled:bg-red-600/50",
      icon: <FiX className="w-5 h-5" />
    },
    limit_reached: {
      label: "Limit Reached",
      bgColor: "bg-orange-600 hover:bg-orange-700 disabled:bg-orange-600/50",
      icon: <FiAlertTriangle className="w-5 h-5" />
    }
  };

  const config = buttonConfig[status];

  return (
    <button
      onClick={() => onReport(status)}
      disabled={isSubmitting}
      className={`w-full flex items-center justify-center px-4 py-3 cursor-pointer ${config.bgColor} text-white font-medium rounded-lg transition-colors`}>
      <span className="mr-2">{config.icon}</span>
      {config.label}
    </button>
  );
}

export default function ReportPopup({ isOpen, onClose, cdKey, slug }: ReportPopupProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReport = async (status: "working" | "expired" | "limit_reached") => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const eventMap = {
        working: "report_key_working" as const,
        expired: "report_key_expired" as const,
        limit_reached: "report_key_limit_reached" as const
      };

      await trackEvent(eventMap[status], {
        programSlug: slug,
        key: cdKey,
        path: window.location.pathname
      });

      const statusMessages = {
        working: "Key reported as working. Thank you!",
        expired: "Key reported as expired. Thank you!",
        limit_reached: "Key reported as limit reached. Thank you!"
      };

      setNotification(statusMessages[status]);
      onClose();
    } catch (error) {
      console.error("Failed to report key status:", error);
      setNotification("Failed to report key status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Toast Notification */}
      {notification && (
        <Toast message={notification} type="info" duration={NOTIFICATION_DURATION} onClose={handleNotificationClose} />
      )}

      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}>
        <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Report Key Status</h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-neutral-300 text-sm mb-2">
              Key: <code className="bg-neutral-700 px-2 py-1 rounded text-xs">{cdKey.key}</code>
            </p>
            <p className="text-neutral-400 text-sm">How is this key working for you?</p>
          </div>

          <div className="space-y-3">
            <ReportButton status="working" isSubmitting={isSubmitting} onReport={handleReport} />
            <ReportButton status="expired" isSubmitting={isSubmitting} onReport={handleReport} />
            <ReportButton status="limit_reached" isSubmitting={isSubmitting} onReport={handleReport} />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-700">
            <p className="text-neutral-500 text-xs text-center">
              Your feedback helps us maintain accurate key statuses
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
