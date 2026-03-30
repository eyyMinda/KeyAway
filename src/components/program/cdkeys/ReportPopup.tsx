"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CDKey } from "@/src/types/program";
import { DuplicateCheckRequest, DuplicateCheckResponse } from "@/src/types";
import Toast from "@/src/components/ui/Toast";
import { ModalCloseButton } from "@/src/components/ui/ModalCloseButton";
import RenewalModal from "./RenewalModal";
import { FiCheck, FiX, FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import {
  EVENT_TYPE_MAP,
  getReportButtonConfig,
  getStatusTextFromEventType,
  CDKeyStatus
} from "@/src/lib/program/cdKeyUtils";
import {
  NOTIFICATION_DURATION,
  getReportStatusMessage,
  getErrorMessage,
  getInfoMessage,
  SPAMMER_REPORT_RESTRICTION_NOTICE,
  SPAMMER_REPORT_DISABLED_OPTION_TITLE
} from "@/src/lib/notifications/notificationUtils";
import { formatDate } from "@/src/lib/dateUtils";

interface ReportPopupProps {
  isOpen: boolean;
  onClose: () => void;
  cdKey: CDKey;
  slug: string;
  onReportSubmitted?: () => void;
  /** Negative statuses disabled in UI; API enforces the same. */
  isSpammerVisitor?: boolean;
}

interface ReportButtonProps {
  status: CDKeyStatus;
  isSubmitting: boolean;
  onReport: (status: CDKeyStatus) => void;
  blockedBySpammer?: boolean;
}

function ReportButton({ status, isSubmitting, onReport, blockedBySpammer }: ReportButtonProps) {
  const config = getReportButtonConfig(status);
  const disabled = isSubmitting || blockedBySpammer;

  // Get the appropriate icon for the status
  const getIcon = () => {
    switch (status) {
      case "working":
        return <FiCheck className="w-5 h-5" />;
      case "expired":
        return <FiX className="w-5 h-5" />;
      case "limit_reached":
        return <FiAlertTriangle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const styleClass = blockedBySpammer
    ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
    : `${config.bgColor} text-white cursor-pointer`;

  return (
    <button
      type="button"
      onClick={() => !blockedBySpammer && onReport(status)}
      disabled={disabled}
      title={blockedBySpammer ? SPAMMER_REPORT_DISABLED_OPTION_TITLE : undefined}
      className={`w-full flex items-center justify-center px-4 py-3 font-medium rounded-lg transition-colors ${styleClass}`}>
      <span className="mr-2">{getIcon()}</span>
      {config.label}
    </button>
  );
}

export default function ReportPopup({
  isOpen,
  onClose,
  cdKey,
  slug,
  onReportSubmitted,
  isSpammerVisitor = false
}: ReportPopupProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateReport, setDuplicateReport] = useState<DuplicateCheckResponse["existingReport"] | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  const checkForDuplicate = useCallback(async () => {
    setDuplicateReport(null);
    setIsCheckingDuplicate(true);

    try {
      const request: DuplicateCheckRequest = {
        programSlug: slug,
        key: cdKey.key
      };

      const response = await fetch("/api/v1/key-reports/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });

      const { data } = (await response.json()) as { data?: DuplicateCheckResponse };
      if (data?.isDuplicate && data?.existingReport) {
        setDuplicateReport(data.existingReport);
      }
    } catch (error) {
      console.error("Failed to check for duplicate report:", error);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, [slug, cdKey.key]);

  useEffect(() => {
    if (isOpen) void checkForDuplicate();
  }, [isOpen, slug, cdKey.key, checkForDuplicate]);

  const handleReport = async (status: CDKeyStatus) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/key-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: EVENT_TYPE_MAP[status],
          meta: { programSlug: slug, key: cdKey, path: window.location.pathname }
        })
      });

      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload?.data?.skipped) {
        onClose();
        return;
      }

      if (!res.ok) {
        console.error("[Report] API error:", res.status, payload);
        const msg = payload?.error?.message;
        setNotification(typeof msg === "string" ? msg : getErrorMessage("REPORT_FAILED"));
        return;
      }

      setNotification(getReportStatusMessage(status));
      onReportSubmitted?.();
      onClose();
    } catch (error) {
      console.error("Failed to report key status:", error);
      setNotification(getErrorMessage("REPORT_FAILED"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenewReport = () => {
    setShowRenewalModal(true);
  };

  const handleRenewalComplete = () => {
    setShowRenewalModal(false);
    setDuplicateReport(null);
    onReportSubmitted?.();
    onClose();
  };

  const handleClose = () => {
    setDuplicateReport(null);
    setShowRenewalModal(false);
    onClose();
  };

  const handleNotificationClose = () => {
    setNotification(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const getStatusText = (eventType: string) => {
    return getStatusTextFromEventType(eventType);
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Toast Notification */}
      {notification && (
        <Toast
          message={notification}
          type="info"
          duration={NOTIFICATION_DURATION.SHORT}
          onClose={handleNotificationClose}
        />
      )}

      {/* Renewal Modal */}
      {showRenewalModal && duplicateReport && (
        <RenewalModal
          isOpen={showRenewalModal}
          onClose={() => setShowRenewalModal(false)}
          onRenew={handleRenewalComplete}
          cdKey={cdKey.key}
          existingReport={duplicateReport}
          slug={slug}
          isSpammerVisitor={isSpammerVisitor}
        />
      )}

      {/* Main Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}>
        <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Report Key Status</h3>
            <ModalCloseButton
              onClick={handleClose}
              className="p-1 text-neutral-400 hover:text-white"
            />
          </div>

          <div className="mb-4">
            <p className="text-neutral-300 text-sm mb-2">
              Key: <code className="bg-neutral-700 px-2 py-1 rounded text-xs">{cdKey.key}</code>
            </p>

            {/* Loading state */}
            {isCheckingDuplicate && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                <span className="ml-2 text-neutral-400 text-sm">{getInfoMessage("CHECKING_DUPLICATE")}</span>
              </div>
            )}

            {/* Duplicate report found */}
            {duplicateReport && !isCheckingDuplicate && (
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <FiRefreshCw className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-orange-300 font-medium text-sm mb-1">{getInfoMessage("DUPLICATE_FOUND")}</h4>
                    <p className="text-orange-200 text-xs mb-2">Status: {getStatusText(duplicateReport.eventType)}</p>
                    <p className="text-orange-300 text-xs">Reported: {formatDate(duplicateReport.createdAt)}</p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={handleRenewReport}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                        Renew Report
                      </button>
                      <button
                        onClick={handleClose}
                        className="bg-neutral-600 hover:bg-neutral-700 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Normal report interface */}
            {!duplicateReport && !isCheckingDuplicate && (
              <>
                <p className="text-neutral-400 text-sm">How is this key working for you?</p>
                {isSpammerVisitor && (
                  <p className="text-amber-200/90 text-sm mt-3 leading-relaxed border border-amber-500/25 bg-amber-950/30 rounded-lg px-3 py-2">
                    {SPAMMER_REPORT_RESTRICTION_NOTICE}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Report buttons - only show if no duplicate found */}
          {!duplicateReport && !isCheckingDuplicate && (
            <div className="space-y-3">
              <ReportButton status="working" isSubmitting={isSubmitting} onReport={handleReport} />
              <ReportButton
                status="expired"
                isSubmitting={isSubmitting}
                onReport={handleReport}
                blockedBySpammer={isSpammerVisitor}
              />
              <ReportButton
                status="limit_reached"
                isSubmitting={isSubmitting}
                onReport={handleReport}
                blockedBySpammer={isSpammerVisitor}
              />
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-neutral-700">
            <p className="text-neutral-500 text-xs text-center">
              {duplicateReport ? getInfoMessage("RENEWAL_INSTRUCTIONS") : getInfoMessage("REPORT_INSTRUCTIONS")}
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
