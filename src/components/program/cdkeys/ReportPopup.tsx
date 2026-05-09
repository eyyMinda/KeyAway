"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { CDKey, ProgramFlow } from "@/src/types/program";
import { getActivationEntryDisplayLabel } from "@/src/lib/program/activationEntry";
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
  programFlow: ProgramFlow;
  /** Row storage key aligned with `getRowStorageHash` / key reports map. */
  rowStorageId: string;
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
      className={`flex w-full items-center justify-center rounded-sm px-4 py-3 font-medium transition-colors ${styleClass}`}>
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
  programFlow,
  rowStorageId,
  onReportSubmitted,
  isSpammerVisitor = false
}: ReportPopupProps) {
  const activationLabel = getActivationEntryDisplayLabel(cdKey, programFlow);
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
        key: { ...cdKey, programFlow },
        programFlow
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
  }, [slug, programFlow, cdKey, rowStorageId]);

  useEffect(() => {
    if (isOpen) void checkForDuplicate();
  }, [isOpen, slug, rowStorageId, checkForDuplicate]);

  const handleReport = async (status: CDKeyStatus) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/key-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: EVENT_TYPE_MAP[status],
          meta: { programSlug: slug, key: { ...cdKey, programFlow }, programFlow, path: window.location.pathname }
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
          cdKey={cdKey}
          programFlow={programFlow}
          activationLabel={activationLabel}
          existingReport={duplicateReport}
          slug={slug}
          isSpammerVisitor={isSpammerVisitor}
        />
      )}

      {/* Main Modal Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={handleBackdropClick}>
        <div className="mx-4 w-full max-w-md rounded-sm border border-[#2a475e] bg-[#1b2838] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#c6d4df]">Report activation status</h3>
            <ModalCloseButton onClick={handleClose} className="p-1 text-[#8f98a0] hover:text-white" />
          </div>

          <div className="mb-4">
            <p className="mb-2 text-sm text-[#8f98a0]">
              Entry: <code className="break-all rounded-sm bg-[#32465a] px-2 py-1 text-xs text-[#c6d4df]">{activationLabel}</code>
            </p>

            {/* Loading state */}
            {isCheckingDuplicate && (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#66c0f4]"></div>
                <span className="ml-2 text-sm text-[#8f98a0]">{getInfoMessage("CHECKING_DUPLICATE")}</span>
              </div>
            )}

            {/* Duplicate report found */}
            {duplicateReport && !isCheckingDuplicate && (
              <div className="mb-4 rounded-sm border border-[#a3421b] bg-[#3a2800] p-4">
                <div className="flex items-start space-x-3">
                    <FiRefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-[#e8632a]" />
                  <div className="flex-1">
                    <h4 className="mb-1 text-sm font-medium text-[#f4a460]">{getInfoMessage("DUPLICATE_FOUND")}</h4>
                    <p className="mb-2 text-xs text-[#e8b28f]">Status: {getStatusText(duplicateReport.eventType)}</p>
                    <p className="text-xs text-[#f4a460]">Reported: {formatDate(duplicateReport.createdAt)}</p>
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={handleRenewReport}
                        className="rounded-sm bg-[#a3421b] px-3 py-1.5 text-xs font-medium text-[#c6d4df] transition-colors hover:bg-[#c85222] hover:text-white">
                        Renew Report
                      </button>
                      <button
                        onClick={handleClose}
                        className="rounded-sm bg-[#32465a] px-3 py-1.5 text-xs font-medium text-[#c6d4df] transition-colors hover:bg-[#3d5770] hover:text-white">
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
                <p className="text-sm text-[#8f98a0]">How is this entry working for you?</p>
                {isSpammerVisitor && (
                  <p className="mt-3 rounded-sm border border-[#a3421b] bg-[#3a2800] px-3 py-2 text-sm leading-relaxed text-[#f4a460]">
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

          <div className="mt-4 border-t border-[#2a475e] pt-4">
            <p className="text-center text-xs text-[#556772]">
              {duplicateReport ? getInfoMessage("RENEWAL_INSTRUCTIONS") : getInfoMessage("REPORT_INSTRUCTIONS")}
            </p>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
