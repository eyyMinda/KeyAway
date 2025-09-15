"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { KeyReportEvent, RenewReportRequest, RenewReportResponse } from "@/src/types";
import Toast from "@/src/components/ui/Toast";
import { EVENT_TYPE_MAP, getStatusTextFromEventType, CDKeyStatus } from "@/src/lib/cdKeyUtils";
import { NOTIFICATION_DURATION, getRenewalStatusMessage, getErrorMessage } from "@/src/lib/notificationUtils";
import { formatDate } from "@/src/lib/dateUtils";

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: () => void;
  cdKey: string;
  existingReport: {
    _id: string;
    eventType: KeyReportEvent;
    programSlug: string;
    keyHash: string;
    keyIdentifier: string;
    createdAt: string;
  };
  slug: string;
}

interface RenewButtonProps {
  status: CDKeyStatus;
  isSubmitting: boolean;
  onRenew: (status: CDKeyStatus) => void;
  currentStatus: KeyReportEvent;
}

function RenewButton({ status, isSubmitting, onRenew, currentStatus }: RenewButtonProps) {
  const isCurrentStatus = EVENT_TYPE_MAP[status] === currentStatus;

  const getButtonStyles = () => {
    if (isCurrentStatus) {
      return "bg-gray-500 text-gray-300 cursor-not-allowed";
    }

    switch (status) {
      case "working":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "expired":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "limit_reached":
        return "bg-orange-600 hover:bg-orange-700 text-white";
      default:
        return "bg-gray-600 hover:bg-gray-700 text-white";
    }
  };

  const getStatusText = () => {
    return getStatusTextFromEventType(EVENT_TYPE_MAP[status]);
  };

  return (
    <button
      onClick={() => onRenew(status)}
      disabled={isSubmitting || isCurrentStatus}
      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${getButtonStyles()}`}>
      {isCurrentStatus ? `${getStatusText()} (Current)` : `Renew as ${getStatusText()}`}
    </button>
  );
}

export default function RenewalModal({ isOpen, onClose, onRenew, cdKey, existingReport, slug }: RenewalModalProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRenew = async (status: CDKeyStatus) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const request: RenewReportRequest = {
        reportId: existingReport._id,
        newEventType: EVENT_TYPE_MAP[status],
        programSlug: slug,
        key: cdKey
      };

      const response = await fetch("/api/renew-key-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      const result: RenewReportResponse = await response.json();

      if (result.ok && result.updatedReport) {
        setNotification(getRenewalStatusMessage(status));
        onRenew(); // Refresh the parent component
        onClose();
      } else {
        setNotification(result.error || getErrorMessage("RENEWAL_FAILED"));
      }
    } catch (error) {
      console.error("Failed to renew key report:", error);
      setNotification(getErrorMessage("RENEWAL_FAILED"));
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

  const getCurrentStatusText = () => {
    return getStatusTextFromEventType(existingReport.eventType);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Toast Notification */}
      {notification && (
        <Toast
          message={notification}
          type="info"
          duration={NOTIFICATION_DURATION.MEDIUM}
          onClose={handleNotificationClose}
        />
      )}

      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}>
        <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Renew Key Report</h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-neutral-300 text-sm mb-2">
              Key: <code className="bg-neutral-700 px-2 py-1 rounded text-xs">{cdKey}</code>
            </p>
            <div className="bg-neutral-700 rounded-lg p-3 mb-4">
              <p className="text-neutral-300 text-sm">
                <span className="font-medium">Current Status:</span> {getCurrentStatusText()}
              </p>
              <p className="text-neutral-400 text-xs mt-1">Last reported: {formatDate(existingReport.createdAt)}</p>
            </div>
            <p className="text-neutral-400 text-sm">Update the status of this key:</p>
          </div>

          <div className="space-y-3">
            <RenewButton
              status="working"
              isSubmitting={isSubmitting}
              onRenew={handleRenew}
              currentStatus={existingReport.eventType}
            />
            <RenewButton
              status="expired"
              isSubmitting={isSubmitting}
              onRenew={handleRenew}
              currentStatus={existingReport.eventType}
            />
            <RenewButton
              status="limit_reached"
              isSubmitting={isSubmitting}
              onRenew={handleRenew}
              currentStatus={existingReport.eventType}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-700">
            <p className="text-neutral-500 text-xs text-center">
              Renewing will update your previous report with the new status and timestamp
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
